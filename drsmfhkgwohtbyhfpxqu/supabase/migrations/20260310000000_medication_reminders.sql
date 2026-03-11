-- Medication reminders: user-facing medication tracking with reminder scheduling.
-- Gateway accesses via PostgREST using the service role key.

create table medication_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medication_name text not null,
  dosage text not null default '',
  frequency text not null default 'daily'
    check (frequency in ('daily', 'twice_daily', 'three_daily', 'weekly', 'custom')),
  reminder_times jsonb not null default '["08:00"]',
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table medication_reminders enable row level security;

create policy "Users can view own reminders"
  on medication_reminders for select
  using (auth.uid() = user_id);

create policy "Users can create own reminders"
  on medication_reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on medication_reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on medication_reminders for delete
  using (auth.uid() = user_id);

create policy "Service role full access"
  on medication_reminders for all
  using (auth.role() = 'service_role');

create index idx_reminders_user on medication_reminders (user_id);
create index idx_reminders_active on medication_reminders (user_id, is_active) where is_active = true;

-- Auto-update updated_at on row changes
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on medication_reminders
  for each row
  execute function update_updated_at_column();
