from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field


class TriageRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20_000)
    traceId: str | None = Field(default=None, max_length=128)


class TriageResponse(BaseModel):
    emergency: bool
    severity: str
    reasons: list[str]


app = FastAPI(title="NurseAda CDSS", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/triage", response_model=TriageResponse)
def triage(req: TriageRequest) -> TriageResponse:
    text = req.text.lower()

    emergency_keywords = [
        "chest pain",
        "difficulty breathing",
        "shortness of breath",
        "severe bleeding",
        "unconscious",
        "very confused",
        "stroke",
        "face drooping",
        "cannot speak",
        "pregnant and bleeding",
        "suicidal",
    ]

    emergency_hits = [k for k in emergency_keywords if k in text]
    emergency = len(emergency_hits) > 0

    severity = "mild"
    reasons: list[str] = []

    if emergency:
        severity = "emergency"
        reasons.append("Text contains red-flag symptoms that may represent an emergency.")
    elif "severe" in text or "very bad" in text or "worst" in text:
        severity = "moderate"
        reasons.append("Described as severe or very bad.")

    if "chest pain" in text and "exertion" in text:
        severity = "emergency"
        emergency = True
        reasons.append("Chest pain with exertion may be cardiac.")

    if not reasons:
        reasons.append("No explicit red-flag symptoms detected by simple rule set.")

    return TriageResponse(emergency=emergency, severity=severity, reasons=reasons)


