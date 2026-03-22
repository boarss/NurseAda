"""
Appointment management: CRUD for user appointments and clinic directory proxy.
Appointments are persisted in Supabase; clinic directory proxies to knowledge service.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import httpx

from app.config import GATEWAY_KNOWLEDGE_URL
from app.services.auth import AuthUser, require_auth
from app.services import supabase_client as supa

router = APIRouter()

TABLE = "appointments"


# ── Request / response models ────────────────────────────────────────

class AppointmentCreate(BaseModel):
    clinic_name: str
    clinic_id: str | None = None
    specialty: str = ""
    appointment_type: str = "in_person"
    reason: str = ""
    preferred_date: str | None = None
    preferred_time: str | None = None
    notes: str = ""


class AppointmentUpdate(BaseModel):
    clinic_name: str | None = None
    clinic_id: str | None = None
    specialty: str | None = None
    appointment_type: str | None = None
    reason: str | None = None
    preferred_date: str | None = None
    preferred_time: str | None = None
    status: str | None = None
    notes: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────

def _require_supa():
    if not supa.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Appointments are not configured (Supabase not set).",
        )


# ── Appointment CRUD ──────────────────────────────────────────────────

@router.get("")
async def list_appointments(current_user: AuthUser = Depends(require_auth)):
    """List all appointments for the authenticated user."""
    _require_supa()
    rows = await supa.select(
        TABLE, filters={"user_id": f"eq.{current_user.user_id}"},
    )
    return {"appointments": rows}


@router.post("", status_code=201)
async def create_appointment(
    body: AppointmentCreate,
    current_user: AuthUser = Depends(require_auth),
):
    """Create a new appointment request."""
    _require_supa()
    if not body.clinic_name.strip():
        raise HTTPException(status_code=422, detail="Clinic name is required.")

    row: dict = {
        "user_id": current_user.user_id,
        "clinic_name": body.clinic_name.strip(),
        "specialty": body.specialty.strip(),
        "appointment_type": body.appointment_type,
        "reason": body.reason.strip(),
        "notes": body.notes.strip(),
    }
    if body.clinic_id:
        row["clinic_id"] = body.clinic_id.strip()
    if body.preferred_date:
        row["preferred_date"] = body.preferred_date
    if body.preferred_time:
        row["preferred_time"] = body.preferred_time.strip()

    created = await supa.insert(TABLE, row)
    return created


@router.put("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    body: AppointmentUpdate,
    current_user: AuthUser = Depends(require_auth),
):
    """Update an existing appointment (partial update, including status changes)."""
    _require_supa()
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update.")

    existing = await supa.select(
        TABLE,
        filters={
            "id": f"eq.{appointment_id}",
            "user_id": f"eq.{current_user.user_id}",
        },
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    updated = await supa.update(
        TABLE,
        appointment_id,
        fields,
        filters={"user_id": f"eq.{current_user.user_id}"},
    )
    return updated


@router.delete("/{appointment_id}", status_code=204)
async def delete_appointment(
    appointment_id: str,
    current_user: AuthUser = Depends(require_auth),
):
    """Cancel/delete an appointment."""
    _require_supa()
    existing = await supa.select(
        TABLE,
        filters={
            "id": f"eq.{appointment_id}",
            "user_id": f"eq.{current_user.user_id}",
        },
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    await supa.delete(TABLE, appointment_id, user_id=current_user.user_id)


# ── Clinic directory proxy ────────────────────────────────────────────

@router.get("/clinics")
async def list_clinics(
    state: str = Query("", description="Filter by state"),
    specialty: str = Query("", description="Filter by specialty"),
    type: str = Query("", description="Filter by facility type"),
    q: str = Query("", description="Free-text search"),
):
    """Browse healthcare facilities (public, no auth). Proxies to knowledge service."""
    if not GATEWAY_KNOWLEDGE_URL:
        raise HTTPException(
            status_code=503,
            detail="Clinic directory is not configured.",
        )

    try:
        params: dict[str, str] = {}
        if state:
            params["state"] = state
        if specialty:
            params["specialty"] = specialty
        if type:
            params["type"] = type
        if q:
            params["q"] = q

        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{GATEWAY_KNOWLEDGE_URL.rstrip('/')}/clinics",
                params=params,
                timeout=8.0,
            )
            if r.status_code != 200:
                raise HTTPException(status_code=502, detail="Clinic directory unavailable.")
            return r.json()
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Clinic directory unavailable.")
