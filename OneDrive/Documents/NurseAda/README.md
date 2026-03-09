# NurseAda

AI-powered 24/7 virtual healthcare assistant for primary care users in Africa.

## Repo layout

- `apps/web`: Next.js web app (patient-facing chat)
- `apps/mobile`: React Native (Expo) mobile app
- `services/gateway`: FastAPI API gateway (orchestration, auth, safety, audit)
- `services/llm-gateway`: LLM gateway (hosted + self-hosted via adapters)
- `services/cdss`: Clinical Decision Support System (triage, interactions, pathways)
- `services/knowledge`: Retrieval + medical knowledge adapters (vector DB, formularies, herbal DB)
- `packages/shared-ts`: Shared TypeScript types (API contracts)
- `packages/shared-py`: Shared Python utilities (config/logging types)
- `infra`: Docker/K8s scaffolding

## Local development (scaffold)

1. Copy env template:
   - `cp .env.example .env` (PowerShell: `Copy-Item .env.example .env`)
2. Bring up services (when implemented):
   - `docker compose up --build`

## Safety note

NurseAda is **not** a replacement for professional medical advice. The system must enforce emergency escalation and conservative guidance when uncertain.

