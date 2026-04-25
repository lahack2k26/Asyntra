import logging
import requests
import json
from typing import List, Dict
from src.core.config import settings

logger = logging.getLogger(__name__)


class ASIClient:
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.ASI_API_KEY
        self.url = "https://api.asi1.ai/v1/chat/completions"
    
    def chat_completion(self, messages: List[Dict], model: str = "asi1") -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {"model": model, "messages": messages}
        
        response = requests.post(self.url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        return result['choices'][0]['message']['content'].strip()
