import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY")
    ASI_API_KEY: str = os.getenv("ASI_ONE_API_KEY")
    URLS_TO_SCRAPE: list = [
        "https://www.indiehackers.com/",
        "https://upwork.com",
        "https://www.toptal.com",
        "https://fiverr.com",
    ]
    CACHE_FILE: str = "jobs.json"
    CACHE_TTL_MINUTES: int = 30
    RATE_LIMIT: str = "5/hour"


settings = Settings()
