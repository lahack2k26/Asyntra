import os
from src.agents.asi_client import ASIClient


class BaseAgent:

    prompt_file: str = None

    def __init__(self):
        self.client = ASIClient()
        self.system_prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        path = os.path.join(os.path.dirname(__file__), f"../config/{self.prompt_file}")
        with open(path, "r") as f:
            return f.read()
