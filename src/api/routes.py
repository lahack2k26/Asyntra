import logging
from fastapi import Request, HTTPException

from src.core.cache import (
    load_cache, save_cache,
    load_classified_cache, save_classified_cache,
    load_invoice_cache, save_invoice_cache,
)
from src.core.scraper import scrape
from src.agents.job_parser_agent import JobParserAgent
from src.agents.inbox_agent import InboxAgent
from src.agents.invoice_agent import InvoiceAgent

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
