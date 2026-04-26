import json
import logging
from datetime import datetime, timezone
from typing import List, Dict
from src.agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

class InboxAgent(BaseAgent):
    prompt_file = "classification_prompt.txt"

    def process(self, jobs: List[Dict]) -> Dict:
        logger.info(f"InboxAgent received {len(jobs)} jobs")
        filtered = [j for j in jobs if ((j.get("client") or {}).get("name") or "").strip()]
        logger.info(f"After filter: {len(filtered)} jobs with named clients")

        grouped = self._group_by_company(filtered)
        companies = []
        for company_data in grouped.values():
            company_data["projects"] = [self._enrich_project(p) for p in company_data["projects"]]
            companies.append(company_data)

        output = {
            "classified_at": datetime.now(timezone.utc).isoformat(),
            "total_companies": len(companies),
            "total_projects": sum(len(c["projects"]) for c in companies),
            "companies": companies,
        }
        logger.info(f"Classification complete: {output['total_companies']} companies, {output['total_projects']} projects")
        return output

    def _group_by_company(self, jobs: List[Dict]) -> Dict:
        grouped = {}
        for job in jobs:
            client = job.get("client", {})
            company_name = (client.get("name") or "").strip()
            company_id = company_name.lower().replace(" ", "_").replace(".", "").replace(",", "")

            if company_name not in grouped:
                grouped[company_name] = {
                    "company_id": company_id,
                    "company_name": company_name,
                    "client_profile": {
                        "type": client.get("type"),
                        "industry": client.get("industry"),
                        "location": client.get("location"),
                        "budget_tier": client.get("budget_tier")
                    },
                    "projects": []
                }

            project = job.get("project", {})
            grouped[company_name]["projects"].append({
                "project_id": job.get("project_id"),
                "title": project.get("title"),
                "source_platform": job.get("source_platform"),
                "source_url": job.get("source_url"),
                "timestamp": job.get("timestamp"),
                "metadata": {
                    "category": project.get("category"),
                    "complexity": project.get("complexity"),
                    "urgency": project.get("urgency"),
                    "duration_estimate": project.get("duration_estimate"),
                    "budget": project.get("budget")
                },
                "_raw_technical_stack": project.get("technical_stack", []),
                "_raw_key_requirements": project.get("key_requirements", []),
                "_raw_description": project.get("description", "")
            })

        return grouped

    def _enrich_project(self, project: Dict) -> Dict:
        raw_stack = project.pop("_raw_technical_stack", [])
        raw_reqs = project.pop("_raw_key_requirements", [])
        raw_desc = project.pop("_raw_description", "")
        category = project.get("metadata", {}).get("category", "")

        try:
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": json.dumps({
                    "project_id": project.get("project_id"),
                    "title": project.get("title"),
                    "description": raw_desc,
                    "category": category,
                    "technical_stack": raw_stack,
                    "key_requirements": raw_reqs,
                })},
            ]
            response = self.client.chat_completion(messages)
            clean = response.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            enriched = json.loads(clean)
            project["category"] = enriched.get("category", category)
            project["technical_requirements"] = enriched.get("technical_requirements", {})
            project["requirements"] = enriched.get("requirements", {})

        except Exception as e:
            logger.error(f"Enrichment failed for {project.get('project_id')}: {e}")
            project["category"] = category
            project["technical_requirements"] = {"unclassified": raw_stack}
            project["requirements"] = {"unclassified": raw_reqs}

        return project