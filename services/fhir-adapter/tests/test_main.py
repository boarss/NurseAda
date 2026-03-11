"""Unit tests for FHIR adapter proxy endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app import config as fhir_config


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # Default to unconfigured FHIR_BASE_URL for tests that expect 503
    monkeypatch.setattr(fhir_config, "FHIR_BASE_URL", "")
    return TestClient(app)


def test_health_endpoint_ok(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "fhir-adapter"


def test_patient_requires_configured_base_url(client: TestClient):
    resp = client.get("/Patient/123")
    assert resp.status_code == 503
    assert "FHIR is not configured" in resp.json()["detail"]

