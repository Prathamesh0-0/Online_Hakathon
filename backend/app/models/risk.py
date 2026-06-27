import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Risk(Base):
    __tablename__ = "risks"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    meeting = relationship("Meeting", back_populates="risks")
    
    text = Column(String, nullable=False)
    severity = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH
    status = Column(String, default="OPEN") # OPEN, RESOLVED
    createdAt = Column(DateTime, default=datetime.utcnow)
