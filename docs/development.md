# NoteForge AI — Local Development Guide

## Prerequisites
- **Python**: Version 3.11 or 3.12
- **Node.js**: Version 18+ (tested on Node v20/v26, npm 11/12)
- **Docker & Docker Compose**: Docker Desktop 24+

---

## Quick Start (Dockerized Development)

To start the full stack (PostgreSQL + FastAPI Backend + React Frontend):

```bash
# 1. Clone repository
git clone <repository_url> noteforge-ai
cd noteforge-ai

# 2. Configure environment
cp .env.example .env

# 3. Start containers with live build
docker compose up --build
```

Access the applications:
- **Frontend Workspace**: http://localhost:5173
- **FastAPI Documentation & Swagger**: http://localhost:8000/docs
- **Health Check Endpoint**: http://localhost:8000/api/health
- **PostgreSQL Database**: `localhost:5433` (mapped to avoid port 5432 collision)

---

## Local Development (Without Docker)

### 1. Database Setup
Start only the PostgreSQL container:
```bash
docker compose up -d db
```
Database is healthy on `localhost:5433`.

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite HMR server
npm run dev
```

---

## Running Automated Tests

### Backend Unit & Integration Tests (14 Tests)
```bash
cd noteforge-ai
backend/.venv/bin/pytest backend/tests -v
# On Windows:
backend\.venv\Scripts\python -m pytest backend/tests -v
```

### Frontend TypeScript Verification & Build
```bash
cd frontend
npm run lint   # Type checks with tsc --noEmit
npm run build  # Validates Vite bundling
```
