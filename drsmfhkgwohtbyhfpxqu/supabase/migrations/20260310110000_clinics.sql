-- Clinics: directory of healthcare facilities for NurseAda primary care network.
-- Gateway/knowledge services read from this table using the service role key.

create table clinics (
  id text primary key,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  phone text,
  specialties text[] not null default '{}'::text[],
  facility_type text not null
    check (facility_type in ('hospital', 'clinic', 'primary_health_center', 'specialist')),
  accepts_telemedicine boolean not null default false,
  hours text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clinics enable row level security;

-- Everyone can read clinics (public directory).
create policy "Clinics are readable by all"
  on clinics for select
  using (true);

-- Service role can manage clinics (admin flows).
create policy "Service role full access to clinics"
  on clinics for all
  using (auth.role() = 'service_role');

create index idx_clinics_state on clinics (state);
create index idx_clinics_type on clinics (facility_type);
create index idx_clinics_state_type on clinics (state, facility_type);

-- Auto-update updated_at on row changes (reuse shared function).
create trigger set_clinics_updated_at
  before update on clinics
  for each row
  execute function update_updated_at_column();

