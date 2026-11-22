# Email Automation & Reminder System

A full-stack student project with a FastAPI backend and a modern Next.js dashboard.

## Features
- Dashboard with contact, reminder and activity metrics
- Create and delete contacts
- Create, list, run and delete reminders
- One-off, daily and weekly recurrence labels
- Email Studio with safe dry-run and optional SMTP live send
- Activity history and API documentation
- JSON-backed local persistence for easy local development

## Architecture
Next.js frontend (port 3000) -> FastAPI backend (port 8000) -> local JSON data files / SMTP server.

## Run the backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```
Interactive API docs: http://localhost:8000/docs

## Run the frontend
Open a second terminal:
```bash
cd frontend
npm install
# Optional: copy .env.local.example to .env.local
npm run dev
```
Open http://localhost:3000.

## Safe testing
The Email Studio starts in dry-run mode. Reminder "Run" actions also default to dry-run. No real email is sent in dry-run mode.

For live SMTP, configure `backend/.env` with your sender address and provider-specific app password, then uncheck dry-run in Email Studio. Only send to recipients who have consented. Never commit `.env`.

## Important implementation note
This starter includes a dashboard and API for managing reminders, but it does not yet run an autonomous background scheduler. The Run action executes a reminder on demand. A production-ready recurring worker, durable database, authentication, retries and delivery-provider webhooks are future extensions. The recurrence field is stored and displayed but is not automatically executed on a recurring timer in this version.
