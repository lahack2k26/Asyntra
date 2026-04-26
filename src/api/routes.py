import logging
from fastapi import Request, HTTPException

from src.core.cache import (
    load_cache, save_cache,
    load_classified_cache, save_classified_cache,
    load_invoice_cache, save_invoice_cache,
    clear_invoice_cache, clear_all_cache,
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

    if jobs is not None and classified is not None and invoice is not None:
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


async def debug_scrape():
    """Returns raw scrape markdown preview + parsed job count per URL for debugging."""
    results = scrape()
    output = []
    for item in results:
        if not item.get('success'):
            output.append({"url": item.get('data', {}).get('sourceURL', '?'), "success": False})
            continue
        data = item.get('data', {})
        markdown = data.get('markdown', '')
        url = data.get('sourceURL') or data.get('url', '?')
        jobs = JobParserAgent()._parse(markdown, url)
        output.append({
            "url": url,
            "markdown_length": len(markdown),
            "markdown_preview": markdown[:500],
            "jobs_parsed": len(jobs),
            "job_titles": [j.get('project', {}).get('title') for j in jobs[:5]],
        })
    return {"sources": output}


async def clear_all_caches():
    logger.info("POST /cache/clear-all called")
    try:
        clear_all_cache()
        return {"status": "all caches cleared"}
    except Exception as e:
        logger.error(f"Clear all cache error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def refresh_invoices():
    logger.info("POST /cache/clear-invoice called")
    try:
        classified = load_classified_cache()
        if not classified:
            logger.info("No classified cache — running full pipeline first")
            jobs = load_cache()
            if not jobs:
                jobs = JobParserAgent().process(scrape())
                save_cache(jobs)
            classified = InboxAgent().process(jobs)
            save_classified_cache(classified)
        clear_invoice_cache()
        invoice = InvoiceAgent().process(classified)
        save_invoice_cache(invoice)
        logger.info("Invoice cache refreshed with new metrics")
        return {"status": "refreshed", "invoice": invoice}
    except Exception as e:
        logger.error(f"Invoice refresh error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
