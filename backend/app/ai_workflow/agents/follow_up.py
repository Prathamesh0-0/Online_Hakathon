from typing import Dict, Any, List
from app.ai_workflow.state import MeetingState
from app.services.llm import llm_service

def follow_up_agent(state: MeetingState) -> Dict[str, Any]:
    cleaned = state.get("cleaned_transcript") or []
    action_items = state.get("action_items") or []
    
    if not cleaned:
        return {"follow_ups": []}

    full_text = "\n".join(cleaned)
    items_summary = json.dumps(action_items)
    
    prompt = f"""
    Based on the following meeting transcript and extracted action items, suggest 1-3 concrete next-step follow-ups.
    For each, provide a text description and an assignee if possible.

    Return ONLY a JSON object containing an array under the key 'followUps':
    {{
      "followUps": [
        {{
          "text": "description of follow up task",
          "assigneeName": "Name or null",
          "dueDate": "YYYY-MM-DD or null"
        }}
      ]
    }}

    Action Items Already Extracted:
    {items_summary}

    Transcript:
    {full_text}
    """

    try:
        result = llm_service.generate_json(prompt, "You are a post-meeting secretary.")
        follow_ups = result.get("followUps") or []
        return {"follow_ups": follow_ups}
    except Exception as e:
        return {"follow_ups": [], "errors": [str(e)]}

import json
