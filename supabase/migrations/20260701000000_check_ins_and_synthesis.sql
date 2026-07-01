-- Run this in the Supabase SQL Editor (or `supabase db push` if you use the CLI).
-- Adds persistence for daily check-ins and weekly synthesis emails.
-- Required by lib/check-ins.ts, lib/claude.ts, and the /api/mood/* routes.

create table if not exists check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  mood_score smallint not null check (mood_score between 1 and 10),
  energy_level smallint not null check (energy_level between 1 and 10),
  stress_level smallint not null check (stress_level between 1 and 10),
  journal_entry text,

  insight text,
  root_cause text,
  micro_intervention text,
  pattern_detected text default 'none',

  is_crisis boolean not null default false,
  is_breakthrough boolean not null default false
);

create index if not exists check_ins_user_created_idx
  on check_ins (user_id, created_at desc);

alter table check_ins enable row level security;

create policy "Users can read their own check-ins"
  on check_ins for select
  using (auth.uid() = user_id);

create policy "Users can insert their own check-ins"
  on check_ins for insert
  with check (auth.uid() = user_id);

-- One row per user per ISO week. week_start is the Monday (UTC) of that week.
create table if not exists weekly_syntheses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  created_at timestamptz not null default now(),

  subject text not null,
  body text not null,
  emailed_at timestamptz,

  unique (user_id, week_start)
);

alter table weekly_syntheses enable row level security;

create policy "Users can read their own weekly syntheses"
  on weekly_syntheses for select
  using (auth.uid() = user_id);
