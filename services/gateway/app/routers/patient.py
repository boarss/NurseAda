"""
Patient data: proxy to FHIR adapter for patient demography and context.
"""
from fastapi import APIRouter, HTTPException
import httpx

from app.config import GATEWAY_FHIR_URL

router = APIRouter()


@router.get("/{patient_id}")
async def get_patient(patient_id: str):
    """Get patient demography from FHIR. Used for chat context and profile display."""
    if not GATEWAY_FHIR_URL:
        raise HTTPException(
            status_code=503,
            detail="Patient data is not configured (GATEWAY_FHIR_URL not set)",
        )
    base = GATEWAY_FHIR_URL.rstrip("/")
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{base}/Patient/{patient_id}", timeout=10.0)
            if r.status_code == 404:
                raise HTTPException(status_code=404, detail="Patient not found")
            if r.status_code != 200:
                raise HTTPException(status_code=r.status_code, detail="FHIR request failed")
            return r.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach FHIR: {str(e)}")
