-- 0003_scorecards_and_branding.sql
-- Strukturerade intervju-scorecards (bias-reduktion, à la Greenhouse) + karriärsidesbranding (à la Teamtailor)

-- Strukturerade intervjuutvärderingar. En rekryterare kan lämna flera scorecards per
-- ansökan (t.ex. ett per intervjusteg: screening, teknisk, kulturmöte), vilket gör
-- utvärderingen mer strukturerad och spårbar än ett enda "magkänsla"-beslut.
create table if not exists interview_scorecards (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  recruiter_id uuid not null references profiles(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  stage text not null default 'Intervju',           -- "Screening" / "Teknisk intervju" / "Kulturmöte" etc
  ratings jsonb not null default '[]',              -- [{ "question": string, "rating": 1-5, "comment": string }]
  overall_rating integer check (overall_rating between 1 and 5),
  recommendation text check (recommendation in ('strong_yes', 'yes', 'no', 'strong_no')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_scorecards_application_idx on interview_scorecards(application_id);
create index if not exists interview_scorecards_recruiter_idx on interview_scorecards(recruiter_id);

create trigger interview_scorecards_updated_at
  before update on interview_scorecards
  for each row execute function set_timestamp();

alter table interview_scorecards enable row level security;

create policy "Recruiters can CRUD own interview scorecards"
  on interview_scorecards for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

-- Karriärsidesbranding — låter rekryterare anpassa den publika företagssidan
-- utan utvecklarinvolvering (varumärkesfärg, omslagsbild, medarbetarcitat).
alter table company_profiles
  add column if not exists brand_color text,
  add column if not exists cover_image_url text,
  add column if not exists testimonials jsonb not null default '[]'; -- [{ "name": string, "role": string, "quote": string }]
