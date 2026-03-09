"""
NurseAda Knowledge: medical KB, vector search, retrieval for RAG.
Includes DKA/ketone/diabetes clinical content from masterclass guidance.
"""
from fastapi import FastAPI
from pydantic import BaseModel

from app.clinical_content import retrieve_clinical_chunks
from app.herbal_content import retrieve_herbal_for_symptoms

app = FastAPI(
    title="NurseAda Knowledge",
    description="Medical knowledge base and vector retrieval",
    version="0.2.0",
)


class RetrieveRequest(BaseModel):
    query: str = ""
    top_k: int = 5


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
def retrieve_herbal(req: RetrieveRequest):
    """Herbal/natural remedy retrieval for symptoms. Used by herbal agent and triage enrichment."""
    chunks = retrieve_herbal_for_symptoms(req.query, top_k=req.top_k)
    return {
        "chunks": [{"text": c["text"], "source": c.get("source", "herbal"), "condition": c.get("condition", "")} for c in chunks],
        "sources": list({c.get("source", "herbal") for c in chunks}),
    }
