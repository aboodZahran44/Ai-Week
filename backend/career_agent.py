"""
Career Agent - Core logic extracted from full2.py
Handles CV parsing, GitHub analysis, job searching, and job matching.
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
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


class UltimateCareerAgent:
    def __init__(self, github_token, serp_api_key, model="llama3.1"):
        self.model = model
        self.github_token = github_token
        self.serp_api_key = serp_api_key

        self.headers_github = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def extract_text_from_pdf(self, pdf_path):
        doc = fitz.open(pdf_path)
        return "".join([page.get_text() for page in doc])

    def extract_github_username(self, text):
        match = re.search(r"github\.com/([\w\d-]+)", text)
        return match.group(1) if match else None

    def get_main_code_snippet(self, username, repo_name):
        url = f"https://api.github.com/repos/{username}/{repo_name}/contents"

        try:
            res = requests.get(url, headers=self.headers_github)

            if res.status_code != 200:
                return "Could not access files."

            files = res.json()

            important_extensions = (
                '.py', '.js', '.ts', '.cpp',
                '.java', '.go', '.cs'
            )

            target_file = None

            priority_names = (
                'main', 'app', 'index',
                'server', 'client'
            )

            for f in files:
                if (
                    f['name'].lower().startswith(priority_names)
                    and f['name'].endswith(important_extensions)
                ):
                    target_file = f
                    break

            if not target_file:
                for f in files:
                    if f['name'].endswith(important_extensions):
                        target_file = f
                        break

            if target_file:
                file_res = requests.get(
                    target_file['download_url'],
                    headers=self.headers_github
                )
                return file_res.text[:3000]

            return "No source code found."

        except Exception as e:
            return f"Error: {str(e)}"

    def fetch_github_deep_data(self, username):
        url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=5"

        try:
            response = requests.get(url, headers=self.headers_github)

            if response.status_code != 200:
                return []

            repos = response.json()
            detailed_repos = []

            for repo in repos:
                name = repo.get("name")
                print(f"[*] Analyzing Repo: {name}")

                code_snippet = self.get_main_code_snippet(username, name)

                detailed_repos.append({
                    "name": name,
                    "language": repo.get("language"),
                    "stars": repo.get("stargazers_count"),
                    "description": repo.get("description"),
                    "snippet": code_snippet
                })

            return detailed_repos

        except Exception as e:
            print("GitHub Error:", e)
            return []

    def generate_persona(self, cv_text, github_data):
        prompt = f"""
You are an ELITE Technical Recruiter and Senior Software Architect.

Analyze the following CV and GitHub repositories deeply.

========================
CV
========================
{cv_text}

========================
GitHub Repositories
========================
{json.dumps(github_data, indent=2)}

====================================================
TASKS
====================================================

1. Extract:
- Skills
- Frameworks
- Programming Languages
- Education
- Experience
- Certifications

2. Technical Evaluation:
- Code Maturity
- Architecture Quality
- Clean Code Level
- Real Technical Depth
- Libraries Actually Used
- Complexity of Projects

3. Verify:
- Compare CV claims vs actual GitHub evidence
- Detect exaggeration if exists

4. Assign:
- Final Readiness Score (1-10)

5. Create:
- Short technical summary

6. Generate EXACTLY 2 clean job titles suitable for this candidate.

====================================================
OUTPUT FORMAT
====================================================

# PERSONA SUMMARY
...

# SKILLS
...

# CODE ANALYSIS
...

# PROJECT COMPLEXITY
...

# CV VS GITHUB VERIFICATION
...

# FINAL READINESS SCORE
...

# JOB SEARCH QUERIES
Title 1, Title 2
"""

        res = ollama.chat(
            model=self.model,
            messages=[{
                'role': 'user',
                'content': prompt
            }]
        )

        return res['message']['content']

    def extract_job_queries(self, persona_text):
        match = re.search(
            r"# JOB SEARCH QUERIES\s*(.*)",
            persona_text,
            re.IGNORECASE | re.DOTALL
        )

        if not match:
            return ["AI Engineer", "Machine Learning Engineer"]

        raw = match.group(1).strip()
        raw_list = re.split(r'[,|\n]', raw)

        queries = []
        for q in raw_list:
            clean_q = re.sub(r'[*•\d\.\-]', '', q).strip()
            if clean_q and len(clean_q) > 3:
                queries.append(clean_q)

        return queries[:2]

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
            response = requests.get(url, params=params)

            if response.status_code != 200:
                return []

            jobs = response.json().get("jobs_results", [])

            if not jobs:
                print("[WARN] No local jobs found, trying Remote...")
                params["q"] = f"{query} Remote"
                response = requests.get(url, params=params)
                jobs = response.json().get("jobs_results", [])

            return jobs[:5]

        except Exception as e:
            print("Job Search Error:", e)
            return []

    def match_jobs(self, persona, jobs):
        final_results = []

        for job in jobs:
            title = job.get("title", "Unknown")
            company = job.get("company_name", "Unknown")
            description = job.get("description", "")[:1000]

            prompt = f"""
You are an AI Career Mentor.

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

            res = ollama.chat(
                model=self.model,
                messages=[{
                    'role': 'user',
                    'content': prompt
                }]
            )

            apply_link = "#"
            apply_options = job.get("apply_options", [])
            if apply_options:
                apply_link = apply_options[0].get("link", "#")

            final_results.append({
                "title": title,
                "company": company,
                "link": apply_link,
                "analysis": res['message']['content']
            })

        return final_results

    def run(self, pdf_path):
        print("[STEP 1] Extracting CV Data...")
        cv_text = self.extract_text_from_pdf(pdf_path)

        print("[STEP 2] Finding GitHub...")
        username = self.extract_github_username(cv_text)

        github_data = []
        if username:
            print(f"[OK] GitHub Found: @{username}")
            github_data = self.fetch_github_deep_data(username)
        else:
            print("[WARN] No GitHub Found.")

        print("\n[STEP 3] Generating Technical Persona...")
        persona = self.generate_persona(cv_text, github_data)

        print("\n[STEP 4] Extracting Job Queries...")
        queries = self.extract_job_queries(persona)
        print("Queries:", queries)

        all_jobs = []
        print("\n[STEP 5] Searching Jobs...")
        for q in queries:
            jobs = self.find_real_jobs(q)
            for j in jobs:
                all_jobs.append(j)

        print("\n[STEP 6] Matching Candidate with Jobs...")
        matched_jobs = self.match_jobs(persona, all_jobs[:5])

        print("\n[DONE] Analysis complete!")

        return {
            "persona": persona,
            "jobs": matched_jobs
        }
