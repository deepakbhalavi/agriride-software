"""
AgriRide – Database configuration using SQLAlchemy.
Supports SQLite (default), MySQL, and PostgreSQL via connection string.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agriride.db")

# ── Normalise database URL dialects ───────────────────────────────────────────
# 1. MySQL: Render does NOT have mysqlclient (MySQLdb) installed.
#    Rewrite ALL mysql:// variants to use PyMySQL (listed in requirements.txt).
import re as _re
DATABASE_URL = _re.sub(
    r"^mysql(\+[^:]+)?://",
    "mysql+pymysql://",
    DATABASE_URL,
)

# 2. PostgreSQL: SQLAlchemy 2.x dropped support for the legacy "postgres://" scheme.
#    Render/Supabase may still provide it, so normalise to "postgresql://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ── SQLite extra args ──────────────────────────────────────────────────────────
# SQLite needs check_same_thread=False for FastAPI async usage
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get DB session for FastAPI endpoints."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
