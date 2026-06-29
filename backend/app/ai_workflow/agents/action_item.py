from typing import Dict, Any, List
from app.ai_workflow.state import MeetingState
from app.services.llm import llm_service

def action_item_agent(state: MeetingState) -> Dict[str, Any]:
    cleaned = state.get("cleaned_transcript") or []
    if not cleaned:
        return {"action_items": []}

    full_text = "\n".join(cleaned)
    prompt = f"""
    You are an AI Meeting Copilot.
    Extract action items only from the current meeting transcript.

    ## Rules:
    1. Never use placeholder or fixed names such as John, Alice, Bob, Alex, Sarah, Person A, Person B, Employee 1, or Team Member.
    2. Assign action items only to participants who are actually present in the current meeting.
    3. Use the exact participant names detected from the meeting transcript or participant list.
    4. If a speaker's name is unavailable or cannot be identified with confidence, assign the task as 'Unassigned' or null instead of inventing a name.
    5. Never reuse participant names from previous meetings.
    6. Every meeting must generate a fresh list of participants and corresponding action items based only on that meeting.
    7. Do not hallucinate participants or tasks.

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
