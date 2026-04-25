import json
import os
import pytest
from unittest.mock import patch, mock_open, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

MOCK_JOBS_CACHE = {
    "timestamp": "2025-01-01T00:00:00Z",
    "results": [
        {
            "project_id": "FW-001",
            "timestamp": "2025-01-01T00:00:00Z",
            "source_platform": "upwork",
            "source_url": "https://upwork.com/test",
            "client": {"name": "Acme", "type": "startup", "industry": "Tech",
                       "location": None, "budget_tier": "medium"},
            "project": {"title": "Test App", "description": "Build a test app.",
                        "category": "web_development", "complexity": "moderate",
                        "urgency": "medium", "duration_estimate": "weeks",
                        "budget": "$500", "technical_stack": ["react"],
                        "key_requirements": ["build login"]}
        }
    ]
}

MOCK_CLASSIFIED = {
    "classified_at": "2025-01-01T01:00:00Z",
    "total_companies": 1,
    "total_projects": 1,
    "companies": []
}


class TestHealthEndpoint:

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestClassifyEndpoint:

    def test_404_when_jobs_cache_missing(self):
        with patch("src.api.routes.os.path.exists", return_value=False):
            response = client.get("/classify")
        assert response.status_code == 404
        assert "jobs.json" in response.json()["detail"]

    def test_returns_cached_output_when_fresh(self):
        def exists_side_effect(path):
            return True

        def getmtime_side_effect(path):
            if "classified" in path:
                return 2000.0
            return 1000.0

        with patch("src.api.routes.os.path.exists", side_effect=exists_side_effect), \
             patch("src.api.routes.os.path.getmtime", side_effect=getmtime_side_effect), \
             patch("builtins.open", mock_open(read_data=json.dumps(MOCK_CLASSIFIED))):
            response = client.get("/classify")

        assert response.status_code == 200
        assert response.json()["total_companies"] == 1

    def test_reruns_agent_when_jobs_newer(self):
        def exists_side_effect(path):
            return True

        def getmtime_side_effect(path):
            if "classified" in path:
                return 1000.0
            return 2000.0

        mock_agent = MagicMock()
        mock_agent.process.return_value = MOCK_CLASSIFIED

        with patch("src.api.routes.os.path.exists", side_effect=exists_side_effect), \
             patch("src.api.routes.os.path.getmtime", side_effect=getmtime_side_effect), \
             patch("src.api.routes.InboxAgent", return_value=mock_agent), \
             patch("builtins.open", mock_open(read_data=json.dumps(MOCK_JOBS_CACHE))):
            response = client.get("/classify")

        assert mock_agent.process.called

    def test_500_on_unexpected_error(self):
        with patch("src.api.routes.os.path.exists", return_value=True), \
             patch("src.api.routes.os.path.getmtime", side_effect=Exception("disk error")):
            response = client.get("/classify")
        assert response.status_code == 500
