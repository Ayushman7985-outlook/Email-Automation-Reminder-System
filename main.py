import argparse
from src.scheduler import process_reminders, run_scheduler

def main():
    parser = argparse.ArgumentParser(description="Email Automation & Reminder System")
    parser.add_argument("--live", action="store_true", help="Actually send emails using configured SMTP.")
    parser.add_argument("--once", action="store_true", help="Check reminders once and exit.")
    args = parser.parse_args()

    dry_run = not args.live
    if args.once:
        process_reminders(dry_run=dry_run)
    else:
        run_scheduler(dry_run=dry_run)

if __name__ == "__main__":
    main()
