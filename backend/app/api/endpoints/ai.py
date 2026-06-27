from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Body, HTTPException
from app.api.deps import get_current_user
from app.services.llm import llm_service
from app.services.qdrant_service import qdrant_service

router = APIRouter()

@router.post("/summarize")
def summarize_transcript(
    transcripts: List[str] = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    if not transcripts:
        return {"overview": "No dialogue provided.", "keyTakeaways": [], "productivityScore": 100}
    
    full_text = "\n".join(transcripts)
    prompt = f"Summarize the following meeting transcript. Return a JSON object with 'overview' (string), 'keyTakeaways' (list of strings), and 'productivityScore' (int):\n\n{full_text}"
    return llm_service.generate_json(prompt, "You are a professional scribe.")

@router.post("/action-items")
def extract_action_items(
    transcripts: List[str] = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    if not transcripts:
        return {"actionItems": []}
        
    full_text = "\n".join(transcripts)
    prompt = f"Extract all action items from this transcript. Return ONLY a JSON object with key 'actionItems' containing elements with 'text', 'assigneeName', 'dueDate':\n\n{full_text}"
    return llm_service.generate_json(prompt, "You are a scrum master.")

@router.post("/risks")
def detect_risks(
    transcripts: List[str] = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    if not transcripts:
        return {"risks": []}
        
    full_text = "\n".join(transcripts)
    prompt = f"Detect all blocker risks from this transcript. Return ONLY a JSON object with key 'risks' containing elements with 'text' and 'severity' (LOW/MEDIUM/HIGH):\n\n{full_text}"
    return llm_service.generate_json(prompt, "You are a project auditor.")

@router.get("/search")
def search_transcripts(
    query: str = Query(..., description="The search term for semantic search"),
    meeting_id: Optional[str] = Query(None, description="Filter results to a specific meeting ID"),
    current_user: dict = Depends(get_current_user)
):
    try:
        results = qdrant_service.search_transcripts(
            query=query,
            meeting_id=meeting_id,
            limit=5
        )
        return {"query": query, "results": results}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {str(e)}"
        )
