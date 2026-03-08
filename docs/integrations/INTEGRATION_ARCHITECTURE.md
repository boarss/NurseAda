# NurseAda Integration Architecture

This document describes how NurseAda integrates with **HL7 FHIR**, **EHR**, **pharmacies**, **labs**, and **emergency services** to deliver accurate recommendations and diagnoses. All external integrations are used through **agent teams** and a **verification layer** so that only verified outputs are shown to users.

**FHIR specification:** [HL7 FHIR Index (R5)](https://fhir.hl7.org/fhir/index.html) – REST API, resource types (Patient, Observation, MedicationRequest, DiagnosticReport, Task, etc.), and implementation guides.

---

## 1. Configure real endpoints (.env)

Copy `.env.example` to `.env` in the repo root. The example configures a **real FHIR endpoint** for development:

| Variable | Purpose | Example (dev) |
|----------|---------|----------------|
| `FHIR_BASE_URL` | Upstream FHIR server (EHR). Used by **fhir-adapter**. | `https://hapi.fhir.org/baseR4` (public R4 test server; [Swagger](https://hapi.fhir.org/baseR4/swagger-ui/)) |
| `GATEWAY_FHIR_URL` | URL of the **fhir-adapter** service. Used by **gateway** agent teams. | `http://localhost:8011` |

- **Do not** use the public test server for production or real PHI; it is regularly purged.
- For production, set `FHIR_BASE_URL` to your EHR’s FHIR endpoint (e.g. SMART on FHIR) and ensure auth is configured in the adapter.

**Deploy agent teams** so the gateway and fhir-adapter run with these env vars:

- **Option A:** From repo root, run `.\scripts\deploy-agents.ps1` (starts fhir-adapter in background, then gateway on port 8080).
- **Option B:** In one terminal: `cd services/fhir-adapter && uvicorn app.main:app --port 8011`. In another: set `GATEWAY_FHIR_URL=http://localhost:8011` and run `cd services/gateway && uvicorn app.main:app --port 8080`.
- **Option C:** `docker-compose up` (see root README); set `FHIR_BASE_URL` and `GATEWAY_FHIR_URL` in the compose file or `.env`.

---

## 2. Overview

- **Gateway** is the single entry for chat. It uses an **agent orchestrator** to route each user message to the right **agent(s)**.
- Each agent may call **FHIR** (EHR/HL7), **CDSS**, **pharmacy**, **lab**, or **emergency** APIs.
- **Verification** runs **before** an agent is called (input checks) and **after** (output checks). Only verified responses are returned to the user.

```
User → Gateway (chat) → Orchestrator
                           → Input verification ✓
                           → Agent (Triage | Medication | Lab | Emergency | General)
                           → Output verification ✓
                           → Reply to user
```

---

## 3. Agent Teams

| Agent ID     | Purpose                    | Integrations used                    | When used (intent)        |
|-------------|----------------------------|-------------------------------------|---------------------------|
| **emergency** | Escalation, hotlines       | Emergency API, FHIR Task            | Emergency keywords        |
| **triage**    | Symptom/diagnosis support | CDSS, FHIR Observation              | Symptom/diagnosis keywords|
| **medication**| Drug info, interactions   | CDSS (drug-interactions), FHIR MedicationRequest, Pharmacy API | Medication keywords |
| **lab**       | Lab orders/results        | FHIR Observation, Lab API           | Lab/test keywords         |
| **general**   | General health Q&A        | LLM Gateway, Knowledge (RAG)        | Default fallback          |

- **Intent detection** is rule-based (keyword patterns). It can be replaced or extended with an LLM classifier.
- Only **one** agent is invoked per user message; the orchestrator chooses by intent.

---

## 4. Verification (Before and After Execution)

- **Input verification** (before any agent is called):
  - Non-empty, valid string.
  - Length ≤ 4000 chars.
  - Reject obvious injection/script patterns.

- **Output verification** (after agent returns):
  - Non-empty, valid string.
  - Length ≤ 8000 chars.
  - For clinical agents (triage, medication, lab, emergency): ensure or append a **disclaimer** (e.g. “not a substitute for professional care”, “consult a provider”, “in an emergency seek care”).

If input or output verification fails, the user sees a **safe fallback message** instead of unverified content. Agents are only “called on” after input verification passes; their reply is only shown after output verification (and optional disclaimer append).

**Code check before triage/medication:** A code-check step runs before the triage or medication agent is invoked (gateway calls CDSS `POST /code-check`). If the input cannot be resolved to symptom or medication terms, the agent is not called. CDSS triage returns severity, suggestions, inferred_codes, confidence, and reasoning; drug-interactions returns codes_checked—so recommendations and diagnoses are code-aware and transparent.

---

## 5. HL7 FHIR and EHR

- **Service**: `services/fhir-adapter`
- **Role**: Proxies to a configured FHIR server (EHR that exposes a FHIR API).
- **Endpoints** (all proxy to `FHIR_BASE_URL`; resource types per [FHIR spec](https://fhir.hl7.org/fhir/index.html)):
  - `GET /Patient/{id}` – patient demography.
  - `GET /Observation?patient=...` – observations (e.g. vitals, lab results).
  - `GET /MedicationRequest?patient=...` – current medications.
  - `GET /DiagnosticReport?patient=...` – lab/imaging reports (Level 4 Diagnostics).
  - `POST /Task` – create task (e.g. emergency escalation).
- **Config**: Set `FHIR_BASE_URL` (and optionally `GATEWAY_FHIR_URL` in the gateway to point to the fhir-adapter).
- **EHR / SMART on FHIR**: For real EHRs, the FHIR server URL is typically the EHR’s FHIR endpoint; auth (e.g. SMART on FHIR) can be added in the adapter or gateway (e.g. bearer token from auth flow).

---

## 6. Pharmacies

- **Usage**: Medication agent calls pharmacy for availability, info, or ordering (when implemented).
- **Config**: `PHARMACY_API_URL` in the gateway.
- **Contract**: Gateway expects `POST {PHARMACY_API_URL}/query` with `{"query": "..."}` and optional `patient_id`; response with `reply` or `message` is used in the agent reply.
- **Local formulary**: Drug interactions and formulary checks are done via **CDSS** (`/drug-interactions`); pharmacy API can be a separate vendor or in-house API.

---

## 7. Labs

- **Usage**: Lab agent fetches or orders lab work (and optionally FHIR Observation/DiagnosticReport).
- **Config**: `LAB_API_URL` in the gateway.
- **Contract**: Gateway expects `POST {LAB_API_URL}/query` with `{"query": "...", "patient_id": "..."}`; response with `reply`, `message`, or `summary` is used.
- **FHIR**: Observations (including lab results) are read via the **fhir-adapter** (`/Observation?patient=...`).

---

## 8. Emergency Services

- **Usage**: Emergency agent provides hotline info and can escalate (e.g. create FHIR Task, call emergency API).
- **Config**: `EMERGENCY_API_URL` in the gateway.
- **Contract**: Gateway expects `POST {EMERGENCY_API_URL}/escalate` with `{"reason": "...", "patient_id": "...", "source": "nurseada"}`; response `message` or `reply` is shown. If not configured, a **default message** with Nigeria emergency numbers (e.g. 112, Lagos 767) is returned.
- **FHIR**: Optional `POST /Task` to the fhir-adapter for audit/referral.

---

## 9. Gateway Configuration Summary

| Env var               | Purpose                    | Used by      |
|-----------------------|----------------------------|-------------|
| `GATEWAY_FHIR_URL`    | FHIR adapter base URL      | All agents that need EHR/FHIR |
| `GATEWAY_CDSS_URL`    | CDSS service base URL      | Triage, Medication |
| `GATEWAY_LLM_URL`     | LLM gateway base URL       | General agent |
| `GATEWAY_KNOWLEDGE_URL` | Knowledge service base URL | General agent |
| `PHARMACY_API_URL`    | Pharmacy API base URL      | Medication agent |
| `LAB_API_URL`        | Lab API base URL           | Lab agent |
| `EMERGENCY_API_URL`   | Emergency escalation API   | Emergency agent |

FHIR adapter:

| Env var          | Purpose                |
|------------------|------------------------|
| `FHIR_BASE_URL`  | Upstream FHIR server (EHR) base URL |

---

## 10. Deployment and Verification Before Use

- **Deploy**:
  - Run **fhir-adapter** (e.g. port 8011), **gateway** (8080), **cdss** (8002), **llm-gateway** (8001), **knowledge** (8003).
  - Configure env vars above for any external systems (FHIR server, pharmacy, lab, emergency).
- **Verification before production**:
  - **Input/output verification**: Unit tests for `verify_agent_input` and `verify_agent_output` with valid/invalid inputs and outputs.
  - **Agent contract**: Test each agent with mocked FHIR/CDSS/pharmacy/lab/emergency responses to ensure correct parsing and disclaimer behavior.
  - **Orchestrator**: Test intent routing (emergency vs medication vs lab vs triage vs general) and that only one agent runs and returns a verified reply.
  - **Integration**: Smoke tests against a real or sandbox FHIR server (and other APIs when available) to confirm end-to-end flow.

Once these are verified, the system is ready to be “called on” by production traffic.
