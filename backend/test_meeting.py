import sys
from app.core.database import SessionLocal
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingDetailResponse

db = SessionLocal()
meeting = db.query(Meeting).filter(Meeting.code == "TM-7YZXUI").first()
if not meeting:
    print("Meeting not found!")
    sys.exit(1)

try:
    resp = MeetingDetailResponse.model_validate(meeting)
    print("Success:", resp)
except Exception as e:
    import traceback
    traceback.print_exc()
