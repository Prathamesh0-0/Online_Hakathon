from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.schemas.livekit import LiveKitTokenRequest, LiveKitTokenResponse
from app.services.livekit_service import livekit_service

router = APIRouter()

@router.post("/token", response_model=LiveKitTokenResponse)
def get_livekit_token(
    payload: LiveKitTokenRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Generate unique identity or use username
        identity = f"{payload.participantName.lower().replace(' ', '_')}_{current_user['userId'][:8]}"
        
        token = livekit_service.generate_access_token(
            room_name=payload.meetingId,
            participant_identity=identity,
            participant_name=payload.participantName
        )
        
        return {
            "token": token,
            "url": livekit_service.get_livekit_url()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate LiveKit token: {str(e)}"
        )
