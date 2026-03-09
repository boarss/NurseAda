"""
Herbal and natural remedy content for NurseAda.
Evidence-based traditional remedies with clinical validation (Nigeria/Africa context).
PRD: bitter leaf for malaria prophylaxis, ginger for nausea, etc.
"""
from dataclasses import dataclass


@dataclass
class HerbalChunk:
    text: str
    source: str
    keywords: list[str]
    condition: str  # symptom/condition for matching


# Symptom/condition → herbal recommendation (evidence-based, complementary to conventional care)
HERBAL_CONTENT = [
    HerbalChunk(
        text="**Ginger** (Zingiber officinale): May help with nausea and vomiting. Use fresh ginger tea or small amounts of grated ginger. Generally safe; avoid in large amounts if on blood thinners. Not a substitute for medical care if vomiting is severe.",
        source="Herbal/Natural – Nausea",
        keywords=["nausea", "vomit", "ginger", "sick", "stomach"],
        condition="nausea",
    ),
    HerbalChunk(
        text="**Bitter leaf** (Vernonia amygdalina): Traditionally used for malaria prophylaxis and digestive support in West Africa. Evidence is limited; do not replace antimalarial medication. Consult a provider for malaria prevention and treatment.",
        source="Herbal/Natural – Malaria",
        keywords=["malaria", "bitter leaf", "fever", "prophylaxis", "traditional"],
        condition="malaria",
    ),
    HerbalChunk(
        text="**Honey** (with warm water or lemon): May soothe cough and sore throat in adults and children over 1 year. Do not give honey to infants under 1 year (botulism risk).",
        source="Herbal/Natural – Cough",
        keywords=["cough", "honey", "throat", "sore throat"],
        condition="cough",
    ),
    HerbalChunk(
        text="**Peppermint** (Mentha piperita): Peppermint tea may help with mild headache and digestive discomfort. Avoid if you have GERD or gallstones.",
        source="Herbal/Natural – Headache",
        keywords=["headache", "peppermint", "mint", "pain"],
        condition="headache",
    ),
    HerbalChunk(
        text="**Oral rehydration solution (ORS)** with zinc: Evidence-based for diarrhea. Homemade: clean water, salt, sugar. Zinc supplements can reduce duration. Seek care if severe or bloody.",
        source="Herbal/Natural – Diarrhea",
        keywords=["diarrhea", "diarrhoea", "loose stool", "ors", "rehydration", "zinc"],
        condition="diarrhea",
    ),
    HerbalChunk(
        text="**Fever**: Rest, fluids, and paracetamol are first-line. Some use ginger or neem leaf traditionally; evidence is limited. Seek care if fever is high (>39°C) or lasts >3 days.",
        source="Herbal/Natural – Fever",
        keywords=["fever", "temperature", "neem", "ginger"],
        condition="fever",
    ),
    HerbalChunk(
        text="**Turmeric** (Curcuma longa): Anti-inflammatory; may help with mild joint pain. Use in food; high-dose supplements can interact with medications. Consult provider if on blood thinners.",
        source="Herbal/Natural – Pain/Inflammation",
        keywords=["pain", "joint", "arthritis", "turmeric", "inflammation"],
        condition="pain",
    ),
    HerbalChunk(
        text="**Moringa** (Moringa oleifera): Nutrient-rich; used for fatigue and malnutrition support. Generally safe as food. Check with provider if pregnant or on medications.",
        source="Herbal/Natural – Fatigue",
        keywords=["tired", "fatigue", "weak", "moringa", "malnutrition"],
        condition="fatigue",
    ),
]


def retrieve_herbal_for_symptoms(query: str, top_k: int = 3) -> list[dict]:
    """
    Return herbal/natural remedy chunks matching the symptom query.
    Used to enrich triage responses and answer direct herbal queries.
    """
    q = (query or "").strip().lower()
    if not q or len(q) < 2:
        return []

    scored: list[tuple[float, HerbalChunk]] = []
    q_words = set(w for w in q.split() if len(w) > 2)

    for chunk in HERBAL_CONTENT:
        score = 0.0
        for kw in chunk.keywords:
            if kw in q or any(kw in w or w in kw for w in q_words):
                score += 1.0
            if kw in q:
                score += 0.5
        if chunk.condition in q or any(chunk.condition in w for w in q_words):
            score += 1.0
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: -x[0])
    return [
        {"text": c.text, "source": c.source, "condition": c.condition}
        for _, c in scored[:top_k]
    ]
