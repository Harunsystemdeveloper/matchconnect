-- 0011_candidate_activation.sql
--
-- Steg 8: Passiv kandidataktivering.
--
-- candidate_invites spårar varje "bjud in till jobb"-utskick separat från vanliga
-- meddelanden, så vi kan mäta öppnings- och svarsfrekvens specifikt för utskick — inte
-- bara generell chattaktivitet.

create table if not exists candidate_invites (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  message_id uuid references messages(id) on delete set null,
  match_score integer,
  opened_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique(recruiter_id, job_id, seeker_id)
);

create index if not exists candidate_invites_recruiter_idx on candidate_invites(recruiter_id);
create index if not exists candidate_invites_conversation_idx on candidate_invites(conversation_id);

alter table candidate_invites enable row level security;

drop policy if exists "Recruiters can manage own invites" on candidate_invites;
create policy "Recruiters can manage own invites"
  on candidate_invites for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

-- Kandidaten behöver kunna trigga "opened"/"responded" på sin egen inbjudan (via
-- track-endpointen, som kör som kandidatens session, inte rekryterarens).
drop policy if exists "Seekers can update open/response tracking on own invites" on candidate_invites;
create policy "Seekers can update open/response tracking on own invites"
  on candidate_invites for update
  using (auth.uid() = seeker_id)
  with check (auth.uid() = seeker_id);
