import time
import logging
from jose import jwt
from app.config import settings

logger = logging.getLogger("livekit_service")

class LiveKitService:
    def __init__(self):
        self.api_key = settings.LIVEKIT_API_KEY
        self.api_secret = settings.LIVEKIT_API_SECRET
        self.livekit_url = settings.LIVEKIT_URL

        if not self.api_key or not self.api_secret:
            logger.warning(
                "LIVEKIT_API_KEY or LIVEKIT_API_SECRET is not set. LiveKit token generator running in dummy mode."
            )

    def generate_access_token(self, room_name: str, participant_identity: str, participant_name: str) -> str:
        # Fallback secrets if none set in settings
        key = self.api_key or "dev-key"
        secret = self.api_secret or "dev-secret"

        now = int(time.time())
        # Token expires in 6 hours
        expire = now + 6 * 3600

        payload = {
            "iss": key,
            "sub": participant_identity,
            "name": participant_name,
            "exp": expire,
            "nbf": now,
            "video": {
                "roomJoin": True,
                "room": room_name,
                "roomList": True,
                "canPublish": True,
                "canSubscribe": True,
                "canPublishData": True
            }
        }

        try:
            token = jwt.encode(payload, secret, algorithm="HS256")
            logger.info(f"Generated LiveKit token for participant {participant_name} in room {room_name}")
            return token
        except Exception as e:
            logger.error(f"Failed to encode LiveKit token: {e}")
            raise

    def get_livekit_url(self) -> str:
        return self.livekit_url

livekit_service = LiveKitService()
