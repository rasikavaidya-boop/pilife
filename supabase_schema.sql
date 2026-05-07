-- ══════════════════════════════════════════
--  PiLife — paste this in Supabase SQL Editor
-- ══════════════════════════════════════════

-- Projects
create table if not exists projects (
  id         bigserial primary key,
  user_id    uuid not null references auth.users on delete cascade,
  name       text not null,
  color      text not null default '#7c5cbf',
  goal_hrs   numeric not null default 10,
  created_at timestamptz not null default now()
);

-- Time logs
create table if not exists time_logs (
  id           bigserial primary key,
  user_id      uuid not null references auth.users on delete cascade,
  project_id   bigint references projects on delete set null,
  description  text,
  duration_hrs numeric not null check (duration_hrs > 0),
  logged_date  date not null default current_date,
  source       text not null default 'manual',
  created_at   timestamptz not null default now()
);

-- Indexes
create index if not exists projects_user_idx   on projects  (user_id);
create index if not exists logs_user_idx       on time_logs (user_id);
create index if not exists logs_date_idx       on time_logs (logged_date);
create index if not exists logs_project_idx    on time_logs (project_id);

-- Row Level Security
alter table projects  enable row level security;
alter table time_logs enable row level security;

-- Users can only see and modify their own data
create policy "own projects"  on projects  for all using (auth.uid() = user_id);
create policy "own time_logs" on time_logs for all using (auth.uid() = user_id);
