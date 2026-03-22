"""Unit tests for appointments router and clinic directory proxy."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers import appointments
from app.services.auth import AuthUser, require_auth


class DummySupabase:
    def __init__(self) -> None:
        self.rows: list[dict] = []

    def is_configured(self) -> bool:
        return True

    async def select(self, table: str, *, filters: dict | None = None, order: str = "created_at.desc"):
        return [r for r in self.rows if not filters or all(str(r.get(k.split(".")[0])) in v for k, v in filters.items())]

    async def insert(self, table: str, row: dict):
        row = {**row, "id": str(len(self.rows) + 1), "status": "requested"}
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
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    dummy = DummySupabase()
    monkeypatch.setattr(appointments, "supa", dummy)
    _override_auth_success()
    return TestClient(app)


def test_list_appointments_empty(client: TestClient):
    resp = client.get("/appointments")
    assert resp.status_code == 200
    assert resp.json() == {"appointments": []}


def test_create_update_and_delete_appointment(client: TestClient):
    payload = {"clinic_name": "Test Clinic", "specialty": "General Practice"}
    resp = client.post("/appointments", json=payload)
    assert resp.status_code == 201
    created = resp.json()
    assert created["clinic_name"] == "Test Clinic"
    assert created["status"] == "requested"
    appointment_id = created["id"]

    update_payload = {"status": "cancelled", "notes": "Feeling better"}
    resp_upd = client.put(f"/appointments/{appointment_id}", json=update_payload)
    assert resp_upd.status_code == 200
    updated = resp_upd.json()
    assert updated["status"] == "cancelled"
    assert updated["notes"] == "Feeling better"

    resp_del = client.delete(f"/appointments/{appointment_id}")
    assert resp_del.status_code == 204


def test_create_appointment_requires_clinic_name(client: TestClient):
    payload = {"clinic_name": "   "}
    resp = client.post("/appointments", json=payload)
    assert resp.status_code == 422
    assert "Clinic name is required" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_list_clinics_unconfigured_and_error(monkeypatch: pytest.MonkeyPatch):
    # Unconfigured knowledge URL -> 503
    monkeypatch.setattr(appointments, "GATEWAY_KNOWLEDGE_URL", "")
    with pytest.raises(Exception):
        await appointments.list_clinics()

