import logging
import re
from typing import List, Dict
from src.models.job import JobListing

logger = logging.getLogger(__name__)


def parse_indiehackers_jobs(markdown: str) -> List[JobListing]:
    jobs = []
    
    # Pattern for Remote Jobs section
    # Format: [Icon]Title\\\\\nCompany•_$Salary_/month\\\\\n•\\\\\nType
    remote_pattern = r'!\[.*?\]\((.*?)\)(.*?)\\\\\n(.*?)•_\$(.*?)_/month\\\\\n•\\\\\n(.*?)'
    
    matches = re.finditer(remote_pattern, markdown)
    for match in matches:
        icon_url = match.group(1)
        title = match.group(2).strip()
        company = match.group(3).strip()
        salary = match.group(4).strip()
        employment_type = match.group(5).strip()
        
        job = JobListing(
            title=title,
            company=company,
            salary=f"${salary}/month",
            employment_type=employment_type,
            location="Remote",
            description=None,
            url=None,
            source="indiehackers"
        )
        jobs.append(job)
        logger.info(f"Parsed job: {title} at {company}")
    
    # Pattern for Partner Up section (co-founder opportunities)
    # Format: [Title](url)duration
    partner_pattern = r'\[(.*?)\]\((.*?)\)(\d+[dhm])'
    
    matches = re.finditer(partner_pattern, markdown)
    for match in matches:
        title = match.group(1).strip()
        url = match.group(2)
        duration = match.group(3)
        
        # Only include if it looks like a partnership/co-founder opportunity
        if any(keyword in title.lower() for keyword in ['co-founder', 'partner', 'collaborator', 'founder']):
            job = JobListing(
                title=title,
                company="Partnership Opportunity",
                salary=None,
                employment_type="Co-founder/Partner",
                location=None,
                description=f"Duration: {duration}",
                url=url,
                source="indiehackers"
            )
            jobs.append(job)
            logger.info(f"Parsed partnership: {title}")
    
    logger.info(f"Total jobs parsed from Indie Hackers: {len(jobs)}")
    return jobs


def parse_toptal_jobs(markdown: str) -> List[JobListing]:
    jobs = []
    logger.info("Toptal job parsing not yet implemented")
    return jobs


def parse_hackernews_jobs(markdown: str) -> List[JobListing]:
    jobs = []
    logger.info("Hacker News job parsing not yet implemented")
    return jobs


def parse_jobs(scraped_data: List[Dict]) -> List[Dict]:
    all_jobs = []
    
    for item in scraped_data:
        if not item.get('success'):
            logger.warning(f"Skipping unsuccessful scrape: {item}")
            continue
        
        data = item.get('data', {})
        markdown = data.get('markdown', '')
        source_url = data.get('url', '')
        
        logger.info(f"Parsing data from {source_url}")
        
        # Determine source and use appropriate parser
        if 'indiehackers.com' in source_url:
            jobs = parse_indiehackers_jobs(markdown)
        elif 'toptal.com' in source_url:
            jobs = parse_toptal_jobs(markdown)
        elif 'news.ycombinator.com' in source_url:
            jobs = parse_hackernews_jobs(markdown)
        else:
            logger.warning(f"No parser available for {source_url}")
            continue
        
        # Convert JobListing objects to dicts
        for job in jobs:
            all_jobs.append({
                'title': job.title,
                'company': job.company,
                'salary': job.salary,
                'employment_type': job.employment_type,
                'location': job.location,
                'description': job.description,
                'url': job.url,
                'source': job.source
            })
    
    logger.info(f"Total jobs parsed across all sources: {len(all_jobs)}")
    return all_jobs
