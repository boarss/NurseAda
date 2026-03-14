# NurseAda Environment Variables Setup

This guide walks you through setting up environment variables for local development and production.

## Quick Start (Local Development)

1. **Copy the root template** (if you haven't already):
   ```powershell
   Copy-Item .env.example .env
   ```

2. **Fill in required values** in `.env` (see below).

3. **Run the setup script** to propagate vars to all services:
   ```powershell
   .\scripts\setup-env.ps1
   ```

4. **Start the stack**:
   ```powershell
   .\scripts\start-dev-all.ps1
   ```

---

## Where Each Service Reads Its Env

| Location | Used By | Key Variables |
|----------|---------|----------------|
| `services/gateway/.env` | API Gateway | `GATEWAY_*`, `SUPABASE_*`, `CORS_ALLOW_ORIGINS` |
| `services/llm-gateway/.env` | LLM Gateway | `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `VISION_MODEL`, `COMPLETION_MODEL` |
| `services/fhir-adapter/.env` | FHIR Adapter | `FHIR_BASE_URL` |
| `apps/web/.env.local` | Next.js web app | `NEXT_PUBLIC_GATEWAY_URL`, `NEXT_PUBLIC_SUPABASE_*` |
| `apps/mobile/.env` | Expo mobile app | `EXPO_PUBLIC_GATEWAY_URL`, `EXPO_PUBLIC_SUPABASE_*` |

---

## Required Variables (Minimum to Run)

### 1. Gateway URL (Web & Mobile)

When using `start-dev-all.ps1`, the gateway runs on **port 8080**:

```
NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080
EXPO_PUBLIC_GATEWAY_URL=http://localhost:8080
```

For Android emulator, use `http://10.0.2.2:8080` instead of `localhost`.

### 2. OpenAI API Key (Chat & Vision)

Get a key from [platform.openai.com](https://platform.openai.com/api-keys):

```
OPENAI_API_KEY=sk-...
```

Without this, chat will fail and image analysis will return a fallback message.

### 3. Supabase Auth (Sign-in, Medications, Appointments)

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Go to **Settings → API → JWT Settings** and copy **JWT Secret** → `SUPABASE_JWT_SECRET`
4. For medication reminders and appointments, copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

Without Supabase, auth is disabled (guest mode). Chat works, but patient data and reminders require auth.

---

### 4. Minimal Independent Stack

For a self-contained NurseAda deployment (no hospital/FMC/EHR integration), you only need:

- **Gateway + LLM gateway** — chat and clinical agents (triage, general, medications).
- **Knowledge service** — herbal remedies, clinic directory, clinical content.
- **Supabase** — auth, medication reminders, appointments.
- **Web and/or mobile apps** — pointing at the gateway URL.

These variables should be set for the minimal stack:

- `NEXT_PUBLIC_GATEWAY_URL`, `EXPO_PUBLIC_GATEWAY_URL`
- `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL`, `COMPLETION_MODEL`, `VISION_MODEL`)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `GATEWAY_KNOWLEDGE_URL`, `GATEWAY_LLM_URL`

Everything else in the table below is **optional** and only needed when you integrate external systems (FHIR/EHR, CDSS, XAI, telecoms).

---

## Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `GATEWAY_KNOWLEDGE_URL` | Herbal remedies, clinic directory | `http://127.0.0.1:8003` (set by start script) |
| `GATEWAY_CDSS_URL` | Triage, drug interactions | `http://127.0.0.1:8002` |
| `GATEWAY_XAI_URL` | Saliency heatmaps | `http://127.0.0.1:8012` |
| `GATEWAY_LLM_URL` | LLM completions | `http://127.0.0.1:8001` |
| `GATEWAY_FHIR_URL` | Patient data from EHR | — |
| `FHIR_BASE_URL` | Upstream FHIR server | `https://hapi.fhir.org/baseR4` (test server) |
| `OPENAI_BASE_URL` | Custom OpenAI-compatible endpoint | — |
| `VISION_MODEL` | Model for image analysis | `gpt-4o` |
| `COMPLETION_MODEL` | Model for chat | `gpt-4o` |
| `CORS_ALLOW_ORIGINS` | Allowed web origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `KNOWLEDGE_CLINICS_SOURCE` | Source for clinic directory (`memory` or `supabase`) | `memory` |
| `GATEWAY_ADMIN_EMAILS` | Comma-separated list of admin emails for clinic management | — |

---

## Production

Use `.env.production.example` as a template. Key differences:

- `NEXT_PUBLIC_GATEWAY_URL` → your deployed gateway (e.g. `https://nurseada-gateway.onrender.com`)
- `CORS_ALLOW_ORIGINS` → include your Vercel domain
- Set all Supabase and OpenAI keys in your hosting dashboard (Vercel, Render, EAS)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Gateway not found" | Ensure gateway is running and `NEXT_PUBLIC_GATEWAY_URL` matches (8080 for start-dev-all) |
| Chat returns errors | Set `OPENAI_API_KEY` and ensure LLM gateway is running (port 8001) |
| Sign-in doesn't work | Set all `SUPABASE_*` and `NEXT_PUBLIC_SUPABASE_*` vars |
| Herbal remedies empty | Set `GATEWAY_KNOWLEDGE_URL` and run Knowledge service (8003) |
| CORS errors in browser | Add your frontend URL to `CORS_ALLOW_ORIGINS` |
