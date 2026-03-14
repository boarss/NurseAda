---
name: herbal-recommendations
description: >
  Herbal and natural remedy recommendations in NurseAda. Use when adding or changing
  herbal logic, content sources, or safety. Triggers on "herbal", "natural remedy",
  "traditional remedy", "herbal agent", "herbal content", "drug-herb", "remedies".
---

# Herbal Recommendations (NurseAda)

Herbal recommendations in NurseAda are **separate from hospitals and FMC**. Content comes only from the **knowledge service** (curated, evidence-based). Hospital/FMC APIs are never used for herbal content.

## Where Herbal Logic Lives

- **Routing**: [services/gateway/app/agents/orchestrator.py](services/gateway/app/agents/orchestrator.py) — `HERBAL_PATTERNS`; herbal agent runs after imaging, before general.
- **Agent**: [services/gateway/app/agents/herbal_agent.py](services/gateway/app/agents/herbal_agent.py) — calls knowledge service only; optionally uses FHIR for **patient medications** (drug–herb interaction checking), not for herbal content.
- **Content**: [services/knowledge/app/herbal_content.py](services/knowledge/app/herbal_content.py) — curated entries (evidence_level, contraindications, drug_interactions, blocked_populations).
- **API**: Knowledge service `POST /retrieve/herbal` (query, top_k, context with medications); `GET /herbal/catalog` for browse.

## Rules

1. **Herbal content source**: Only the knowledge service. Do not add calls to hospital, FMC, or any external scheduling/EMR API for herbal recommendations.
2. **FHIR usage**: Use FHIR only to fetch **patient medications** when `patient_id` is set, then pass them in `context.medications` to `/retrieve/herbal` for drug–herb interaction and population safety. Do not pull "herbal formularies" or "hospital herbal lists" from FHIR.
3. **Trusted sources**: Current content is curated in `herbal_content.py` (WHO, NCCIH, Nigerian monographs, evidence-based). Any future "internet" or external source must be ingested into the knowledge service (e.g. RAG over trusted docs) and exposed via the same `/retrieve/herbal` contract — no live scraping or ad‑hoc web calls from the gateway.
4. **Safety**: All responses include evidence badges, contraindications, drug–herb interaction warnings, and the standard herbal disclaimer. Keep `verify_agent_output` including "herbal" for clinical agents.
5. **Framing**: Always frame as complementary to — not a substitute for — conventional care.

## Checklist for Herbal Work

- [ ] No new calls to hospital/FMC APIs for herbal content
- [ ] New content or sources go through the knowledge service (herbal_content or RAG ingestion), not gateway
- [ ] Patient meds for interactions still come from context or FHIR; no "hospital herbal list" from FHIR
- [ ] Disclaimers and interaction warnings remain in responses
