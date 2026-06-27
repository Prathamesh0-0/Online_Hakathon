from typing import Dict, Any
from app.ai_workflow.state import MeetingState
from app.services.llm import llm_service

def analytics_agent(state: MeetingState) -> Dict[str, Any]:
    cleaned = state.get("cleaned_transcript") or []
    if not cleaned:
        return {
            "analytics": {
                "duration": 0,
                "totalWords": 0,
                "talkTimeDistribution": {},
                "sentimentScore": 0.0,
                "engagementScore": 100
            }
        }

    full_text = "\n".join(cleaned)
    
    # Calculate simple word counts & dialogue size
    total_words = len(full_text.split())
    # Estimate duration: assume average speaker talking speed is 130 words per minute
    duration_seconds = int((total_words / 130.0) * 60)
    if duration_seconds < 10 and total_words > 0:
        duration_seconds = 10

    prompt = f"""
    Analyze the meeting transcript and calculate the following analytical metrics:
    1. Sentiment score of the conversation on a scale from -1.0 (very negative) to 1.0 (very positive).
    2. Team engagement score from 0 to 100 based on interactivity (back-and-forth turns), responsiveness, and distribution.
    3. Track attendance by listing all unique speakers identified in the dialogue.
    4. Distribution of talk time in seconds among all participants.
    5. Productivity index based on meeting progress, alignment, and task count relative to speaking duration.
    6. Specific speaker sentiment category ('Positive', 'Neutral', or 'Concerned') for each speaker based on their verbal statements, tone, and agreement.

    Return ONLY a JSON object:
    {{
      "sentimentScore": 0.5,
      "engagementScore": 88,
      "attendance": ["Speaker Name 1", "Speaker Name 2"],
      "talkTimeDistribution": {{
        "Participant Name": 120,
        "Another Name": 80
      }},
      "speakerSentiment": {{
        "Speaker Name 1": "Positive",
        "Speaker Name 2": "Concerned"
      }}
    }}

    Transcript:
    {full_text}
    """

    try:
        result = llm_service.generate_json(
            prompt, 
            "You are a conversation analyst specialized in tracking team meeting attendance, measuring participant engagement metrics, and monitoring collaboration productivity trends."
        )
        sentiment = result.get("sentimentScore", 0.0)
        engagement = result.get("engagementScore", 85)
        talk_time = result.get("talkTimeDistribution", {})
        speaker_sent = result.get("speakerSentiment") or {}
        
        # fallback if talk_time is not populated properly
        if not talk_time:
            # Let's count turns per speaker to distribute time
            speaker_turns = {}
            for line in cleaned:
                if ":" in line:
                    sp = line.split(":", 1)[0].strip()
                    speaker_turns[sp] = speaker_turns.get(sp, 0) + 1
            
            total_turns = sum(speaker_turns.values()) or 1
            for sp, turns in speaker_turns.items():
                talk_time[sp] = int((turns / total_turns) * duration_seconds)

        # fallback if speaker_sent is not populated properly
        if not speaker_sent:
            # simple fallback
            for line in cleaned:
                if ":" in line:
                    sp = line.split(":", 1)[0].strip()
                    if sp not in speaker_sent:
                        speaker_sent[sp] = "Neutral"

        return {
            "analytics": {
                "duration": duration_seconds,
                "totalWords": total_words,
                "talkTimeDistribution": talk_time,
                "sentimentScore": float(sentiment),
                "engagementScore": int(engagement),
                "speakerSentiment": speaker_sent
            }
        }
    except Exception as e:
        return {
            "analytics": {
                "duration": duration_seconds,
                "totalWords": total_words,
                "talkTimeDistribution": {},
                "sentimentScore": 0.0,
                "engagementScore": 75,
                "speakerSentiment": {}
            },
            "errors": [str(e)]
        }
