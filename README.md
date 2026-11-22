# Email Automation & Reminder System

A full-stack email automation dashboard built with **FastAPI, Python, Next.js, and React**. It helps manage contacts, create reminders, send test or reminder emails, and track email activity from one place.

The project supports both **Dry Run** and **Live Email Sending**. Dry Run is the safe default; Live mode connects to an SMTP server (tested with Gmail SMTP) and sends real emails.

## Features

- **Dashboard:** View contact counts, reminders, email activity, and upcoming scheduled reminders.
- **Contact management:** Add, view, and delete contacts.
- **Reminder management:** Create, view, delete, and manually run reminders.
- **Personalized email sending:** Send a test email or run a reminder for its recipient.
- **Real SMTP integration:** Send actual emails through Gmail or another compatible SMTP provider.
- **Dry Run mode:** Test the workflow without sending an email.
- **Activity tracking:** Track sent, simulated, and failed email attempts.
- **Configuration through environment variables:** Keep SMTP credentials outside the source code.

## Technology Stack

| Area | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| UI and charts | Material UI, Recharts |
| Backend API | Python, FastAPI, Uvicorn |
| Email sending | smtplib, email.message, SMTP, STARTTLS |
| Data storage | JSON files |
| Configuration | python-dotenv, environment variables |

## Project Structure

```text
Email-Automation-Reminder-System/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes and application
│   │   ├── config.py        # Environment and application settings
│   │   ├── mailer.py        # SMTP email sending
│   │   ├── schemas.py       # Request data validation
│   │   └── store.py         # JSON-based data storage
│   ├── data/                # Contacts and reminder data
│   ├── outputs/             # Email activity data
│   ├── logs/                # Backend logs
│   ├── .env.example         # SMTP configuration template
│   └── requirements.txt
├── frontend/
│   ├── app/                 # Next.js application pages
│   ├── components/          # Reusable UI components
│   └── package.json
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ayushman7985-outlook/Email-Automation-Reminder-System.git
cd Email-Automation-Reminder-System
```

### 2. Set up the backend

Open a terminal in the project root:

```powershell
cd backend
python -m venv venv
.env\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` and configure your SMTP details (see **Real Email Sending** below).

Start the backend:

```powershell
uvicorn app.main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Set up the frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

## Real Email Sending (Gmail SMTP)

The application can send real emails using Gmail SMTP. To use Gmail:

1. Enable **2-Step Verification** on your Google account.
2. Generate an **App Password** from your Google Account security settings.
3. Copy `backend/.env.example` to `backend/.env` (if you have not already).
4. Add your Gmail address and the generated App Password:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_SENDER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
CORS_ORIGINS=http://localhost:3000
```

5. Save the file and restart the backend.

**Important:** Use the Google App Password, not your normal Gmail account password. Keep `backend/.env` private and never commit it to GitHub. If an App Password is exposed, revoke it in your Google Account and generate a new one.

### Dry Run vs Live Mode

- **Dry Run:** Simulates the email operation. No real email is sent. Use this while testing.
- **Live Mode:** Connects to the configured SMTP server and attempts to send the email to the entered/selected recipient.

Start with Dry Run. Switch to Live only after checking the recipient address and email content. Send test messages only to addresses you own or have permission to contact.

An SMTP server accepting a message does not guarantee that it will reach the recipient's inbox; it may be filtered as spam or rejected later.

## How It Works

1. The user manages contacts and reminders through the Next.js dashboard.
2. The frontend sends requests to the FastAPI backend.
3. FastAPI validates the request and reads or updates the application's JSON data files.
4. When an email action is triggered, the backend passes the recipient, subject, and message to the mailer.
5. In Dry Run mode, the mailer returns a simulated result. In Live mode, it connects to the SMTP server using STARTTLS, authenticates, and submits the email.
6. The result (sent, simulated, or failed) is recorded in the activity data and shown on the dashboard.

**Current scope:** Reminders can be created and run from the dashboard. The current version does not run an always-on background scheduler that automatically sends reminders at their scheduled time.

## Main API Routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/dashboard` | Get dashboard statistics and recent activity |
| GET / POST | `/api/contacts` | List or add contacts |
| DELETE | `/api/contacts/{contact_id}` | Delete a contact |
| GET / POST | `/api/reminders` | List or create reminders |
| DELETE | `/api/reminders/{reminder_id}` | Delete a reminder |
| POST | `/api/send-test` | Send or simulate a test email |
| POST | `/api/reminders/{reminder_id}/run` | Run a reminder in dry-run or live mode |
| GET | `/api/activity` | View email activity |

## Data and Security Notes

- Contacts, reminders, and activity are stored in JSON files in the backend.
- SMTP credentials belong in `backend/.env`, never directly in Python files.
- Do not commit `.env` files, passwords, App Passwords, or private contact information.
- Use test addresses or recipients who have explicitly agreed to receive messages.
- This project is intended for local development and demonstration; production use would need stronger storage, authentication, deployment configuration, and delivery monitoring.

## Future Improvements

- Add a background scheduler/worker for automatic reminder execution.
- Add a database for persistent, multi-user data storage.
- Add authentication and user-specific access.
- Add retry handling and more detailed delivery status tracking.
- Deploy the frontend and backend for remote access.

## Learning Outcomes

This project demonstrates how a frontend communicates with a Python API, how application data is managed, how SMTP email sending works, how environment variables protect credentials, and how to record application activity.
