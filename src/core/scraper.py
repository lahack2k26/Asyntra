import logging
import requests
from src.core.config import settings

logger = logging.getLogger(__name__)


def scrape():
    logger.info("Starting scrape function")
    firecrawl_url = "https://api.firecrawl.dev/v1/scrape"
    results = []

    headers = {
        "Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}",
        "Content-Type": "application/json",
    }

    logger.info(f"API Key present: {bool(settings.FIRECRAWL_API_KEY)}")
    logger.info(f"URLs to scrape: {settings.URLS_TO_SCRAPE}")

    for target_url in settings.URLS_TO_SCRAPE:
        logger.info(f"Scraping URL: {target_url}")
        payload = {
            "url": target_url,
            "formats": ["markdown"],
            "waitFor": 3000,
        }

        try:
            response = requests.post(
                firecrawl_url,
                json=payload,
                headers=headers,
                timeout=40,
            )
            logger.info(f"Response status: {response.status_code}")
            response.raise_for_status()
            result = response.json()
            logger.info(f"Successfully scraped {target_url}")
            results.append(result)
        except Exception as e:
            logger.error(f"Error scraping {target_url}: {str(e)}")

    logger.info(f"Scrape completed with {len(results)} results")
    return results
