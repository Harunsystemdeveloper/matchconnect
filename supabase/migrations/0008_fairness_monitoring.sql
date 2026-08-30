-- 0008_fairness_monitoring.sql
--
-- Steg 3: Fairness & Bias-övervakning.
--
-- candidate_demographics lagrar HELT FRIVILLIGA, samtyckesbaserade uppgifter (kön, födelseår)
-- som ENDAST kandidaten själv någonsin kan läsa/skriva/radera direkt. Rekryterare har INGEN
-- RLS-policy till denna tabell överhuvudtaget -- all aggregering för fairness-dashboarden görs
-- server-side med service-role via /api/fairness/analyze, som ENDAST returnerar aggregerade
-- gruppstatistik (aldrig enskilda kandidaters uppgifter) och som respekterar ett minsta
-- gruppstorlek-tröskelvärde (k-anonymitet) innan någon siffra visas.
--
-- Dessa uppgifter skickas ALDRIG till Claude och används ALDRIG i själva matchningen -- de
-- finns uteslutande för att i efterhand kunna upptäcka om matchningsresultaten råkar slå
-- systematiskt olika mellan grupper.

create table if not exists candidate_demographics (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null references profiles(id) on delete cascade unique,
  gender text check (gender in ('kvinna', 'man', 'annat')),
  birth_year integer check (birth_year between 1900 and extract(year from now())),
  consent_given_at timestamptz not null default now(),
  consent_version text not null default 'v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists candidate_demographics_updated_at on candidate_demographics;
create trigger candidate_demographics_updated_at
  before update on candidate_demographics
  for each row execute function set_timestamp();

alter table candidate_demographics enable row level security;

-- Endast kandidaten själv -- ingen policy för recruiter/service-konsumtion sker via RLS.
drop policy if exists "Seekers can manage own demographics" on candidate_demographics;
create policy "Seekers can manage own demographics"
  on candidate_demographics for all
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);

-- ai_decision_logs: en fairness-analys gäller en GRUPP sökande, inte en enskild person,
-- så subject_user_id måste kunna vara null för just den beslutstypen.
alter table ai_decision_logs alter column subject_user_id drop not null;

alter table ai_decision_logs drop constraint if exists ai_decision_logs_decision_type_check;
alter table ai_decision_logs add constraint ai_decision_logs_decision_type_check
  check (decision_type in (
    'cv_analysis',
    'match_score',
    'skill_gap_analysis',
    'interview_questions',
    'candidate_summary',
    'auto_match',
    'fairness_analysis'
  ));
