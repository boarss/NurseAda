"""
NurseAda Knowledge: medical KB, vector search, retrieval for RAG.
Includes DKA/ketone/diabetes clinical content from masterclass guidance.
"""
from __future__ import annotations

from fastapi import FastAPI, Query
from pydantic import BaseModel

from app.clinical_content import retrieve_clinical_chunks
from app.clinic_content import get_clinic_directory, search_clinics
from app.herbal_content import retrieve_herbal_for_symptoms, get_herbal_catalog

app = FastAPI(
    title="NurseAda Knowledge",
    description="Medical knowledge base and vector retrieval",
    version="0.3.0",
)


class RetrieveRequest(BaseModel):
    query: str = ""
    top_k: int = 5


class HerbalRetrieveRequest(BaseModel):
    query: str = ""
    top_k: int = 5
    context: dict | None = None


@app.get("/health")
def health():
    return {"status": "ok", "service": "knowledge"}


@app.post("/retrieve")
def retrieve(req: RetrieveRequest):
    clinical = retrieve_clinical_chunks(req.query, top_k=req.top_k)
    herbal = retrieve_herbal_for_symptoms(req.query, top_k=2)
    chunks = [
        {"text": c["text"], "source": c.get("source", "clinical")}
        for c in (clinical + herbal)
    ]
    return {
        "chunks": chunks,
        "sources": list({c.get("source", "clinical") for c in chunks}),
    }


@app.post("/retrieve/herbal")
def retrieve_herbal(req: HerbalRetrieveRequest):
    """Herbal/natural remedy retrieval with context-aware safety filtering."""
    chunks = retrieve_herbal_for_symptoms(req.query, top_k=req.top_k, context=req.context)
    return {
        "chunks": chunks,
        "sources": list({c.get("source", "herbal") for c in chunks}),
    }


@app.get("/herbal/catalog")
def herbal_catalog(condition: str = Query("", description="Filter by condition keyword")):
    """Browse all herbal remedies, optionally filtered by condition."""
    items = get_herbal_catalog(condition)
    return {"items": items, "total": len(items)}


@app.get("/clinics")
def clinics(
    state: str = Query("", description="Filter by Nigerian state"),
    specialty: str = Query("", description="Filter by medical specialty"),
    type: str = Query("", description="Filter by facility type"),
    q: str = Query("", description="Free-text search"),
):
    """Browse healthcare facilities in Nigeria."""
    if q:
        items = search_clinics(q)
    else:
        items = get_clinic_directory(state=state, specialty=specialty, facility_type=type)
    return {"clinics": items, "total": len(items)}
