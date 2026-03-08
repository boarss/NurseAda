"""
Drug interaction logic: check medication pairs and return warnings with codes.
Uses a small interaction table; can be extended with full formulary (e.g. Nigeria/Africa).
"""
from dataclasses import dataclass
import re

@dataclass
class DrugCheckResult:
    interactions: list[dict]  # [{ "drug_a", "drug_b", "severity", "message", "codes_checked" }]
    warnings: list[str]
    codes_checked: list[dict]  # drugs resolved to codes for transparency


# Known interaction pairs: (normalized name A, normalized name B) → (severity, message)
# Normalized = lowercase, no extra spaces
INTERACTION_TABLE = {
    ("aspirin", "ibuprofen"): ("medium", "Increased bleeding risk when combined. Use under provider guidance."),
    ("aspirin", "warfarin"): ("high", "Major bleeding risk. Do not combine unless prescribed together; monitor closely."),
    ("ibuprofen", "warfarin"): ("high", "Increased bleeding risk. Avoid or use only under provider supervision."),
    ("paracetamol", "acetaminophen"): ("low", "Same drug; avoid double-dosing. Check total daily dose."),
    ("metformin", "contrast dye"): ("high", "Risk of lactic acidosis with contrast. Discuss with provider before imaging."),
    ("ace inhibitor", "potassium"): ("medium", "Risk of high potassium. Monitor levels if taking both."),
}

# Normalize for lookup: strip, lower, collapse spaces
def _norm(s: str) -> str:
    return " ".join((s or "").lower().split())


def _extract_drug_mentions(query: str) -> list[str]:
    """Extract likely drug names from free text (simple tokenization + known list)."""
    known = {"aspirin", "ibuprofen", "warfarin", "paracetamol", "acetaminophen", "metformin", "potassium", "ace inhibitor"}
    tokens = re.findall(r"[a-z]+", query.lower())
    found = []
    for t in tokens:
        if t in known:
            found.append(t)
    # Also check for two-word "ace inhibitor"
    if "ace" in tokens and "inhibitor" in tokens:
        found.append("ace inhibitor")
    return list(dict.fromkeys(found))


def run_drug_interactions(query: str, patient_id: str | None = None) -> DrugCheckResult:
    """Check for drug interactions and return warnings with codes_checked for transparency."""
    query = (query or "").strip()
    drugs = _extract_drug_mentions(query)
    interactions: list[dict] = []
    warnings: list[str] = []
    codes_checked: list[dict] = []

    for i, a in enumerate(drugs):
        codes_checked.append({"type": "medication", "name": a, "system": "RxNorm", "code": f"DRUG-{a[:8]}"})
        for b in drugs[i + 1:]:
            key1 = (_norm(a), _norm(b))
            key2 = (_norm(b), _norm(a))
            for key in (key1, key2):
                if key in INTERACTION_TABLE:
                    sev, msg = INTERACTION_TABLE[key]
                    interactions.append({
                        "drug_a": key[0],
                        "drug_b": key[1],
                        "severity": sev,
                        "message": msg,
                        "codes_checked": True,
                    })
                    warnings.append(f"{key[0]} + {key[1]}: {msg}")
                    break

    if not codes_checked and query:
        codes_checked.append({"type": "medication", "name": "query", "system": "free_text", "code": None, "note": "No standard drug names detected; consider rephrasing with medication names."})

    return DrugCheckResult(
        interactions=interactions,
        warnings=warnings,
        codes_checked=codes_checked,
    )
