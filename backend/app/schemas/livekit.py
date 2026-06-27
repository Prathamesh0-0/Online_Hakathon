from typing import Optional
from pydantic import BaseModel

class LiveKitTokenRequest(BaseModel):
    meetingId: str
    participantName: str

class LiveKitTokenResponse(BaseModel):
    token: str
    url: Optional[str] = None
