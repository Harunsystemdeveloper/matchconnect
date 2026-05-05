-- 0002_features.sql
-- Lägger till saknade kolumner och nya tabeller för konkurrensfunktioner

-- Fix: saknade kolumner i jobs
alter table jobs
  add column if not exists views integer not null default 0,
  add column if not exists deadline timestamptz;

-- Fix: saknad kolumn i cv_profiles
alter table cv_profiles
  add column if not exists top_matches jsonb;

-- Fix: RPC-funktion för att öka visningsräknaren på jobb
create or replace function increment_job_views(job_id uuid)
returns void as $$
  update jobs set views = views + 1 where id = job_id;
$$ language sql security definer;

-- Notifikationer (persistent, läses upp i notification-bell)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, -- 'new_application' | 'status_change' | 'new_job_match' | 'interview_invite' | 'message'
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_user_read_idx on notifications(user_id, read);

-- Kandidat-CRM: anteckningar och taggar per kandidat (kopplade till seeker, ej ansökan)
create table if not exists candidate_notes (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references profiles(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  note text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists candidate_notes_recruiter_idx on candidate_notes(recruiter_id);
create index if not exists candidate_notes_seeker_idx on candidate_notes(seeker_id);
create index if not exists candidate_notes_recruiter_seeker_idx on candidate_notes(recruiter_id, seeker_id);

create trigger candidate_notes_updated_at
  before update on candidate_notes
  for each row execute function set_timestamp();

-- Intervjubokning
create table if not exists interview_schedules (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  recruiter_id uuid not null references profiles(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  proposed_times timestamptz[] not null default '{}', -- rekryteraren föreslår 3 tider
  confirmed_time timestamptz,
  location text,             -- "Google Meet" / "Kontoret, Storgatan 1" / etc
  meeting_link text,
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id)
);

create index if not exists interview_schedules_application_idx on interview_schedules(application_id);
create index if not exists interview_schedules_seeker_idx on interview_schedules(seeker_id);
create index if not exists interview_schedules_recruiter_idx on interview_schedules(recruiter_id);

create trigger interview_schedules_updated_at
  before update on interview_schedules
  for each row execute function set_timestamp();

-- RLS Policies

-- Notifications
alter table notifications enable row level security;

create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);

create policy "Users can update own notifications (mark read)"
  on notifications for update
  using (auth.uid() = user_id);

-- Candidate notes
alter table candidate_notes enable row level security;

create policy "Recruiters can CRUD own candidate notes"
  on candidate_notes for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

-- Interview schedules
alter table interview_schedules enable row level security;

create policy "Recruiter can manage interview schedules"
  on interview_schedules for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

create policy "Seeker can read own interview schedules"
  on interview_schedules for select
  using (auth.uid() = seeker_id);

create policy "Seeker can confirm interview (update confirmed_time)"
  on interview_schedules for update
  using (auth.uid() = seeker_id);
