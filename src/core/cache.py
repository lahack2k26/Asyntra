import json
import logging
import os
from datetime import datetime, timedelta, timezone
from src.core.config import settings

logger = logging.getLogger(__name__)


def load_cache():
    logger.info(f"Attempting to load cache from {settings.CACHE_FILE}")
    if not os.path.exists(settings.CACHE_FILE):
        logger.info("Cache file does not exist")
        return None

    try:
        with open(settings.CACHE_FILE, "r") as f:
            data = json.load(f)
        logger.info("Cache file loaded successfully")

        timestamp = datetime.fromisoformat(data["timestamp"])
        ttl = timedelta(minutes=settings.CACHE_TTL_MINUTES)
        logger.info(f"Cache timestamp: {timestamp}, TTL: {settings.CACHE_TTL_MINUTES} minutes")

        if datetime.now(timezone.utc) - timestamp > ttl:
            logger.info("Cache expired")
            return None

        logger.info("Returning cached data")
        return data["results"]
    except Exception as e:
        logger.error(f"Error loading cache: {str(e)}", exc_info=True)
        return None


def save_cache(results):
    logger.info(f"Saving {len(results)} results to cache at {settings.CACHE_FILE}")
    try:
        with open(settings.CACHE_FILE, "w") as f:
            json.dump(
                {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "results": results,
                },
                f,
                indent=2,
            )
        logger.info("Cache saved successfully")
    except Exception as e:
        logger.error(f"Error saving cache: {str(e)}", exc_info=True)
        raise
