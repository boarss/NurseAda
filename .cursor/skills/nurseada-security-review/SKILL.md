---
name: nurseada-security-review
description: Reviews NurseAda (web, Python gateway, Supabase, FHIR, LLM) for access control, secrets, abuse limits, and OWASP-style issues. Use when the user asks for a security review, vulnerability check, penetration-style audit, hardening, or OWASP alignment for this repository.
---

# NurseAda security review

## Scope (check each area)

1. **Gateway (`services/gateway`)** — `app/routers/*`, `app/services/auth.py`, `supabase_client.py`, `main.py` (CORS, `/docs`).
2. **Web (`apps/web`)** — `app/api/gateway/[...path]/route.ts`, `app/api/recommendations/route.ts`, chat rendering, env exposure (`NEXT_PUBLIC_*` vs server-only).
3. **LLM / CDSS / knowledge** — body limits, unauthenticated routes, upstream URLs (no user-controlled hosts).
4. **Supabase** — RLS on user tables; **never** rely on pre-check `select` alone when **service role** bypasses RLS on `PATCH`/`DELETE`.
5. **FHIR** — if `GATEWAY_FHIR_URL` is set, every patient read must bind **authenticated user → allowed Patient id** (see `routers/patient.py`).

## High-priority patterns (defense in depth)

| Risk | Where to look | What to verify |
|------|----------------|----------------|
| **IDOR / tenant bypass** | `services/gateway/app/services/supabase_client.py` `update()` | `PATCH` must filter by **both** row `id` **and** `user_id` (or equivalent tenant key). Pre-check `select` + update-by-id-only is **not** enough with service role. |
| **Horizontal patient access** | `services/gateway/app/routers/patient.py` | Any `GET /patient/{id}` must enforce mapping from JWT `sub` to permitted FHIR ids. |
| **Abuse / cost** | Chat, vision (`image_base64`), `/medications/check-interactions`, `/feedback`, `/api/recommendations` | Rate limits; max body size; max list lengths; max message history length; cap decoded image bytes. |
| **OpenAPI in prod** | `services/gateway/app/main.py` | Disable or protect `/docs` and `/openapi.json` in production. |
| **Security headers** | `apps/web/next.config.*` | CSP, HSTS (when on HTTPS), frame/embed policy as appropriate. |

## Secrets and env

- **OK in browser:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (RLS must protect data).
- **Server-only:** `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `GATEWAY_URL`, LLM/Pinecone keys. Never `NEXT_PUBLIC_` for these.
- Confirm production **fails fast** if required auth env vars are missing (avoid ambiguous “guest” behavior when JWT verification is off).

## CORS

Gateway uses `CORSMiddleware` with `allow_credentials=True`. **Never** set `allow_origins` to `*` with credentials. Keep production origins explicit (`CORS_ALLOW_ORIGINS`).

## Gateway proxy (Next)

`app/api/gateway/[...path]/route.ts`: upstream base comes **only** from server env — good for SSRF. Residual: treat as a **controlled open proxy**; restrict `GATEWAY_URL` reachability via network policy if needed.

## Chat / XSS

Prefer React text nodes for user content. If adding markdown/HTML later, sanitize or use a safe pipeline; avoid raw `dangerouslySetInnerHTML` for untrusted text.

## Output format for findings

When reporting to the user, group by **Critical / High / Medium / Low**, cite **file paths** (and symbols when helpful), state **impact**, and give **concrete fixes** (not generic advice).

## Verification commands (run when relevant)

- Web: `npm audit` in `apps/web` (or workspace root per project convention).
- Python: `pip-audit` / Dependabot on gateway and related services.

## OWASP Top 10 quick map

Use as a completeness check: broken access control (IDOR, FHIR), cryptographic failures (JWT secret, TLS), injection (PostgREST/LLM prompt), insecure design (guest + `patient_id`), misconfiguration (CORS, headers, docs), vulnerable components, auth failures, integrity (feedback fields), logging/PII leakage, SSRF (proxy, webhooks).
