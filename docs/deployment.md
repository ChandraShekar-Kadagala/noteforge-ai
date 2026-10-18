# NoteForge AI — Production Deployment Guide

## Production Architecture

In production, NoteForge AI deploys across three tiers:
1. **Frontend**: Static production build served behind Nginx with gzip compression, TLS termination, and reverse proxying for `/api`.
2. **Backend**: FastAPI running with Uvicorn workers behind a production ASGI server or container orchestrator.
3. **Database**: Managed PostgreSQL (e.g., Supabase PostgreSQL, AWS RDS, Neon, or DigitalOcean Managed DB) with automated backups and connection pooling.

---

## Environment Variables for Production

Ensure these variables are set securely in your hosting platform (never committed to Git):

```ini
ENVIRONMENT=production
DEBUG=False
PORT=8000
FRONTEND_PORT=5173

# Database Connection (Managed Postgres)
DATABASE_URL=postgresql+psycopg://<user>:<password>@<db-host>:5432/<db_name>?sslmode=require

# Security Secrets (Must be 32+ characters generated via `openssl rand -hex 32`)
SECRET_KEY=<production_random_secret_key>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Production CORS Domains
CORS_ORIGINS=https://noteforge.yourdomain.com

# AI Provider Configuration
GEMINI_API_KEY=<your_gemini_api_key>
GEMINI_MODEL=gemini-1.5-flash
AI_MOCK_FALLBACK=False

# Optional OAuth Credentials
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<client_secret>
LINKEDIN_CLIENT_ID=<client_id>
LINKEDIN_CLIENT_SECRET=<client_secret>
```

---

## Security Checklist Before Go-Live
- [ ] Set `DEBUG=False` in production.
- [ ] Enforce HTTPS (TLS 1.3) via Let's Encrypt / Cloudflare.
- [ ] Restrict `CORS_ORIGINS` to verified production domain names.
- [ ] Verify that database migrations are applied: `alembic upgrade head`.
- [ ] Confirm that AI rate limits and timeouts are actively monitored.
- [ ] Set up daily automated snapshots for the PostgreSQL database.
