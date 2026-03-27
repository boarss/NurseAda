# Ideal customer profile (ICP)

Canonical product definition for **who NurseAda serves** and **what “success” means**. Keep this file short; link to it from the PRD and from engineering docs instead of duplicating long prose.

**Ownership:** Product owns updates to this document. Engineering and clinical stakeholders review changes via the normal PR process when they affect scope or messaging.

## Who

- **Primary users**: **Patients** (people seeking health guidance for themselves or family)—not clinicians as the default audience.
- **Geography**: **Nigeria and Africa**, including urban and underserved areas where facilities, insurance, and workforce are constrained (see [NurseAda_PRD.md](../../NurseAda_PRD.md) problem statement).
- **Constraints**: Variable connectivity, cost sensitivity, need for clear next steps without long waits or complex booking.

## Jobs to be done

- **Immediate primary-care-style triage**: Understand severity, get plain-language reasoning, and actionable next steps (including emergency escalation when appropriate).
- **Operate independently**: Core chat works from **symptom description alone**—no requirement for a hospital portal, EHR, or linked records ([§2.4a Independent Primary Care Network Mode](../../NurseAda_PRD.md)).
- **Optional depth**: Herbal and natural options (where configured), medication reminders and interaction checks, clinic discovery and appointment **requests**, imaging upload when relevant—all **additive**, not prerequisites for basic triage.
- **Tone**: Professional and conversational; users should feel informed and supported, not dismissed (aligned with user stories in the PRD).

## What success looks like

- Responses include **clear severity framing**, **recommendations**, and the **standard clinical disclaimer**.
- **Localisation**: User-facing flows available in the languages the product supports (see `packages/locales/`).
- **Trust**: Honest about limits—general information, not a substitute for in-person care when that is needed.

## Non-goals

- Replacing a licensed clinician or definitive diagnosis.
- Requiring **FHIR/EHR** or `patient_id` for users to get meaningful triage (those are **optional enrichments** when configured).
- Presenting the product as only for healthcare professionals.

## Operational independence

For **what to run** so core chat works without EHR or hospital integrations, see [OPERATIONAL_INDEPENDENCE.md](./OPERATIONAL_INDEPENDENCE.md).

## Related links

- [NurseAda_PRD.md](../../NurseAda_PRD.md) — product requirements and independent mode.
- [docs/clinical/CLINICAL_REVIEW.md](../clinical/CLINICAL_REVIEW.md) — how to review clinical-path changes.
- Gateway triage: CDSS when `GATEWAY_CDSS_URL` is set; otherwise fallback triage in `services/gateway/app/services/fallback_triage.py`.
