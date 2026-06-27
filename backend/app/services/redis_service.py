import logging
import redis
from app.config import settings

logger = logging.getLogger("redis_service")

class RedisService:
    def __init__(self):
        self.enabled = False
        self.client = None
        self._mock_cache = {}

        if settings.REDIS_URL:
            try:
                self.client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2.0)
                # Test connection
                self.client.ping()
                self.enabled = True
                logger.info(f"Redis connected to {settings.REDIS_URL}")
            except Exception as e:
                logger.error(f"Redis connection failed: {e}. Running in Mock Redis mode.")
        else:
            logger.warning("REDIS_URL is not set. Running in Mock Redis mode.")

    def set(self, key: str, value: str, expire: int = None) -> bool:
        if self.enabled and self.client:
            try:
                self.client.set(key, value, ex=expire)
                return True
            except Exception as e:
                logger.error(f"Redis set failed: {e}")
        
        self._mock_cache[key] = value
        return True

    def get(self, key: str) -> str:
        if self.enabled and self.client:
            try:
                val = self.client.get(key)
                if val is not None:
                    return val
            except Exception as e:
                logger.error(f"Redis get failed: {e}")
        
        return self._mock_cache.get(key)

    def delete(self, key: str) -> bool:
        if self.enabled and self.client:
            try:
                self.client.delete(key)
                return True
            except Exception as e:
                logger.error(f"Redis delete failed: {e}")
        
        if key in self._mock_cache:
            del self._mock_cache[key]
        return True

    def publish(self, channel: str, message: str) -> int:
        if self.enabled and self.client:
            try:
                return self.client.publish(channel, message)
            except Exception as e:
                logger.error(f"Redis publish failed: {e}")
        
        logger.info(f"[Mock Redis Pub] Publish on channel '{channel}': {message}")
        return 1

redis_service = RedisService()
