import json
import pytest
from unittest.mock import MagicMock, patch
from src.agents.inbox_agent import InboxAgent


def make_job(name, project_id="FW-001", title="Test Project", category="design",
             stack=None, requirements=None, description="A test project."):
    return {
        "project_id": project_id,
        "timestamp": "2025-01-01T00:00:00Z",
        "source_platform": "upwork",
        "source_url": "https://upwork.com/test",
        "client": {
            "name": name,
            "type": "startup",
            "industry": "Tech",
            "location": None,
            "budget_tier": "medium"
        },
        "project": {
            "title": title,
            "description": description,
            "category": category,
            "complexity": "moderate",
            "urgency": "medium",
            "duration_estimate": "weeks",
            "budget": "$500",
            "technical_stack": stack or [],
            "key_requirements": requirements or ["req1", "req2"]
        }
    }


@pytest.fixture
def agent():
    with patch.object(InboxAgent, '__init__', lambda self: None):
        a = InboxAgent.__new__(InboxAgent)
        a.client = MagicMock()
        a.system_prompt = "test prompt"
        return a


# ---------------------------------------------------------------------------
# _filter_jobs
# ---------------------------------------------------------------------------

class TestFilterJobs:

    def test_removes_null_name(self, agent):
        jobs = [make_job(None), make_job("Acme")]
        result = agent._filter_jobs(jobs)
        assert len(result) == 1
        assert result[0]["client"]["name"] == "Acme"

    def test_removes_empty_string_name(self, agent):
        jobs = [make_job(""), make_job("  "), make_job("Acme")]
        result = agent._filter_jobs(jobs)
        assert len(result) == 1

    def test_all_null_returns_empty(self, agent):
        jobs = [make_job(None), make_job(None)]
        assert agent._filter_jobs(jobs) == []

    def test_all_named_returns_all(self, agent):
        jobs = [make_job("Acme"), make_job("Globex"), make_job("Initech")]
        assert len(agent._filter_jobs(jobs)) == 3

    def test_empty_input_returns_empty(self, agent):
        assert agent._filter_jobs([]) == []


# ---------------------------------------------------------------------------
# _group_by_company
# ---------------------------------------------------------------------------

class TestGroupByCompany:

    def test_same_company_groups_together(self, agent):
        jobs = [
            make_job("Acme", project_id="1", title="P1"),
            make_job("Acme", project_id="2", title="P2"),
        ]
        result = agent._group_by_company(jobs)
        assert len(result) == 1
        assert len(result["Acme"]["projects"]) == 2

    def test_different_companies_separate_groups(self, agent):
        jobs = [make_job("Acme", project_id="1"), make_job("Globex", project_id="2")]
        result = agent._group_by_company(jobs)
        assert len(result) == 2
        assert "Acme" in result
        assert "Globex" in result

    def test_company_id_slug_is_lowercased(self, agent):
        jobs = [make_job("Verde Solar Power", project_id="1")]
        result = agent._group_by_company(jobs)
        assert result["Verde Solar Power"]["company_id"] == "verde_solar_power"

    def test_company_id_removes_dots(self, agent):
        jobs = [make_job("JimmysOffice.com", project_id="1")]
        result = agent._group_by_company(jobs)
        assert result["JimmysOffice.com"]["company_id"] == "jimmysofficecom"

    def test_client_profile_populated(self, agent):
        jobs = [make_job("Acme", project_id="1")]
        result = agent._group_by_company(jobs)
        profile = result["Acme"]["client_profile"]
        assert profile["type"] == "startup"
        assert profile["industry"] == "Tech"
        assert profile["budget_tier"] == "medium"

    def test_project_raw_fields_present(self, agent):
        jobs = [make_job("Acme", project_id="1", stack=["react"], requirements=["auth"])]
        result = agent._group_by_company(jobs)
        project = result["Acme"]["projects"][0]
        assert project["_raw_technical_stack"] == ["react"]
        assert project["_raw_key_requirements"] == ["auth"]


# ---------------------------------------------------------------------------
# _enrich_project
# ---------------------------------------------------------------------------

VALID_ENRICHMENT = {
    "category": "web_development",
    "technical_requirements": {
        "tools": [],
        "platforms": [],
        "languages_frameworks": ["react", "nodejs"],
        "infrastructure": [],
        "other": []
    },
    "requirements": {
        "functional": ["user login", "dashboard view"],
        "non_functional": ["mobile responsive", "fast load time"]
    }
}


def make_raw_project(project_id="FW-001", category="web_development", stack=None, requirements=None):
    return {
        "project_id": project_id,
        "title": "Test Project",
        "source_platform": "upwork",
        "source_url": None,
        "timestamp": None,
        "metadata": {"category": category, "complexity": "moderate", "urgency": "medium",
                     "duration_estimate": "weeks", "budget": "$500"},
        "_raw_technical_stack": stack or ["react", "nodejs"],
        "_raw_key_requirements": requirements or ["build login", "dashboard"],
        "_raw_description": "Build a web app with login and dashboard."
    }


class TestEnrichProject:

    def test_happy_path_populates_fields(self, agent):
        agent.client.chat_completion.return_value = json.dumps(VALID_ENRICHMENT)
        project = make_raw_project()
        result = agent._enrich_project(project)
        assert result["category"] == "web_development"
        assert result["technical_requirements"]["languages_frameworks"] == ["react", "nodejs"]
        assert "user login" in result["requirements"]["functional"]

    def test_strips_json_code_fences(self, agent):
        fenced = f"```json\n{json.dumps(VALID_ENRICHMENT)}\n```"
        agent.client.chat_completion.return_value = fenced
        result = agent._enrich_project(make_raw_project())
        assert result["category"] == "web_development"

    def test_strips_plain_code_fences(self, agent):
        fenced = f"```\n{json.dumps(VALID_ENRICHMENT)}\n```"
        agent.client.chat_completion.return_value = fenced
        result = agent._enrich_project(make_raw_project())
        assert "technical_requirements" in result

    def test_network_failure_degrades_gracefully(self, agent):
        agent.client.chat_completion.side_effect = Exception("connection timeout")
        project = make_raw_project(stack=["react"], requirements=["auth"])
        result = agent._enrich_project(project)
        assert result["technical_requirements"] == {"unclassified": ["react"]}
        assert result["requirements"] == {"unclassified": ["auth"]}

    def test_invalid_json_response_degrades_gracefully(self, agent):
        agent.client.chat_completion.return_value = "this is not json at all"
        project = make_raw_project(stack=["react"])
        result = agent._enrich_project(project)
        assert result["technical_requirements"] == {"unclassified": ["react"]}

    def test_raw_fields_removed_after_enrichment(self, agent):
        agent.client.chat_completion.return_value = json.dumps(VALID_ENRICHMENT)
        project = make_raw_project()
        result = agent._enrich_project(project)
        assert "_raw_technical_stack" not in result
        assert "_raw_key_requirements" not in result
        assert "_raw_description" not in result

    def test_empty_stack_and_requirements(self, agent):
        agent.client.chat_completion.return_value = json.dumps({
            "category": "design",
            "technical_requirements": {"frontend": [], "backend": [], "database": [], "devops": [], "other": []},
            "requirements": {"functional": [], "non_functional": []}
        })
        project = make_raw_project(stack=[], requirements=[])
        result = agent._enrich_project(project)
        assert result["technical_requirements"]["frontend"] == []
        assert result["requirements"]["functional"] == []

    def test_missing_keys_in_response_use_defaults(self, agent):
        agent.client.chat_completion.return_value = json.dumps({"category": "design"})
        project = make_raw_project()
        result = agent._enrich_project(project)
        assert result["technical_requirements"] == {}
        assert result["requirements"] == {}


# ---------------------------------------------------------------------------
# process (full pipeline)
# ---------------------------------------------------------------------------

class TestProcess:

    def test_full_pipeline_filters_and_groups(self, agent):
        agent.client.chat_completion.return_value = json.dumps(VALID_ENRICHMENT)
        jobs = [
            make_job("Acme", project_id="1"),
            make_job(None, project_id="2"),
            make_job("Globex", project_id="3"),
        ]
        result = agent.process(jobs)
        assert result["total_companies"] == 2
        assert result["total_projects"] == 2
        assert "classified_at" in result

    def test_all_null_names_returns_empty(self, agent):
        jobs = [make_job(None), make_job(None)]
        result = agent.process(jobs)
        assert result["total_companies"] == 0
        assert result["total_projects"] == 0
        assert result["companies"] == []
