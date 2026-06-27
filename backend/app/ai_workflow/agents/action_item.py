from typing import Dict, Any, List
from app.ai_workflow.state import MeetingState
from app.services.llm import llm_service

def action_item_agent(state: MeetingState) -> Dict[str, Any]:
    cleaned = state.get("cleaned_transcript") or []
    if not cleaned:
        return {"action_items": []}

    full_text = "\n".join(cleaned)
    prompt = f"""
    Analyze the meeting transcript and extract all action items. For each item, identify:
    1. The task description (text).
    2. The assignee's name (assigneeName) if mentioned, or null.
    3. A proposed due date (dueDate in YYYY-MM-DD format) if mentioned, or null.

    Return ONLY a JSON object containing an array under the key 'actionItems':
    {{
      "actionItems": [
        {{
          "text": "description of task",
          "assigneeName": "Name or null",
          "dueDate": "YYYY-MM-DD or null"
        }}
      ]
    }}

    Transcript:
    {full_text}
    """

    try:
        result = llm_service.generate_json(prompt, "You are a project manager assistant.")
        items = result.get("actionItems") or []
        # Sanitize items
        sanitized = []
        for it in items:
            if it.get("text"):
                sanitized.append({
                    "text": it["text"],
                    "assigneeName": it.get("assigneeName"),
                    "dueDate": it.get("dueDate")
                })
        return {"action_items": sanitized}
    except Exception as e:
        return {"action_items": [], "errors": [str(e)]}
