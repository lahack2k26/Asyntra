import logging
import json
import os
from datetime import datetime, timezone
from typing import List, Dict
from src.agents.asi_client import ASIClient

logger = logging.getLogger(__name__)

TECH_CATEGORIES = {"web_development", "mobile_development", "api_development", "devops", "ai_ml", "data_science", "blockchain", "iot_development", "security_development"}


class InboxAgent:

    def __init__(self):
        self.client = ASIClient()
        self.system_prompt = self._load_prompt()

    def _load_prompt(self) -> str:
        path = os.path.join(os.path.dirname(__file__), "../config/classification_prompt.txt")
        with open(path, 'r') as f:
            return f.read()

    def process(self, jobs: List[Dict]) -> Dict:
        logger.info(f"InboxAgent received {len(jobs)} jobs")

        filtered = self._filter_jobs(jobs)
        logger.info(f"After filter: {len(filtered)} jobs with named clients (skipped {len(jobs) - len(filtered)})")

        grouped = self._group_by_company(filtered)
        logger.info(f"Grouped into {len(grouped)} companies")

        companies = []
        for company_name, company_data in grouped.items():
            enriched_projects = []
            for project in company_data["projects"]:
                enriched = self._enrich_project(project)
                enriched_projects.append(enriched)
            company_data["projects"] = enriched_projects
            companies.append(company_data)

        output = {
            "classified_at": datetime.now(timezone.utc).isoformat(),
            "total_companies": len(companies),
            "total_projects": sum(len(c["projects"]) for c in companies),
            "companies": companies
        }

        logger.info(f"Classification complete: {output['total_companies']} companies, {output['total_projects']} projects")
        return output

    def _filter_jobs(self, jobs: List[Dict]) -> List[Dict]:
        filtered = []
        for job in jobs:
            name = job.get("client", {}).get("name")
            if name and name.strip():
                filtered.append(job)
            else:
                logger.info(f"Skipping job {job.get('project_id')} — client.name is null")
        return filtered

    def _group_by_company(self, jobs: List[Dict]) -> Dict:
        grouped = {}
        for job in jobs:
            client = job.get("client", {})
            company_name = client["name"].strip()
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
        raw_requirements = project.pop("_raw_key_requirements", [])
        raw_description = project.pop("_raw_description", "")
        category = project.get("metadata", {}).get("category", "")
        is_tech = category in TECH_CATEGORIES

        try:
            logger.info(f"Enriching project: {project.get('project_id')}")
            messages = [
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": json.dumps({
                        "project_id": project.get("project_id"),
                        "title": project.get("title"),
                        "description": raw_description,
                        "category": category,
                        "is_tech_project": is_tech,
                        "technical_stack": raw_stack,
                        "key_requirements": raw_requirements
                    })
                }
            ]
            response = self.client.chat_completion(messages)
            logger.info(f"ASI enrichment response for {project.get('project_id')}: {response[:300]}...")
            clean_response = response.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            enriched = json.loads(clean_response)

            project["category"] = enriched.get("category", category)
            project["technical_requirements"] = enriched.get("technical_requirements", {})
            project["requirements"] = enriched.get("requirements", {})

        except Exception as e:
            logger.error(f"Enrichment failed for {project.get('project_id')}: {e}", exc_info=True)
            project["category"] = category
            project["technical_requirements"] = {"unclassified": raw_stack}
            project["requirements"] = {"unclassified": raw_requirements}

        return project
