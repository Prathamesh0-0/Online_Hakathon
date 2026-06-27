import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    invitedEmails = Column(String, nullable=True)
    status = Column(String, default="SCHEDULED") # SCHEDULED, ACTIVE, COMPLETED
    startTime = Column(DateTime, default=datetime.utcnow)
    endTime = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    hostId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    host = relationship("User", back_populates="meetings")

    channelId = Column(String, ForeignKey("channels.id", ondelete="SET NULL"), nullable=True)
    channel = relationship("Channel", backref="meetings")

    # Relationships
    transcripts = relationship("Transcript", back_populates="meeting", cascade="all, delete-orphan")
    actionItems = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="meeting", cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan")
    analytics = relationship("Analytics", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
