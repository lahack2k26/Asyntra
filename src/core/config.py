import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY")
    ASI_API_KEY: str = os.getenv("ASI_ONE_API_KEY")
    UPSTASH_REDIS_REST_URL: str = os.getenv("UPSTASH_REDIS_REST_URL")
    UPSTASH_REDIS_REST_TOKEN: str = os.getenv("UPSTASH_REDIS_REST_TOKEN")
    URLS_TO_SCRAPE: list = [
        "https://www.indiehackers.com/jobs",
        "https://www.upwork.com/nx/jobs/search/",
        "https://www.toptal.com/developers",
        "https://www.fiverr.com/categories/programming-tech",
    ]
    CACHE_FILE: str = "jobs.json"
    CLASSIFIED_CACHE_FILE: str = "classified_output.json"
    CACHE_TTL_MINUTES: int = 30
    RATE_LIMIT: str = "5/hour"


settings = Settings()
