from datetime import datetime, timezone
from uuid import uuid4
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS, LOG_DIR
from .schemas import ReminderCreate, SendTestRequest
from .store import reminders, save_reminders, contacts, save_contacts, activity, add_activity
from .mailer import send_message

logging.basicConfig(
    filename=LOG_DIR / "api.log",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

app = FastAPI(
    title="Email Automation API",
    description="API for contacts, scheduled reminders, email sending and activity tracking.",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in CORS_ORIGINS if x.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"name": "Email Automation & Reminder System", "status": "online"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "backend"}

@app.get("/api/dashboard")
def dashboard():
    rs = reminders()
    logs = activity()
    now = datetime.now().astimezone()
    upcoming = []
    for r in rs:
        try:
            dt = datetime.fromisoformat(r["scheduled_at"].replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.astimezone()
            if dt >= now and r.get("status") == "scheduled":
                upcoming.append(r)
        except (ValueError, KeyError):
            pass
    return {
        "contacts": len(contacts()),
        "reminders": len(rs),
        "scheduled": sum(1 for r in rs if r.get("status") == "scheduled"),
        "sent": sum(1 for x in logs if x.get("status") == "sent"),
        "simulated": sum(1 for x in logs if x.get("status") == "simulated"),
        "failed": sum(1 for x in logs if x.get("status") == "failed"),
        "upcoming": sorted(upcoming, key=lambda x: x.get("scheduled_at", ""))[:5],
        "recent_activity": logs[:8],
    }

@app.get("/api/reminders")
def list_reminders():
    return sorted(reminders(), key=lambda x: x.get("scheduled_at", ""))

@app.post("/api/reminders")
def create_reminder(payload: ReminderCreate):
    items = reminders()
    item = payload.model_dump()
    item["id"] = str(uuid4())
    item["created_at"] = datetime.now(timezone.utc).isoformat()
    item["status"] = "scheduled"
    items.append(item)
    save_reminders(items)
    return item

@app.delete("/api/reminders/{reminder_id}")
def delete_reminder(reminder_id: str):
    items = reminders()
    updated = [r for r in items if r.get("id") != reminder_id]
    if len(updated) == len(items):
        raise HTTPException(status_code=404, detail="Reminder not found")
    save_reminders(updated)
    return {"deleted": True}

@app.get("/api/contacts")
def list_contacts():
    return contacts()

@app.post("/api/contacts")
def create_contact(payload: dict):
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    department = str(payload.get("department", "General")).strip()
    if not name or "@" not in email:
        raise HTTPException(status_code=400, detail="A valid name and email are required")
    items = contacts()
    if any(c.get("email", "").lower() == email for c in items):
        raise HTTPException(status_code=409, detail="Contact already exists")
    item = {"id": str(uuid4()), "name": name, "email": email, "department": department}
    items.append(item)
    save_contacts(items)
    return item

@app.delete("/api/contacts/{contact_id}")
def delete_contact(contact_id: str):
    items = contacts()
    updated = [c for c in items if c.get("id") != contact_id]
    if len(updated) == len(items):
        raise HTTPException(status_code=404, detail="Contact not found")
    save_contacts(updated)
    return {"deleted": True}

@app.get("/api/activity")
def get_activity():
    return activity()

@app.post("/api/send-test")
def send_test(payload: SendTestRequest):
    try:
        result = send_message(payload.email, payload.subject, payload.message, payload.dry_run)
        add_activity({
            "recipient": payload.email,
            "subject": payload.subject,
            "status": result["status"],
            "detail": result["detail"],
            "mode": "dry-run" if payload.dry_run else "live",
        })
        return result
    except Exception as exc:
        logging.exception("Test email failed")
        add_activity({
            "recipient": payload.email,
            "subject": payload.subject,
            "status": "failed",
            "detail": str(exc),
            "mode": "live",
        })
        raise HTTPException(status_code=500, detail=str(exc))

@app.post("/api/reminders/{reminder_id}/run")
def run_reminder(reminder_id: str, dry_run: bool = True):
    items = reminders()
    reminder = next((r for r in items if r.get("id") == reminder_id), None)
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    try:
        result = send_message(reminder["email"], reminder["subject"], reminder["message"], dry_run)
        add_activity({
            "recipient": reminder["email"],
            "subject": reminder["subject"],
            "status": result["status"],
            "detail": result["detail"],
            "mode": "dry-run" if dry_run else "live",
            "reminder_id": reminder_id,
        })
        if not dry_run and reminder.get("recurrence") == "once":
            reminder["status"] = "completed"
            save_reminders(items)
        return result
    except Exception as exc:
        logging.exception("Reminder send failed")
        add_activity({
            "recipient": reminder.get("email", ""),
            "subject": reminder.get("subject", ""),
            "status": "failed",
            "detail": str(exc),
            "mode": "live",
            "reminder_id": reminder_id,
        })
        raise HTTPException(status_code=500, detail=str(exc))
