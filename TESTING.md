# Testing NurseAda

This project has tests at three main layers: **backend services**, **web app**, and **end‑to‑end (e2e)** flows.

## Backend tests (Pytest)

- Services covered:
  - `services/gateway` (FastAPI API gateway and agents)
  - `services/cdss` (clinical decision support & triage)
  - `services/fhir-adapter` (FHIR proxy)
- To run the main backend tests:

```bash
npm run test:backend
```

or directly:

```bash
cd services/gateway && pytest tests
cd services/cdss && pytest tests
cd services/fhir-adapter && pytest tests
```

Shared fixtures for common FastAPI apps are defined in `services/conftest.py`.

## Web unit & integration tests (Vitest + Testing Library)

- Web app lives in `apps/web` (Next.js App Router, React, TypeScript).
- Vitest config: `apps/web/vitest.config.ts`.
- Global test setup (jsdom, jest-dom, Supabase/auth mocks): `apps/web/setupTests.ts`.
- Shared render helper (wraps `IntlProvider` and `AuthProvider`): `apps/web/test/renderWithProviders.tsx`.
- Page tests:
  - `app/chat/ChatPage.test.tsx`
  - `app/medications/MedicationsPage.test.tsx`
  - `app/remedies/RemediesPage.test.tsx`
  - `app/appointments/AppointmentsPage.test.tsx`
  - `app/patient/[id]/PatientPage.test.tsx`

Run all web unit/integration tests:

```bash
npm run test:web
```

## Web e2e tests (Playwright)

- Playwright config: `playwright.config.ts` (testDir `apps/web/e2e`).
- Example flows:
  - `apps/web/e2e/chat.spec.ts` – chat triage + disclaimer
  - `apps/web/e2e/medications.spec.ts` – medications tabs + disclaimer
  - `apps/web/e2e/remedies.spec.ts` – herbal catalog + disclaimer
  - `apps/web/e2e/appointments.spec.ts` – appointments tab switching
  - `apps/web/e2e/patient.spec.ts` – patient profile tabs (assumes auth + test patient)

Before running e2e tests you must:

1. Start the web app (and any required backend) on the same base URL used by Playwright:

```bash
npm run dev:web
```

2. Optionally set `PLAYWRIGHT_BASE_URL` to override the default `http://localhost:3000`.

Run e2e tests:

```bash
npm run test:e2e
```

## CI wiring

- Root `package.json` exposes:
  - `test:backend` – Pytest across key services.
  - `test:web` – Vitest unit/integration tests for the web app.
  - `test:e2e` – Playwright browser tests.
- In CI, run lint + typecheck + `test:backend` + `test:web` in parallel, and `test:e2e` against a deployed or locally started test environment.

