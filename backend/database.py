"""
AgriRide – Database configuration using SQLAlchemy.
Supports SQLite (default), MySQL, and PostgreSQL via connection string.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agriride.db")

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
