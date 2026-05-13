"""
Career Agent - Core logic for CV parsing, GitHub analysis, job searching, and job matching.
Includes extensive debug logging for full pipeline visibility.
"""

import sys
import io
import fitz
import re
import requests
import ollama
import json

# Fix Windows console encoding for Unicode output
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

# Timeout for all external HTTP requests (seconds)
REQUEST_TIMEOUT = 20


class UltimateCareerAgent:
    def __init__(self, github_token, serp_api_key, model="llama3.1"):
        self.model = model
        self.github_token = github_token
        self.serp_api_key = serp_api_key

        self.headers_github = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }

    # ===========================================================
    # PDF EXTRACTION
    # ===========================================================
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF with proper resource cleanup and validation."""
        print(f"\n{'='*60}")
        print(f"[PDF] Opening: {pdf_path}")
        try:
            doc = fitz.open(pdf_path)
            try:
                pages_text = []
                for i, page in enumerate(doc):
                    page_text = page.get_text()
                    pages_text.append(page_text)
                    print(f"[PDF] Page {i+1}: extracted {len(page_text)} chars")
                text = "".join(pages_text)
            finally:
                doc.close()

            cleaned = text.strip()
            print(f"[PDF] Total extracted text: {len(cleaned)} chars")
            if len(cleaned) < 50:
                raise ValueError(
                    f"PDF text extraction yielded only {len(cleaned)} chars. "
                    f"The PDF may be image-based or corrupted."
                )
            # Print first 500 chars for debug
            print(f"[PDF] Preview: {cleaned[:500]}...")
            print(f"{'='*60}\n")
            return text
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"PDF processing error: {str(e)}")

    # ===========================================================
    # GITHUB USERNAME EXTRACTION
    # ===========================================================
    def extract_github_username(self, text):
        """Extract GitHub username from CV text. Handles multiple URL formats."""
        patterns = [
            r'github\.com/([A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)',
            r'GitHub\s*:\s*@?([A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)',
            r'GitHub\s*Profile\s*:\s*(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9\-]+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                username = match.group(1).strip().rstrip('/')
                # Filter out common false positives
                if username.lower() not in ('features', 'pricing', 'about', 'topics', 'settings', 'explore'):
                    print(f"[GITHUB] Extracted username: '{username}' via pattern: {pattern}")
                    return username
        print("[GITHUB] No GitHub username found in CV text")
        return None

    # ===========================================================
    # GITHUB TOKEN VALIDATION
    # ===========================================================
    def validate_github_token(self):
        """Check if the GitHub token is valid and log rate limit status."""
        print(f"\n{'='*60}")
        print("[GITHUB] Validating GitHub token...")
        try:
            res = requests.get(
                "https://api.github.com/rate_limit",
                headers=self.headers_github,
                timeout=10
            )
            if res.status_code == 200:
                data = res.json()
                core = data.get("resources", {}).get("core", {})
                remaining = core.get("remaining", "?")
                limit = core.get("limit", "?")
                print(f"[GITHUB] Token VALID. Rate limit: {remaining}/{limit} requests remaining")
                if isinstance(remaining, int) and remaining < 10:
                    print(f"[GITHUB] WARNING: Very low rate limit remaining ({remaining})!")
                return True
            elif res.status_code == 401:
                print("[GITHUB] ERROR: Token is INVALID or EXPIRED!")
                return False
            else:
                print(f"[GITHUB] WARNING: Unexpected status {res.status_code} during token check")
                return False
        except Exception as e:
            print(f"[GITHUB] Token validation failed: {e}")
            return False

    # ===========================================================
    # GITHUB CODE SNIPPET (RECURSIVE SEARCH)
    # ===========================================================
    def get_main_code_snippet(self, username, repo_name):
        """Fetch the most important code file from a repo, searching subdirectories too."""
        important_extensions = ('.py', '.js', '.ts', '.tsx', '.jsx', '.cpp', '.java', '.go', '.cs', '.rs')
        priority_names = ('main', 'app', 'index', 'server', 'client', 'core', 'bot', 'agent')
        code_dirs = ('src', 'app', 'lib', 'core', 'api', 'backend', 'server', 'scripts')

        def _fetch_dir_contents(path=""):
            url = f"https://api.github.com/repos/{username}/{repo_name}/contents/{path}".rstrip('/')
            try:
                res = requests.get(url, headers=self.headers_github, timeout=REQUEST_TIMEOUT)
                if res.status_code in (403, 429):
                    print(f"    [RATE-LIMIT] Hit rate limit fetching {repo_name}/{path}")
                    return None
                if res.status_code != 200:
                    return None
                data = res.json()
                return data if isinstance(data, list) else None
            except Exception:
                return None

        def _find_best_file(files):
            """From a list of file entries, find the best code file."""
            if not files:
                return None
            # Priority pass: main.py, app.js, index.ts, etc.
            for f in files:
                if not isinstance(f, dict) or f.get('type') != 'file':
                    continue
                name = f.get('name', '').lower()
                if any(name.startswith(p) for p in priority_names) and name.endswith(important_extensions):
                    return f
            # Fallback: any code file
            for f in files:
                if not isinstance(f, dict) or f.get('type') != 'file':
                    continue
                if f.get('name', '').endswith(important_extensions):
                    return f
            return None

        try:
            # 1. Search root directory
            root_files = _fetch_dir_contents("")
            if root_files is None:
                print(f"    [CODE] Could not access root of {repo_name}")
                return "Could not access repository files."

            all_code_files = [f for f in root_files if isinstance(f, dict) and f.get('type') == 'file']
            all_dirs = [f for f in root_files if isinstance(f, dict) and f.get('type') == 'dir']
            dir_names = [d.get('name', '') for d in all_dirs]
            print(f"    [CODE] Root of {repo_name}: {len(all_code_files)} files, {len(all_dirs)} dirs ({', '.join(dir_names[:5])})")

            best = _find_best_file(root_files)

            # 2. If no code file at root, search key subdirectories
            if not best:
                for d in all_dirs:
                    dname = d.get('name', '').lower()
                    if dname in code_dirs:
                        print(f"    [CODE] Searching subdirectory: {dname}/")
                        sub_files = _fetch_dir_contents(dname)
                        if sub_files:
                            best = _find_best_file(sub_files)
                            if best:
                                break

            if not best:
                print(f"    [CODE] No code files found in {repo_name}")
                return "No source code files found in this repository."

            # 3. Download the file
            download_url = best.get('download_url')
            file_name = best.get('name', '?')
            if not download_url:
                return f"Found {file_name} but no download URL available."

            print(f"    [CODE] Downloading: {file_name}")
            file_res = requests.get(download_url, headers=self.headers_github, timeout=REQUEST_TIMEOUT)
            if file_res.status_code == 200:
                snippet = file_res.text[:4000]
                print(f"    [CODE] Got {len(snippet)} chars from {file_name}")
                return snippet
            return f"Could not download {file_name} (HTTP {file_res.status_code})."

        except Exception as e:
            print(f"    [CODE] Error fetching code from {repo_name}: {e}")
            return f"Error: {str(e)}"

    # ===========================================================
    # GITHUB DEEP DATA FETCH
    # ===========================================================
    def fetch_github_deep_data(self, username):
        """Fetch detailed data for all recent repos of a user. Extensive logging."""
        print(f"\n{'='*60}")
        print(f"[GITHUB] Fetching repos for user: @{username}")

        # Validate token first
        token_valid = self.validate_github_token()
        if not token_valid:
            print("[GITHUB] Proceeding without valid token - results may be limited")

        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10"

        try:
            response = requests.get(url, headers=self.headers_github, timeout=REQUEST_TIMEOUT)
            print(f"[GITHUB] Repos API response: HTTP {response.status_code}")

            # Log rate limit headers
            remaining = response.headers.get('X-RateLimit-Remaining', '?')
            limit = response.headers.get('X-RateLimit-Limit', '?')
            print(f"[GITHUB] Rate limit after call: {remaining}/{limit}")

            if response.status_code in (403, 429):
                print(f"[GITHUB] RATE LIMITED! Cannot fetch repos.")
                return []
            if response.status_code == 404:
                print(f"[GITHUB] User @{username} NOT FOUND on GitHub!")
                return []
            if response.status_code != 200:
                print(f"[GITHUB] Unexpected status: {response.status_code}")
                print(f"[GITHUB] Response body: {response.text[:300]}")
                return []

            repos = response.json()
            if not isinstance(repos, list):
                print(f"[GITHUB] ERROR: Expected list, got {type(repos).__name__}: {str(repos)[:200]}")
                return []

            print(f"[GITHUB] Fetched {len(repos)} repositories for @{username}")

            if len(repos) == 0:
                print(f"[GITHUB] WARNING: User @{username} has no public repositories!")
                return []

            detailed_repos = []
            for i, repo in enumerate(repos):
                if not isinstance(repo, dict):
                    continue
                name = repo.get("name", "unknown")
                language = repo.get("language", "N/A")
                stars = repo.get("stargazers_count", 0)
                forks = repo.get("forks_count", 0)
                description = repo.get("description") or "No description"
                topics = repo.get("topics", [])

                print(f"\n  [{i+1}/{len(repos)}] Repo: {name}")
                print(f"    Language: {language} | Stars: {stars} | Forks: {forks}")
                print(f"    Description: {description[:100]}")
                if topics:
                    print(f"    Topics: {', '.join(topics)}")

                code_snippet = self.get_main_code_snippet(username, name)
                snippet_len = len(code_snippet) if code_snippet else 0
                print(f"    Snippet length: {snippet_len} chars")

                detailed_repos.append({
                    "name": name,
                    "language": language,
                    "stars": stars,
                    "forks": forks,
                    "description": description,
                    "topics": topics,
                    "snippet": code_snippet
                })

            print(f"\n[GITHUB] SUMMARY: Successfully analyzed {len(detailed_repos)} repos")
            for r in detailed_repos:
                has_code = len(r.get('snippet', '')) > 50
                print(f"  - {r['name']} ({r['language']}) {'[HAS CODE]' if has_code else '[NO CODE]'}")
            print(f"{'='*60}\n")

            return detailed_repos

        except requests.exceptions.Timeout:
            print(f"[GITHUB] ERROR: Request TIMED OUT for user {username}")
            return []
        except requests.exceptions.ConnectionError:
            print(f"[GITHUB] ERROR: CONNECTION FAILED for user {username}")
            return []
        except Exception as e:
            print(f"[GITHUB] UNEXPECTED ERROR: {e}")
            return []

    # ===========================================================
    # PERSONA GENERATION (OPTIMIZED PROMPT)
    # ===========================================================
    def generate_persona(self, cv_text, github_data):
        """Generate technical persona with clear source separation and anti-hallucination guards."""
        print(f"\n{'='*60}")
        print(f"[PERSONA] Generating persona...")
        print(f"[PERSONA] CV text length: {len(cv_text)} chars")
        print(f"[PERSONA] GitHub repos provided: {len(github_data)}")

        # Build the GitHub section with explicit labeling
        if github_data and len(github_data) > 0:
            repos_with_code = [r for r in github_data if len(r.get('snippet', '')) > 50]
            repos_without_code = [r for r in github_data if len(r.get('snippet', '')) <= 50]
            print(f"[PERSONA] Repos with actual code snippets: {len(repos_with_code)}")
            print(f"[PERSONA] Repos without code snippets: {len(repos_without_code)}")

            github_section = "The following GitHub repositories and code snippets were fetched from the candidate's REAL GitHub profile.\n\n"
            for i, repo in enumerate(github_data):
                github_section += f"--- Repository {i+1}: {repo['name']} ---\n"
                github_section += f"Primary Language: {repo.get('language', 'N/A')}\n"
                github_section += f"Stars: {repo.get('stars', 0)} | Forks: {repo.get('forks', 0)}\n"
                github_section += f"Description: {repo.get('description', 'None')}\n"
                topics = repo.get('topics', [])
                if topics:
                    github_section += f"Topics: {', '.join(topics)}\n"
                snippet = repo.get('snippet', '')
                if snippet and len(snippet) > 50:
                    github_section += f"Code Sample:\n```\n{snippet[:3000]}\n```\n"
                else:
                    github_section += "Code Sample: Not available for this repository.\n"
                github_section += "\n"
            github_available = True
        else:
            github_section = "NO GITHUB DATA WAS FOUND OR FETCHED. The candidate either did not provide a GitHub link, or their repositories could not be accessed. Do NOT invent or hallucinate any GitHub projects. Only analyze the CV content below."
            github_available = False
            print("[PERSONA] WARNING: No GitHub data available - LLM will analyze CV only")

        # Build the optimized prompt
        prompt = f"""You are an ELITE Technical Recruiter and Senior Software Architect performing a deep candidate analysis.

You have TWO data sources. You MUST use BOTH and clearly indicate which source each piece of information comes from.

===================== SOURCE 1: CANDIDATE'S CV =====================
{cv_text}
===================== END OF CV =====================

===================== SOURCE 2: GITHUB REPOSITORIES =====================
{github_section}
===================== END OF GITHUB DATA =====================

===================== YOUR ANALYSIS TASKS =====================

IMPORTANT RULES:
- Extract Education, Experience, and Certifications ONLY from the CV (Source 1). These are NEVER in GitHub data.
- Extract Skills and Frameworks from BOTH the CV AND GitHub code analysis.
- For Code Analysis, ONLY use the actual GitHub code snippets provided above. Reference specific repository names and actual code patterns you can see.
- If GitHub data is empty or unavailable, explicitly state "No GitHub data was provided" in the relevant sections. Do NOT make up repositories or code observations.
- NEVER say "Not available in the provided GitHub repository" for CV-based fields like Education, Experience, or Certifications. These come from the CV.

TASK 1 - PROFILE EXTRACTION (from CV):
- Full Name (from CV)
- Skills & Technologies (combine CV claims + GitHub evidence)
- Frameworks & Libraries (combine CV claims + GitHub evidence)
- Programming Languages (combine CV claims + GitHub evidence)
- Education (from CV ONLY)
- Work Experience (from CV ONLY)
- Certifications (from CV ONLY)

{"TASK 2 - GITHUB CODE ANALYSIS (from Source 2):" if github_available else "TASK 2 - GITHUB CODE ANALYSIS:"}
{"Analyze EACH repository listed above individually. For each repo, mention it BY NAME and describe:" if github_available else "No GitHub data was available. Skip this section and state that clearly."}
{"- What the project does (based on the code snippet and description)" if github_available else ""}
{"- Code quality observations (naming, structure, patterns)" if github_available else ""}
{"- Technologies/libraries actually used in the code" if github_available else ""}
{"- Complexity level of the project" if github_available else ""}

TASK 3 - CROSS-VERIFICATION:
- Compare what the CV claims vs what the GitHub code actually shows
- Note any skills claimed in CV but not evidenced in code
- Note any skills visible in code but not mentioned in CV

TASK 4 - OVERALL ASSESSMENT:
- Final Readiness Score (1-10) with justification
- Short technical summary paragraph (3-4 sentences)

TASK 5 - JOB RECOMMENDATIONS:
- Generate EXACTLY 2 specific job titles suitable for this candidate

===================== OUTPUT FORMAT (use these exact headers) =====================

# PERSONA SUMMARY
Write a 3-4 sentence summary of the candidate including their name, background, and key strengths.

# SKILLS
List all technical skills found in CV and GitHub, noting the source.

# CODE ANALYSIS
{"Analyze each GitHub repository by name with specific observations from the code." if github_available else "State: No GitHub repositories were available for analysis."}

# PROJECT COMPLEXITY
{"Rate and explain the complexity of each project found on GitHub." if github_available else "State: Cannot assess - no GitHub data available."}

# CV VS GITHUB VERIFICATION
Compare claims vs evidence. Be specific.

# FINAL READINESS SCORE
Score/10 with detailed justification.

# JOB SEARCH QUERIES
Title 1, Title 2
"""

        print(f"[PERSONA] Prompt length: {len(prompt)} chars")
        print(f"[PERSONA] Sending to Ollama model: {self.model}...")

        try:
            res = ollama.chat(
                model=self.model,
                messages=[{
                    'role': 'user',
                    'content': prompt
                }]
            )
            persona_text = res['message']['content']
            print(f"[PERSONA] Response received: {len(persona_text)} chars")
            print(f"[PERSONA] Preview: {persona_text[:300]}...")
            return persona_text
        except Exception as e:
            print(f"[PERSONA] ERROR from Ollama: {e}")
            raise

    # ===========================================================
    # JOB QUERY EXTRACTION
    # ===========================================================
    def extract_job_queries(self, persona_text):
        match = re.search(
            r"# JOB SEARCH QUERIES\s*(.*)",
            persona_text,
            re.IGNORECASE | re.DOTALL
        )

        if not match:
            print("[JOBS] Could not find JOB SEARCH QUERIES section, using defaults")
            return ["AI Engineer", "Machine Learning Engineer"]

        raw = match.group(1).strip()
        raw_list = re.split(r'[,|\n]', raw)

        queries = []
        for q in raw_list:
            clean_q = re.sub(r'[*•\d\.\-]', '', q).strip()
            if clean_q and len(clean_q) > 3:
                queries.append(clean_q)

        result = queries[:2] if queries else ["Software Engineer", "Backend Developer"]
        print(f"[JOBS] Extracted job queries: {result}")
        return result

    # ===========================================================
    # SERP API JOB SEARCH
    # ===========================================================
    def find_real_jobs(self, query, location="Jordan"):
        print(f"\n[SEARCH] Searching Jobs for: {query}")

        url = "https://serpapi.com/search.json"
        params = {
            "engine": "google_jobs",
            "q": f"{query} in {location}",
            "hl": "en",
            "api_key": self.serp_api_key
        }

        try:
            response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
            print(f"[SEARCH] SerpAPI status: {response.status_code}")

            if response.status_code != 200:
                print(f"[SEARCH] SerpAPI error response: {response.text[:200]}")
                return []

            data = response.json()
            if not isinstance(data, dict):
                return []

            jobs = data.get("jobs_results", [])
            print(f"[SEARCH] Found {len(jobs)} jobs for '{query}'")

            if not jobs:
                print("[SEARCH] No local jobs, trying Remote...")
                params["q"] = f"{query} Remote"
                try:
                    response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
                    if response.status_code == 200:
                        fallback_data = response.json()
                        if isinstance(fallback_data, dict):
                            jobs = fallback_data.get("jobs_results", [])
                            print(f"[SEARCH] Remote fallback found {len(jobs)} jobs")
                except Exception as e:
                    print(f"[SEARCH] Remote fallback failed: {e}")

            return jobs[:5]

        except requests.exceptions.Timeout:
            print("[SEARCH] SerpAPI request timed out")
            return []
        except Exception as e:
            print(f"[SEARCH] Job Search Error: {e}")
            return []

    # ===========================================================
    # JOB MATCHING
    # ===========================================================
    def match_jobs(self, persona, jobs):
        final_results = []

        for i, job in enumerate(jobs):
            title = job.get("title", "Unknown")
            company = job.get("company_name", "Unknown")
            description = job.get("description", "")[:1000]
            print(f"\n[MATCH] Analyzing job {i+1}/{len(jobs)}: {title} at {company}")

            prompt = f"""You are an AI Career Mentor.

Candidate Persona:
{persona}

=================================================
JOB
=================================================
Title: {title}
Company: {company}

Description:
{description}

=================================================
TASK
=================================================
1. Match Score (/100)
2. Why candidate fits
3. Missing skill
4. Learning roadmap
5. Hiring probability

FORMAT:

MATCH SCORE:
...

WHY FIT:
...

MISSING SKILL:
...

ROADMAP:
...

HIRING PROBABILITY:
...
"""
            try:
                res = ollama.chat(
                    model=self.model,
                    messages=[{'role': 'user', 'content': prompt}]
                )
                analysis = res['message']['content']
                print(f"[MATCH] Analysis complete for {title} ({len(analysis)} chars)")
            except Exception as e:
                print(f"[MATCH] Ollama failed for {title}: {e}")
                analysis = "Analysis unavailable due to processing error."

            apply_link = "#"
            apply_options = job.get("apply_options", [])
            if isinstance(apply_options, list) and apply_options:
                first_option = apply_options[0]
                if isinstance(first_option, dict):
                    apply_link = first_option.get("link", "#")

            final_results.append({
                "title": title,
                "company": company,
                "link": apply_link,
                "analysis": analysis
            })

        return final_results

    # ===========================================================
    # MAIN PIPELINE
    # ===========================================================
    def run(self, pdf_path):
        print("\n" + "=" * 60)
        print("   ULTIMATE CAREER AGENT - ANALYSIS PIPELINE")
        print("=" * 60)

        print("\n[STEP 1/6] Extracting CV Data...")
        cv_text = self.extract_text_from_pdf(pdf_path)

        print("\n[STEP 2/6] Finding GitHub username in CV...")
        username = self.extract_github_username(cv_text)

        github_data = []
        if username:
            print(f"[STEP 3/6] GitHub Found: @{username} — fetching deep data...")
            github_data = self.fetch_github_deep_data(username)
        else:
            print("[STEP 3/6] No GitHub username found in CV — skipping GitHub analysis")

        # Log the final payload going to the LLM
        print(f"\n[PAYLOAD CHECK] CV text: {len(cv_text)} chars")
        print(f"[PAYLOAD CHECK] GitHub repos: {len(github_data)}")
        if github_data:
            for r in github_data:
                snippet_len = len(r.get('snippet', ''))
                print(f"  - {r['name']}: {r['language']}, snippet={snippet_len} chars")
        else:
            print("  (empty - LLM will be told no GitHub data is available)")

        print("\n[STEP 4/6] Generating Technical Persona via Ollama...")
        persona = self.generate_persona(cv_text, github_data)

        print("\n[STEP 5/6] Extracting Job Queries from persona...")
        queries = self.extract_job_queries(persona)

        all_jobs = []
        print(f"\n[STEP 6/6] Searching for jobs matching: {queries}")
        for q in queries:
            jobs = self.find_real_jobs(q)
            all_jobs.extend(jobs)

        print(f"\n[MATCHING] Found {len(all_jobs)} total jobs, matching top 5...")
        matched_jobs = self.match_jobs(persona, all_jobs[:5])

        print("\n" + "=" * 60)
        print(f"   PIPELINE COMPLETE — {len(matched_jobs)} jobs matched")
        print("=" * 60 + "\n")

        return {
            "persona": persona,
            "jobs": matched_jobs
        }
