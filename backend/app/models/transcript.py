import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

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
