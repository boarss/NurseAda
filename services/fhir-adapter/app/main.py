"""
NurseAda FHIR Adapter: proxies FHIR requests to a configured FHIR server.
Resource types per HL7 FHIR spec: https://fhir.hl7.org/fhir/index.html
(Administration: Patient; Diagnostics: Observation, DiagnosticReport; Medications: MedicationRequest; Workflow: Task)
"""
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse, Response
import httpx

from app.config import FHIR_BASE_URL

app = FastAPI(
    title="NurseAda FHIR Adapter",
    description="Proxy to FHIR server (Patient, Observation, MedicationRequest, DiagnosticReport, Task)",
    version="0.1.0",
)


def _fhir_not_configured():
    raise HTTPException(
        status_code=503,
        detail="FHIR is not configured (FHIR_BASE_URL not set)",
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "fhir-adapter"}


@app.get("/Patient/{patient_id}")
async def get_patient(patient_id: str):
    if not FHIR_BASE_URL:
        _fhir_not_configured()
    base = FHIR_BASE_URL.rstrip("/")
    url = f"{base}/Patient/{patient_id}"
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url)
            try:
                return JSONResponse(status_code=r.status_code, content=r.json())
            except Exception:
                return Response(content=r.content, status_code=r.status_code, media_type=r.headers.get("content-type"))
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))


@app.get("/Observation")
async def get_observations(patient: str | None = None, **params):
    if not FHIR_BASE_URL:
        _fhir_not_configured()
    base = FHIR_BASE_URL.rstrip("/")
    url = f"{base}/Observation"
    query = dict(params)
    if patient is not None:
        query["patient"] = patient
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, params=query)
            try:
                return JSONResponse(status_code=r.status_code, content=r.json())
            except Exception:
                return Response(content=r.content, status_code=r.status_code, media_type=r.headers.get("content-type"))
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))


@app.get("/MedicationRequest")
async def get_medication_requests(patient: str | None = None, **params):
    if not FHIR_BASE_URL:
        _fhir_not_configured()
    base = FHIR_BASE_URL.rstrip("/")
    url = f"{base}/MedicationRequest"
    query = dict(params)
    if patient is not None:
        query["patient"] = patient
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, params=query)
            try:
                return JSONResponse(status_code=r.status_code, content=r.json())
            except Exception:
                return Response(content=r.content, status_code=r.status_code, media_type=r.headers.get("content-type"))
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))


@app.get("/DiagnosticReport")
async def get_diagnostic_reports(patient: str | None = None, **params):
    """FHIR Level 4 Diagnostics – lab/imaging reports."""
    if not FHIR_BASE_URL:
        _fhir_not_configured()
    base = FHIR_BASE_URL.rstrip("/")
    url = f"{base}/DiagnosticReport"
    query = dict(params)
    if patient is not None:
        query["patient"] = patient
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, params=query)
            try:
                return JSONResponse(status_code=r.status_code, content=r.json())
            except Exception:
                return Response(content=r.content, status_code=r.status_code, media_type=r.headers.get("content-type"))
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))


@app.post("/Task")
async def create_task(body: dict):
    if not FHIR_BASE_URL:
        _fhir_not_configured()
    base = FHIR_BASE_URL.rstrip("/")
    url = f"{base}/Task"
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(url, json=body)
            try:
                return JSONResponse(status_code=r.status_code, content=r.json())
            except Exception:
                return Response(content=r.content, status_code=r.status_code, media_type=r.headers.get("content-type"))
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))


@app.get("/")
def root():
    return {"service": "fhir-adapter", "docs": "/docs"}
