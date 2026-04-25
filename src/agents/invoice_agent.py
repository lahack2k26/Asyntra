import json
import logging
from datetime import datetime, timezone
from typing import Dict, List
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class InvoiceAgent(BaseAgent):
    """Agent that generates budget, timeline and scaling analysis per project."""
    prompt_file = "invoice_prompt.txt"

    def process(self, classified_data: Dict) -> Dict:
        output = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_projects": classified_data.get("total_projects", 0),
            "total_companies": classified_data.get("total_companies", 0),
            "companies": [],
            "summary": {
                "accumulated_budget_min": 0,
                "accumulated_budget_max": 0,
                "currency": "USD",
            },
        }

        for company in classified_data.get("companies", []):
            company_result = {
                "company_id": company.get("company_id"),
                "company_name": company.get("company_name"),
                "client_profile": company.get("client_profile", {}),
                "projects": [],
                "company_total": {"min": 0, "max": 0, "currency": "USD"},
            }

            for project in company.get("projects", []):
                invoice = self._generate_invoice(project)
                if invoice:
                    company_result["projects"].append(invoice)
                    company_result["company_total"]["min"] += invoice["budget_estimate"]["min"]
                    company_result["company_total"]["max"] += invoice["budget_estimate"]["max"]

            output["companies"].append(company_result)
            output["summary"]["accumulated_budget_min"] += company_result["company_total"]["min"]
            output["summary"]["accumulated_budget_max"] += company_result["company_total"]["max"]

        return output

    def _generate_invoice(self, project: Dict) -> Dict:
        try:
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": json.dumps(project, indent=2)},
            ]
            response = self.client.chat_completion(messages)
            invoice = json.loads(response)
            logger.info(f"Generated invoice for {project.get('project_id')}")
            return invoice
        except Exception as e:
            logger.error(f"Invoice generation failed for {project.get('project_id')}: {e}")
            return None
