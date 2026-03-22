"""Unit tests for medication reminders router and interaction checker."""

import types
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.routers import medications
from app.services.auth import AuthUser, require_auth


class DummySupabase:
    def __init__(self) -> None:
        self.rows: list[dict] = []

    def is_configured(self) -> bool:
        return True

    async def select(self, table: str, *, filters: dict | None = None, order: str = "created_at.desc"):
        return [r for r in self.rows if not filters or all(str(r.get(k.split(".")[0])) in v for k, v in filters.items())]

    async def insert(self, table: str, row: dict):
        row = {**row, "id": str(len(self.rows) + 1)}
        self.rows.append(row)
        return row

    async def update(
        self,
        table: str,
        row_id: str,
        fields: dict,
        *,
        filters: dict[str, str] | None = None,
    ):
        for r in self.rows:
            if str(r.get("id")) != row_id:
                continue
            if filters and not all(
                str(r.get(k.split(".")[0])) in v for k, v in filters.items()
            ):
                continue
            r.update(fields)
            return r
        return {}

    async def delete(self, table: str, row_id: str, *, user_id: str):
        self.rows = [r for r in self.rows if not (str(r.get("id")) == row_id and r.get("user_id") == user_id)]
        return True


def _override_auth_success():
    async def _require_auth_override():
        return AuthUser(user_id="user-1", email="test@example.com")

    app.dependency_overrides[require_auth] = _require_auth_override


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    # Ensure overrides don't leak between tests
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    # Use in-memory Supabase stub
    dummy = DummySupabase()
    monkeypatch.setattr(medications, "supa", dummy)
    _override_auth_success()
    return TestClient(app)


def test_list_reminders_empty(client: TestClient):
    resp = client.get("/medications/reminders")
    assert resp.status_code == 200
    assert resp.json() == {"reminders": []}


def test_create_and_update_and_delete_reminder(client: TestClient):
    # Create
    payload = {"medication_name": "Metformin", "dosage": "500 mg", "frequency": "twice daily"}
    resp = client.post("/medications/reminders", json=payload)
    assert resp.status_code == 201
    created = resp.json()
    assert created["medication_name"] == "Metformin"
    reminder_id = created["id"]

    # Update
    update_payload = {"notes": "Take with food", "is_active": False}
    resp_upd = client.put(f"/medications/reminders/{reminder_id}", json=update_payload)
    assert resp_upd.status_code == 200
    updated = resp_upd.json()
    assert updated["notes"] == "Take with food"
    assert updated["is_active"] is False

    # Delete
    resp_del = client.delete(f"/medications/reminders/{reminder_id}")
    assert resp_del.status_code == 204


def test_create_reminder_requires_name(client: TestClient):
    payload = {"medication_name": "   "}
    resp = client.post("/medications/reminders", json=payload)
    assert resp.status_code == 422
    assert "Medication name is required" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_check_interactions_input_validation_and_unconfigured(monkeypatch: pytest.MonkeyPatch):
    # Fewer than two drugs -> guidance message
    body = medications.InteractionCheckRequest(drugs=["aspirin", " "])
    result = await medications.check_interactions(body)
    assert result["interactions"] == []
    assert "Enter at least two medications" in result["message"]

    # Unconfigured CDSS URL -> friendly message
    monkeypatch.setattr(medications, "GATEWAY_CDSS_URL", "")
    body2 = medications.InteractionCheckRequest(drugs=["aspirin", "ibuprofen"])
    result2 = await medications.check_interactions(body2)
    assert result2["interactions"] == []
    assert "not configured" in result2["message"]

