-- Appointments: user-facing appointment tracking with clinic references.
-- Gateway accesses via PostgREST using the service role key.

create table appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clinic_name text not null,
  clinic_id text,
  specialty text default '',
  appointment_type text not null default 'in_person'
    check (appointment_type in ('in_person', 'telemedicine')),
  reason text default '',
  preferred_date date,
  preferred_time text,
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'cancelled', 'completed')),
  severity text,
  referral_agent text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table appointments enable row level security;

create policy "Users can view own appointments"
  on appointments for select
  using (auth.uid() = user_id);

create policy "Users can create own appointments"
  on appointments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own appointments"
  on appointments for update
  using (auth.uid() = user_id);

create policy "Users can delete own appointments"
  on appointments for delete
  using (auth.uid() = user_id);

create policy "Service role full access"
  on appointments for all
  using (auth.role() = 'service_role');

create index idx_appointments_user on appointments (user_id);
create index idx_appointments_status on appointments (user_id, status);

create trigger set_appointments_updated_at
  before update on appointments
  for each row
  execute function update_updated_at_column();
