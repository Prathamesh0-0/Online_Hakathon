from fastapi import APIRouter
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.meetings import router as meetings_router
from app.api.endpoints.livekit import router as livekit_router
from app.api.endpoints.ai import router as ai_router
from app.api.endpoints.analytics import router as analytics_router
from app.api.endpoints.teams import router as teams_router

api_router = APIRouter()

# Include all subrouters
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(meetings_router, prefix="/meetings", tags=["meetings"])
api_router.include_router(livekit_router, prefix="/livekit", tags=["livekit"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(teams_router, prefix="/teams", tags=["teams"])
