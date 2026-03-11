"""Integration-style tests for medication reminders and interaction checker."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import medications as meds_router
from app.services.auth import AuthUser, require_auth


class DummySupabase:
    def __init__(self) -> None:
        self.rows: list[dict] = []

    def is_configured(self) -> bool:
        return True

    async def select(self, table: str, *, filters: dict | None = None, order: str = "created_at.desc"):
        if not filters:
            return list(self.rows)
        result: list[dict] = []
        for row in self.rows:
            match = True
            for key, val in filters.items():
                # filters come in as "column": "eq.value"
                column = key.split(".")[0]
                if not str(row.get(column, "")).startswith(val.split(".", 1)[-1].replace("eq", "").strip(".")):
                    match = False
                    break
            if match:
                result.append(row)
        return result

    async def insert(self, table: str, row: dict):
        row = {**row, "id": str(len(self.rows) + 1)}
        self.rows.append(row)
        return row


def _override_auth_success():
    async def _require_auth_override():
        return AuthUser(user_id="user-int", email="test@example.com")

    app.dependency_overrides[require_auth] = _require_auth_override


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    dummy = DummySupabase()
    monkeypatch.setattr(meds_router, "supa", dummy)
    _override_auth_success()
    return TestClient(app)


def test_integration_create_and_list_reminders(client: TestClient):
    # Create a reminder via the public API
    payload = {"medication_name": "Metformin", "dosage": "500 mg"}
    resp = client.post("/medications/reminders", json=payload)
    assert resp.status_code == 201

    # List reminders and confirm shape
    list_resp = client.get("/medications/reminders")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["reminders"]
    assert data["reminders"][0]["medication_name"] == "Metformin"


@pytest.mark.asyncio
async def test_integration_interaction_checker_cdss_unconfigured(monkeypatch: pytest.MonkeyPatch):
    # When CDSS URL is not configured, checker should return a friendly message
    monkeypatch.setattr(meds_router, "GATEWAY_CDSS_URL", "")
    body = meds_router.InteractionCheckRequest(drugs=["aspirin", "ibuprofen"])
    result = await meds_router.check_interactions(body)
    assert result["interactions"] == []
    assert "not configured" in result["message"]

