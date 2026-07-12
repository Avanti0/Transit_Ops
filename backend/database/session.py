from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from backend.utils.config import settings

# Create engine with standard configuration options suitable for PostgreSQL in production
# pool_pre_ping=True verifies connections before using them to prevent stale connection errors
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

# SessionLocal is the session factory that will be instantiated per request
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a transactional database session.
    Ensures that sessions are closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
