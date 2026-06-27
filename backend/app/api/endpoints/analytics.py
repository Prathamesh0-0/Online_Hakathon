import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.meeting import Meeting
from app.models.extra import Analytics, Team

router = APIRouter()

@router.get("/{meeting_id}")
def get_meeting_analytics(
    meeting_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check that meeting exists and host is authorized (or user is in the team)
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    if meeting.hostId != current_user["userId"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this meeting's analytics"
        )

    analytics = db.query(Analytics).filter(Analytics.meetingId == meeting_id).first()
    if not analytics:
        return {
            "meetingId": meeting_id,
            "duration": 0,
            "totalWords": 0,
            "talkTimeDistribution": {},
            "sentimentScore": 0.0,
            "engagementScore": 100
        }

    try:
        tt_dist = json.loads(analytics.talkTimeDistribution)
    except Exception:
        tt_dist = {}

    return {
        "meetingId": analytics.meetingId,
        "duration": analytics.duration,
        "totalWords": analytics.totalWords,
        "talkTimeDistribution": tt_dist,
        "sentimentScore": analytics.sentimentScore,
        "engagementScore": analytics.engagementScore,
        "createdAt": analytics.createdAt
    }

@router.get("/team/{team_id}")
def get_team_analytics(
    team_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )

    # Check that current user is a member of this team
    is_member = any(member.id == current_user["userId"] for member in team.members)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this team"
        )

    # Aggregate meeting metrics for all meetings hosted by team members
    member_ids = [m.id for m in team.members]
    meetings = db.query(Meeting).filter(Meeting.hostId.in_(member_ids)).all()
    meeting_ids = [m.id for m in meetings]

    analytics_list = db.query(Analytics).filter(Analytics.meetingId.in_(meeting_ids)).all()
    
    if not analytics_list:
        return {
            "teamId": team_id,
            "averageDuration": 0,
            "averageSentiment": 0.0,
            "averageEngagement": 100,
            "totalMeetingsAnalyzed": 0
        }

    total_duration = sum(a.duration for a in analytics_list)
    total_sentiment = sum(a.sentimentScore for a in analytics_list)
    total_engagement = sum(a.engagementScore for a in analytics_list)
    count = len(analytics_list)

    return {
        "teamId": team_id,
        "averageDuration": total_duration // count,
        "averageSentiment": round(total_sentiment / count, 2),
        "averageEngagement": total_engagement // count,
        "totalMeetingsAnalyzed": count
    }
