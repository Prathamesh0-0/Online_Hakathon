from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    channelId: Optional[str] = None
    startTime: Optional[datetime] = None
    invitedEmails: Optional[str] = None

class MeetingResponseSummary(BaseModel):
    id: str
    overview: str
    keyTakeaways: str  # JSON array string or deserialized list
    keyDecisions: Optional[str] = None
    nextSteps: Optional[str] = None
    productivityScore: int

    class Config:
        from_attributes = True

class MeetingCount(BaseModel):
    transcripts: int
    actionItems: int
    risks: int

class UserMinResponse(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True

class MeetingListResponse(BaseModel):
    id: str
    code: Optional[str] = None
    title: str
    description: Optional[str]
    invitedEmails: Optional[str] = None
    status: str
    createdAt: datetime
    channelId: Optional[str] = None
    summary: Optional[MeetingResponseSummary] = None
    _count: Optional[MeetingCount] = None

    class Config:
        from_attributes = True

class TranscriptMinResponse(BaseModel):
    id: str
    speakerName: str
    text: str
    timestamp: datetime

    class Config:
        from_attributes = True

class ActionItemMinResponse(BaseModel):
    id: str
    text: str
    assigneeName: Optional[str]
    status: str
    dueDate: Optional[datetime]
    externalId: Optional[str] = None
    externalUrl: Optional[str] = None
    externalPlatform: Optional[str] = None

    class Config:
        from_attributes = True

class RiskMinResponse(BaseModel):
    id: str
    text: str
    severity: str
    status: str

    class Config:
        from_attributes = True

class MeetingDetailResponse(BaseModel):
    id: str
    code: Optional[str] = None
    title: str
    description: Optional[str]
    invitedEmails: Optional[str] = None
    status: str
    startTime: Optional[datetime]
    endTime: Optional[datetime]
    createdAt: datetime
    channelId: Optional[str] = None
    transcripts: List[TranscriptMinResponse] = []
    actionItems: List[ActionItemMinResponse] = []
    risks: List[RiskMinResponse] = []
    summary: Optional[MeetingResponseSummary] = None
    host: Optional[UserMinResponse] = None

    class Config:
        from_attributes = True
