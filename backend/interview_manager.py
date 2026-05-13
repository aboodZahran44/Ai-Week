"""
Interview Manager - Handles the AI interview session state and logic.
"""

import ollama
import edge_tts
import tempfile
import asyncio
import speech_recognition as sr


class InterviewManager:
    def __init__(self, model="llama3.1"):
        self.model = model
        self.question_count = 0
        self.max_questions = 3
        self.history = []
        self.is_complete = False
        self.persona = ""
        self.job_title = ""
        self.company = ""

    def setup_interview(self, persona, job_title, company):
        self.question_count = 0
        self.is_complete = False
        self.persona = persona
        self.job_title = job_title
        self.company = company
        self.history = [
            {
                "role": "system",
                "content": f"""You are a Senior Technical Recruiter at {company} interviewing a candidate for the {job_title} position.
                The candidate's detailed technical profile: 
                {persona}
                
                RULES:
                1. Start by welcoming the candidate, introduce yourself and the company briefly, then ask the candidate to introduce themselves.
                2. Ask ONLY ONE short question at a time. Wait for the candidate's response.
                3. Ask highly targeted technical questions based on their profile.
                4. You will ask a total of {self.max_questions} questions.
                5. Do NOT output any final reports until the system tells you the interview is over.
                6. NEVER use placeholders, brackets [ ], or templates like [Your Name] or [Company Name]. Always use natural, complete sentences with real names and details.
                7. Keep your responses concise and conversational — like a real interview."""
            }
        ]

    def get_welcome_message(self):
        """Get the initial welcome message from the AI interviewer."""
        response = ollama.chat(model=self.model, messages=self.history)
        ai_response = response['message']['content']
        self.history.append({"role": "assistant", "content": ai_response})
        return ai_response

    def process_answer(self, user_text):
        """Process a user's answer and return the next response."""
        # Append the user's answer to history
        self.history.append({"role": "user", "content": user_text})

        # Increment question count WHEN we receive a user answer
        # This tracks how many questions the user has answered
        self.question_count += 1

        # Check if interview should end (user has answered all questions)
        if self.question_count >= self.max_questions:
            self.is_complete = True

            # Add the report generation prompt (use "user" role so the model
            # is forced to generate a response — Ollama often ignores a
            # trailing "system" message)
            self.history.append({
                "role": "user",
                "content": f"""The interview is now over. You are a strict but fair Senior Technical Recruiter. 
Generate a comprehensive and structured final evaluation report based ONLY on the candidate's actual answers during this interview.

You MUST use the following exact Markdown format with these exact section headers:

### 🎯 Final Verdict (Eligibility)
Write one of: "Highly Recommended", "Recommended with Conditions", or "Not Recommended". Then add one sentence explaining why.

### 📈 Hiring Probability Score
Write a realistic percentage score (e.g. 75%) based on the candidate's interview performance.

### 💪 Key Strengths
* Write strength 1 based on what the candidate demonstrated
* Write strength 2 based on their technical knowledge
* Write strength 3 based on their problem-solving approach

### ⚠️ Weaknesses & Areas for Improvement
* Write weakness 1 based on gaps in their answers
* Write weakness 2 based on areas where they lacked depth

### 🗣️ Communication & Confidence Level
Write a paragraph evaluating how clear, structured, and confident the candidate's responses were.

### 🗺️ Recommended Action Plan (Roadmap)
* Write actionable step 1 the candidate should take to improve
* Write actionable step 2 for further development

CRITICAL RULES:
- Do NOT use any brackets, placeholders, or template markers like [text] anywhere.
- Base your evaluation strictly on what the candidate said during this interview.
- Be specific and reference their actual answers when possible.
- The position is {self.job_title} at {self.company}."""
            })

            response = ollama.chat(model=self.model, messages=self.history)
            final_report = response['message']['content']
            self.history.append({"role": "assistant", "content": final_report})

            return {
                "type": "report",
                "user_text": user_text,
                "ai_text": "Thank you for your time. The interview is now complete. Let me prepare your evaluation report.",
                "report": final_report
            }

        # Continue with next question
        response = ollama.chat(model=self.model, messages=self.history)
        ai_response = response['message']['content']

        # Always append AI response to history for context continuity
        self.history.append({"role": "assistant", "content": ai_response})

        return {
            "type": "question",
            "user_text": user_text,
            "ai_text": ai_response,
            "questions_remaining": self.max_questions - self.question_count
        }


async def text_to_speech(text, voice="en-US-ChristopherNeural"):
    """Convert text to speech using edge-tts."""
    try:
        communicate = edge_tts.Communicate(text, voice)
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        await communicate.save(temp_file.name)
        return temp_file.name
    except Exception as e:
        # Fallback: try a different voice if the primary one fails
        print(f"[WARN] TTS failed with {voice}: {e}, trying fallback voice...")
        try:
            fallback_voice = "en-US-GuyNeural"
            communicate = edge_tts.Communicate(text, fallback_voice)
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
            await communicate.save(temp_file.name)
            return temp_file.name
        except Exception as e2:
            raise RuntimeError(f"Text-to-speech failed with all voices: {str(e2)}")


async def speech_to_text(audio_filepath):
    """Convert audio file to text using Google Speech Recognition.
    Runs in a thread pool to avoid blocking the async event loop.
    """
    def _recognize(filepath):
        recognizer = sr.Recognizer()
        # Adjust for ambient noise tolerance
        recognizer.energy_threshold = 300
        recognizer.dynamic_energy_threshold = True

        try:
            with sr.AudioFile(filepath) as source:
                audio_data = recognizer.record(source)
                user_text = recognizer.recognize_google(audio_data)
                if not user_text or not user_text.strip():
                    raise ValueError("Speech was recognized but produced empty text. Please speak more clearly.")
                return user_text
        except sr.UnknownValueError:
            raise ValueError("Could not understand audio. Please try again and speak clearly.")
        except sr.RequestError as e:
            raise ValueError(f"Speech recognition service error: {str(e)}")
        except ValueError:
            raise
        except Exception as e:
            raise ValueError(f"Audio processing error: {str(e)}")

    # Run the blocking speech recognition in a thread to avoid blocking the event loop
    return await asyncio.to_thread(_recognize, audio_filepath)
