import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Summary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False)
    meeting = relationship("Meeting", back_populates="summary")
    
    overview = Column(String, nullable=False)
    keyTakeaways = Column(String, nullable=False) # JSON-serialized array of strings
    keyDecisions = Column(String, nullable=True) # JSON-serialized array of strings
    nextSteps = Column(String, nullable=True) # JSON-serialized array of strings
    productivityScore = Column(Integer, default=100)
    createdAt = Column(DateTime, default=datetime.utcnow)
