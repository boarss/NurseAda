# Operational independence (core chat)

Minimal services required for **symptom-based triage** without hospital portals or EHR.

## Minimal stack

| Component | Role |
|-----------|------|
| **Gateway** | `POST /chat`, orchestration, triage agent, disclaimers |
| **Triage logic** | CDSS at `GATEWAY_CDSS_URL` **or** gateway **fallback triage** when CDSS is unset |

With only the gateway running and CDSS disabled, users still receive structured fallback triage (see `services/gateway/app/services/fallback_triage.py`).

## Optional extensions

- **LLM** (`GATEWAY_LLM_URL`): phrasing layer for triage output; not required for deterministic fallback formatting.
- **Knowledge** (`GATEWAY_KNOWLEDGE_URL`): herbal retrieval, browse catalog.
- **FHIR** (`GATEWAY_FHIR_URL`): enriches context when `patient_id` is sent; **not** required for core chat.
- **CDSS**: Improves rule-based triage when configured.

## Local development

See [README.md](../../README.md) **Quick start** (e.g. `scripts/start-dev-all.ps1` or gateway + web).

## Product alignment

- [IDEAL_CUSTOMER_PROFILE.md](./IDEAL_CUSTOMER_PROFILE.md) — who we serve and independent-mode intent.
- [NurseAda_PRD.md](../../NurseAda_PRD.md) §2.4a — independent primary care network mode.
