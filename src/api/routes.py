import logging
from fastapi import Request, HTTPException
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from src.core.config import settings
from src.core.cache import load_cache, save_cache, load_invoice_cache, save_invoice_cache
from src.core.scraper import scrape
from src.agents.job_parser_agent import JobParserAgent
from src.agents.invoice_agent import InvoiceAgent

logger = logging.getLogger(__name__)


async def get_jobs(request: Request):
    logger.info("GET /jobs endpoint called")
    
    cached = load_cache()
    if cached:
        logger.info("Returning cached data")
        return {
            "source": "cache",
            "data": cached
        }

    try:
        logger.info("Starting scrape operation")
        scraped_results = scrape()
        logger.info(f"Scrape completed, got {len(scraped_results)} results")
    
        agent = JobParserAgent()
        parsed_jobs = agent.process(scraped_results)
        logger.info(f"Parsed {len(parsed_jobs)} job listings")
        
        save_cache(parsed_jobs)
        logger.info("Cache saved successfully")

        return {
            "source": "fresh",
            "data": parsed_jobs
        }

    except Exception as e:
        logger.error(f"Error in get_jobs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def get_invoice(request: Request):
    logger.info("GET /invoice endpoint called")

    cached = load_invoice_cache()
    if cached:
        logger.info("Returning cached invoice")
        return {"source": "cache", "data": cached}

    try:
        import json, os
        classified_path = os.path.join(os.getcwd(), "classified_output.json")
        with open(classified_path, "r") as f:
            classified_data = json.load(f)

        agent = InvoiceAgent()
        invoice_output = agent.process(classified_data)
        save_invoice_cache(invoice_output)
        logger.info("Invoice generated and cached")

        return {"source": "fresh", "data": invoice_output}

    except Exception as e:
        logger.error(f"Error in get_invoice: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def health_check():
    return {"status": "healthy"}


def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded ({settings.RATE_LIMIT})."},
    )
