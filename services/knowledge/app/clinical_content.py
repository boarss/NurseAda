"""
Clinical reference content for NurseAda (DKA, ketones, diabetes).
Aligned with DKA playbook, ketone conversation, and pathways-to-prevention guidance.
"""
import os
from dataclasses import dataclass
from app.supabase_rest import fetch_rows, supabase_configured


@dataclass
class ClinicalChunk:
    text: str
    source: str
    keywords: list[str]


# DKA (Diabetic Ketoacidosis) – recognition, emergency, prevention
DKA_CONTENT = [
    ClinicalChunk(
        text="DKA (Diabetic Ketoacidosis) is a life-threatening emergency. Seek emergency care immediately if you have: fruity-smelling breath, rapid deep breathing (Kussmaul breathing), severe abdominal pain with nausea/vomiting, confusion or decreased alertness, extreme weakness, or loss of consciousness. DKA can develop within 24 hours.",
        source="DKA Playbook – Emergency Recognition",
        keywords=["dka", "ketoacidosis", "diabetic ketoacidosis", "fruity breath", "kussmaul", "ketone", "ketones"],
    ),
    ClinicalChunk(
        text="Early DKA signs: high blood sugar (>250 mg/dL or >14 mmol/L), ketones in urine or blood, dehydration (dry mouth, headache, flushed skin), extreme thirst, frequent urination. If you have diabetes and these symptoms, check ketones and contact your care team or seek care.",
        source="DKA Playbook – Early Recognition",
        keywords=["dka", "ketone", "high blood sugar", "diabetes", "dehydration", "thirst"],
    ),
    ClinicalChunk(
        text="Ketone monitoring: Check blood ketones (beta-hydroxybutyrate) or urine ketones when blood sugar is high, you are ill, or you have nausea/vomiting. Moderate or large ketones with high blood sugar require urgent action. Small ketones may be managed at home with fluids and insulin per your sick-day plan.",
        source="Beyond the Strip – Ketone Monitoring",
        keywords=["ketone", "ketones", "blood ketone", "urine ketone", "beta-hydroxybutyrate", "strip"],
    ),
    ClinicalChunk(
        text="DKA prevention: Take insulin as prescribed. Have a sick-day plan: check blood sugar and ketones more often when ill. Stay hydrated. Know when to call your provider or go to emergency. Common triggers: missed insulin, infection, illness, certain medications (e.g. SGLT-2 inhibitors, steroids).",
        source="DKA Pathways to Prevention",
        keywords=["dka", "prevention", "sick day", "insulin", "ketone", "diabetes"],
    ),
    ClinicalChunk(
        text="Ketone conversation with patients: Explain what ketones are (byproducts when the body breaks down fat for energy when insulin is low). Teach when and how to check ketones. Emphasize that moderate/large ketones with high blood sugar mean seek care. Provide a clear action plan.",
        source="Ketone Conversation – Patient Education",
        keywords=["ketone", "ketones", "conversation", "patient", "education", "action plan"],
    ),
]

# Diabetes general – for context
DIABETES_CONTENT = [
    ClinicalChunk(
        text="People with type 1 or type 2 diabetes can develop DKA. Type 1 is more common, but type 2 can occur especially during illness or with certain medications. Always check ketones when blood sugar is persistently high or you feel unwell.",
        source="DKA Playbook",
        keywords=["type 1", "type 2", "diabetes", "dka", "ketone"],
    ),
]


CLINICAL_SOURCE = (os.getenv("KNOWLEDGE_CLINICAL_SOURCE") or "memory").strip().lower()


def _fetch_clinical_chunks_from_supabase() -> list[ClinicalChunk] | None:
    if not supabase_configured():
        return None

    rows = fetch_rows(
        "medical_knowledge_chunks",
        {"select": "text,source,keywords", "is_active": "eq.true", "order": "created_at.asc"},
    )
    if rows is None:
        return None

    chunks: list[ClinicalChunk] = []
    for row in rows:
        text = str(row.get("text") or "").strip()
        if not text:
            continue
        keywords = row.get("keywords") or []
        chunks.append(
            ClinicalChunk(
                text=text,
                source=str(row.get("source") or "clinical"),
                keywords=[str(k).lower() for k in keywords if str(k).strip()],
            )
        )
    return chunks


def _get_clinical_chunks() -> list[ClinicalChunk]:
    if CLINICAL_SOURCE == "supabase" and supabase_configured():
        rows = _fetch_clinical_chunks_from_supabase()
        if rows is not None:
            return rows
    return DKA_CONTENT + DIABETES_CONTENT


def retrieve_clinical_chunks(query: str, top_k: int = 5) -> list[dict]:
    """
    Keyword-based retrieval for DKA/ketone/diabetes content.
    Returns chunks with text and source for RAG context.
    """
    q = (query or "").strip().lower()
    if not q or len(q) < 2:
        return []

    all_chunks = _get_clinical_chunks()
    scored: list[tuple[float, ClinicalChunk]] = []

    for chunk in all_chunks:
        score = 0.0
        q_words = set(w for w in q.split() if len(w) > 2)
        for kw in chunk.keywords:
            if kw in q or any(kw in w or w in kw for w in q_words):
                score += 1.0
            if kw in q:
                score += 0.5
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: -x[0])
    return [
        {"text": c.text, "source": c.source}
        for _, c in scored[:top_k]
    ]
