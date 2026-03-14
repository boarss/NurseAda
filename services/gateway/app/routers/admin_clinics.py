"""
Admin management for the NurseAda primary care clinic network.

Protected routes for creating, updating, and deactivating clinics in Supabase.
Only users whose email is listed in GATEWAY_ADMIN_EMAILS can access these APIs.
"""
from __future__ import annotations

import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.auth import AuthUser, require_auth
from app.services import supabase_client as supa


router = APIRouter()

TABLE = "clinics"

_ADMIN_EMAILS = [
    e.strip().lower()
    for e in (os.getenv("GATEWAY_ADMIN_EMAILS") or "").split(",")
    if e.strip()
]


def _require_supa():
    if not supa.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Clinics admin is not configured (Supabase not set).",
        )


async def require_admin(current_user: Annotated[AuthUser, Depends(require_auth)]) -> AuthUser:
    """Require an authenticated user whose email is in GATEWAY_ADMIN_EMAILS."""
    if not _ADMIN_EMAILS:
        raise HTTPException(
            status_code=503,
            detail="Admin features are not configured (GATEWAY_ADMIN_EMAILS not set).",
        )
    email = (current_user.email or "").lower()
    if not email or email not in _ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="You are not allowed to manage clinics.")
    return current_user


class ClinicBase(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    phone: str | None = None
    specialties: list[str] = []
    facility_type: str
    accepts_telemedicine: bool = False
    hours: str | None = None
    is_active: bool = True


class ClinicUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    phone: str | None = None
    specialties: list[str] | None = None
    facility_type: str | None = None
    accepts_telemedicine: bool | None = None
    hours: str | None = None
    is_active: bool | None = None


@router.get("")
async def list_clinics_admin(_: Annotated[AuthUser, Depends(require_admin)]):
    """List all clinics for admins (including inactive)."""
    _require_supa()
    rows = await supa.select(TABLE, order="state,city,name")
    return {"clinics": rows}


@router.post("", status_code=201)
async def create_clinic(
    body: ClinicBase,
    _: Annotated[AuthUser, Depends(require_admin)],
):
    """Create a new clinic in the primary care network."""
    _require_supa()
    row = body.model_dump()
    created = await supa.insert(TABLE, row)
    return created


@router.patch("/{clinic_id}")
async def update_clinic(
    clinic_id: str,
    body: ClinicUpdate,
    _: Annotated[AuthUser, Depends(require_admin)],
):
    """Update an existing clinic (including is_active flag)."""
    _require_supa()
    fields = {k: v for k, v in body.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=422, detail="No fields to update.")
    updated = await supa.update(TABLE, clinic_id, fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Clinic not found.")
    return updated


@router.delete("/{clinic_id}", status_code=204)
async def deactivate_clinic(
    clinic_id: str,
    _: Annotated[AuthUser, Depends(require_admin)],
):
    """
    Deactivate a clinic.

    We mark is_active = false instead of hard-deleting so that existing
    appointments keep their clinic_id reference.
    """
    _require_supa()
    updated = await supa.update(TABLE, clinic_id, {"is_active": False})
    if not updated:
        raise HTTPException(status_code=404, detail="Clinic not found.")
    return None

