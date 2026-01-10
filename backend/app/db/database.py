"""
Database Configuration

Supports both SQLite (local development) and PostgreSQL (production).
The DATABASE_URL environment variable determines which to use.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Get database URL from environment, default to SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./analytics.db")

# Handle Supabase/Heroku PostgreSQL URL format
# Some providers use "postgres://" but SQLAlchemy requires "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration (local development)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL configuration (production)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # Check connection health before using
        pool_recycle=300,        # Recycle connections every 5 minutes
        pool_size=5,             # Number of connections to keep
        max_overflow=10          # Extra connections when needed
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
