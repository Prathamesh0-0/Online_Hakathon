import logging
from app.core.logging import setup_logging
setup_logging()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from app.config import settings
from app.core.database import engine, Base
# Ensure all models are imported so metadata knows about them
import app.models  # noqa: F401
from app.api.endpoints import api_router
from app.websockets.socket_handler import register_socket_handlers

logger = logging.getLogger("main")

# 2. Create DB Tables
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")

    # Auto migration for ActionItem external integration columns and new fields
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        
        # 1. Action Items Table
        columns = [c["name"] for c in inspector.get_columns("action_items")]
        with engine.begin() as conn:
            if "externalId" not in columns:
                logger.info("Database migration: adding externalId column to action_items table...")
                conn.execute(text("ALTER TABLE action_items ADD COLUMN externalId VARCHAR(255)"))
            if "externalUrl" not in columns:
                logger.info("Database migration: adding externalUrl column to action_items table...")
                conn.execute(text("ALTER TABLE action_items ADD COLUMN externalUrl VARCHAR(1024)"))
            if "externalPlatform" not in columns:
                logger.info("Database migration: adding externalPlatform column to action_items table...")
                conn.execute(text("ALTER TABLE action_items ADD COLUMN externalPlatform VARCHAR(50)"))
        
        # 2. Summaries Table
        columns_summaries = [c["name"] for c in inspector.get_columns("summaries")]
        with engine.begin() as conn:
            if "keyDecisions" not in columns_summaries:
                logger.info("Database migration: adding keyDecisions column to summaries table...")
                conn.execute(text("ALTER TABLE summaries ADD COLUMN keyDecisions TEXT"))
            if "nextSteps" not in columns_summaries:
                logger.info("Database migration: adding nextSteps column to summaries table...")
                conn.execute(text("ALTER TABLE summaries ADD COLUMN nextSteps TEXT"))
        
        # 3. Analytics Table
        columns_analytics = [c["name"] for c in inspector.get_columns("analytics")]
        with engine.begin() as conn:
            if "speakerSentiment" not in columns_analytics:
                logger.info("Database migration: adding speakerSentiment column to analytics table...")
                conn.execute(text("ALTER TABLE analytics ADD COLUMN speakerSentiment TEXT"))
                
        # 4. Meetings Table
        columns_meetings = [c["name"] for c in inspector.get_columns("meetings")]
        with engine.begin() as conn:
            if "code" not in columns_meetings:
                logger.info("Database migration: adding code column to meetings table...")
                conn.execute(text("ALTER TABLE meetings ADD COLUMN code VARCHAR(50)"))
            if "invitedEmails" not in columns_meetings:
                logger.info("Database migration: adding invitedEmails column to meetings table...")
                conn.execute(text("ALTER TABLE meetings ADD COLUMN invitedEmails TEXT"))

        logger.info("Database migration checks completed successfully.")
    except Exception as em:
        logger.error(f"Failed to run database schema migrations: {em}")
except Exception as e:
    logger.error(f"Failed to initialize database tables: {e}")

# 3. Initialize FastAPI App
app = FastAPI(
    title="AI Meeting Copilot API",
    description="Backend API and real-time Socket.IO gateway for AI Meeting Copilot",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Include REST endpoints router
app.include_router(api_router)

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "AI Meeting Copilot API is running"}


# 5. Setup Socket.IO
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
register_socket_handlers(sio)

# 6. Wrap FastAPI inside Socket.IO ASGI App
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
logger.info("FastAPI and Socket.IO ASGI application assembled.")
