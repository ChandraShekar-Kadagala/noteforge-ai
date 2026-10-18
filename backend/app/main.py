from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import engine, Base, get_db
from app.routers.auth import router as auth_router
from app.routers.documents import router as documents_router
from app.routers.ai import router as ai_router
from app.routers.export import router as export_router
from app.routers.upload import router as upload_router
from app.utils.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Safe database table initialization on application startup
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize database on startup (will retry on requests): {e}")
    yield

app = FastAPI(
    title="NoteForge AI API",
    description="Personal AI-Powered Documentation Workspace Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# Explicit CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(ai_router)
app.include_router(export_router)
app.include_router(upload_router)

@app.get("/api/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    db_healthy = False
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        logger.error(f"Health check database failure: {e}")

    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": "connected" if db_healthy else "disconnected",
        "environment": settings.ENVIRONMENT,
        "ai_model": settings.GEMINI_MODEL,
        "ai_fallback_enabled": settings.AI_MOCK_FALLBACK
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "app": "NoteForge AI",
        "status": "active",
        "documentation": "/docs"
    }
