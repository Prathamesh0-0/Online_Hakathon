import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    meetings = relationship("Meeting", back_populates="host", cascade="all, delete-orphan")

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="SCHEDULED") # SCHEDULED, ACTIVE, COMPLETED
    startTime = Column(DateTime, default=datetime.utcnow)
    endTime = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    
    hostId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    host = relationship("User", back_populates="meetings")

    transcripts = relationship("Transcript", back_populates="meeting", cascade="all, delete-orphan")
    actionItems = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    risks = relationship("Risk", back_populates="meeting", cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    meeting = relationship("Meeting", back_populates="transcripts")
    
    speakerName = Column(String, nullable=False)
    speakerId = Column(String, nullable=True)
    text = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    createdAt = Column(DateTime, default=datetime.utcnow)

class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    meeting = relationship("Meeting", back_populates="actionItems")
    
    text = Column(String, nullable=False)
    assigneeName = Column(String, nullable=True)
    status = Column(String, default="PENDING") # PENDING, COMPLETED
    dueDate = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class Risk(Base):
    __tablename__ = "risks"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    meeting = relationship("Meeting", back_populates="risks")
    
    text = Column(String, nullable=False)
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH
    status = Column(String, default="OPEN") # OPEN, RESOLVED
    createdAt = Column(DateTime, default=datetime.utcnow)

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False)
    meeting = relationship("Meeting", back_populates="summary")
    
    overview = Column(String, nullable=False)
    keyTakeaways = Column(String, nullable=False) # JSON-serialized array of strings
    productivityScore = Column(Integer, default=100)
    createdAt = Column(DateTime, default=datetime.utcnow)
