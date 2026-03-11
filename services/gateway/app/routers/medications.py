"""
Medication management: reminder CRUD and drug interaction checking.
Reminders are persisted in Supabase; interactions proxy to CDSS.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import httpx

from app.config import GATEWAY_CDSS_URL
from app.services.auth import AuthUser, require_auth
from app.services import supabase_client as supa

router = APIRouter()

TABLE = "medication_reminders"


# ── Request / response models ────────────────────────────────────────

class ReminderCreate(BaseModel):
    medication_name: str
    dosage: str = ""
    frequency: str = "daily"
    reminder_times: list[str] = ["08:00"]
    start_date: str | None = None
    end_date: str | None = None
    notes: str = ""


class ReminderUpdate(BaseModel):
    medication_name: str | None = None
    dosage: str | None = None
    frequency: str | None = None
    reminder_times: list[str] | None = None
    start_date: str | None = None
    end_date: str | None = None
    is_active: bool | None = None
    notes: str | None = None


class InteractionCheckRequest(BaseModel):
    drugs: list[str]


# ── Reminder CRUD ─────────────────────────────────────────────────────

def _require_supa():
    if not supa.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Medication reminders are not configured (Supabase not set).",
        )


@router.get("/reminders")
async def list_reminders(current_user: AuthUser = Depends(require_auth)):
    """List all medication reminders for the authenticated user."""
    _require_supa()
    rows = await supa.select(
        TABLE, filters={"user_id": f"eq.{current_user.user_id}"},
    )
    return {"reminders": rows}


@router.post("/reminders", status_code=201)
async def create_reminder(
    body: ReminderCreate,
    current_user: AuthUser = Depends(require_auth),
):
    """Create a new medication reminder."""
    _require_supa()
    if not body.medication_name.strip():
        raise HTTPException(status_code=422, detail="Medication name is required.")

    row = {
        "user_id": current_user.user_id,
        "medication_name": body.medication_name.strip(),
        "dosage": body.dosage.strip(),
        "frequency": body.frequency,
        "reminder_times": body.reminder_times,
        "notes": body.notes.strip(),
    }
    if body.start_date:
        row["start_date"] = body.start_date
    if body.end_date:
        row["end_date"] = body.end_date

    created = await supa.insert(TABLE, row)
    return created


@router.put("/reminders/{reminder_id}")
async def update_reminder(
    reminder_id: str,
    body: ReminderUpdate,
    current_user: AuthUser = Depends(require_auth),
):
    """Update an existing medication reminder (partial update)."""
    _require_supa()
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update.")

    existing = await supa.select(
        TABLE,
        filters={
            "id": f"eq.{reminder_id}",
            "user_id": f"eq.{current_user.user_id}",
        },
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    updated = await supa.update(TABLE, reminder_id, fields)
    return updated


@router.delete("/reminders/{reminder_id}", status_code=204)
async def delete_reminder(
    reminder_id: str,
    current_user: AuthUser = Depends(require_auth),
):
    """Delete a medication reminder."""
    _require_supa()
    existing = await supa.select(
        TABLE,
        filters={
            "id": f"eq.{reminder_id}",
            "user_id": f"eq.{current_user.user_id}",
        },
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Reminder not found.")

    await supa.delete(TABLE, reminder_id, user_id=current_user.user_id)


# ── Drug interaction checker ──────────────────────────────────────────

@router.post("/check-interactions")
async def check_interactions(body: InteractionCheckRequest):
    """Check drug-drug interactions via CDSS. No auth required."""
    drugs = [d.strip() for d in body.drugs if d.strip()]
    if len(drugs) < 2:
        return {
            "interactions": [],
            "warnings": [],
            "message": "Enter at least two medications to check for interactions.",
        }

    query = ", ".join(drugs)

    if not GATEWAY_CDSS_URL:
        return {
            "interactions": [],
            "warnings": [],
            "message": (
                "Drug interaction checking is not configured. "
                "Please ask your pharmacist or doctor about potential interactions."
            ),
        }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{GATEWAY_CDSS_URL.rstrip('/')}/drug-interactions",
                json={"query": query},
                timeout=10.0,
            )
            if r.status_code != 200:
                return {
                    "interactions": [],
                    "warnings": [],
                    "message": "Interaction check unavailable right now. Please try again.",
                }
            data = r.json()
            return {
                "interactions": data.get("interactions", []),
                "warnings": data.get("warnings", []),
                "codes_checked": data.get("codes_checked", []),
            }
    except Exception:
        return {
            "interactions": [],
            "warnings": [],
            "message": "Could not reach the interaction service. Please try again later.",
        }
