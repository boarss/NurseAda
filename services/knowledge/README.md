# NurseAda Knowledge service

FastAPI app for clinical/herbal retrieval, clinic directory, and (optional) vector-backed RAG.

## Supabase-backed content (optional)

By default, clinical and herbal entries are served from Python modules. To read from Postgres instead:

1. Apply migrations: `drsmfhkgwohtbyhfpxqu/supabase/migrations/20260320130000_medical_knowledge.sql` and `20260320131000_medical_knowledge_seed.sql`.
2. Set on this service:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `KNOWLEDGE_CLINICAL_SOURCE=supabase` and/or `KNOWLEDGE_HERBAL_SOURCE=supabase`

Clinic directory uses `KNOWLEDGE_CLINICS_SOURCE=supabase` the same way (see `app/clinic_content.py`).

**Regenerate seed SQL** after editing in-code knowledge:

```bash
python scripts/generate_medical_knowledge_seed.py
```

(Run from repository root; writes `drsmfhkgwohtbyhfpxqu/supabase/migrations/20260320131000_medical_knowledge_seed.sql`.)

## Tests

```bash
pytest services/knowledge/tests/
```
