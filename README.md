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
| `services/xai` | Explainable AI: decision tree / logistic regression, SHAP, LIME, symptom heatmaps, saliency (radiology placeholder) |
| `packages/shared-ts` | Shared TypeScript types and constants |
| `infra` | Deployment and infrastructure (K8s, CI/CD) |
| `docs/integrations/` | [Integration architecture](docs/integrations/INTEGRATION_ARCHITECTURE.md) (FHIR, EHR, pharmacy, lab, emergency, agent teams, verification) |

## Quick start

### Prerequisites

- Node.js 18+
- Python 3.10+
- (Optional) Docker for running services

### Web app (and full stack)

**Option A – start everything (recommended):**

```powershell
.\scripts\start-dev-all.ps1
```

This starts CDSS (8002), XAI (8012), Gateway (8080), then the web app (3000). Open [http://localhost:3000](http://localhost:3000) and click **Start chat**.

**Option B – start only the web app:**

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For chat to work, run the gateway (and optionally CDSS/XAI) in other terminals—see "Backend services (local)" below.

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

## Authentication

NurseAda uses **Supabase Auth** (email + password). Create a Supabase project and set the env vars below.

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Gateway `.env` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Gateway `.env` | Supabase anon/public key |
| `SUPABASE_JWT_SECRET` | Gateway `.env` | JWT secret for backend token validation |
| `NEXT_PUBLIC_SUPABASE_URL` | Web `.env.local` | Supabase URL (browser client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web `.env.local` | Supabase anon key (browser client) |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile `.env` | Supabase URL (Expo) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile `.env` | Supabase anon key (Expo) |

**How it works:**

- The gateway validates Supabase JWTs on incoming requests. When `SUPABASE_JWT_SECRET` is unset (local dev), auth is disabled and all requests are treated as guest.
- Web and mobile apps use Supabase client-side SDKs for sign-in / sign-up and pass the access token in the `Authorization: Bearer` header to the gateway.
- Guest users can still chat but cannot access patient data or imaging features. Patient routes require authentication.
- No PII is logged in RLHF — only opaque Supabase `user_id` (UUID).

## Medical Imaging

NurseAda supports medical image analysis (X-ray, CT, MRI, skin photos, wounds) via LLM vision.

- **Web**: Click the camera button in the chat input to attach an image. A preview thumbnail appears both in the input area and in the message bubble after sending.
- **Mobile**: Tap the camera button to choose from your photo library or take a new photo. The image is shown in the message bubble.
- **Backend**: The imaging agent sends the image to the LLM gateway `POST /v1/vision`, which calls GPT-4o (configurable via `VISION_MODEL`). The XAI service provides supplementary saliency heatmaps when configured.
- Set `OPENAI_API_KEY` for vision to work. Without it, the imaging agent returns a fallback directing users to a radiologist.

## Herbal Remedies

NurseAda provides evidence-based herbal and natural remedy recommendations relevant to Nigeria and Africa, complementary to conventional medicine.

- **22 remedies** covering nausea, malaria, cough, headache, diarrhea, fever, pain, fatigue, hypertension, skin, dental, congestion, and more.
- Each remedy includes preparation instructions, dosage guidance, evidence level, contraindications, and drug-herb interaction data.
- **Drug-herb interaction safety**: When a patient is on medications, the system checks for interactions (critical/major/moderate/minor severity) and warns accordingly.
- **Population safety**: Remedies unsafe for pregnant women, breastfeeding mothers, or young children are automatically filtered.

| Endpoint | Data |
|----------|------|
| `POST /retrieve/herbal` (knowledge) | Symptom-matched remedies with safety filtering |
| `GET /herbal/catalog` (gateway) | Browse all remedies (no auth required) |

- **Web**: Browse the full catalog at `/remedies` with search, condition filters, and evidence badges. The chat includes herbal suggested prompts and a "Remedies" nav link.
- **Mobile**: Tap "Herbal Remedies" on the home screen to browse. The chat includes herbal suggested prompts.
- Set `GATEWAY_KNOWLEDGE_URL` for the herbal feature to work.

## Patient Data

Authenticated users can view patient records from a FHIR-compatible EHR:

| Endpoint | Data |
|----------|------|
| `GET /patient/{id}` | Demographics (name, birth date, gender) |
| `GET /patient/{id}/observations` | Vitals and lab values |
| `GET /patient/{id}/medications` | Active prescriptions |
| `GET /patient/{id}/reports` | Diagnostic reports (lab, imaging) |

- **Web**: Enter a Patient ID in the chat header to see a summary banner. Click "Profile" to open the full patient profile page with tabbed Observations, Medications, and Reports.
- **Mobile**: Enter a Patient ID above the chat. Tap "Profile" to view the patient profile screen.
- All patient routes require authentication. Set `GATEWAY_FHIR_URL` to point at a FHIR R4 server (e.g. `https://hapi.fhir.org/baseR4` for testing).

## Localisation

NurseAda supports 5 languages: **English**, **Nigerian Pidgin**, **Hausa**, **Yoruba**, and **Igbo**.

| Component | Technology | Notes |
|-----------|-----------|-------|
| Translation files | `packages/locales/{en,pcm,ha,yo,ig}.json` | ~200 keys, nested JSON with namespaces |
| Web i18n | `next-intl` | `useTranslations()` hook, `NextIntlClientProvider` at layout level |
| Mobile i18n | `i18next` + `react-i18next` | `useTranslation()` hook, device locale detection via `expo-localization` |
| Language picker | Web dropdown, mobile bottom sheet | Saves to `localStorage` (web) / `AsyncStorage` (mobile) |
| Backend | `locale` field in `POST /chat` | Orchestrator passes to agents; discourse templates translated; LLM system prompts locale-aware |

**How language selection works:**

1. User picks a language from the picker (or the app auto-detects from browser/device settings).
2. All UI strings update immediately via the i18n provider.
3. Chat requests include the `locale` field, so backend responses come back in the chosen language.
4. The LLM receives a system prompt instructing it to respond in the target language.
5. Discourse templates (triage assessments, disclaimers, herbal disclaimers) are served in the user's language.

**Adding a new language:**

1. Create a new `{code}.json` in `packages/locales/` with all keys from `en.json`.
2. Add the code to `SUPPORTED_LANGUAGES` in `packages/shared-ts/src/types.ts`.
3. Add translations to `TRANSLATIONS` dict in `services/gateway/app/services/discourse.py`.
4. Add an instruction to `LOCALE_INSTRUCTIONS` in `services/llm-gateway/app/main.py`.
5. Add the language to the `LANGUAGES` array in both `LanguagePicker` components.
6. Import the new locale JSON in `apps/web/lib/IntlProvider.tsx` and `apps/mobile/lib/i18n.ts`.

## Environment

See **[ENV_SETUP.md](./ENV_SETUP.md)** for a step-by-step guide. Quick setup:

1. Copy `.env.example` to `.env` and fill in your API keys.
2. Run `.\scripts\setup-env.ps1` to propagate vars to all services.
3. Run `.\scripts\start-dev-all.ps1` to start the stack.

Key variables:

- `NEXT_PUBLIC_GATEWAY_URL` for the web app
- `OPENAI_API_KEY` for the LLM gateway and medical image analysis
- `VISION_MODEL` to override the default vision model (default: `gpt-4o`)
- Supabase Auth keys (see Authentication section above)
- `GATEWAY_KNOWLEDGE_URL` for herbal remedies and knowledge retrieval (see Herbal Remedies section above)
- `GATEWAY_FHIR_URL` for patient data access (see Patient Data section above)
- Vector DB keys when you enable those features

## License

Proprietary. See PRD classification.
