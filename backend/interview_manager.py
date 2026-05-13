"""
Interview Manager - Handles the AI interview session state and logic.
"""

import ollama
import edge_tts
import tempfile
import asyncio
import speech_recognition as sr


class InterviewManager:
    def __init__(self, model="gemma3:4b"):
        self.model = model
        self.question_count = 0
        self.max_questions = 3
        self.history = []
        self.is_complete = False

    def setup_interview(self, persona, job_title, company):
        self.question_count = 0
        self.is_complete = False
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
                4. You will ask a total of 3 questions.
                5. Do NOT output any final reports until the system tells you the interview is over."""
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
        self.history.append({"role": "user", "content": user_text})

        # Check if interview should end
        if self.question_count >= self.max_questions:
            self.is_complete = True
            self.history.append({
                "role": "system",
                "content": """The interview is now over. You are a strict but fair Senior Technical Recruiter. Generate a comprehensive and structured final evaluation report based ONLY on the candidate's answers. 
        
        You MUST strictly use the following Markdown format:

        ### 🎯 Final Verdict (Eligibility)
        [State clearly: Highly Recommended, Recommended with Conditions, or Not Recommended. Add 1 sentence justification.]

        ### 📈 Hiring Probability Score
        [Calculate a realistic score like 85%]

        ### 💪 Key Strengths
        * [Point 1: Focus on technical skills demonstrated]
        * [Point 2: Focus on practical experience]
        * [Point 3: Focus on problem-solving]

        ### ⚠️ Weaknesses & Areas for Improvement
        * [Point 1: Missing technical knowledge]
        * [Point 2: Vague answers or lack of depth]

        ### 🗣️ Communication & Confidence Level
        [Evaluate how clear, structured, and confident their audio answers were]

        ### 🗺️ Recommended Action Plan (Roadmap)
        * [Actionable step 1 to improve their chances]
        * [Actionable step 2]
        """
            })
            response = ollama.chat(model=self.model, messages=self.history)
            final_report = response['message']['content']

            return {
                "type": "report",
                "user_text": user_text,
                "ai_text": "Thank you for your time. The interview is now complete.",
                "report": final_report
            }

        # Continue with next question
        response = ollama.chat(model=self.model, messages=self.history)
        ai_response = response['message']['content']

        self.history.append({"role": "assistant", "content": ai_response})
        self.question_count += 1

        return {
            "type": "question",
            "user_text": user_text,
            "ai_text": ai_response,
            "questions_remaining": self.max_questions - self.question_count
        }


async def text_to_speech(text, voice="en-US-ChristopherNeural"):
    """Convert text to speech using edge-tts."""
    communicate = edge_tts.Communicate(text, voice)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    await communicate.save(temp_file.name)
    return temp_file.name


def speech_to_text(audio_filepath):
    """Convert audio file to text using Google Speech Recognition."""
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(audio_filepath) as source:
            audio_data = recognizer.record(source)
            user_text = recognizer.recognize_google(audio_data)
            return user_text
    except sr.UnknownValueError:
        raise ValueError("Could not understand audio. Please try again.")
    except sr.RequestError as e:
        raise ValueError(f"Speech recognition service error: {str(e)}")
    except Exception as e:
        raise ValueError(f"Audio processing error: {str(e)}")
