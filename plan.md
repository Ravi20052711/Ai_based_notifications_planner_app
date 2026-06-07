# NotifyAI — Implementation Plan

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend  | FastAPI (Python 3.12) |
| Database | SQLite + SQLAlchemy |
| Frontend | React.js (Vite + TailwindCSS) |
| Cache    | Redis |
| AI Model | Qwen 2.5 (via Ollama) |
| Scheduler| APScheduler |
| Notifications | Firebase Cloud Messaging |
| Auth | JWT (PyJWT + bcrypt) |
| Deployment | Docker + docker-compose |

---

## 1. Project Structure

```
Ai-based_notifications app/
├── backend/                    # FastAPI + SQLite + Redis
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entry point
│   │   ├── config.py           # Settings (env vars via pydantic-settings)
│   │   ├── database.py         # SQLite connection + engine
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py         # User model
│   │   │   └── reminder.py     # Reminder model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py         # Pydantic schemas for users
│   │   │   └── reminder.py     # Pydantic schemas for reminders
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # Register / Login
│   │   │   ├── reminders.py    # CRUD + today's tasks
│   │   │   └── ai.py           # AI endpoints (NL → reminder, plan, goals)
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── ai_service.py   # Qwen integration (Ollama HTTP client)
│   │   │   ├── scheduler.py    # APScheduler — checks due reminders
│   │   │   └── notification.py # Firebase push notification sender
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── auth.py         # JWT encode/decode helpers
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── alembic/                # (optional) DB migrations
│       └── ...
├── frontend/                   # React.js
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateReminder.jsx
│   │   │   ├── AIReminder.jsx
│   │   │   ├── DailyPlan.jsx
│   │   │   └── GoalBreakdown.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios API client
│   │   ├── store/              # State management (context or zustand)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── plan.md                     # This file
└── README.md
```

---

## 2. Phased Implementation

### Phase 1 — Backend Foundation (Days 1-3)

| Step | Task | Details |
|------|------|---------|
| 1.1 | Project scaffolding | Create `/backend` with FastAPI, config, folder structure |
| 1.2 | Database setup | SQLite engine + SQLAlchemy Base + session management |
| 1.3 | User model + auth | `User` model, bcrypt hashing, JWT access/refresh tokens |
| 1.4 | Reminder model + CRUD | `Reminder` model, full CRUD via REST endpoints |
| 1.5 | Validate + test | Run backend, test all endpoints with httpie/curl |

### Phase 2 — AI Integration (Days 4-6)

| Step | Task | Details |
|------|------|---------|
| 2.1 | Install Ollama + Qwen | `ollama pull qwen2.5:7b`, expose HTTP API |
| 2.2 | AI service module | `ai_service.py` — sends prompt → receives JSON → validates |
| 2.3 | NL → Reminder endpoint | `POST /api/ai/reminder` — free text → structured reminder |
| 2.4 | Daily planner endpoint | `POST /api/ai/plan` — pending tasks → optimized schedule |
| 2.5 | Goal breakdown endpoint | `POST /api/ai/goals` — big goal → subtask list |

### Phase 3 — Scheduling + Notifications (Days 7-9)

| Step | Task | Details |
|------|------|---------|
| 3.1 | APScheduler setup | Background job runs every 60s, queries due reminders |
| 3.2 | Redis integration | Cache user sessions, rate-limit AI calls, cache today's tasks |
| 3.3 | Firebase setup | Service account + FCM HTTP v1 API |
| 3.4 | Push on due reminders | Scheduler finds due reminders → sends push notification |
| 3.5 | Smart notification text | AI-generated personalized reminder message |

### Phase 4 — Frontend (Days 10-14)

| Step | Task | Details |
|------|------|---------|
| 4.1 | Vite + React setup | TailwindCSS, react-router, Axios |
| 4.2 | Auth pages | Login / Register forms with JWT storage (localStorage) |
| 4.3 | Dashboard | Today's tasks, pending count, priority badges |
| 4.4 | Manual reminder form | Date/time/repeat/priority inputs |
| 4.5 | AI reminder input | Text box → calls AI endpoint → shows parsed preview → saves |
| 4.6 | Daily planner UI | Timed schedule view with task cards |
| 4.7 | Goal breakdown UI | Input goal + days → shows generated task list |

### Phase 5 — Docker + Deployment (Days 15-16)

| Step | Task | Details |
|------|------|---------|
| 5.1 | Backend Dockerfile | Python 3.12-slim, uvicorn |
| 5.2 | Frontend Dockerfile | Node build → nginx static serve |
| 5.3 | docker-compose.yml | Backend + Frontend + Redis + (optional: Ollama) |
| 5.4 | Environment config | `.env` for secrets (JWT, Firebase, etc.) |
| 5.5 | Smoke test | Full flow: register → login → AI reminder → scheduled → notify |

---

## 3. API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create user account |
| POST | `/api/auth/login` | Authenticate, return JWT |
| POST | `/api/auth/refresh` | Refresh access token |

### Reminders (requires JWT)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reminders` | List all reminders for user |
| GET | `/api/reminders/today` | Today's pending tasks |
| GET | `/api/reminders/{id}` | Get single reminder |
| POST | `/api/reminders` | Create reminder (manual) |
| PUT | `/api/reminders/{id}` | Update reminder |
| DELETE | `/api/reminders/{id}` | Delete reminder |
| PATCH | `/api/reminders/{id}/complete` | Mark as completed |

### AI (requires JWT)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/reminder` | Free text → structured reminder |
| POST | `/api/ai/plan` | Pending tasks → daily schedule |
| POST | `/api/ai/goals` | Goal description → subtasks |

---

## 4. Database Schema (SQLite)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    date TEXT NOT NULL,              -- YYYY-MM-DD
    time TEXT NOT NULL,              -- HH:MM
    repeat_type TEXT DEFAULT 'none', -- none|daily|weekly|weekdays|monthly
    priority TEXT DEFAULT 'medium',  -- low|medium|high
    category TEXT DEFAULT 'general',
    status TEXT DEFAULT 'pending',   -- pending|completed|missed
    is_ai_generated INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 5. Redis Usage

| Purpose | Key Pattern | TTL |
|---------|-------------|-----|
| Cache today's tasks | `todays_tasks:{user_id}` | 5 min |
| Rate limit AI | `ratelimit:{user_id}:ai` | 1 min |
| User session cache | `session:{user_id}` | 1 hour |
| Celery result backend | _(future)_ | — |

---

## 6. AI Prompt Engineering

### Reminder Extraction (System Prompt)
```
You are a reminder extraction assistant. Extract structured data from the user's sentence.
Return ONLY valid JSON with these fields:
- title (string, required)
- date (YYYY-MM-DD, infer from "tomorrow"/"next monday" etc., default to today)
- time (HH:MM in 24h format, infer from "morning"=>"09:00", "afternoon"=>"14:00", "evening"=>"18:00", default to "09:00")
- repeat (one of: none, daily, weekly, weekdays, monthly)
- priority (one of: low, medium, high; infer from urgency words)
- category (infer from context: "work", "personal", "health", "study", "general")
```

### Daily Planner (System Prompt)
```
Given the user's pending tasks with their priorities and deadlines,
create an optimized daily schedule. Consider:
- High priority tasks first
- Tasks with nearest deadlines
- Logical grouping (e.g., study topics together)
Return a JSON array of objects with fields: time (HH:MM), title, duration_minutes.
```

### Goal Breakdown (System Prompt)
```
Break down the user's goal into smaller daily tasks.
The user specifies a goal and a number of days.
Create a JSON array where each entry has: day (number), title, description, estimated_minutes.
Make tasks specific, actionable, and progressive.
```

---

## 7. Docker Compose Services

```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [redis]
    volumes: [./backend:/app]

  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  ollama:        # Optional — can run separately
    image: ollama/ollama
    ports: ["11434:11434"]
    volumes: [ollama_data:/root/.ollama]

volumes:
  ollama_data:
```

---

## 8. Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Qwen model too large for local | Use smaller model (qwen2.5:3b) or cloud API fallback |
| SQLite concurrency limits | Acceptable for MVP; migrate to PostgreSQL later |
| Firebase not available in all regions | Fallback to polling + browser notification |
| Ollama GPU requirements | Run on CPU with slower inference; queue AI requests |
| Timezone handling | Store all times in UTC, convert on frontend |

---

## 9. Success Criteria (MVP)

- [ ] User can register and login with JWT
- [ ] User can create a reminder manually (title, date, time, repeat, priority)
- [ ] User can type natural language → AI creates a structured reminder
- [ ] Scheduler fires notifications at the right time
- [ ] Dashboard shows today's pending tasks
- [ ] AI can generate a daily plan from pending tasks
- [ ] AI can break down a goal into daily subtasks
- [ ] Entire system runs via `docker-compose up`
