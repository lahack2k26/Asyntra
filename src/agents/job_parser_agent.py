import logging
import json
import os
from typing import List, Dict
from src.agents.asi_client import ASIClient
from src.core.config import settings

logger = logging.getLogger(__name__)


class JobParserAgent:
    
    def __init__(self):
        self.client = ASIClient()
        self.system_prompt = self._load_prompt()
    
    def _load_prompt(self) -> str:
        path = os.path.join(os.path.dirname(__file__), "../config/system_prompt.txt")
        with open(path, 'r') as f:
            return f.read()
    
    def process(self, scraped_data: List[Dict]) -> List[Dict]:
        all_jobs = []
        
        for item in scraped_data:
            if not item.get('success'):
                continue
            
            data = item.get('data', {})
            markdown = data.get('markdown', '')
            source_url = data.get('url', '')
            
            if not markdown:
                continue
            
            jobs = self._parse(markdown, source_url)
            all_jobs.extend(jobs)
        
        return all_jobs
    
    def _parse(self, markdown: str, source_url: str) -> List[Dict]:
        try:
            logger.info(f"Parsing {source_url}, markdown length: {len(markdown)}")
            logger.info(f"Markdown preview: {markdown[:500]}...")
            
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Source: {source_url}\n\nContent:\n{markdown}"}
            ]
            response = self.client.chat_completion(messages)
            logger.info(f"ASI response: {response[:500]}...")
            
            jobs = json.loads(response)
            return jobs if isinstance(jobs, list) else []
        except Exception as e:
            logger.error(f"Parse error: {e}", exc_info=True)
            return []
