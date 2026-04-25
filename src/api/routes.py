import json
import logging
import os
from fastapi import Request, HTTPException
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from src.core.config import settings
from src.core.cache import load_cache, save_cache
from src.core.scraper import scrape
from src.agents.job_parser_agent import JobParserAgent
from src.agents.inbox_agent import InboxAgent

logger = logging.getLogger(__name__)


async def get_jobs(request: Request):
    logger.info("GET /jobs endpoint called")
    
    # cached = load_cache()
    # if cached:
    #     logger.info("Returning cached data")
    #     return {
    #         "source": "cache",
    #         "data": cached
    #     }

    try:
        logger.info("Starting scrape operation")
        scraped_results = scrape()
        logger.info(f"Scrape completed, got {len(scraped_results)} results")
        
        logger.info("Parsing job listings from scraped data using ASI agent")
        agent = JobParserAgent()
        parsed_jobs = agent.process(scraped_results)
        logger.info(f"Parsed {len(parsed_jobs)} job listings")
        
        logger.info("Saving parsed results to cache")
        save_cache(parsed_jobs)
        logger.info("Cache saved successfully")

        return {
            "source": "fresh",
            "data": parsed_jobs
        }

    except Exception as e:
        logger.error(f"Error in get_jobs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def health_check():
    return {"status": "healthy"}


async def classify_jobs(request: Request):
    logger.info("GET /classify endpoint called")

    cache_path = settings.CACHE_FILE
    if not os.path.exists(cache_path):
        logger.error("jobs.json not found — run /jobs first to populate the cache")
        raise HTTPException(
            status_code=404,
            detail="jobs.json not found. Call /jobs first to scrape and cache job listings."
        )

    try:
        classified_path = settings.CLASSIFIED_CACHE_FILE
        if os.path.exists(classified_path):
            jobs_mtime = os.path.getmtime(cache_path)
            classified_mtime = os.path.getmtime(classified_path)
            if classified_mtime >= jobs_mtime:
                logger.info("Returning cached classified output (newer than jobs.json)")
                with open(classified_path, "r") as f:
                    return json.load(f)

        logger.info(f"Loading jobs from {cache_path}")
        with open(cache_path, "r") as f:
            cache_data = json.load(f)

        jobs = cache_data.get("results", [])
        logger.info(f"Loaded {len(jobs)} jobs from cache")

        agent = InboxAgent()
        classified = agent.process(jobs)
        logger.info(f"Classification complete: {classified['total_companies']} companies, {classified['total_projects']} projects")

        with open(settings.CLASSIFIED_CACHE_FILE, "w") as f:
            json.dump(classified, f, indent=2)
        logger.info(f"Saved classified output to {settings.CLASSIFIED_CACHE_FILE}")

        return classified

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in classify_jobs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded ({settings.RATE_LIMIT})."},
    )
