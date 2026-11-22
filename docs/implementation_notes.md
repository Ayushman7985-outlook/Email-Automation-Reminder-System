# Implementation Notes

## Workflow
CSV inputs -> validation/contact lookup -> template rendering -> due-time check -> dry-run or SMTP -> report/state/log.

## Recurrence
- once: only the first processing after the scheduled time
- daily: next attempt at least 24 hours after the prior successful run
- weekly: next attempt at least 7 days after the prior successful run

## Testing safely
Dry-run mode is default. It prints message contents and does not contact SMTP. Use only dummy data during demos.

## State
`outputs/dry_run_state.json` and `outputs/live_state.json` record the last processed timestamp per reminder ID. Delete the relevant state file to reset test state (also consider cleaning report rows if you want a fresh report).
