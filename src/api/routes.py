import json
import logging
import os
from fastapi import Request, HTTPException

from src.core.cache import (
    load_cache, save_cache,
    load_classified_cache, save_classified_cache,
    load_invoice_cache, save_invoice_cache,
)
from src.core.scraper import scrape
from src.agents.job_parser_agent import JobParserAgent
from src.agents.inbox_agent import InboxAgent

logger = logging.getLogger(__name__)


async def get_jobs(request: Request):
    logger.info("GET /jobs endpoint called")

    jobs = load_cache()
    classified = load_classified_cache()
    invoice = load_invoice_cache()

    if jobs and classified and invoice:
        logger.info("All stages cached — returning from Redis")
        return {"source": "cache", "jobs": jobs, "classified": classified, "invoice": invoice}

    try:
        logger.info("Stage 1: Scraping + parsing jobs")
        jobs = JobParserAgent().process(scrape())
        save_cache(jobs)
        logger.info(f"Stage 1 complete: {len(jobs)} jobs → Redis")

        logger.info("Stage 2: Classifying by company")
        classified = InboxAgent().process(jobs)
        save_classified_cache(classified)
        logger.info(f"Stage 2 complete: {classified['total_companies']} companies → Redis")

        logger.info("Stage 3: Generating invoices")
        invoice = InvoiceAgent().process(classified)
        save_invoice_cache(invoice)
        logger.info("Stage 3 complete: invoices → Redis")

        return {"source": "fresh", "jobs": jobs, "classified": classified, "invoice": invoice}

    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}", exc_info=True)
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
