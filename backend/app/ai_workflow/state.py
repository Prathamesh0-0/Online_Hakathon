from typing import List, Dict, Any, Optional, TypedDict

class MeetingState(TypedDict):
    meeting_id: str
    raw_transcript: List[str]  # e.g. ["Alice: Hello", "Bob: Hi"]
    cleaned_transcript: List[str]
    summary: Dict[str, Any]  # overview, keyTakeaways, productivityScore
    action_items: List[Dict[str, Any]]  # text, assigneeName, dueDate
    risks: List[Dict[str, Any]]  # text, severity
    follow_ups: List[Dict[str, Any]]  # text, assigneeName, dueDate
    analytics: Dict[str, Any]  # duration, totalWords, talkTimeDistribution, sentimentScore, engagementScore
    search_indexed: bool
    errors: List[str]
