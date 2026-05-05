-- 0001_initial.sql
-- Skapar de grundläggande datamodellerna för MatchConnect

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null check (user_type in ('job_seeker', 'recruiter')),
  full_name text,
  avatar_url text,
  headline text,
  bio text,
  location text,
  website text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_profiles (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references profiles(id) on delete cascade,
  company_name text not null,
  logo_url text,
  industry text,
  description text,
  website text,
  location text,
  size text check (size in ('1-10','11-50','51-200','201-500','500+')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  requirements text,
  skills_required text[],
  experience_level text,
  location text,
  work_type text check (work_type in ('remote', 'hybrid', 'on-site')),
  salary_min integer,
  salary_max integer,
  currency text default 'SEK',
  status text default 'active' check (status in ('active', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cv_profiles (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references profiles(id) on delete cascade unique,
  cv_url text,
  cv_text text,
  skills text[],
  experience_years integer,
  education text,
  languages text[],
  ai_summary text,
  last_analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  match_score integer check (match_score between 0 and 100),
  ai_summary text,
  skill_gaps text[],
  interview_questions text[],
  cover_letter text,
  status text default 'pending' check (status in ('pending','reviewed','shortlisted','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, seeker_id)
);

create table if not exists saved_jobs (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(seeker_id, job_id)
);

create table if not exists shortlist (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references profiles(id) on delete cascade,
  application_id uuid not null references applications(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique(recruiter_id, application_id)
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references profiles(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Triggers for updated_at
create or replace function set_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles for each row execute function set_timestamp();
create trigger company_profiles_updated_at before update on company_profiles for each row execute function set_timestamp();
create trigger jobs_updated_at before update on jobs for each row execute function set_timestamp();
create trigger applications_updated_at before update on applications for each row execute function set_timestamp();
