"""Tests for medical feedback + Cloudflare crawl integration."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import medical_feedback
from app.services.auth import AuthUser, require_auth
from app.services.rlhf import rlhf_store


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def clear_rlhf_feedback():
    rlhf_store.feedback.clear()
    yield
    rlhf_store.feedback.clear()


def _override_auth():
    async def _require_auth_override():
        return AuthUser(user_id="user-test", email="t@example.com")

    app.dependency_overrides[require_auth] = _require_auth_override


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    _override_auth()
    monkeypatch.setattr(medical_feedback, "cloudflare_crawl_configured", lambda: True)
    monkeypatch.setattr(medical_feedback, "CLOUDFLARE_ACCOUNT_ID", "acct")
    monkeypatch.setattr(medical_feedback, "CLOUDFLARE_API_TOKEN", "tok")

    async def fake_start(**kwargs):
        assert kwargs["url"].startswith("https://")
        return "job-1"

    async def fake_wait(**kwargs):
        return {
            "status": "completed",
            "records": [
                {
                    "status": "completed",
                    "url": "https://www.who.int/health-topics",
                    "markdown": "# Topic\nBody text.",
                },
            ],
        }

    monkeypatch.setattr(medical_feedback, "start_crawl_job", fake_start)
    monkeypatch.setattr(medical_feedback, "wait_for_crawl_completion", fake_wait)
    return TestClient(app)


def test_medical_feedback_rejects_non_allowlisted_url(client: TestClient):
    resp = client.post(
        "/feedback/medical-source",
        json={
            "source_url": "https://example.com/page",
            "rating": 1,
            "comment": "test",
        },
    )
    assert resp.status_code == 400
    assert "allowlist" in resp.json()["detail"].lower()


def test_medical_feedback_stores_crawl_excerpts(client: TestClient):
    resp = client.post(
        "/feedback/medical-source",
        json={
            "source_url": "https://www.who.int/health-topics/diabetes",
            "rating": -1,
            "comment": "Needs clearer wording",
            "max_pages": 2,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["crawl_status"] == "completed"
    assert body["pages_captured"] == 1
    assert "disclaimer" in body

    assert len(rlhf_store.feedback) == 1
    fb = rlhf_store.feedback[0]
    assert fb.rating == -1
    assert fb.metadata.get("user_id") == "user-test"
    pages = fb.metadata.get("crawl", {}).get("pages") or []
    assert len(pages) == 1
    assert "Topic" in pages[0]["markdown"]


def test_medical_feedback_requires_auth(monkeypatch: pytest.MonkeyPatch):
    app.dependency_overrides.clear()
    monkeypatch.setattr(medical_feedback, "cloudflare_crawl_configured", lambda: True)
    monkeypatch.setattr(medical_feedback, "CLOUDFLARE_ACCOUNT_ID", "a")
    monkeypatch.setattr(medical_feedback, "CLOUDFLARE_API_TOKEN", "t")
    # No auth override — require_auth will 503 if JWT secret unset, else 401
    c = TestClient(app)
    resp = c.post(
        "/feedback/medical-source",
        json={"source_url": "https://www.who.int/x", "rating": 1},
    )
    assert resp.status_code in (401, 503)
