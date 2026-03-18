-- Patients: one-to-one mapping from Supabase auth user to a human-friendly patient code.
-- patient_code is guessable (sequential) and must never be used for authorization.

create sequence if not exists public.patient_number_seq;

create table if not exists public.patients (
  user_id uuid primary key references auth.users(id) on delete cascade,
  patient_number bigint not null default nextval('public.patient_number_seq'),
  patient_code text generated always as ('NA-' || lpad(patient_number::text, 6, '0')) stored,
  created_at timestamptz not null default now(),
  unique (patient_number),
  unique (patient_code)
);

alter table public.patients enable row level security;

-- Users can read only their own patient code.
create policy "Users can view own patient record"
  on public.patients for select
  using (auth.uid() = user_id);

-- Service role can manage patient records (admin/back-office flows).
create policy "Service role full access"
  on public.patients for all
  using (auth.role() = 'service_role');

create index if not exists idx_patients_user on public.patients (user_id);
create index if not exists idx_patients_code on public.patients (patient_code);

-- Auto-create patient row when a new auth user is created.
create or replace function public.handle_new_user_patient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.patients (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_patient on auth.users;

create trigger on_auth_user_created_patient
after insert on auth.users
for each row execute procedure public.handle_new_user_patient();

