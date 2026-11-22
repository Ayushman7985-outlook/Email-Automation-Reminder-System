# Backend — FastAPI

## Setup (Windows PowerShell)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Dry-run is the default for test sends and reminder runs. Live sending requires valid SMTP credentials in `.env`. Never commit `.env`.
