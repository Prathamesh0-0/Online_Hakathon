import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

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

    # External task integration fields
    externalId = Column(String, nullable=True)
    externalUrl = Column(String, nullable=True)
    externalPlatform = Column(String, nullable=True)
