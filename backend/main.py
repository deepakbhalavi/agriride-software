"""
AgriRide – FastAPI Application Entry Point

Architecture:
    React Frontend
          ↓
    FastAPI REST API   ← this file
          ↓
    Business Logic
          ↓
    Matching Engine (services/matching_engine.py)
          ↓
    Route Optimization (services/matching_engine.py → optimize_pickup_route)
          ↓
    Cost Allocation (services/cost_allocator.py)
          ↓
    SQLite / MySQL / PostgreSQL (database.py)
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import all routers
from routers import auth, farmers, drivers, vehicles, bookings, matching, shared_trips, payments, admin, notifications

# Import DB and models to create tables
from database import engine
import models

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

# ─────────────────────────────────────────────────────────────
# FastAPI App
# ─────────────────────────────────────────────────────────────

app = FastAPI(
    title="AgriRide API",
    description=(
        "Smart Shared Transportation Scheduling Platform for Farmers.\n\n"
        "Core research contribution: Rule-based compatibility matching engine "
        "for agricultural produce transport scheduling with transparent cost allocation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────────────────────
# CORS – allow React dev server
# ─────────────────────────────────────────────────────────────

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Register routers
# ─────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(farmers.router)
app.include_router(drivers.router)
app.include_router(vehicles.router)
app.include_router(bookings.router)
app.include_router(matching.router)
app.include_router(shared_trips.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(notifications.router)


@app.get("/")
def root():
    return {
        "app":     "AgriRide – Smart Shared Transportation Scheduling Platform for Farmers",
        "version": "1.0.0",
        "docs":    "/docs",
        "status":  "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
