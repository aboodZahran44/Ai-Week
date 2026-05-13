"""
Ultimate AI Career Agent - FastAPI Backend
Serves as the API layer wrapping the career agent and interview logic.
"""

import os
import uuid
import shutil
import tempfile
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv

from career_agent import UltimateCareerAgent
from interview_manager import InterviewManager, text_to_speech, speech_to_text

# Load environment variables
load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
SERP_API_KEY = os.getenv("SERP_API_KEY", "")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

# Create temp directories
UPLOAD_DIR = Path("./temp_uploads")
AUDIO_DIR = Path("./temp_audio")
UPLOAD_DIR.mkdir(exist_ok=True)
AUDIO_DIR.mkdir(exist_ok=True)

# ==========================================
# FastAPI App
# ==========================================
app = FastAPI(
    title="Ultimate AI Career Agent",
    description="AI-powered career analysis, job matching, and virtual interviews",
    version="1.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Session State (in-memory for simplicity)
# ==========================================
sessions = {}


class SessionData:
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.persona = ""
        self.jobs = []
        self.selected_job = None
        self.interview_manager = None


# ==========================================
# Request/Response Models
# ==========================================
class JobSelectRequest(BaseModel):
    session_id: str
    job_index: int


class StartInterviewRequest(BaseModel):
    session_id: str


class ChatMessage(BaseModel):
    role: str
    content: str


# ==========================================
# API Endpoints
# ==========================================

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "model": OLLAMA_MODEL}


@app.post("/api/upload-cv")
async def upload_cv(file: UploadFile = File(...)):
    """
    Upload a PDF CV, analyze it, find matching jobs.
    Returns the persona analysis and matched jobs.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    # Create a new session
    session = SessionData()
    
    # Save uploaded file
    file_path = UPLOAD_DIR / f"{session.session_id}.pdf"
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Run the career agent analysis
    try:
        agent = UltimateCareerAgent(
            github_token=GITHUB_TOKEN,
            serp_api_key=SERP_API_KEY,
            model=OLLAMA_MODEL
        )

        result = agent.run(str(file_path))

        session.persona = result["persona"]
        session.jobs = result["jobs"]

        # Store session
        sessions[session.session_id] = session

        return {
            "session_id": session.session_id,
            "persona": result["persona"],
            "jobs": [
                {
                    "index": i,
                    "title": job["title"],
                    "company": job["company"],
                    "link": job.get("link", "#"),
                    "analysis": job["analysis"]
                }
                for i, job in enumerate(result["jobs"])
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        # Cleanup uploaded file
        if file_path.exists():
            os.remove(file_path)


@app.post("/api/select-job")
async def select_job(request: JobSelectRequest):
    """
    Select a specific job for the interview.
    Returns the selected job details and prepares interview.
    """
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Please upload your CV first.")

    if request.job_index < 0 or request.job_index >= len(session.jobs):
        raise HTTPException(status_code=400, detail="Invalid job index.")

    selected_job = session.jobs[request.job_index]
    session.selected_job = selected_job

    # Setup interview manager
    session.interview_manager = InterviewManager(model=OLLAMA_MODEL)
    session.interview_manager.setup_interview(
        persona=session.persona,
        job_title=selected_job["title"],
        company=selected_job["company"]
    )

    return {
        "status": "ready",
        "selected_job": {
            "title": selected_job["title"],
            "company": selected_job["company"]
        }
    }


@app.post("/api/start-interview")
async def start_interview(request: StartInterviewRequest):
    """
    Start the interview - get the first welcome message from the AI interviewer.
    Returns the AI's welcome text and audio.
    """
    session = sessions.get(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not session.interview_manager:
        raise HTTPException(status_code=400, detail="Please select a job first.")

    try:
        # Get welcome message from AI
        welcome_text = session.interview_manager.get_welcome_message()

        # Generate TTS audio
        audio_path = await text_to_speech(welcome_text)

        # Store audio path for retrieval
        audio_id = str(uuid.uuid4())
        audio_dest = AUDIO_DIR / f"{audio_id}.mp3"
        shutil.move(audio_path, str(audio_dest))

        return {
            "text": welcome_text,
            "audio_id": audio_id,
            "questions_remaining": session.interview_manager.max_questions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@app.post("/api/chat-audio")
async def chat_audio(
    session_id: str = Form(...),
    audio: UploadFile = File(...)
):
    """
    Process user's audio answer. Convert to text, get AI response,
    convert AI response to audio, return everything.
    """
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not session.interview_manager:
        raise HTTPException(status_code=400, detail="Interview not started.")

    # Save the uploaded audio
    audio_path = UPLOAD_DIR / f"{uuid.uuid4()}.wav"
    try:
        with open(audio_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save audio: {str(e)}")

    try:
        # Validate audio file is not empty/corrupt
        audio_size = audio_path.stat().st_size
        if audio_size < 1000:
            raise ValueError("Audio recording is too short or empty. Please try recording again.")

        # Speech to text (async to avoid blocking event loop)
        user_text = await speech_to_text(str(audio_path))

        # Process the answer through the interview manager
        result = session.interview_manager.process_answer(user_text)

        # Generate TTS for AI response
        tts_text = result["ai_text"]
        audio_response_path = await text_to_speech(tts_text)

        # Move audio to accessible location
        audio_id = str(uuid.uuid4())
        audio_dest = AUDIO_DIR / f"{audio_id}.mp3"
        shutil.move(audio_response_path, str(audio_dest))

        response_data = {
            "user_text": result["user_text"],
            "ai_text": result["ai_text"],
            "audio_id": audio_id,
            "type": result["type"],
        }

        if result["type"] == "report":
            response_data["report"] = result["report"]
        else:
            response_data["questions_remaining"] = result["questions_remaining"]

        return response_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        # Cleanup uploaded audio
        if audio_path.exists():
            os.remove(audio_path)


@app.get("/api/audio/{audio_id}")
async def get_audio(audio_id: str):
    """Serve generated TTS audio files."""
    audio_path = AUDIO_DIR / f"{audio_id}.mp3"
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio not found.")

    return FileResponse(
        str(audio_path),
        media_type="audio/mpeg",
        filename=f"{audio_id}.mp3"
    )


# ==========================================
# Cleanup endpoint (optional)
# ==========================================
@app.delete("/api/session/{session_id}")
async def cleanup_session(session_id: str):
    """Clean up session data."""
    if session_id in sessions:
        del sessions[session_id]
    return {"status": "cleaned"}


# ==========================================
# Run Server
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
