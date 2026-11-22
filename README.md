# Email Automation & Reminder System

A student-friendly Python project that loads contact and reminder data from CSV files, personalizes email templates, schedules one-off or recurring reminders, and records results in CSV reports and logs.

## Features
- CSV-based contacts and reminders
- Personalized messages using Jinja2
- One-off, daily, and weekly reminders
- Dry-run mode (default) that does not send email
- Optional SMTP sending
- Logging and CSV reporting
- Separate state files for dry-run and live mode

## Tech Stack
Python, Pandas, smtplib, email.message, Schedule, datetime, CSV, logging, python-dotenv, Jinja2.

## Project Structure
See the repository folders: `data/`, `templates/`, `src/`, `outputs/`, `logs/`, `images/`, and `docs/`.

## Setup
1. Install Python 3.10+.
2. Create and activate a virtual environment.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Dry-run once:
   ```bash
   python main.py --once
   ```
5. Run the scheduler in dry-run mode:
   ```bash
   python main.py
   ```

## Sample data
Edit `data/contacts.csv` and `data/reminders.csv`. Scheduled timestamps use `YYYY-MM-DD HH:MM`. For demo purposes the sample reminders are dated in the past, so they will be due when first run.

## Live sending (optional)
Copy `.env.example` to `.env` and set your sender and SMTP credentials. Use a provider-specific app password where required. Carefully edit the CSV so it contains only addresses you own or have permission to contact. Then run:
```bash
python main.py --live --once
```
Live mode sends messages to recipients listed in the CSV. Do not test on people without permission.

## Reports
The application writes `outputs/email_report.csv`, state files under `outputs/`, and `logs/automation.log`.

## Important
- Dry-run is the default and does not send real emails.
- Never commit `.env`, credentials, private contact data, generated logs, or reports.
- SMTP acceptance does not guarantee inbox delivery.
- State files prevent duplicate sends for the same reminder in each mode.

## Screenshots
Add screenshots of the folder structure, sample CSVs, dry-run terminal, generated report, and GitHub repository preview to `images/`.

## Learning Outcomes
CSV processing, Python modules, templates, datetime handling, scheduling, SMTP, environment variables, logging, exception handling, and Git/GitHub workflow.
