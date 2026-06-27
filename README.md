# AI Meeting Copilot for Remote Teams

An interactive, real-time AI Meeting Copilot that streams meeting conversations, extracts action items dynamically, identifies blockers and risks, and compiles professional meeting summaries and analytics using **FastAPI (Python)**, **Socket.IO WebSockets**, **SQLAlchemy**, **Qdrant**, **Redis**, **AWS S3**, **Groq API**, and **LangGraph**.

---

## Capabilities

### AI Capabilities
* **Real-time Transcription & Summarization**: Process speech streams chunk-by-chunk and translate/transcribe multilingual dialogues.
* **Accent & Speaker Handling**: Gracefully handle diverse accents and automatically map dialogue turns through speaker diarization.
* **Summaries for Absent Participants**: Generate highly structured meeting minutes and overview briefs, allowing absent team members to quickly catch up.
* **Semantic Search Knowledge Base**: Store dialogue embeddings inside **Qdrant** and run semantic queries across all past discussions, decisions, and tasks.
* **Distributed Time Zone Support**: Format all deadlines, action items, and schedules into timezone-aware UTC timestamps for remote global teams.

### Analytics Capabilities
* **Meeting Attendance Tracker**: Auto-detect participating speakers and track meeting presence.
* **Participant Engagement Metrics**: Measure meeting engagement scores based on turn distribution balance and dialogue interactivity.
* **Action Item Tracking**: Track responsibilities and task assignments.
* **Collaboration Productivity Trends**: Estimate cooperation productivity scores (0-100) per session to monitor team performance over time.

---

## MVP Priority Focus (Hackathon / Hack-Project Scope)
To maintain a tight, high-impact scope for a hackathon or college MVP, we prioritized:
1. **Real-time socket-based transcription**
2. **Multi-agent AI Summarization**
3. **Action item responsibility and deadline assignment**
4. **Qdrant-based Semantic Search**
5. **Follow-up recommendation automation**
6. **Dockerized PostgreSQL, Redis, and Qdrant setup**

*Advanced third-party connectors (Slack, Jira, Trello, ClickUp, Google Calendar) and full analytics dashboards can be scaled incrementally.*

---

## Tech Stack

* **Frontend**: React (Vite), TypeScript, Vanilla CSS (Premium dark mode glassmorphism theme), and Socket.IO client.
* **Backend**: FastAPI (Python), Socket.IO ASGI Gateway, JWT Auth.
* **Database**: PostgreSQL (Production) / SQLite (Local file development).
* **Vector Store**: Qdrant Vector DB (for semantic transcript search).
* **Cache & Pub/Sub**: Redis.
* **Object Store**: AWS S3 (for archiving raw meeting transcripts).
* **Orchestration & LLM**: LangGraph multi-agent network using the Groq API (fallback to Gemini or Mock parser if keys are missing).

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/             # JWT auth, LiveKit token generator, meetings, and AI endpoints
│   │   ├── core/            # Database configurations, password hashings, and security
│   │   ├── models/          # PostgreSQL SQLAlchemy schemas (User, Meeting, Transcript, Summary, etc.)
│   │   ├── schemas/         # Pydantic request/response body validators
│   │   ├── services/        # Qdrant, S3, Redis, LiveKit, and Integrations services
│   │   ├── ai_workflow/     # LangGraph multi-agent state definitions and nodes
│   │   ├── websockets/      # Socket.IO live stream listeners and real-time emitters
│   │   └── main.py          # FastAPI application bootstrapper
│   ├── main.py              # Root backend delegation script
│   ├── requirements.txt     # Backend python dependencies
│   ├── Dockerfile           # Backend containerization configuration
│   └── docker-compose.yml   # Multi-service setup (Postgres, Redis, Qdrant, Backend)
└── frontend/
    ├── src/
    │   ├── pages/           # Login, Dashboard, live Meeting Room, and Tasks board
    │   ├── App.tsx          # Router layout and sidebar navigation
    │   ├── index.css        # Premium style tokens and CSS definitions
    │   └── main.tsx         # Frontend entry point
```

---

## Setup & Running Guide

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and [Python](https://www.python.org/) (v3.10 or higher) installed.

### 2. Configure Environment Variables
Create or verify the `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL="sqlite:///./dev.db"
JWT_SECRET="super-secret-copilot-key-change-in-production"
GROQ_API_KEY=""
GEMINI_API_KEY=""
```
*Note: If no API keys are provided, the app will run in **Mock AI Mode**, generating fully structured outputs so you can test all features.*

### 3. Initialize & Start Backend
Navigate to the `backend/` directory, install packages, and start the development server:
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:socket_app --port 5000 --reload
```
The FastAPI server starts on [http://localhost:5000](http://localhost:5000). Swagger documentation is available at [http://localhost:5000/docs](http://localhost:5000/docs).

### 4. Start Frontend
Navigate to the `frontend/` directory, install packages, and start the dev server:
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
