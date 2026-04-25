import json
import logging
from upstash_redis import Redis
from src.core.config import settings

logger = logging.getLogger(__name__)

CACHE_KEY = "freelanceos:jobs"


def _get_client() -> Redis:
    return Redis(
        url=settings.UPSTASH_REDIS_REST_URL,
        token=settings.UPSTASH_REDIS_REST_TOKEN
    )


def load_cache():
    try:
        redis = _get_client()
        data = redis.get(CACHE_KEY)
        if data is None:
            logger.info("Cache miss")
            return None
        logger.info("Cache hit")
        return json.loads(data)
    except Exception as e:
        logger.error(f"Error loading cache: {e}")
        return None


def save_cache(results):
    try:
        redis = _get_client()
        redis.set(CACHE_KEY, json.dumps(results), ex=settings.CACHE_TTL_SECONDS)
        logger.info(f"Saved {len(results)} results to Redis (TTL: {settings.CACHE_TTL_SECONDS}s)")
    except Exception as e:
        logger.error(f"Error saving cache: {e}")
        raise
