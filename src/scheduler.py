import json
from datetime import datetime, timedelta
import pandas as pd

from .utils import DATA_DIR, OUTPUT_DIR, logger
from .email_service import create_email, send_email
from .report_generator import record_result

DRY_STATE = OUTPUT_DIR / "dry_run_state.json"
LIVE_STATE = OUTPUT_DIR / "live_state.json"

def load_state(path):
    if path.exists():
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_state(state, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def load_contacts():
    df = pd.read_csv(DATA_DIR / "contacts.csv")
    df["email"] = df["email"].astype(str).str.strip().str.lower()
    return df.set_index("email").to_dict(orient="index")

def load_reminders():
    df = pd.read_csv(DATA_DIR / "reminders.csv")
    df["email"] = df["email"].astype(str).str.strip().str.lower()
    df["scheduled_at"] = df["scheduled_at"].astype(str).str.strip()
    df["recurrence"] = df["recurrence"].astype(str).str.strip().str.lower()
    return df.to_dict(orient="records")

def is_due(reminder, now, state):
    rid = str(reminder["id"])
    scheduled = datetime.strptime(reminder["scheduled_at"], "%Y-%m-%d %H:%M")
    last_sent = state.get(rid)

    if last_sent is None:
        return now >= scheduled

    recurrence = reminder["recurrence"]
    if recurrence == "once":
        return False

    last_time = datetime.fromisoformat(last_sent)
    if recurrence == "daily":
        return now >= last_time + timedelta(days=1)
    if recurrence == "weekly":
        return now >= last_time + timedelta(days=7)
    logger.warning("Unknown recurrence value for %s: %s", rid, recurrence)
    return False

def process_reminders(dry_run=True):
    contacts = load_contacts()
    reminders = load_reminders()
    state_path = DRY_STATE if dry_run else LIVE_STATE
    state = load_state(state_path)
    now = datetime.now()
    mode = "DRY_RUN" if dry_run else "LIVE"

    for reminder in reminders:
        rid = str(reminder.get("id", ""))
        email = reminder.get("email", "").strip().lower()

        if email not in contacts:
            logger.error("Contact not found for reminder %s (%s)", rid, email)
            record_result(reminder, mode, "FAILED", "No matching contact in contacts.csv")
            continue

        try:
            if not is_due(reminder, now, state):
                logger.info("Not due yet or already processed: %s", rid)
                continue

            msg = create_email(contacts[email], reminder)
            status, details = send_email(msg, dry_run=dry_run)
            record_result(reminder, mode, status, details)

            # Only mark processed after the operation succeeds/simulates.
            state[rid] = now.isoformat(timespec="seconds")
            save_state(state, state_path)

        except Exception as exc:
            logger.exception("Failed to process reminder %s", rid)
            record_result(reminder, mode, "FAILED", str(exc))

def run_scheduler(dry_run=True):
    import schedule
    import time

    logger.info("Scheduler started (%s mode). Checks reminders every minute.", 
                "DRY_RUN" if dry_run else "LIVE")
    process_reminders(dry_run=dry_run)
    schedule.every(1).minutes.do(process_reminders, dry_run=dry_run)
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user.")
