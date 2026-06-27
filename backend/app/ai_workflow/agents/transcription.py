from typing import Dict, Any
from app.ai_workflow.state import MeetingState

def transcription_agent(state: MeetingState) -> Dict[str, Any]:
    raw_lines = state.get("raw_transcript") or []
    cleaned = []

    for line in raw_lines:
        cleaned_line = line.strip()
        if not cleaned_line:
            continue
        
        # Check if line contains speaker name format: "Name: Text"
        if ":" in cleaned_line:
            parts = cleaned_line.split(":", 1)
            speaker = parts[0].strip()
            text = parts[1].strip()
            
            # Simple cleaning rule: skip empty texts or noise
            if text:
                cleaned.append(f"{speaker}: {text}")
        else:
            cleaned.append(f"Speaker: {cleaned_line}")

    return {"cleaned_transcript": cleaned}
