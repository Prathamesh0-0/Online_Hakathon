from typing import Dict, Any
from app.ai_workflow.state import MeetingState
from app.services.qdrant_service import qdrant_service

def search_agent(state: MeetingState) -> Dict[str, Any]:
    meeting_id = state.get("meeting_id")
    cleaned = state.get("cleaned_transcript") or []

    if meeting_id and cleaned:
        try:
            qdrant_service.upsert_transcripts(meeting_id, cleaned)
            return {"search_indexed": True}
        except Exception as e:
            return {"search_indexed": False, "errors": [f"Qdrant index error: {str(e)}"]}
    
    return {"search_indexed": False}
