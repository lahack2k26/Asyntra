from dataclasses import dataclass
from typing import Optional


@dataclass
class JobListing:
    title: str
    company: str
    salary: Optional[str]
    employment_type: Optional[str]
    location: Optional[str]
    description: Optional[str]
    url: Optional[str]
    source: str
