from typing import Dict, Any, List
from app.ai_workflow.state import MeetingState
from app.services.llm import llm_service

def risk_agent(state: MeetingState) -> Dict[str, Any]:
    cleaned = state.get("cleaned_transcript") or []
    if not cleaned:
        return {"risks": []}

    full_text = "\n".join(cleaned)
    prompt = f"""
    Analyze the meeting transcript and detect any potential risks, blockers, timeline slips, or conflicts.
    For each risk, assign a severity level: LOW, MEDIUM, or HIGH.

    Return ONLY a JSON object containing an array under the key 'risks':
    {{
      "risks": [
        {{
          "text": "description of the blocker/risk",
          "severity": "LOW" | "MEDIUM" | "HIGH"
        }}
      ]
    }}

    Transcript:
    {full_text}
    """

    try:
        result = llm_service.generate_json(prompt, "You are a scrum master risk identifier.")
        risks = result.get("risks") or []
        # Sanitize risks
        sanitized = []
        for r in risks:
            if r.get("text"):
                sev = r.get("severity", "MEDIUM").upper()
                if sev not in ["LOW", "MEDIUM", "HIGH"]:
                    sev = "MEDIUM"
                sanitized.append({
                    "text": r["text"],
                    "severity": sev
                })
        return {"risks": sanitized}
    except Exception as e:
        return {"risks": [], "errors": [str(e)]}
