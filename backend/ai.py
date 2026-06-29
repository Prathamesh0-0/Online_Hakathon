import os
import json
import logging
from datetime import datetime, timedelta
from google import genai

logger = logging.getLogger("ai_service")
logging.basicConfig(level=logging.INFO)

class AiService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini API client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")
        else:
            logger.warning("GEMINI_API_KEY is not set. Running in Mock AI mode.")

    def summarize_meeting(self, transcript_lines: list) -> dict:
        full_transcript = "\n".join(transcript_lines)
        if not full_transcript.strip():
            return {
                "overview": "No transcript available for this meeting.",
                "keyTakeaways": ["No takeaways because there was no discussion."],
                "productivityScore": 100
            }

        if not self.client:
            return self._get_mock_summary(transcript_lines)

        try:
            prompt = f"""
            Analyze the following meeting transcript. Generate a concise paragraph summarizing the meeting (overview), 
            extract key takeaways as a list of strings, and estimate a team productivity score from 0 to 100.
            Return the response as a JSON object matching this schema:
            {{
              "overview": "string summary",
              "keyTakeaways": ["takeaway 1", "takeaway 2"],
              "productivityScore": 85
            }}

            Transcript:
            {full_transcript}
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini API summarization failed: {e}. Falling back to mock.")
            return self._get_mock_summary(transcript_lines)

    def extract_action_items(self, transcript_lines: list) -> list:
        full_transcript = "\n".join(transcript_lines)
        if not full_transcript.strip():
            return []

        if not self.client:
            return self._get_mock_action_items(transcript_lines)

        try:
            prompt = f"""
            Analyze this meeting transcript and extract all explicit or implied action items (tasks/todos).
            For each action item, identify:
            1. The description of the task (text).
            2. The name of the assignee (assigneeName) if mentioned, or null.
            3. A proposed due date (dueDate in YYYY-MM-DD format) if mentioned, or null.
            
            Return a JSON array of objects matching this schema:
            [
              {{
                "text": "description of task",
                "assigneeName": "Name or null",
                "dueDate": "YYYY-MM-DD or null"
              }}
            ]

            Transcript:
            {full_transcript}
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini API action items extraction failed: {e}. Falling back to mock.")
            return self._get_mock_action_items(transcript_lines)

    def detect_risks(self, transcript_lines: list) -> list:
        full_transcript = "\n".join(transcript_lines)
        if not full_transcript.strip():
            return []

        if not self.client:
            return self._get_mock_risks(transcript_lines)

        try:
            prompt = f"""
            Analyze this meeting transcript and detect any potential project risks, conflicts, timeline bottlenecks, or blockers.
            For each risk detected, categorize its severity as LOW, MEDIUM, or HIGH.
            Return a JSON array of objects matching this schema:
            [
              {{
                "text": "description of the risk/blocker",
                "severity": "LOW" | "MEDIUM" | "HIGH"
              }}
            ]

            Transcript:
            {full_transcript}
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json"
                }
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini API risk detection failed: {e}. Falling back to mock.")
            return self._get_mock_risks(transcript_lines)

    # --- MOCK FALLBACKS ---

    def _get_mock_summary(self, transcript_lines: list) -> dict:
        full_text = " ".join(transcript_lines).lower()
        overview = "The team discussed active sprint updates, roadblocks, and coordinate next steps. Key milestones were reviewed."
        key_takeaways = [
            "Reviewed current project status and alignment on backend architecture.",
            "Identified API integration hurdles and designated owners.",
            "Aligned on frontend styling approach using premium Vanilla CSS theme."
        ]
        score = 85

        if "delay" in full_text or "block" in full_text or "issue" in full_text:
            overview += " A few blockers regarding backend deployment and database migrations were highlighted."
            key_takeaways.append("Need to troubleshoot Docker Compose setup for local database instances.")
            score = 70

        return {
            "overview": overview,
            "keyTakeaways": key_takeaways,
            "productivityScore": score
        }

    def _get_mock_action_items(self, transcript_lines: list) -> list:
        actions = []
        for line in transcript_lines:
            clean_line = line.lower()
            if any(k in clean_line for k in ["will", "should", "need to", "task"]):
                parts = line.split(":")
                speaker = parts[0].strip() if len(parts) > 1 else "Unknown"
                text = parts[1].strip() if len(parts) > 1 else line.strip()
                
                assignee = speaker
                if "rahul" in clean_line: assignee = "Rahul Sharma"
                elif "priya" in clean_line: assignee = "Priya Patel"
                elif "aman" in clean_line: assignee = "Aman Verma"

                if len(text) > 10:
                    actions.append({
                        "text": text,
                        "assigneeName": assignee,
                        "dueDate": (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d")
                    })

        if not actions:
            # Return defaults
            actions = [
                {"text": "Set up Prisma database schema and migrations", "assigneeName": "Rahul Sharma", "dueDate": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")},
                {"text": "Create real-time Socket.io gateway in backend", "assigneeName": "Aman Verma", "dueDate": (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%d")},
                {"text": "Design Dashboard and Meeting Room components in React", "assigneeName": "Priya Patel", "dueDate": (datetime.utcnow() + timedelta(days=4)).strftime("%Y-%m-%d")}
            ]
        return actions

    def _get_mock_risks(self, transcript_lines: list) -> list:
        risks = []
        full_text = " ".join(transcript_lines).lower()

        if "delay" in full_text or "late" in full_text:
            risks.append({"text": "Timeline slip risk: Frontend development is blocked by backend API design", "severity": "HIGH"})
        if "db" in full_text or "database" in full_text:
            risks.append({"text": "Database synchronization issue between Docker environment and local machines", "severity": "MEDIUM"})
        if "api" in full_text or "gemini" in full_text:
            risks.append({"text": "API integration: AI responses might be delayed if API keys are missing", "severity": "LOW"})

        if not risks:
            risks.append({"text": "Potential resource constraints due to parallel tasks in frontend and backend", "severity": "LOW"})
        return risks

ai_service = AiService()
