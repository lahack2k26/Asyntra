import json
import logging
from upstash_redis import Redis
from src.core.config import settings

logger = logging.getLogger(__name__)

CACHE_KEY = "asyntra:jobs"
EMAIL_CACHE_KEY = "asyntra:email_jobs"
CLASSIFIED_CACHE_KEY = "asyntra:classified"
INVOICE_CACHE_KEY = "asyntra:invoices"


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


def load_classified_cache():
    try:
        redis = _get_client()
        data = redis.get(CLASSIFIED_CACHE_KEY)
        if data is None:
            logger.info("Classified cache miss")
            return None
        logger.info("Classified cache hit")
        return json.loads(data)
    except Exception as e:
        logger.error(f"Error loading classified cache: {e}")
        return None


def save_classified_cache(classified_data):
    try:
        redis = _get_client()
        redis.set(CLASSIFIED_CACHE_KEY, json.dumps(classified_data), ex=settings.CACHE_TTL_SECONDS)
        logger.info("Classified data saved to Redis")
    except Exception as e:
        logger.error(f"Error saving classified cache: {e}")
        raise


def load_invoice_cache():
    try:
        redis = _get_client()
        data = redis.get(INVOICE_CACHE_KEY)
        if data is None:
            logger.info("Invoice cache miss")
            return None
        logger.info("Invoice cache hit")
        return json.loads(data)
    except Exception as e:
        logger.error(f"Error loading invoice cache: {e}")
        return None


def save_invoice_cache(invoice_data):
    try:
        redis = _get_client()
        redis.set(INVOICE_CACHE_KEY, json.dumps(invoice_data), ex=settings.CACHE_TTL_SECONDS)
        logger.info("Invoice saved to Redis")
    except Exception as e:
        logger.error(f"Error saving invoice cache: {e}")
        raise
