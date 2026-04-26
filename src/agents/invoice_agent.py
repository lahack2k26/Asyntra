import json
import logging
from datetime import datetime, timezone
from typing import Dict, List
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class InvoiceAgent(BaseAgent):

    prompt_file = "invoice_prompt.txt"

    WEEKLY_HOURS = 40

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
                "total_hours_min": 0,
                "total_hours_max": 0,
                "total_weeks_at_40hrs_min": 0.0,
                "total_weeks_at_40hrs_max": 0.0,
                "average_risk_score": 0.0,
                "high_risk_projects": [],
            },
        }

        risk_scores = []

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

                    budget = invoice.get("budget_estimate", {})
                    company_result["company_total"]["min"] += budget.get("min", 0)
                    company_result["company_total"]["max"] += budget.get("max", 0)

                    workload = invoice.get("workload_metrics", {})
                    output["summary"]["total_hours_min"] += workload.get("estimated_hours_min", 0)
                    output["summary"]["total_hours_max"] += workload.get("estimated_hours_max", 0)
                    output["summary"]["total_weeks_at_40hrs_min"] += workload.get("weeks_at_40hrs_min", 0.0)
                    output["summary"]["total_weeks_at_40hrs_max"] += workload.get("weeks_at_40hrs_max", 0.0)

                    risk = invoice.get("risk_assessment", {})
                    score = risk.get("overall_risk_score")
                    if isinstance(score, (int, float)):
                        risk_scores.append(score)
                        if score >= 7:
                            output["summary"]["high_risk_projects"].append({
                                "project_id": invoice.get("project_id"),
                                "title": invoice.get("title"),
                                "risk_score": score,
                                "top_risk": (risk.get("risk_factors") or ["unknown"])[0],
                            })

            output["companies"].append(company_result)
            output["summary"]["accumulated_budget_min"] += company_result["company_total"]["min"]
            output["summary"]["accumulated_budget_max"] += company_result["company_total"]["max"]

        if risk_scores:
            output["summary"]["average_risk_score"] = round(sum(risk_scores) / len(risk_scores), 1)

        output["summary"]["total_weeks_at_40hrs_min"] = round(output["summary"]["total_weeks_at_40hrs_min"], 1)
        output["summary"]["total_weeks_at_40hrs_max"] = round(output["summary"]["total_weeks_at_40hrs_max"], 1)

        return output

    def _generate_invoice(self, project: Dict) -> Dict:
        try:
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": json.dumps(project, indent=2)},
            ]
            response = self.client.chat_completion(messages)
            clean = response.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            invoice = json.loads(clean)
            logger.info(f"Generated invoice for {project.get('project_id')}")
            return invoice
        except Exception as e:
            logger.error(f"Invoice generation failed for {project.get('project_id')}: {e}")
            return None
