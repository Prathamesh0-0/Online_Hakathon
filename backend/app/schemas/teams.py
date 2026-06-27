from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserMinResponse(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    name: str

class ChannelCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ChannelResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    teamId: str
    createdAt: datetime

    class Config:
        from_attributes = True

class TeamResponse(BaseModel):
    id: str
    name: str
    createdAt: datetime
    channels: List[ChannelResponse] = []
    members: List[UserMinResponse] = []

    class Config:
        from_attributes = True

class ChannelMessageCreate(BaseModel):
    text: str

class ChannelMessageResponse(BaseModel):
    id: str
    text: str
    channelId: str
    senderId: str
    senderName: str
    createdAt: datetime

    class Config:
        from_attributes = True

class DirectMessageCreate(BaseModel):
    text: str
    receiverId: str

class DirectMessageResponse(BaseModel):
    id: str
    text: str
    senderId: str
    receiverId: str
    createdAt: datetime
    sender: UserMinResponse
    receiver: UserMinResponse

    class Config:
        from_attributes = True
