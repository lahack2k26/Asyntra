import logging
import json
from typing import List, Dict
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class JobParserAgent(BaseAgent):
    prompt_file = "system_prompt.txt"
    
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
            
            truncated = markdown[:8000]
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Source: {source_url}\n\nContent:\n{truncated}"}
            ]
            response = self.client.chat_completion(messages)
            logger.info(f"ASI response: {response[:500]}...")
            clean = response.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            jobs = json.loads(clean)
            return jobs if isinstance(jobs, list) else []
        except Exception as e:
            logger.error(f"Parse error: {e}", exc_info=True)
            return []
