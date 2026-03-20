from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "services" / "knowledge"))

from app import clinical_content, herbal_content


def test_retrieve_clinical_chunks_from_supabase(monkeypatch):
    monkeypatch.setattr(clinical_content, "CLINICAL_SOURCE", "supabase")
    monkeypatch.setattr(clinical_content, "supabase_configured", lambda: True)
    monkeypatch.setattr(
        clinical_content,
        "fetch_rows",
        lambda table, params: [
            {
                "text": "DKA warning signs include ketones and dehydration.",
                "source": "Supabase Clinical",
                "keywords": ["dka", "ketones", "dehydration"],
            }
        ]
        if table == "medical_knowledge_chunks"
        else [],
    )

    rows = clinical_content.retrieve_clinical_chunks("I have ketones and dehydration", top_k=3)
    assert rows
    assert rows[0]["source"] == "Supabase Clinical"


def test_retrieve_clinical_chunks_falls_back_to_memory(monkeypatch):
    monkeypatch.setattr(clinical_content, "CLINICAL_SOURCE", "supabase")
    monkeypatch.setattr(clinical_content, "supabase_configured", lambda: False)

    rows = clinical_content.retrieve_clinical_chunks("ketones", top_k=2)
    assert rows
    assert any("Ketone" in row["source"] or "DKA" in row["source"] for row in rows)


def test_retrieve_herbal_and_interactions_from_supabase(monkeypatch):
    monkeypatch.setattr(herbal_content, "HERBAL_SOURCE", "supabase")
    monkeypatch.setattr(herbal_content, "supabase_configured", lambda: True)

    def _mock_fetch(table: str, params: dict[str, str]):
        if table == "herbal_remedies":
            return [
                {
                    "text": "**Ginger** (Zingiber officinale): Helpful for nausea.",
                    "source": "Supabase Herbal",
                    "keywords": ["ginger", "nausea"],
                    "condition": "nausea",
                    "evidence_level": "moderate",
                    "contraindications": ["gallstones"],
                    "drug_interactions": ["warfarin"],
                    "blocked_populations": [],
                }
            ]
        if table == "herbal_drug_interaction_rules":
            return [
                {
                    "herb_keywords": ["ginger"],
                    "drug_keywords": ["warfarin"],
                    "severity": "critical",
                    "message_template": "Avoid combining {herb} with {drug}.",
                }
            ]
        return []

    monkeypatch.setattr(herbal_content, "fetch_rows", _mock_fetch)

    chunks = herbal_content.retrieve_herbal_for_symptoms(
        "I feel nausea",
        top_k=2,
        context={"medications": ["warfarin"]},
    )
    assert chunks
    assert chunks[0]["source"] == "Supabase Herbal"
    assert chunks[0]["drug_interactions"]
    assert chunks[0]["drug_interactions"][0]["severity"] == "critical"
