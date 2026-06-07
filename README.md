# NotifyAI — Enterprise Productivity Platform

NotifyAI is an intelligent, AI-powered notification and reminder system. It uses a local **Qwen:4b** LLM to parse natural language, optimize daily schedules, and generate personalized notification messages.

## 🚀 One-Command Deployment

This entire system is dockerized and ready for production-like deployment locally.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

### Setup & Run
1.  **Clone the repository.**
2.  In the root directory, run:
    ```bash
    docker-compose up --build
    ```
3.  **Wait for the AI:** On the first run, the `ollama` container will download the 2.3GB **Qwen:4b** model. You can track progress in the terminal.
4.  **Access the App:**
    *   **Frontend:** [http://localhost:5173](http://localhost:5173)
    *   **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

## 🧠 Core Features
- **Smart Parsing:** Type "Remind me to fix the bug in 5 minutes" and the AI extracts structured data.
- **Goal Roadmap:** Deconstruct high-level goals into daily actionable steps.
- **AI Daily Planner:** Automatically optimizes your schedule based on priority.
- **Native Notifications:** Browser-level popups triggered by system clock sync.
- **Admin Control:** Secure dashboard to monitor all users and override system reminders.

## 🏗️ Architecture
- **Frontend:** React + Vite + TailwindCSS + Framer Motion.
- **Backend:** FastAPI (Python 3.12) + SQLAlchemy (Repository Pattern).
- **Database:** SQLite (Container-persisted).
- **AI Engine:** Ollama (Local qwen:4b).

## 🛡️ Security
- **Isolated Sessions:** Data access is strictly scoped to the authenticated user ID at the repository layer.
- **JWT Auth:** Secure session management with encrypted tokens.
- **Global Exception Handling:** Standardized error responses to prevent data leakage.

## 🔐 Admin Credentials (Default)
Register a new account. The **very first user** to register is automatically granted **Admin** privileges.

---
*Built for High Performance & Human-Centered Productivity.*
