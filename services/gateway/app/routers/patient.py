"""
Patient data: proxy to FHIR adapter for patient demography, observations,
medications, and diagnostic reports.
All routes require authentication -- patient records must not be exposed
without sign-in.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
import httpx

from app.config import GATEWAY_FHIR_URL
from app.services.auth import AuthUser, require_auth

router = APIRouter()


def _require_fhir() -> str:
    if not GATEWAY_FHIR_URL:
        raise HTTPException(
            status_code=503,
            detail="Patient data is not configured (GATEWAY_FHIR_URL not set)",
        )
    return GATEWAY_FHIR_URL.rstrip("/")


async def _fhir_get(url: str, params: dict | None = None) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, params=params, timeout=10.0)
            if r.status_code == 404:
                raise HTTPException(status_code=404, detail="Resource not found")
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="FHIR request failed")
            return r.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach FHIR: {str(e)}")


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: AuthUser = Depends(require_auth),
):
    """Patient demographics from FHIR."""
    base = _require_fhir()
    return await _fhir_get(f"{base}/Patient/{patient_id}")


@router.get("/{patient_id}/observations")
async def get_observations(
    patient_id: str,
    current_user: AuthUser = Depends(require_auth),
):
    """Observations (vitals, lab values) for a patient."""
    base = _require_fhir()
    return await _fhir_get(f"{base}/Observation", params={"patient": patient_id})


@router.get("/{patient_id}/medications")
async def get_medications(
    patient_id: str,
    current_user: AuthUser = Depends(require_auth),
):
    """Active medication requests for a patient."""
    base = _require_fhir()
    return await _fhir_get(f"{base}/MedicationRequest", params={"patient": patient_id})


@router.get("/{patient_id}/reports")
async def get_reports(
    patient_id: str,
    current_user: AuthUser = Depends(require_auth),
):
    """Diagnostic reports (lab, imaging) for a patient."""
    base = _require_fhir()
    return await _fhir_get(f"{base}/DiagnosticReport", params={"patient": patient_id})
