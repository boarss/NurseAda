-- Medical/clinical and herbal knowledge tables for NurseAda.
-- Pattern mirrors existing clinics/reminders migrations:
-- - public read
-- - service role full access
-- - updated_at trigger
--
-- Depends on update_updated_at_column() from 20260310000000_medication_reminders.sql.

create table if not exists medical_knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null default '',
  topic text not null default 'general',
  locale text not null default 'en',
  text text not null,
  source text not null default 'clinical',
  keywords text[] not null default '{}'::text[],
  evidence_level text
    check (evidence_level in ('strong', 'moderate', 'limited', 'traditional')),
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table medical_knowledge_chunks enable row level security;

create policy "Medical knowledge readable by all"
  on medical_knowledge_chunks for select
  using (true);

create policy "Service role full access to medical knowledge"
  on medical_knowledge_chunks for all
  using (auth.role() = 'service_role');

create index idx_mk_topic on medical_knowledge_chunks (topic);
create index idx_mk_active on medical_knowledge_chunks (is_active);
create index idx_mk_locale on medical_knowledge_chunks (locale);
create index idx_mk_keywords_gin on medical_knowledge_chunks using gin (keywords);

create trigger set_medical_knowledge_updated_at
  before update on medical_knowledge_chunks
  for each row
  execute function update_updated_at_column();

create table if not exists herbal_remedies (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  scientific_name text,
  local_names text[] not null default '{}'::text[],
  locale text not null default 'en',
  condition text not null default 'general',
  text text not null,
  source text not null default 'herbal',
  evidence_level text not null
    check (evidence_level in ('strong', 'moderate', 'limited', 'traditional')),
  contraindications text[] not null default '{}'::text[],
  drug_interactions text[] not null default '{}'::text[],
  blocked_populations text[] not null default '{}'::text[],
  keywords text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table herbal_remedies enable row level security;

create policy "Herbal remedies readable by all"
  on herbal_remedies for select
  using (true);

create policy "Service role full access to herbal remedies"
  on herbal_remedies for all
  using (auth.role() = 'service_role');

create index idx_herbal_condition on herbal_remedies (condition);
create index idx_herbal_active on herbal_remedies (is_active);
create index idx_herbal_evidence on herbal_remedies (evidence_level);
create index idx_herbal_keywords_gin on herbal_remedies using gin (keywords);
create index idx_herbal_local_names_gin on herbal_remedies using gin (local_names);

create trigger set_herbal_remedies_updated_at
  before update on herbal_remedies
  for each row
  execute function update_updated_at_column();

create table if not exists herbal_drug_interaction_rules (
  id uuid primary key default gen_random_uuid(),
  herb_keywords text[] not null default '{}'::text[],
  drug_keywords text[] not null default '{}'::text[],
  severity text not null
    check (severity in ('critical', 'major', 'moderate', 'minor')),
  message_template text not null,
  source text not null default 'interaction-table',
  locale text not null default 'en',
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table herbal_drug_interaction_rules enable row level security;

create policy "Herbal interaction rules readable by all"
  on herbal_drug_interaction_rules for select
  using (true);

create policy "Service role full access to herbal interaction rules"
  on herbal_drug_interaction_rules for all
  using (auth.role() = 'service_role');

create index idx_hdir_active on herbal_drug_interaction_rules (is_active);
create index idx_hdir_severity on herbal_drug_interaction_rules (severity);
create index idx_hdir_herb_keywords_gin on herbal_drug_interaction_rules using gin (herb_keywords);
create index idx_hdir_drug_keywords_gin on herbal_drug_interaction_rules using gin (drug_keywords);

create trigger set_herbal_drug_interaction_rules_updated_at
  before update on herbal_drug_interaction_rules
  for each row
  execute function update_updated_at_column();
