from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class TranscriptCreate(BaseModel):
    speakerName: str
    text: str
    speakerId: Optional[str] = None

class TranscriptResponse(BaseModel):
    id: str
    meetingId: str
    speakerName: str
    speakerId: Optional[str]
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True
