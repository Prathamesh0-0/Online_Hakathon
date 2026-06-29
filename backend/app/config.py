import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Settings
    PORT: int = 5000
    DEBUG: bool = True
    API_V1_STR: str = ""

    # Database
    DATABASE_URL: str = "sqlite:///./dev.db"

    # JWT
    JWT_SECRET: str = "super-secret-copilot-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24 * 365

    # LiveKit
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""
    LIVEKIT_URL: str = "wss://your-livekit-project.livekit.cloud"

    # Groq API
    GROQ_API_KEY: str = ""

    # Qdrant Vector Database
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""

    # Redis Cache / Pub-Sub
    REDIS_URL: str = "redis://localhost:6379/0"

    # AWS S3 Storage
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "meeting-copilot-bucket"

    # Third Party Integrations
    SLACK_WEBHOOK_URL: str = ""
    CLICKUP_ACCESS_TOKEN: str = ""
    CLICKUP_LIST_ID: str = ""
    GOOGLE_CALENDAR_CREDENTIALS_JSON: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
