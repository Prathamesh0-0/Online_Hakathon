# Database configuration for SQLAlchemy
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine  # type: ignore
from sqlalchemy.orm import declarative_base, sessionmaker  # type: ignore

load_dotenv()

# We can fall back to file:dev.db if no env variable is set
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

# Convert Prisma-style SQLite file path to SQLAlchemy-style
if DATABASE_URL.startswith("file:"):
    DATABASE_URL = DATABASE_URL.replace("file:", "sqlite:///", 1)

# SQLite needs connect_args={'check_same_thread': False} for multithreading
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
