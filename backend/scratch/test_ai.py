import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.meeting import Meeting
from app.ai_workflow.graph import analyze_meeting_transcripts

def test():
    db = SessionLocal()
    meeting = db.query(Meeting).first()
    if not meeting:
        print("No meetings found")
        return
    
    raw_lines = [f"{t.speakerName}: {t.text}" for t in meeting.transcripts]
    print(f"Loaded {len(raw_lines)} transcript lines.")
    
    print("Running LangGraph workflow...")
    res = analyze_meeting_transcripts(meeting.id, raw_lines)
    print("Result keys:", res.keys())
    if "errors" in res:
        print("Errors:", res["errors"])
    print("Action Items:", res.get("action_items"))
    print("Risks:", res.get("risks"))

if __name__ == "__main__":
    test()
