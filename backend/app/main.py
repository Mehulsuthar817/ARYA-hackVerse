"""
main.py
FastAPI application entry point.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import connect_db, close_db
from app.config import UPLOAD_DIR
from app.routes.auth_routes import router as auth_router
from app.routes.missing_routes import router as missing_router
from app.routes.sightings_routes import router as sightings_router
from app.routes.admin_routes import router as admin_router
from app.routes.cctv_routes import router as cctv_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Missing Person Identification System",
    description="AI-powered facial recognition and CCTV monitoring platform.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — adjust origins for production
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Serve uploaded files at /uploads/<path>
# ---------------------------------------------------------------------------
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(missing_router)
app.include_router(sightings_router)
app.include_router(admin_router)
app.include_router(cctv_router)


@app.get("/")
async def root():
    return {
        "service": "Missing Person Identification System",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
