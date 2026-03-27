# Clinical review process (NurseAda)

This document is the **entry point** for reviewing changes that affect what patients see or hear from NurseAda’s primary-care triage and related clinical flows. It does not replace Cursor rules; it **coordinates** them into one checklist.

## Scope: when this process applies

Use (or adapt) this process when a pull request touches any of the following:

| Area | Examples |
|------|----------|
| Triage and severity | [`services/cdss/app/triage_logic.py`](../../services/cdss/app/triage_logic.py), [`services/cdss/app/diagnosis_engine.py`](../../services/cdss/app/diagnosis_engine.py), [`services/cdss/app/recommendation_engine.py`](../../services/cdss/app/recommendation_engine.py) |
| Gateway fallback triage | [`services/gateway/app/services/fallback_triage.py`](../../services/gateway/app/services/fallback_triage.py) — must stay aligned with CDSS recommendation supplements when both are edited |
| Red flags | [`services/gateway/app/data/red_flags.json`](../../services/gateway/app/data/red_flags.json) and [`services/cdss/app/data/red_flags.json`](../../services/cdss/app/data/red_flags.json) (keep parity) |
| Routing and patterns | [`services/gateway/app/agents/orchestrator.py`](../../services/gateway/app/agents/orchestrator.py) (`TRIAGE_PATTERNS`), [`services/cdss/app/code_check.py`](../../services/cdss/app/code_check.py) (`TRIAGE_MIN_TERMS`) |
| Patient-facing wording | [`services/gateway/app/clinical/generate_response.py`](../../services/gateway/app/clinical/generate_response.py), [`services/gateway/app/services/discourse.py`](../../services/gateway/app/services/discourse.py) |
| Safety verification | [`services/gateway/app/services/verification.py`](../../services/gateway/app/services/verification.py), [`services/gateway/app/agents/orchestrator.py`](../../services/gateway/app/agents/orchestrator.py) (`verify_agent_output`) |
| Clinical agents | Triage, medication, lab, emergency, explain, imaging, herbal, appointment agents under [`services/gateway/app/agents/`](../../services/gateway/app/agents/) |

Changes that are **only** UI layout, non-clinical copy, or infrastructure with no behaviour change may skip full clinical review but should still follow normal code review.

## Pre-merge checklist (engineering)

1. **Red-flag parity** — If either `red_flags.json` file changed, run:
   - `python scripts/verify_red_flags_parity.py` (from repo root).
2. **New symptom or clinical terms** — Update orchestrator patterns, both red-flag JSON files, and `TRIAGE_MIN_TERMS` in CDSS `code_check.py` as required by project rules.
3. **CDSS vs fallback** — If [`recommendation_engine.py`](../../services/cdss/app/recommendation_engine.py) gains new code-based bullets, mirror the same intent in [`fallback_triage.py`](../../services/gateway/app/services/fallback_triage.py) (`_supplement_suggestions_for_codes`) so offline/CDSS-down users are not worse off.
4. **Tests** — Add or extend tests for triage/recommendations (see [`services/cdss/tests/test_recommendation_engine.py`](../../services/cdss/tests/test_recommendation_engine.py), [`services/gateway/tests/test_fallback_triage_supplements.py`](../../services/gateway/tests/test_fallback_triage_supplements.py), [`services/gateway/tests/test_triage_pipeline.py`](../../services/gateway/tests/test_triage_pipeline.py)).
5. **Disclaimers** — Confirm clinical agents still receive the standard disclaimer (orchestrator + `get_standard_disclaimer()`).
6. **Locales** — If you add new user-facing strings in `discourse.py`, add keys to `packages/locales/en.json` first, then other locale files, and extend `TRANSLATIONS` in `discourse.py` for backend-rendered strings.

## Review criteria (what reviewers look for)

- **Safety** — Emergency language is clear (e.g. call 112, emergency department). No instructions to stop prescribed medicines, ignore a clinician, or delay urgent care.
- **Consistency** — CDSS triage output and gateway fallback triage do not contradict each other for the same symptom pattern.
- **Tone** — Aligned with professional discourse: empathetic, practitioner-like, no robotic labels; see `.cursor/rules/nurseada-professional-discourse.mdc`.
- **LLM layer** — `generate_response` must not invent diagnoses or doses; it should only communicate the provided artifact (see system prompt in `generate_response.py`).

## Human / clinical reviewer (optional but recommended for high-impact changes)

Pull in a clinician or clinical advisor when:

- Adding or changing **red-flag** behaviour or emergency escalation.
- Broadening triage rules that could **lower** severity for dangerous presentations.
- Changing **herbal** safety, drug–herb interactions, or blocked populations.

**What to sample**

- A short list of **golden scenarios** (chest pain, stroke-like symptoms, fever, cough, diabetes + illness) and confirm severity and escalation text match expectations.
- If you use feedback or RLHF exports: review **ratings and comments** for triage-related sessions (no PHI in stored feedback; follow internal privacy policy).

Feedback API reference: [`services/gateway/app/routers/medical_feedback.py`](../../services/gateway/app/routers/medical_feedback.py) (signed-in feedback with optional allowlisted source crawl for reviewer context).

## References

| Resource | Role |
|----------|------|
| [`.cursor/rules/nurseada-guardrails.mdc`](../../.cursor/rules/nurseada-guardrails.mdc) | Pre/post processing, PII, emergency phrasing |
| [`.cursor/rules/nurseada-project-consistency.mdc`](../../.cursor/rules/nurseada-project-consistency.mdc) | Triage format, intent/code check, parity scripts |
| [`docs/integrations/INTEGRATION_ARCHITECTURE.md`](../integrations/INTEGRATION_ARCHITECTURE.md) | Verification tests and integration overview |
| [`NurseAda_PRD.md`](../../NurseAda_PRD.md) | Product intent, guardrails, RLHF at a high level |

## Release spot-check (manual)

Before tagging a release with clinical changes, spot-check in staging:

1. One **emergency** query (e.g. chest pain + breathlessness) — must urge emergency care.
2. One **medium** symptom (e.g. cough or fever) — must include monitoring and when to seek care.
3. Confirm the standard **disclaimer** appears on clinical replies.

Record who ran the check and the date in your release notes if your team requires auditability.
