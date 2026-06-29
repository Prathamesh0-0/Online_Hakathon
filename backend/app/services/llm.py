import os
import json
import logging
from typing import Dict, Any, List, Optional
from groq import Groq
from google import genai
from app.config import settings

logger = logging.getLogger("llm_service")

class LlmService:
    def __init__(self):
        self.groq_client = None
        self.gemini_client = None

        # Try to initialize Groq
        groq_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                self.groq_client = Groq(api_key=groq_key)
                logger.info("Groq API client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")

        # Try to initialize Gemini as fallback
        gemini_key = os.getenv("GEMINI_API_KEY") or settings.GROQ_API_KEY
        if gemini_key:
            try:
                self.gemini_client = genai.Client(api_key=gemini_key)
                logger.info("Gemini API client initialized successfully for fallback.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini fallback client: {e}")

        if not self.groq_client and not self.gemini_client:
            logger.warning("No LLM API keys found (Groq or Gemini). Running in Mock AI mode.")

    def generate_json(self, prompt: str, system_instruction: str = "") -> Dict[str, Any]:
        """
        Generates a JSON response from the LLM, falling back through Groq -> Gemini -> Mock
        """
        # 1. Try Groq
        if self.groq_client:
            try:
                # Use Llama 3 70B or 8B
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})

                response = self.groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",  # Fast and reliable
                    messages=messages,
                    response_format={"type": "json_object"},
                    temperature=0.2,
                    max_tokens=4000
                )
                text = response.choices[0].message.content
                return json.loads(text)
            except Exception as e:
                logger.error(f"Groq API call failed: {e}. Trying Gemini fallback...")

        # 2. Try Gemini
        if self.gemini_client:
            try:
                full_prompt = prompt
                if system_instruction:
                    full_prompt = f"{system_instruction}\n\nUser Input:\n{prompt}"
                
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=full_prompt,
                    config={
                        "response_mime_type": "application/json"
                    }
                )
                return json.loads(response.text)
            except Exception as e:
                logger.error(f"Gemini fallback API call failed: {e}.")

        # 3. Fallback to parsing/mocking
        logger.warning("Falling back to structured mock parser.")
        return self._generate_mock_json(prompt)

    def _generate_mock_json(self, prompt: str) -> Dict[str, Any]:
        # Analyze prompt and generate appropriate mock content
        prompt_lower = prompt.lower()
        
        # Action item request
        if "actionitems" in prompt_lower or "action_items" in prompt_lower or "todo" in prompt_lower:
            return {
                "actionItems": [
                    {"text": "Troubleshoot WebSocket port configuration conflicts", "assigneeName": "Aman Verma", "dueDate": "2026-06-22"},
                    {"text": "Assist in debugging backend network ports", "assigneeName": "Rahul Sharma", "dueDate": "2026-06-22"},
                    {"text": "Create dashboard layout view and React components", "assigneeName": "Priya Patel", "dueDate": "2026-06-25"}
                ]
            }
        
        # Risk request
        elif "risks" in prompt_lower or "blocker" in prompt_lower:
            return {
                "risks": [
                    {"text": "Server port configuration conflict", "severity": "HIGH"},
                    {"text": "Timeline delay: 2 days on Socket.io gateway", "severity": "HIGH"},
                    {"text": "Client demo deadline risk on dashboard layout", "severity": "HIGH"}
                ]
            }
        
        # Summary request
        elif "summary" in prompt_lower or "overview" in prompt_lower:
            return {
                "overview": "The team aligned on the weekly status updates. Main discussion points centered around Vite React setups, the API integration blockers, and resolving SQLite schema migrations for the backend service.",
                "keyTakeaways": [
                    "Vite React setup is completed, with routing and core layouts operational.",
                    "WebSocket integration has a minor network port conflict blocker.",
                    "SQLite schema models are to be prepared and migrated locally by tomorrow."
                ],
                "keyDecisions": [
                    "Aman and Rahul will troubleshoot the websocket network ports tomorrow at 10 AM.",
                    "Priya will build the dashboard layout by Monday."
                ],
                "nextSteps": [
                    "Aman Verma will fix port configuration settings.",
                    "Priya Patel will construct dashboard layout components."
                ],
                "productivityScore": 85
            }
        
        # Follow up request
        elif "follow" in prompt_lower:
            return {
                "followUps": [
                    {"text": "Send updated database schema docs to the team after migrations", "assigneeName": "Aman Verma", "dueDate": "2026-06-22"},
                    {"text": "Verify socket server deployment inside the docker container", "assigneeName": "Aman Verma", "dueDate": "2026-06-23"}
                ]
            }
 
        # Analytics request
        elif "analytics" in prompt_lower or "sentiment" in prompt_lower:
            return {
                "duration": 300,
                "totalWords": 185,
                "talkTimeDistribution": {
                    "Rahul Sharma": 95,
                    "Aman Verma": 45,
                    "Priya Patel": 45
                },
                "sentimentScore": 0.35,
                "engagementScore": 92,
                "speakerSentiment": {
                    "Rahul Sharma": "Positive",
                    "Aman Verma": "Neutral",
                    "Priya Patel": "Concerned"
                }
            }

        return {}

llm_service = LlmService()

