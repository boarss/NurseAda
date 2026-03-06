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


class InteractionPair(BaseModel):
    drugA: str
    drugB: str
    severity: str  # major | moderate | minor
    message: str


class CheckInteractionsRequest(BaseModel):
    drugNames: list[str] = Field(min_length=1, max_length=20)


class CheckInteractionsResponse(BaseModel):
    hasInteraction: bool
    severity: str  # major | moderate | minor (worst of pairs)
    pairs: list[InteractionPair]


# Known drug-drug interactions (scaffold; expand with formulary data).
INTERACTION_RULES: list[tuple[set[str], str, str]] = [
    ({"warfarin", "aspirin"}, "major", "Increased bleeding risk. Use together only under doctor supervision."),
    ({"warfarin", "ibuprofen"}, "major", "Increased bleeding risk. Avoid or use alternative pain relief."),
    ({"aspirin", "ibuprofen"}, "moderate", "Ibuprofen can reduce aspirin’s heart-protective effect. Take aspirin at least 2 hours before ibuprofen if both prescribed."),
    ({"metformin", "contrast dye"}, "major", "Risk of lactic acidosis. Metformin may need to be stopped before imaging; follow your doctor’s instructions."),
    ({"ace inhibitor", "potassium", "potassium supplement"}, "moderate", "Risk of high potassium. Monitor levels if both are used."),
    ({"amoxicillin", "methotrexate"}, "moderate", "Amoxicillin can increase methotrexate levels. Your doctor may adjust dose or monitor."),
    ({"caffeine", "theophylline"}, "moderate", "Both stimulate the nervous system. Limit caffeine when taking theophylline."),
]


def _normalize_drug(s: str) -> str:
    return s.strip().lower() if s else ""


def _find_interactions(drug_names: list[str]) -> list[InteractionPair]:
    normalized = [_normalize_drug(d) for d in drug_names if _normalize_drug(d)]
    seen: set[tuple[str, str]] = set()
    out: list[InteractionPair] = []
    for (drug_set, severity, message) in INTERACTION_RULES:
        overlap = [d for d in normalized if d in drug_set or any(d in k for k in drug_set)]
        if len(overlap) >= 2:
            a, b = sorted(overlap[:2])
            if (a, b) not in seen:
                seen.add((a, b))
                out.append(
                    InteractionPair(
                        drugA=a,
                        drugB=b,
                        severity=severity,
                        message=message,
                    )
                )
    return out


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


@app.post("/interactions", response_model=CheckInteractionsResponse)
def check_interactions(req: CheckInteractionsRequest) -> CheckInteractionsResponse:
    pairs = _find_interactions(req.drugNames)
    if not pairs:
        return CheckInteractionsResponse(
            hasInteraction=False,
            severity="minor",
            pairs=[],
        )
    severities = [p.severity for p in pairs]
    worst = "major" if "major" in severities else "moderate" if "moderate" in severities else "minor"
    return CheckInteractionsResponse(
        hasInteraction=True,
        severity=worst,
        pairs=pairs,
    )


