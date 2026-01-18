"""
Database Configuration

Supports both SQLite (local development) and PostgreSQL (production).
The DATABASE_URL environment variable determines which to use.
"""

import os
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load environment variables from .env early so DATABASE_URL is available
# when this module is imported (local development).
load_dotenv()

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
    # Supabase Postgres typically requires SSL. If a Supabase URL is provided
    # without sslmode, default to sslmode=require to avoid hanging connections.
    try:
        parsed = urlparse(DATABASE_URL)
        is_postgres = parsed.scheme.startswith("postgres")
        is_supabase = "supabase." in (parsed.hostname or "") or "pooler.supabase.com" in (parsed.hostname or "")
        if is_postgres and is_supabase:
            qs = dict(parse_qsl(parsed.query, keep_blank_values=True))
            if "sslmode" not in qs:
                qs["sslmode"] = "require"
                parsed = parsed._replace(query=urlencode(qs))
                DATABASE_URL = urlunparse(parsed)
    except Exception:
        # If parsing fails, keep the original URL.
        pass

    # PostgreSQL configuration (production)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"connect_timeout": 5},
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
