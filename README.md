# NurseAda

**AI-powered 24/7 virtual healthcare assistant for primary care users in Nigeria and Africa.**

See [NurseAda_PRD.md](./NurseAda_PRD.md) for full product requirements, architecture, and success metrics.

## Repository structure

| Path | Purpose |
|------|--------|
| `apps/web` | Next.js web app (TypeScript, Tailwind) |
| `apps/mobile` | React Native (Expo) app for iOS/Android |
| `apps/flutter_app` | Flutter app for iOS/Android |
| `services/gateway` | Main API (FastAPI): auth, chat, medications, routing to other services |
| `services/llm-gateway` | LLM abstraction (OpenAI/Claude-compatible), guardrails |
| `services/cdss` | Clinical decision support: triage, drug interactions, treatment paths |
| `services/knowledge` | Medical knowledge base, vector search, retrieval |
| `services/ussd` | USSD/IVR bridge: provider webhooks → gateway chat (short replies) |
| `services/fhir-adapter` | HL7 FHIR proxy (Patient, Observation, MedicationRequest, Task) for EHR integration |
| `packages/shared-ts` | Shared TypeScript types and constants |
| `infra` | Deployment and infrastructure (K8s, CI/CD) |
| `docs/integrations/` | [Integration architecture](docs/integrations/INTEGRATION_ARCHITECTURE.md) (FHIR, EHR, pharmacy, lab, emergency, agent teams, verification) |

## Quick start

### Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) Docker for running services

### Web app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile (React Native / Expo)

```bash
cd apps/mobile
npm install
npm start
```

Set `EXPO_PUBLIC_GATEWAY_URL` (e.g. `http://10.0.2.2:8000` for Android emulator, `http://localhost:8000` for iOS simulator).

### Mobile (Flutter)

```bash
cd apps/flutter_app
flutter pub get
flutter run
```

Use `--dart-define=GATEWAY_URL=http://10.0.2.2:8000` for Android emulator if needed.

### USSD/IVR bridge

Expose gateway to USSD/IVR providers (e.g. Africa's Talking). Provider callbacks POST to this service, which calls the gateway and returns short, menu-friendly replies.

```bash
cd services/ussd && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8010
```

Configure your provider to point at `https://your-domain/ussd/callback`. Set `GATEWAY_URL` to your gateway base URL.

### Backend services (local)

```bash
# Gateway
cd services/gateway && pip install -r requirements.txt && uvicorn app.main:app --reload

# CDSS
cd services/cdss && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8002

# Knowledge
cd services/knowledge && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8003

# LLM Gateway
cd services/llm-gateway && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8001

# USSD bridge (optional)
cd services/ussd && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8010
```

Or run all backend services with `docker-compose up --build`.

## Environment

Copy `.env.example` to `.env` (per app/service as needed) and set:

- `NEXT_PUBLIC_GATEWAY_URL` for the web app
- `OPENAI_API_KEY` or equivalent for the LLM gateway
- Auth and vector DB keys when you enable those features

## License

Proprietary. See PRD classification.
