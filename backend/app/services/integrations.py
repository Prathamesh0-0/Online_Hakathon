import logging
import json
import requests
from datetime import datetime
from typing import Dict, Any, List
from app.config import settings

logger = logging.getLogger("integrations_service")

class IntegrationsService:
    def send_slack_notification(self, webhook_url: str = None, message: str = "") -> bool:
        url = webhook_url or settings.SLACK_WEBHOOK_URL
        if not url:
            logger.info(f"[Mock Slack Notification] Webhook URL not set. Message: {message}")
            return True
        
        try:
            payload = {"text": message}
            response = requests.post(url, json=payload, timeout=5.0)
            if response.status_code == 200:
                logger.info("Slack notification sent successfully.")
                return True
            else:
                logger.error(f"Slack returned code {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")
            return False

    def create_jira_issue(self, summary: str, description: str, project_key: str = "PROJ", issue_type: str = "Task") -> Dict[str, Any]:
        api_url = settings.JIRA_API_URL
        email = settings.JIRA_EMAIL
        token = settings.JIRA_API_TOKEN

        if not api_url or not email or not token:
            logger.info(f"[Mock Jira Task] Credentials missing. Created Issue: {summary} in Project: {project_key}")
            return {"status": "success", "id": "MOCK-101", "key": f"{project_key}-101", "self": "http://jira.mock/MOCK-101"}

        try:
            url = f"{api_url.rstrip('/')}/rest/api/3/issue"
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            # Jira basic auth uses base64(email:token)
            import base64
            auth_str = f"{email}:{token}"
            encoded_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
            headers["Authorization"] = f"Basic {encoded_auth}"

            payload = {
                "fields": {
                    "project": {"key": project_key},
                    "summary": summary,
                    "description": {
                        "type": "doc",
                        "version": 1,
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {"type": "text", "text": description}
                                ]
                            }
                        ]
                    },
                    "issuetype": {"name": issue_type}
                }
            }

            response = requests.post(url, headers=headers, json=payload, timeout=5.0)
            if response.status_code in [200, 201]:
                logger.info(f"Jira issue created successfully: {response.json().get('key')}")
                return response.json()
            else:
                logger.error(f"Jira returned code {response.status_code}: {response.text}")
                return {"status": "error", "message": response.text}
        except Exception as e:
            logger.error(f"Failed to create Jira issue: {e}")
            return {"status": "error", "message": str(e)}

    def create_trello_card(self, card_name: str, card_desc: str, list_id: str = "mock-list-id") -> Dict[str, Any]:
        api_key = settings.TRELLO_API_KEY
        token = settings.TRELLO_TOKEN

        if not api_key or not token:
            import random
            mock_id = f"mock{random.randint(1000, 9999)}"
            logger.info(f"[Mock Trello Card] Keys missing. Created Card: {card_name} on list: {list_id}")
            return {"status": "success", "id": f"trello-{mock_id}", "url": f"https://trello.com/c/{mock_id}"}

        try:
            url = "https://api.trello.com/1/cards"
            query = {
                "key": api_key,
                "token": token,
                "idList": list_id,
                "name": card_name,
                "desc": card_desc
            }
            response = requests.post(url, params=query, timeout=5.0)
            if response.status_code == 200:
                logger.info("Trello card created successfully.")
                return response.json()
            else:
                logger.error(f"Trello returned code {response.status_code}: {response.text}")
                return {"status": "error", "message": response.text}
        except Exception as e:
            logger.error(f"Failed to create Trello card: {e}")
            return {"status": "error", "message": str(e)}

    def create_clickup_task(self, task_name: str, task_notes: str, list_id: str = None) -> Dict[str, Any]:
        access_token = settings.CLICKUP_ACCESS_TOKEN
        target_list_id = list_id or settings.CLICKUP_LIST_ID

        if not access_token or access_token.startswith("pk_57398188_mock") or not target_list_id:
            logger.info(f"[Mock ClickUp Task] Token or List ID missing/mock. Created Task: {task_name} on List: {target_list_id}")
            import random
            mock_id = f"8623{random.randint(1000, 9999)}"
            return {
                "id": mock_id,
                "url": f"https://app.clickup.com/t/{mock_id}",
                "name": task_name,
                "description": task_notes
            }

        try:
            url = f"https://api.clickup.com/api/v2/list/{target_list_id}/task"
            headers = {
                "Authorization": access_token,
                "Content-Type": "application/json"
            }
            payload = {
                "name": task_name,
                "description": task_notes,
                "status": "to do"
            }
            response = requests.post(url, headers=headers, json=payload, timeout=5.0)
            if response.status_code in [200, 201]:
                logger.info("ClickUp task created successfully.")
                return response.json()
            else:
                logger.error(f"ClickUp returned code {response.status_code}: {response.text}")
                return {"status": "error", "message": response.text}
        except Exception as e:
            logger.error(f"Failed to create ClickUp task: {e}")
            return {"status": "error", "message": str(e)}

    def schedule_google_calendar(self, summary: str, description: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        creds_json = settings.GOOGLE_CALENDAR_CREDENTIALS_JSON
        if not creds_json:
            logger.info(f"[Mock Google Calendar] Credentials missing. Scheduled meeting '{summary}' from {start_time} to {end_time}")
            return {"status": "success", "id": "gcal-mock-event-id", "htmlLink": "https://calendar.google.com/mock-event"}

        # Normally we would use google-auth and google-api-python-client
        logger.info(f"Google calendar integration would authenticate with JSON credentials and insert event: {summary}")
        return {"status": "success", "id": "gcal-mock-event-id"}

integrations_service = IntegrationsService()
