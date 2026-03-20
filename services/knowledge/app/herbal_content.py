"""
Herbal and natural remedy content for NurseAda.
Evidence-based traditional remedies with clinical validation (Nigeria/Africa context).
PRD: bitter leaf for malaria prophylaxis, ginger for nausea, etc.
"""
import os
from dataclasses import dataclass
from app.supabase_rest import fetch_rows, supabase_configured


@dataclass
class HerbalChunk:
    text: str
    source: str
    keywords: list[str]
    condition: str
    evidence_level: str  # "strong", "moderate", "limited", "traditional"
    contraindications: list[str]
    drug_interactions: list[str]
    blocked_populations: list[str]  # populations where this remedy is BLOCKED


# Symptom/condition → herbal recommendation (evidence-based, complementary to conventional care)
HERBAL_CONTENT = [
    # ── Original 8 entries (enriched with new fields) ──────────────────────
    HerbalChunk(
        text=(
            "**Ginger** (Zingiber officinale): May help with nausea and vomiting. "
            "Preparation: Slice 2–3 cm fresh ginger root, steep in hot water for "
            "5–10 minutes as tea. Drink up to 3 cups/day. "
            "Generally safe; avoid in large amounts if on blood thinners. "
            "Not a substitute for medical care if vomiting is severe."
        ),
        source="Herbal/Natural – Nausea",
        keywords=["nausea", "vomit", "ginger", "sick", "stomach", "morning sickness"],
        condition="nausea",
        evidence_level="moderate",
        contraindications=["gallstones", "bleeding disorders"],
        drug_interactions=["warfarin", "aspirin", "anticoagulants", "antiplatelets"],
        blocked_populations=["children_under_2"],
    ),
    HerbalChunk(
        text=(
            "**Bitter leaf** (Vernonia amygdalina): Traditionally used for malaria "
            "prophylaxis and digestive support in West Africa. "
            "Preparation: Wash leaves, squeeze out juice, drink 1–2 tablespoons "
            "diluted in water, 1–2 times daily. "
            "Evidence is limited; do not replace antimalarial medication. "
            "Consult a provider for malaria prevention and treatment."
        ),
        source="Herbal/Natural – Malaria",
        keywords=["malaria", "bitter leaf", "fever", "prophylaxis", "traditional", "ewuro", "onugbu"],
        condition="malaria",
        evidence_level="limited",
        contraindications=["pregnancy", "breastfeeding"],
        drug_interactions=["diabetes_medications", "antihypertensives"],
        blocked_populations=["pregnant", "children_under_5"],
    ),
    HerbalChunk(
        text=(
            "**Honey** (with warm water or lemon): May soothe cough and sore throat "
            "in adults and children over 1 year. "
            "Preparation: Mix 1–2 teaspoons honey in warm water or herbal tea. "
            "Can add lemon juice. Use up to 3 times daily. "
            "Do NOT give honey to infants under 1 year (botulism risk)."
        ),
        source="Herbal/Natural – Cough",
        keywords=["cough", "honey", "throat", "sore throat"],
        condition="cough",
        evidence_level="strong",
        contraindications=["infants_under_1_year", "diabetes (use sparingly)"],
        drug_interactions=[],
        blocked_populations=["children_under_1"],
    ),
    HerbalChunk(
        text=(
            "**Peppermint** (Mentha piperita): Peppermint tea may help with mild "
            "headache and digestive discomfort. "
            "Preparation: Steep 1–2 teaspoons dried leaves (or 5–6 fresh leaves) "
            "in hot water for 5–7 minutes. Drink up to 3 cups/day. "
            "Avoid if you have GERD or gallstones."
        ),
        source="Herbal/Natural – Headache/Digestive",
        keywords=["headache", "peppermint", "mint", "pain", "indigestion", "bloating", "stomach"],
        condition="headache",
        evidence_level="moderate",
        contraindications=["GERD", "gallstones", "hiatal hernia"],
        drug_interactions=["cyclosporine", "antacids"],
        blocked_populations=["children_under_2"],
    ),
    HerbalChunk(
        text=(
            "**Oral rehydration solution (ORS)** with zinc: Evidence-based for "
            "diarrhea management. "
            "Preparation: In 1 litre of clean water, dissolve 6 level teaspoons sugar "
            "and ½ level teaspoon salt. Add zinc supplements (20 mg/day for children "
            "over 6 months; 10 mg for infants). Continue for 10–14 days. "
            "Seek care if diarrhea is severe, bloody, or lasts >3 days."
        ),
        source="Herbal/Natural – Diarrhea",
        keywords=["diarrhea", "diarrhoea", "loose stool", "ors", "rehydration", "zinc", "dehydration"],
        condition="diarrhea",
        evidence_level="strong",
        contraindications=[],
        drug_interactions=[],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Fever management**: Rest, fluids, and paracetamol are first-line. "
            "Some use ginger tea or neem leaf infusion traditionally; evidence is "
            "limited. Tepid sponging can help reduce temperature. "
            "Seek care if fever is high (>39°C/102°F), lasts >3 days, or occurs "
            "with neck stiffness, rash, or confusion."
        ),
        source="Herbal/Natural – Fever",
        keywords=["fever", "temperature", "neem", "ginger", "hot", "chills"],
        condition="fever",
        evidence_level="limited",
        contraindications=["pregnancy (neem)", "liver disease (neem)"],
        drug_interactions=["diabetes_medications (neem)", "immunosuppressants (neem)"],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Turmeric** (Curcuma longa): Anti-inflammatory; may help with mild "
            "joint pain and arthritis symptoms. "
            "Preparation: Add ½–1 teaspoon turmeric powder to warm milk or food. "
            "Adding a pinch of black pepper improves absorption. "
            "High-dose supplements can interact with medications. "
            "Consult provider if on blood thinners or diabetes medication."
        ),
        source="Herbal/Natural – Pain/Inflammation",
        keywords=["pain", "joint", "arthritis", "turmeric", "inflammation", "swelling", "ata ile pupa"],
        condition="pain",
        evidence_level="moderate",
        contraindications=["gallstones", "bile duct obstruction", "bleeding disorders"],
        drug_interactions=["warfarin", "anticoagulants", "antiplatelets", "diabetes_medications"],
        blocked_populations=["pregnant"],
    ),
    HerbalChunk(
        text=(
            "**Moringa** (Moringa oleifera): Nutrient-rich leaves used for fatigue, "
            "malnutrition, and micronutrient supplementation. "
            "Preparation: Add 1–2 teaspoons dried moringa leaf powder to food, "
            "smoothies, or porridge. Can also cook fresh leaves as vegetable. "
            "Generally safe as food. Check with provider if pregnant or on medications."
        ),
        source="Herbal/Natural – Fatigue/Nutrition",
        keywords=["tired", "fatigue", "weak", "moringa", "malnutrition", "nutrition", "zogale", "ewe ile"],
        condition="fatigue",
        evidence_level="moderate",
        contraindications=["pregnancy (root/bark)", "thyroid disorders"],
        drug_interactions=["thyroid_medications", "diabetes_medications", "antihypertensives"],
        blocked_populations=[],
    ),
    # ── 14 new entries ─────────────────────────────────────────────────────
    HerbalChunk(
        text=(
            "**Neem** (Azadirachta indica) – Dogonyaro (Hausa): Traditionally used "
            "for malaria, skin infections, and oral hygiene across West Africa. "
            "Preparation: Boil a small handful of fresh leaves in water for "
            "10–15 minutes; drink ½ cup up to twice daily. For skin: apply cooled "
            "leaf wash externally. Neem chewing sticks for oral hygiene. "
            "⚠ Avoid during pregnancy (may cause contractions). Can lower blood "
            "sugar—monitor if on diabetes medication."
        ),
        source="Herbal/Natural – Malaria/Skin/Oral",
        keywords=[
            "neem", "dogonyaro", "malaria", "skin", "infection", "rash",
            "oral", "mouth", "teeth", "boil", "acne", "eczema",
        ],
        condition="skin infection",
        evidence_level="moderate",
        contraindications=[
            "pregnancy", "breastfeeding", "autoimmune disease",
            "liver disease", "trying to conceive",
        ],
        drug_interactions=[
            "diabetes_medications", "immunosuppressants", "lithium",
        ],
        blocked_populations=["pregnant", "children_under_5"],
    ),
    HerbalChunk(
        text=(
            "**Garlic** (Allium sativum): May support cardiovascular health by "
            "helping lower blood pressure and cholesterol. Mild antimicrobial properties. "
            "Preparation: Crush 1–2 fresh cloves and let stand 10 minutes before "
            "eating (releases allicin). Can add to food or swallow with water. "
            "Use 1–2 cloves daily. "
            "⚠ Avoid large supplemental doses if on blood thinners or within "
            "2 weeks of surgery."
        ),
        source="Herbal/Natural – Blood Pressure/Heart",
        keywords=[
            "garlic", "blood pressure", "hypertension", "cholesterol",
            "heart", "ayo", "albasa",
        ],
        condition="hypertension",
        evidence_level="moderate",
        contraindications=[
            "bleeding disorders", "pre-surgery (stop 2 weeks before)",
        ],
        drug_interactions=[
            "warfarin", "anticoagulants", "antiplatelets", "antihypertensives",
            "HIV_protease_inhibitors", "saquinavir",
        ],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Hibiscus** (Hibiscus sabdariffa) – Zobo (Nigeria): Hibiscus tea "
            "may help reduce mild-to-moderate blood pressure. Rich in antioxidants "
            "and vitamin C. "
            "Preparation: Steep 1–2 tablespoons dried hibiscus calyces in hot water "
            "for 5–10 minutes. Drink 1–3 cups daily. Can serve chilled as zobo. "
            "⚠ May enhance the effect of blood pressure medications—monitor BP. "
            "Avoid during pregnancy in large amounts."
        ),
        source="Herbal/Natural – Blood Pressure",
        keywords=[
            "hibiscus", "zobo", "blood pressure", "hypertension",
            "bp", "heart", "high blood pressure",
        ],
        condition="hypertension",
        evidence_level="moderate",
        contraindications=["pregnancy (large amounts)", "low blood pressure"],
        drug_interactions=[
            "antihypertensives", "hydrochlorothiazide", "chloroquine",
            "diabetes_medications",
        ],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Guava leaf** (Psidium guajava): Used traditionally across Nigeria for "
            "diarrhea, menstrual cramps, and blood sugar management. "
            "Preparation: Boil 4–6 fresh leaves in 1 cup water for 10 minutes. "
            "Strain and drink up to twice daily. "
            "Some research supports its antidiarrheal and mild blood sugar-lowering "
            "effects. "
            "⚠ May interact with diabetes medications—monitor blood sugar."
        ),
        source="Herbal/Natural – Diarrhea/Blood Sugar",
        keywords=[
            "guava", "guava leaf", "diarrhea", "diarrhoea", "stomach",
            "cramps", "period pain", "menstrual", "blood sugar",
        ],
        condition="diarrhea",
        evidence_level="moderate",
        contraindications=["pregnancy (in large amounts)"],
        drug_interactions=["diabetes_medications", "antidiarrheal_drugs"],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Scent leaf** (Ocimum gratissimum) – Efirin (Yoruba), Nchanwu (Igbo): "
            "Widely used in Nigerian traditional medicine for stomach pain, diarrhea, "
            "and upper respiratory infections. "
            "Preparation: Squeeze fresh leaves to extract juice; take 1–2 tablespoons. "
            "Or boil leaves for tea. Can add to food as seasoning. "
            "Has antimicrobial properties supported by in-vitro studies. "
            "⚠ May lower blood sugar—monitor if on diabetes medications."
        ),
        source="Herbal/Natural – Stomach/Respiratory",
        keywords=[
            "scent leaf", "efirin", "nchanwu", "stomach pain", "stomach ache",
            "diarrhea", "cold", "catarrh", "respiratory",
        ],
        condition="stomach pain",
        evidence_level="limited",
        contraindications=["pregnancy"],
        drug_interactions=["diabetes_medications"],
        blocked_populations=["pregnant"],
    ),
    HerbalChunk(
        text=(
            "**Pawpaw / Papaya leaf** (Carica papaya): Papaya leaf extract is "
            "traditionally used to support platelet recovery during dengue fever "
            "and as a digestive aid. "
            "Preparation: Crush 2–3 fresh mature leaves, squeeze through cloth to "
            "extract juice. Take 1–2 tablespoons twice daily for up to 5 days. "
            "Tastes very bitter—can mix with honey. "
            "⚠ Do NOT use during pregnancy (papain may cause uterine contractions). "
            "Do not substitute for medical care in dengue/malaria."
        ),
        source="Herbal/Natural – Dengue/Digestion",
        keywords=[
            "pawpaw", "papaya", "dengue", "platelet", "digestion",
            "stomach", "ibepe", "gwanda",
        ],
        condition="dengue support",
        evidence_level="moderate",
        contraindications=[
            "pregnancy", "breastfeeding", "latex allergy",
            "blood thinners",
        ],
        drug_interactions=["warfarin", "anticoagulants", "amiodarone"],
        blocked_populations=["pregnant"],
    ),
    HerbalChunk(
        text=(
            "**Clove** (Syzygium aromaticum) – Kanafuru (Yoruba): Contains eugenol, "
            "a natural analgesic. Effective for toothache and oral pain relief. "
            "Preparation: Place a whole clove against the sore tooth and bite gently, "
            "or apply a drop of clove oil on cotton wool to the affected area. "
            "For sore throat: steep 3–4 cloves in hot water as tea. "
            "⚠ Do not swallow clove oil undiluted. Avoid large amounts if on "
            "blood thinners."
        ),
        source="Herbal/Natural – Dental/Oral Pain",
        keywords=[
            "clove", "kanafuru", "toothache", "tooth pain", "dental",
            "oral pain", "mouth sore", "gum",
        ],
        condition="toothache",
        evidence_level="moderate",
        contraindications=["bleeding disorders", "liver disease"],
        drug_interactions=["warfarin", "anticoagulants", "antiplatelets"],
        blocked_populations=["children_under_2"],
    ),
    HerbalChunk(
        text=(
            "**Aloe vera** (Aloe barbadensis): Gel from the inner leaf soothes minor "
            "burns, sunburn, and skin irritation. "
            "Preparation: Cut a fresh leaf, scoop out the clear gel, and apply "
            "directly to affected skin. Reapply 2–3 times daily. "
            "For constipation: some use a small amount of inner-leaf juice orally, "
            "but this can cause cramping—use cautiously. "
            "⚠ Do not apply gel to deep wounds. Oral use may lower blood sugar."
        ),
        source="Herbal/Natural – Burns/Skin",
        keywords=[
            "aloe", "aloe vera", "burn", "sunburn", "skin",
            "wound", "rash", "constipation",
        ],
        condition="burns",
        evidence_level="strong",
        contraindications=[
            "deep wounds", "pregnancy (oral)", "kidney disease (oral)",
        ],
        drug_interactions=[
            "diabetes_medications", "digoxin", "diuretics", "laxatives",
        ],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Lemongrass** (Cymbopogon citratus): Used traditionally across Nigeria "
            "for fever, colds, and body aches. Has mild antimicrobial and "
            "anti-inflammatory properties. "
            "Preparation: Bruise 2–3 stalks (or use dried leaves), boil in water "
            "for 10–15 minutes. Strain and drink warm, up to 3 cups/day. "
            "⚠ May lower blood pressure. Avoid large amounts during pregnancy."
        ),
        source="Herbal/Natural – Cold/Body Aches",
        keywords=[
            "lemongrass", "cold", "body ache", "body pain", "flu",
            "catarrh", "kooko oba", "fever",
        ],
        condition="cold",
        evidence_level="limited",
        contraindications=["pregnancy (large amounts)", "low blood pressure"],
        drug_interactions=["antihypertensives", "sedatives"],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Shea butter** (Vitellaria paradoxa) – Ori (Yoruba), Man shanu (Hausa): "
            "Traditional skin emollient widely used in West Africa for dry skin, eczema, "
            "minor cuts, and joint/muscle pain (topical). "
            "Preparation: Warm a small amount between palms and massage into affected "
            "skin. For nasal congestion (traditional): rub under nostrils. "
            "Rich in vitamins A, E, and fatty acids. "
            "⚠ For external use only. Test on small area first if you have latex "
            "or nut allergies."
        ),
        source="Herbal/Natural – Skin/Joint (Topical)",
        keywords=[
            "shea butter", "ori", "dry skin", "eczema", "skin",
            "moisturizer", "joint pain", "muscle pain", "rash",
        ],
        condition="dry skin",
        evidence_level="traditional",
        contraindications=["latex allergy", "nut allergy (test first)"],
        drug_interactions=[],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Eucalyptus** (Eucalyptus globulus): Steam inhalation with eucalyptus "
            "leaves may relieve nasal congestion and respiratory symptoms. "
            "Preparation: Add a small handful of crushed eucalyptus leaves (or "
            "2–3 drops eucalyptus oil) to a bowl of hot water. Cover head with towel "
            "and inhale steam for 5–10 minutes. Repeat 2–3 times daily. "
            "⚠ Do NOT ingest eucalyptus oil—it is toxic if swallowed. Keep oil away "
            "from children's faces. Do not use near eyes."
        ),
        source="Herbal/Natural – Respiratory/Congestion",
        keywords=[
            "eucalyptus", "congestion", "blocked nose", "cold", "catarrh",
            "sinusitis", "respiratory", "inhaler", "steam",
        ],
        condition="congestion",
        evidence_level="moderate",
        contraindications=["asthma (may worsen)", "epilepsy"],
        drug_interactions=["diabetes_medications", "liver-metabolized drugs (CYP)"],
        blocked_populations=["children_under_2"],
    ),
    HerbalChunk(
        text=(
            "**Coconut oil** (Cocos nucifera): Used topically for skin moisturising, "
            "mild fungal infections (antifungal properties of lauric acid), and "
            "oil pulling for oral health. "
            "Preparation: For skin, apply virgin coconut oil directly. For oil pulling: "
            "swish 1 tablespoon in mouth for 10–15 minutes, then spit out—do not swallow. "
            "⚠ High in saturated fat if consumed in large dietary quantities."
        ),
        source="Herbal/Natural – Skin/Oral Health",
        keywords=[
            "coconut", "coconut oil", "skin", "fungal", "ringworm",
            "dry skin", "oil pulling", "oral", "adi agbon",
        ],
        condition="skin fungal",
        evidence_level="moderate",
        contraindications=["coconut allergy"],
        drug_interactions=[],
        blocked_populations=[],
    ),
    HerbalChunk(
        text=(
            "**Utazi leaf** (Gongronema latifolium): Used in southeastern Nigeria for "
            "blood sugar management and digestive support. "
            "Preparation: Chew 2–3 fresh leaves before meals, or boil leaves to make "
            "tea—drink ½ cup up to twice daily. Also used in soups. "
            "Some Nigerian studies suggest mild hypoglycemic effects. "
            "⚠ May cause excessive blood sugar lowering if combined with diabetes "
            "medications—monitor blood sugar closely."
        ),
        source="Herbal/Natural – Blood Sugar/Digestive",
        keywords=[
            "utazi", "blood sugar", "diabetes", "sugar", "digestion",
            "appetite", "gongronema",
        ],
        condition="blood sugar support",
        evidence_level="limited",
        contraindications=["pregnancy", "hypoglycemia"],
        drug_interactions=[
            "diabetes_medications", "insulin", "metformin", "glimepiride",
        ],
        blocked_populations=["pregnant", "children_under_5"],
    ),
    HerbalChunk(
        text=(
            "**Soursop leaf** (Annona muricata) – Sawansop: Traditionally used in "
            "West Africa for hypertension and as a calming agent. "
            "Preparation: Boil 5–6 dried leaves in 2 cups water for 15 minutes. "
            "Strain and drink ½ cup up to twice daily. "
            "Some preliminary studies suggest blood pressure-lowering and sedative effects. "
            "⚠ Do NOT use long-term or in high doses—annonacin in seeds/bark has been "
            "linked to neurotoxicity. Use leaves only, short-term."
        ),
        source="Herbal/Natural – Blood Pressure/Calm",
        keywords=[
            "soursop", "sawansop", "graviola", "blood pressure",
            "hypertension", "sleep", "calm", "anxiety", "abo",
        ],
        condition="hypertension",
        evidence_level="limited",
        contraindications=[
            "pregnancy", "Parkinson's disease",
            "liver disease", "kidney disease",
        ],
        drug_interactions=[
            "antihypertensives", "sedatives", "antidepressants",
            "diabetes_medications",
        ],
        blocked_populations=["pregnant"],
    ),
]


EVIDENCE_LABELS = {
    "strong": "Supported by clinical research",
    "moderate": "Some research supports this use",
    "limited": "Limited research; based mainly on traditional practice",
    "traditional": "Based on traditional practice; not yet validated by clinical research",
}

# ── Drug-herb interaction table ────────────────────────────────────────────
# (herb_keyword, drug_keyword) → severity, description
# Severity: "critical", "major", "moderate", "minor"
DRUG_HERB_INTERACTIONS: list[tuple[list[str], list[str], str, str]] = [
    # Critical — combination may cause life-threatening harm
    (
        ["ginger", "turmeric", "garlic", "clove", "pawpaw", "papaya"],
        ["warfarin", "heparin", "enoxaparin", "rivaroxaban", "apixaban"],
        "critical",
        "Serious bleeding risk. {herb} can increase anticoagulant effects of {drug}. "
        "Do NOT combine without direct supervision from your prescribing doctor.",
    ),
    # Major — avoid combination or use only under medical supervision
    (
        ["bitter leaf", "moringa", "neem", "utazi", "guava leaf", "scent leaf",
         "aloe vera", "soursop", "hibiscus"],
        ["metformin", "glimepiride", "glibenclamide", "insulin", "gliclazide"],
        "major",
        "Risk of dangerously low blood sugar (hypoglycemia). {herb} may enhance the "
        "blood-sugar-lowering effect of {drug}. Monitor blood sugar closely and "
        "consult your provider before combining.",
    ),
    (
        ["garlic", "hibiscus", "soursop", "lemongrass", "moringa"],
        ["amlodipine", "lisinopril", "enalapril", "losartan", "nifedipine",
         "atenolol", "hydrochlorothiazide"],
        "major",
        "Risk of excessively low blood pressure. {herb} may enhance the effect of "
        "{drug}. Monitor BP regularly and tell your doctor you are using this remedy.",
    ),
    (
        ["neem"],
        ["cyclosporine", "tacrolimus", "azathioprine", "mycophenolate"],
        "major",
        "Neem may stimulate the immune system and counteract immunosuppressant "
        "medications. Do NOT combine.",
    ),
    (
        ["pawpaw", "papaya"],
        ["amiodarone"],
        "major",
        "Papaya leaf may increase amiodarone levels. Avoid combining.",
    ),
    # Moderate — use with caution + monitoring
    (
        ["turmeric", "ginger"],
        ["aspirin", "ibuprofen", "diclofenac", "naproxen"],
        "moderate",
        "May increase bleeding risk when combined with anti-inflammatory drugs. "
        "Use food-level amounts only; avoid high-dose supplements.",
    ),
    (
        ["aloe vera"],
        ["digoxin"],
        "moderate",
        "Aloe vera (oral) may lower potassium, increasing digoxin toxicity risk. "
        "Monitor potassium levels.",
    ),
    (
        ["aloe vera", "neem"],
        ["diuretics", "furosemide", "hydrochlorothiazide"],
        "moderate",
        "May increase risk of electrolyte imbalance (low potassium). "
        "Stay hydrated and monitor if combining.",
    ),
    (
        ["soursop", "lemongrass"],
        ["diazepam", "lorazepam", "alprazolam", "zolpidem"],
        "moderate",
        "May enhance sedative effects. Avoid driving or operating machinery "
        "if combining.",
    ),
    (
        ["hibiscus"],
        ["chloroquine"],
        "moderate",
        "Hibiscus may reduce chloroquine absorption. Separate intake by at least "
        "2 hours if using both.",
    ),
    (
        ["eucalyptus"],
        ["diabetes_medications", "metformin"],
        "moderate",
        "Eucalyptus may lower blood sugar. Monitor if on diabetes medication.",
    ),
    # Minor — be aware
    (
        ["peppermint"],
        ["antacids", "omeprazole", "pantoprazole"],
        "minor",
        "Peppermint may affect absorption of antacid medications. "
        "Separate intake by 30 minutes.",
    ),
    (
        ["turmeric"],
        ["paracetamol", "acetaminophen"],
        "minor",
        "High-dose turmeric supplements alongside frequent paracetamol may "
        "increase liver workload. Food-level turmeric is fine.",
    ),
]

HERBAL_SOURCE = (os.getenv("KNOWLEDGE_HERBAL_SOURCE") or "memory").strip().lower()


def _extract_herb_name(text: str, condition: str = "") -> str:
    if "**" in text:
        parts = text.split("**")
        if len(parts) > 2:
            return parts[1].split(":")[0].strip().lower()
    return condition.lower()


def _fetch_herbal_content_from_supabase() -> list[HerbalChunk] | None:
    if not supabase_configured():
        return None

    rows = fetch_rows(
        "herbal_remedies",
        {
            "select": "text,source,keywords,condition,evidence_level,contraindications,drug_interactions,blocked_populations",
            "is_active": "eq.true",
            "order": "created_at.asc",
        },
    )
    if rows is None:
        return None

    chunks: list[HerbalChunk] = []
    for row in rows:
        text = str(row.get("text") or "").strip()
        if not text:
            continue
        chunks.append(
            HerbalChunk(
                text=text,
                source=str(row.get("source") or "herbal"),
                keywords=[str(k).lower() for k in (row.get("keywords") or []) if str(k).strip()],
                condition=str(row.get("condition") or "general"),
                evidence_level=str(row.get("evidence_level") or "limited"),
                contraindications=[str(c) for c in (row.get("contraindications") or []) if str(c).strip()],
                drug_interactions=[str(d) for d in (row.get("drug_interactions") or []) if str(d).strip()],
                blocked_populations=[str(p) for p in (row.get("blocked_populations") or []) if str(p).strip()],
            )
        )
    return chunks


def _fetch_interaction_rules_from_supabase() -> list[tuple[list[str], list[str], str, str]] | None:
    if not supabase_configured():
        return None

    rows = fetch_rows(
        "herbal_drug_interaction_rules",
        {
            "select": "herb_keywords,drug_keywords,severity,message_template",
            "is_active": "eq.true",
            "order": "created_at.asc",
        },
    )
    if rows is None:
        return None

    rules: list[tuple[list[str], list[str], str, str]] = []
    for row in rows:
        herbs = [str(h).lower() for h in (row.get("herb_keywords") or []) if str(h).strip()]
        drugs = [str(d).lower() for d in (row.get("drug_keywords") or []) if str(d).strip()]
        severity = str(row.get("severity") or "").strip().lower()
        template = str(row.get("message_template") or "").strip()
        if not herbs or not drugs or not severity or not template:
            continue
        rules.append((herbs, drugs, severity, template))
    return rules


def _get_herbal_content() -> list[HerbalChunk]:
    if HERBAL_SOURCE == "supabase" and supabase_configured():
        rows = _fetch_herbal_content_from_supabase()
        if rows is not None:
            return rows
    return HERBAL_CONTENT


def _get_interaction_rules() -> list[tuple[list[str], list[str], str, str]]:
    if HERBAL_SOURCE == "supabase" and supabase_configured():
        rules = _fetch_interaction_rules_from_supabase()
        if rules is not None:
            return rules
    return DRUG_HERB_INTERACTIONS


# ── Blocked populations and safety rules ───────────────────────────────────
POPULATION_LABELS = {
    "pregnant": "Pregnant women",
    "breastfeeding": "Breastfeeding mothers",
    "children_under_1": "Children under 1 year",
    "children_under_2": "Children under 2 years",
    "children_under_5": "Children under 5 years",
}

BLOCKED_CONTEXT_KEYWORDS = {
    "pregnant": ["pregnant", "pregnancy", "expecting", "trimester", "antenatal"],
    "breastfeeding": ["breastfeeding", "nursing", "lactating", "breast milk"],
    "children_under_1": ["infant", "baby", "newborn", "0 month", "1 month",
                         "2 month", "3 month", "under 1 year", "less than 1"],
    "children_under_2": ["toddler", "1 year old", "under 2", "less than 2"],
    "children_under_5": ["child", "kid", "under 5", "3 year", "4 year",
                         "less than 5", "small child"],
}


def _detect_population(query: str, context: dict | None = None) -> set[str]:
    """Detect blocked-population flags from query text and context."""
    q = (query or "").lower()
    ctx_text = " ".join(
        str(v) for v in (context or {}).values() if isinstance(v, str)
    ).lower()
    combined = f"{q} {ctx_text}"
    detected: set[str] = set()
    for pop, keywords in BLOCKED_CONTEXT_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            detected.add(pop)
    if "children_under_1" in detected:
        detected.update({"children_under_2", "children_under_5"})
    elif "children_under_2" in detected:
        detected.add("children_under_5")
    return detected


def check_drug_herb_interactions(
    herb_name: str,
    medications: list[str] | None = None,
    query: str = "",
) -> list[dict]:
    """
    Check if a herb has known interactions with medications mentioned in the
    query or explicit medication list. Returns list of interaction warnings.
    """
    herb_lower = herb_name.lower()
    med_text = " ".join(medications or []).lower() + " " + query.lower()
    results: list[dict] = []
    for herbs, drugs, severity, template in _get_interaction_rules():
        if not any(h in herb_lower for h in herbs):
            continue
        matched_herb = next((h for h in herbs if h in herb_lower), herb_name)
        for drug in drugs:
            if drug in med_text:
                results.append({
                    "severity": severity,
                    "herb": matched_herb,
                    "drug": drug,
                    "message": template.format(herb=matched_herb.title(), drug=drug),
                })
    return results


def get_herbal_catalog(condition: str = "") -> list[dict]:
    """Return all herbal entries for browsing, optionally filtered by condition."""
    cond = condition.strip().lower()
    results: list[dict] = []
    for c in _get_herbal_content():
        if cond and cond not in c.condition.lower() and not any(cond in kw for kw in c.keywords):
            continue
        results.append({
            "text": c.text,
            "source": c.source,
            "condition": c.condition,
            "evidence_level": c.evidence_level,
            "evidence_label": EVIDENCE_LABELS.get(c.evidence_level, ""),
            "contraindications": c.contraindications,
            "keywords": c.keywords,
        })
    return results


def retrieve_herbal_for_symptoms(
    query: str,
    top_k: int = 3,
    context: dict | None = None,
) -> list[dict]:
    """
    Return herbal/natural remedy chunks matching the symptom query.
    Applies population safety filters and enriches results with evidence
    labels and interaction warnings.
    """
    q = (query or "").strip().lower()
    if not q or len(q) < 2:
        return []

    detected_pops = _detect_population(query, context)
    medications = (context or {}).get("medications", [])
    is_emergency = any(
        kw in q for kw in [
            "emergency", "unconscious", "chest pain", "severe bleed",
            "stroke", "dka", "ketoacidosis", "overdose", "suicide",
        ]
    )
    if is_emergency:
        return []

    scored: list[tuple[float, HerbalChunk]] = []
    q_words = set(w for w in q.split() if len(w) > 2)

    for chunk in _get_herbal_content():
        if detected_pops & set(chunk.blocked_populations):
            continue
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

    results: list[dict] = []
    for _, c in scored[:top_k]:
        interactions = check_drug_herb_interactions(_extract_herb_name(c.text, c.condition), medications, query)
        results.append({
            "text": c.text,
            "source": c.source,
            "condition": c.condition,
            "evidence_level": c.evidence_level,
            "evidence_label": EVIDENCE_LABELS.get(c.evidence_level, ""),
            "contraindications": c.contraindications,
            "drug_interactions": interactions if interactions else [],
        })
    return results
