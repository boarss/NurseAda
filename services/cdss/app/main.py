"""
NurseAda CDSS: symptom triage, drug interactions, treatment pathways.
Implements clear recommendations and diagnoses so users are confident the system is aware of its outputs.
"""
from fastapi import FastAPI
from pydantic import BaseModel

from app.triage_logic import run_triage, TriageResult
from app.drug_logic import run_drug_interactions, DrugCheckResult
from app.code_check import check_codes, CodeCheckResult

app = FastAPI(
    title="NurseAda CDSS",
    description="Clinical decision support: triage, drug interactions, code check before recommendations",
    version="0.2.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "cdss"}


class TriageRequest(BaseModel):
    query: str = ""
    context: dict = {}


@app.post("/triage")
def triage(req: TriageRequest):
    """Symptom triage with severity, suggestions, and inferred codes for transparency."""
    result = run_triage(req.query, req.context)
    return {
        "severity": result.severity,
        "suggestions": result.suggestions,
        "inferred_codes": result.inferred_codes,
        "confidence": result.confidence,
        "reasoning": result.reasoning,
    }


class DrugInteractionsRequest(BaseModel):
    query: str = ""
    patient_id: str | None = None


@app.post("/drug-interactions")
def drug_interactions(req: DrugInteractionsRequest):
    """Drug interaction check with codes_checked for transparency."""
    result = run_drug_interactions(req.query, req.patient_id)
    return {
        "interactions": result.interactions,
        "warnings": result.warnings,
        "codes_checked": result.codes_checked,
    }


class CodeCheckRequest(BaseModel):
    agent_id: str  # triage | medication
    query: str = ""
    context: dict = {}


@app.post("/code-check")
def code_check(req: CodeCheckRequest):
    """Check that input can be resolved to clinical codes before an agent is called. Call this before triage or medication agents."""
    result = check_codes(req.agent_id, req.query, req.context)
    return {
        "ok": result.ok,
        "reason": result.reason,
        "resolved_codes": result.resolved_codes,
        "agent_id": result.agent_id,
    }
