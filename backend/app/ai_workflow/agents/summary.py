from typing import Dict, Any
from app.ai_workflow.state import MeetingState
from app.services.llm import llm_service

def summary_agent(state: MeetingState) -> Dict[str, Any]:
    cleaned = state.get("cleaned_transcript") or []
    if not cleaned:
        return {
            "summary": {
                "overview": "No discussion took place in this meeting.",
                "keyTakeaways": [],
                "productivityScore": 100
            }
        }

    full_text = "\n".join(cleaned)
    prompt = f"""
    Analyze this meeting transcript (which may contain multiple languages or diverse accents). 
    Generate a concise overview paragraph summarizing the meeting, specifically optimized for absent participants to quickly catch up on decisions, discussions, and contexts.
    Extract key takeaways as a list of strings.
    Identify all key decisions reached during the meeting as a list of strings.
    Identify next steps/actionable follow-up plans as a list of strings.
    Estimate a team productivity score from 0 to 100 based on cooperation and activity.
    Support distributed teams across different time zones by ensuring references to deadlines/schedules are time-zone aware or standard UTC.
    
    Return ONLY a JSON object with this format:
    {{
      "overview": "string summary",
      "keyTakeaways": ["takeaway 1", "takeaway 2"],
      "keyDecisions": ["decision 1", "decision 2"],
      "nextSteps": ["step 1", "step 2"],
      "productivityScore": 85
    }}

    Transcript:
    {full_text}
    """

    try:
        result = llm_service.generate_json(
            prompt, 
            "You are a professional meeting summarizer supporting multilingual transcription, speaker diarization tags, and absent team member catch-ups."
        )
        # Validate structure
        overview = result.get("overview") or "Meeting completed."
        takeaways = result.get("keyTakeaways") or []
        decisions = result.get("keyDecisions") or []
        next_steps = result.get("nextSteps") or []
        score = result.get("productivityScore") or 80
        
        return {
            "summary": {
                "overview": overview,
                "keyTakeaways": takeaways,
                "keyDecisions": decisions,
                "nextSteps": next_steps,
                "productivityScore": int(score)
            }
        }
    except Exception as e:
        return {
            "summary": {
                "overview": "Summary extraction failed.",
                "keyTakeaways": ["Error occurred during AI processing."],
                "productivityScore": 50
            },
            "errors": [str(e)]
        }
