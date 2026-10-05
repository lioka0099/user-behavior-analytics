"""
Database Configuration

Supports both SQLite (local development) and PostgreSQL (production).
The DATABASE_URL environment variable determines which to use.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env early so DATABASE_URL is available
# when this module is imported (local development).
load_dotenv()

# Get database URL from environment, default to SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./analytics.db")

# Handle Heroku-style PostgreSQL URL format
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
    # PostgreSQL configuration (production, e.g. Neon).
    # Neon's connection string already includes sslmode=require.
    engine = create_engine(
        DATABASE_URL,
        connect_args={"connect_timeout": 10},  # room for a serverless cold start
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
