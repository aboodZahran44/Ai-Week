


<p align="center">
  <h1 align="center">🚀 AI Career Agent</h1>
  <p align="center">
    <strong>AI-Powered Career Analysis, Job Matching & Voice Interview Platform</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python&logoColor=white" />
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white" />
    <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/Ollama-LLM-orange?style=for-the-badge" />
    <img src="https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  </p>
</p>

---

## 📌 Overview

**AI Career Agent** is a full-stack AI-powered platform that analyzes your CV, matches you with real job opportunities, and conducts a **live voice-to-voice AI interview** — all powered by local LLMs via [Ollama](https://ollama.com/).

The system acts as a complete career assistant:
1. **Upload your CV** (PDF) → The AI extracts your skills, analyzes your GitHub repos, and builds a detailed technical persona.
2. **Job Matching** → Searches for real jobs using SerpAPI and evaluates how well you fit each role.
3. **AI Voice Interview** → Conducts a 3-question live interview with real-time speech-to-text and text-to-speech.
4. **Evaluation Report** → Generates a structured dashboard report with verdict, strengths, weaknesses, hiring probability, and an improvement roadmap.

---

## 🎥 Demo & Screenshots

> https://github.com/user-attachments/assets/277d0f31-486e-4151-a1bf-21f51856918f

### Flow

| Step | Description |
|------|-------------|
| 📄 **Upload CV** | Drag & drop your PDF resume |
| 🎯 **Job Matching** | AI finds and ranks real job listings for you |
| 🎙️ **Voice Interview** | Live AI interview with speech recognition |
| 📊 **Report Dashboard** | Professional evaluation with scores & roadmap |

---

## 🏗️ Architecture

```
AI-Career-Agent/
├── backend/                    # FastAPI Backend
│   ├── main.py                 # API endpoints & server
│   ├── career_agent.py         # CV parsing, GitHub analysis, job matching
│   ├── interview_manager.py    # Interview logic, TTS, STT
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # API keys (create your own)
│
├── frontend/                   # Next.js Frontend
│   ├── app/
│   │   ├── page.js             # Main app page with state management
│   │   ├── layout.js           # Root layout
│   │   ├── globals.css         # Design system & styles
│   │   └── components/
│   │       ├── LandingPage.js      # CV upload with drag & drop
│   │       ├── ResultsPage.js      # Job matching results
│   │       ├── InterviewRoom.js    # Live voice interview UI
│   │       ├── ReportPage.js       # Evaluation dashboard
│   │       ├── Navbar.js           # Top navigation bar
│   │       └── StepIndicator.js    # Progress stepper
│   └── package.json
│
├── .gitignore
└── README.md
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **LLM** | Ollama (Llama 3.1) | Local AI inference for analysis, interview, and reports |
| **Backend** | FastAPI + Uvicorn | REST API server |
| **Frontend** | Next.js 16 + React 19 | Modern web UI |
| **Styling** | Tailwind CSS 4 + Framer Motion | Dark theme, glassmorphism, animations |
| **CV Parsing** | PyMuPDF (fitz) | Extract text from PDF files |
| **Job Search** | SerpAPI (Google Jobs) | Find real job listings |
| **Speech-to-Text** | Google Speech Recognition | Convert user voice to text |
| **Text-to-Speech** | Edge-TTS | Convert AI responses to natural speech |
| **GitHub Analysis** | GitHub REST API | Analyze candidate's repositories |

---

## ⚙️ Prerequisites

Before running the project, make sure you have the following installed:

| Tool | Version | Download Link |
|------|---------|--------------|
| **Python** | 3.10 or higher | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18 or higher | [nodejs.org](https://nodejs.org/) |
| **Ollama** | Latest | [ollama.com](https://ollama.com/download) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### API Keys Required

| Key | Where to Get |
|-----|-------------|
| **GitHub Token** | [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens) |
| **SerpAPI Key** | [serpapi.com](https://serpapi.com/) (free tier available) |

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/aboodZahran44/Ai-Week.git
cd Ai-Week
```

### Step 2: Install & Pull the Ollama Model

```bash
# Install Ollama from https://ollama.com/download
# Then pull the LLM model:
ollama pull llama3.1
```

> Make sure Ollama is running in the background. You can verify by running:
> ```bash
> ollama list
> ```

### Step 3: Setup the Backend

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Step 4: Configure Environment Variables

Create a `.env` file inside the `backend/` directory:

```bash
# backend/.env
GITHUB_TOKEN=your_github_personal_access_token
SERP_API_KEY=your_serpapi_key
OLLAMA_MODEL=llama3.1
```

> ⚠️ **Important:** Never commit your `.env` file to GitHub. It's already in `.gitignore`.

### Step 5: Setup the Frontend

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install Node.js dependencies
npm install
```

---

## ▶️ Running the Application

You need **3 terminals** running simultaneously:

### Terminal 1: Ollama (LLM Server)
```bash
ollama serve
```
> If Ollama is already running as a service, you can skip this step.

### Terminal 2: Backend (FastAPI)
```bash
cd backend
venv\Scripts\activate     # On Windows
# source venv/bin/activate  # On macOS/Linux
python main.py
```
> The API will start at **http://localhost:8000**

### Terminal 3: Frontend (Next.js)
```bash
cd frontend
npm run dev
```
> The UI will be available at **http://localhost:3000**

---

## 📖 How to Use

1. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

2. **Upload your CV** — Drag & drop or click to upload a PDF resume. The AI will:
   - Extract your skills, education, and experience
   - Find your GitHub profile (if linked in the CV) and analyze your repositories
   - Generate a detailed technical persona

3. **Browse Matched Jobs** — The AI searches for real jobs matching your profile and shows:
   - Match score
   - Why you're a good fit
   - Missing skills & learning roadmap
   - Hiring probability

4. **Select a Job & Start the Interview** — Choose a job position, then:
   - The AI interviewer introduces itself and welcomes you
   - You'll be asked **3 targeted technical questions**
   - Click the 🎙️ microphone button to record your answer
   - Click ⏹️ stop to send your response

5. **View Your Report** — After 3 questions, you get a professional dashboard with:
   - 🎯 **Final Verdict** (Highly Recommended / Conditional / Not Recommended)
   - 📈 **Hiring Probability Score** with animated progress bar
   - 💪 **Key Strengths** identified from your answers
   - ⚠️ **Weaknesses & Areas for Improvement**
   - 🗣️ **Communication & Confidence Level** assessment
   - 🗺️ **Action Plan & Roadmap** for improvement

6. **Download** your report as a Markdown file for reference.

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Ollama connection refused` | Make sure Ollama is running: `ollama serve` |
| `Model not found` | Pull the model: `ollama pull llama3.1` |
| `Audio processing error` | Make sure you allow microphone access in the browser |
| `SerpAPI error` | Check your API key in `.env` and verify your quota |
| `CORS error` | Ensure backend is running on port 8000 and frontend on 3000 |
| `pip install fails` | Try upgrading pip: `pip install --upgrade pip` |

---

## 🛠️ Changing the LLM Model

You can use any Ollama-compatible model. Just update in **two places**:

1. **Pull the new model:**
   ```bash
   ollama pull <model-name>
   ```

2. **Update `backend/.env`:**
   ```
   OLLAMA_MODEL=<model-name>
   ```

Popular alternatives: `llama3.1`, `gemma3:4b`, `mistral`, `phi3`

---

## 📁 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check & model info |
| `POST` | `/api/upload-cv` | Upload PDF CV for analysis |
| `POST` | `/api/select-job` | Select a job for interview |
| `POST` | `/api/start-interview` | Start the AI interview |
| `POST` | `/api/chat-audio` | Send audio answer, get AI response |
| `GET` | `/api/audio/{id}` | Retrieve TTS audio file |
| `DELETE` | `/api/session/{id}` | Clean up session data |

---

## 👥 Team

> Haytham Ali Albaqoum -
> Abd Alrahman Nidal Zahran

---

## 📄 License

This project was built for the **AI Week Hackathon**.

---

<p align="center">
  Built with ❤️ using Ollama, FastAPI & Next.js
</p>
