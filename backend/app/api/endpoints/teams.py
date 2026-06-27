from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.extra import Team, Channel, ChannelMessage, DirectMessage, team_members
from app.models.meeting import Meeting
from app.schemas.teams import (
    TeamCreate,
    TeamResponse,
    ChannelCreate,
    ChannelResponse,
    ChannelMessageResponse,
    DirectMessageResponse,
    UserMinResponse,
)
from app.services.llm import llm_service

router = APIRouter()

@router.get("", response_model=List[TeamResponse])
def get_teams(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Query all teams where current user is a member
    user_id = current_user["userId"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.teams

@router.post("", response_model=TeamResponse)
def create_team(
    payload: TeamCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["userId"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if team already exists
    existing = db.query(Team).filter(Team.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already exists")
        
    team = Team(name=payload.name)
    team.members.append(user)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

@router.post("/{team_id}/join", response_model=TeamResponse)
def join_team(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["userId"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    if user not in team.members:
        team.members.append(user)
        db.commit()
        db.refresh(team)
    return team

@router.post("/{team_id}/channels", response_model=ChannelResponse)
def create_channel(
    team_id: str,
    payload: ChannelCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    channel = Channel(name=payload.name, description=payload.description, teamId=team_id)
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel

@router.get("/{team_id}/channels", response_model=List[ChannelResponse])
def get_channels(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team.channels

@router.get("/channels/{channel_id}/messages", response_model=List[ChannelMessageResponse])
def get_channel_messages(
    channel_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    messages = (
        db.query(ChannelMessage)
        .filter(ChannelMessage.channelId == channel_id)
        .order_by(ChannelMessage.createdAt.asc())
        .all()
    )
    return messages

@router.get("/users", response_model=List[UserMinResponse])
def get_all_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user["userId"]
    # List all users except current user
    return db.query(User).filter(User.id != user_id).all()

@router.get("/dms/{user_id}", response_model=List[DirectMessageResponse])
def get_direct_messages(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    my_id = current_user["userId"]
    
    # Query DMs where (sender is me and receiver is other) OR (sender is other and receiver is me)
    messages = (
        db.query(DirectMessage)
        .filter(
            ((DirectMessage.senderId == my_id) & (DirectMessage.receiverId == user_id)) |
            ((DirectMessage.senderId == user_id) & (DirectMessage.receiverId == my_id))
        )
        .order_by(DirectMessage.createdAt.asc())
        .all()
    )
    return messages

@router.post("/channels/{channel_id}/ai-summary")
def generate_channel_ai_summary(
    channel_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
        
    # Get last 50 channel messages
    messages = (
        db.query(ChannelMessage)
        .filter(ChannelMessage.channelId == channel_id)
        .order_by(ChannelMessage.createdAt.desc())
        .limit(50)
        .all()
    )
    messages.reverse() # Restore chronological order
    
    # Get summaries of past meetings in this channel
    meetings = (
        db.query(Meeting)
        .filter(Meeting.channelId == channel_id, Meeting.status == "COMPLETED")
        .all()
    )
    
    # Compile prompt context
    chat_transcript = "\n".join([f"{msg.senderName}: {msg.text}" for msg in messages])
    
    meeting_summaries = []
    for m in meetings:
        if m.summary:
            meeting_summaries.append(f"Meeting '{m.title}' summary: {m.summary.overview}")
            
    meetings_context = "\n".join(meeting_summaries)
    
    if not chat_transcript and not meetings_context:
        return {
            "summary": "No activity or meetings recorded in this channel yet. Start discussing or host meetings to generate a summary!",
            "keyPoints": ["No data available"]
        }
        
    prompt = f"""
    Analyze the activity inside this remote team channel.
    Below is the recent chat history and summaries of meetings hosted in this channel.
    Please summarize:
    1. What the team is currently working on or discussing (main projects/goals).
    2. Decisions made and consensus reached.
    3. Next steps, key milestones, or blocker items.
    
    Return the response as a JSON object matching this schema:
    {{
        "summary": "a detailed overview paragraph summarizing channel activity and status",
        "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3"]
    }}
    
    Recent Chat History:
    {chat_transcript}
    
    Past Meeting Summaries:
    {meetings_context}
    """
    
    try:
        response_json = llm_service.generate_json(
            prompt=prompt,
            system_instruction="You are an expert AI productivity assistant summarizing remote team channel communications."
        )
        return response_json
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Summarizer execution failed: {str(e)}"
        )
