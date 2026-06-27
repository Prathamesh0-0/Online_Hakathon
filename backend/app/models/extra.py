import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Boolean, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

# Many-to-Many Association table for Users and Teams
team_members = Table(
    "team_members",
    Base.metadata,
    Column("userId", String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("teamId", String, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True)
)

class Team(Base):
    __tablename__ = "teams"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    # Members relationship
    members = relationship("User", secondary=team_members, backref="teams")
    channels = relationship("Channel", back_populates="team", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    meeting = relationship("Meeting", back_populates="participants")

    userId = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    role = Column(String, default="ATTENDEE") # HOST, ATTENDEE, OBSERVER
    joinedAt = Column(DateTime, default=datetime.utcnow)
    leftAt = Column(DateTime, nullable=True)

class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(String, primary_key=True, default=generate_uuid)
    meetingId = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False)
    meeting = relationship("Meeting", back_populates="analytics")

    duration = Column(Integer, default=0) # in seconds
    totalWords = Column(Integer, default=0)
    talkTimeDistribution = Column(String, default="{}") # JSON dictionary of name -> seconds
    sentimentScore = Column(Float, default=0.0) # -1.0 to 1.0
    engagementScore = Column(Integer, default=100) # 0 to 100
    speakerSentiment = Column(String, default="{}") # JSON dictionary of name -> sentiment category
    createdAt = Column(DateTime, default=datetime.utcnow)

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="integrations")

    serviceName = Column(String, nullable=False) # slack, jira, trello, google_calendar
    configData = Column(String, default="{}") # JSON dictionary of access token, channel, mapping
    isEnabled = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

class Channel(Base):
    __tablename__ = "channels"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    teamId = Column(String, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    team = relationship("Team", back_populates="channels")
    messages = relationship("ChannelMessage", back_populates="channel", cascade="all, delete-orphan")

class ChannelMessage(Base):
    __tablename__ = "channel_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    text = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    channelId = Column(String, ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    channel = relationship("Channel", back_populates="messages")

    senderId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender = relationship("User")
    senderName = Column(String, nullable=False)

class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    text = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    senderId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender = relationship("User", foreign_keys=[senderId])

    receiverId = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver = relationship("User", foreign_keys=[receiverId])

