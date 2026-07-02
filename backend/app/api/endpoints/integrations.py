import os
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/status")
def get_integrations_status(current_user: dict = Depends(get_current_user)):
    slack_webhook = os.environ.get("SLACK_WEBHOOK_URL")
    clickup_token = os.environ.get("CLICKUP_ACCESS_TOKEN")
    
    # Check if slack is configured and not a placeholder
    has_slack = bool(slack_webhook and "slack.com/services" in slack_webhook and "placeholder" not in slack_webhook)
    # Check if clickup is configured and not a placeholder
    has_clickup = bool(clickup_token and "placeholder" not in clickup_token and clickup_token.strip() != "")

    return {
        "slack": has_slack,
        "clickup": has_clickup
    }
