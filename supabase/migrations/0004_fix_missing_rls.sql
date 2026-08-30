-- 0004_fix_missing_rls.sql
--
-- Detta skript upptäcktes behöva göra mer än bara RLS: en direkt kontroll mot den live
-- databasen visade att 0002_features.sql aldrig applicerats fullt ut. Följande saknades helt:
--   - notifications, candidate_notes, interview_schedules (tabellerna finns inte alls)
--   - jobs.views-kolumnen + RPC-funktionen increment_job_views
--   - Tabellen hette "shortlists" (plural) i databasen, men all appkod och alla migrationer
--     förväntar sig "shortlist" (singular) — därav felet du fick.
--
-- Det här skriptet tar först ikapp det som saknas, döper om shortlists → shortlist, och
-- lägger sedan på RLS på alla fem tabeller som saknade det helt (company_profiles, saved_jobs,
-- shortlist, conversations, messages) samt på de nyskapade tabellerna.
--
-- Säker att köra i sin helhet — allt är skyddat med "if not exists" / omdöpning bara vid behov.

-- ============================================================================
-- STEG 1: Döp om shortlists → shortlist (om det gamla namnet fortfarande finns)
-- ============================================================================
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'shortlists')
     and not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'shortlist')
  then
    alter table shortlists rename to shortlist;
  end if;
end $$;

-- Om tabellen råkar saknas helt (fräsch databas) — skapa den i rätt namn.
create table if not exists shortlist (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references profiles(id) on delete cascade,
  application_id uuid not null references applications(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique(recruiter_id, application_id)
);

-- ============================================================================
-- STEG 2: Återskapa det som saknas från 0002_features.sql
-- ============================================================================

alter table jobs
  add column if not exists views integer not null default 0,
  add column if not exists deadline timestamptz;

alter table cv_profiles
  add column if not exists top_matches jsonb;

create or replace function increment_job_views(job_id uuid)
returns void as $$
  update jobs set views = views + 1 where id = job_id;
$$ language sql security definer;

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on notifications(user_id);
create index if not exists notifications_user_read_idx on notifications(user_id, read);

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

create table if not exists interview_schedules (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  recruiter_id uuid not null references profiles(id) on delete cascade,
  seeker_id uuid not null references profiles(id) on delete cascade,
  proposed_times timestamptz[] not null default '{}',
  confirmed_time timestamptz,
  location text,
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

-- set_timestamp() skapades i 0001_initial.sql — skapa den defensivt igen ifall den saknas.
create or replace function set_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists candidate_notes_updated_at on candidate_notes;
create trigger candidate_notes_updated_at
  before update on candidate_notes
  for each row execute function set_timestamp();

drop trigger if exists interview_schedules_updated_at on interview_schedules;
create trigger interview_schedules_updated_at
  before update on interview_schedules
  for each row execute function set_timestamp();

-- ============================================================================
-- STEG 3: RLS på de nyskapade tabellerna (från 0002_features.sql)
-- ============================================================================

alter table notifications enable row level security;

drop policy if exists "Users can read own notifications" on notifications;
create policy "Users can read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can insert notifications" on notifications;
create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);

drop policy if exists "Users can update own notifications (mark read)" on notifications;
create policy "Users can update own notifications (mark read)"
  on notifications for update
  using (auth.uid() = user_id);

alter table candidate_notes enable row level security;

drop policy if exists "Recruiters can CRUD own candidate notes" on candidate_notes;
create policy "Recruiters can CRUD own candidate notes"
  on candidate_notes for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

alter table interview_schedules enable row level security;

drop policy if exists "Recruiter can manage interview schedules" on interview_schedules;
create policy "Recruiter can manage interview schedules"
  on interview_schedules for all
  using (auth.uid() = recruiter_id)
  with check (auth.uid() = recruiter_id);

drop policy if exists "Seeker can read own interview schedules" on interview_schedules;
create policy "Seeker can read own interview schedules"
  on interview_schedules for select
  using (auth.uid() = seeker_id);

drop policy if exists "Seeker can confirm interview (update confirmed_time)" on interview_schedules;
create policy "Seeker can confirm interview (update confirmed_time)"
  on interview_schedules for update
  using (auth.uid() = seeker_id);

-- ============================================================================
-- STEG 4: KRITISK FIX — RLS på de fem tabellerna som helt saknade det
-- ============================================================================
-- company_profiles, saved_jobs, shortlist, conversations och messages skapades utan RLS.
-- Eftersom NEXT_PUBLIC_SUPABASE_ANON_KEY är publik (ligger i varje klientbundle) betydde
-- detta att VEM SOM HELST kunde läsa/skriva dessa tabeller direkt via Supabase REST API —
-- inklusive alla privata meddelanden — helt förbi appens egna inloggningskontroll.

alter table company_profiles enable row level security;

drop policy if exists "Company profiles are viewable by everyone" on company_profiles;
create policy "Company profiles are viewable by everyone"
  on company_profiles for select
  using (true);

drop policy if exists "Recruiters can insert own company profile" on company_profiles;
create policy "Recruiters can insert own company profile"
  on company_profiles for insert
  with check (recruiter_id = auth.uid());

drop policy if exists "Recruiters can update own company profile" on company_profiles;
create policy "Recruiters can update own company profile"
  on company_profiles for update
  using (recruiter_id = auth.uid())
  with check (recruiter_id = auth.uid());

alter table saved_jobs enable row level security;

drop policy if exists "Seekers can manage own saved jobs" on saved_jobs;
create policy "Seekers can manage own saved jobs"
  on saved_jobs for all
  using (seeker_id = auth.uid())
  with check (seeker_id = auth.uid());

alter table shortlist enable row level security;

drop policy if exists "Recruiters can manage own shortlist" on shortlist;
create policy "Recruiters can manage own shortlist"
  on shortlist for all
  using (recruiter_id = auth.uid())
  with check (recruiter_id = auth.uid());

alter table conversations enable row level security;

drop policy if exists "Participants can view own conversations" on conversations;
create policy "Participants can view own conversations"
  on conversations for select
  using (recruiter_id = auth.uid() or seeker_id = auth.uid());

drop policy if exists "Participants can create conversations they're part of" on conversations;
create policy "Participants can create conversations they're part of"
  on conversations for insert
  with check (recruiter_id = auth.uid() or seeker_id = auth.uid());

drop policy if exists "Participants can update own conversations" on conversations;
create policy "Participants can update own conversations"
  on conversations for update
  using (recruiter_id = auth.uid() or seeker_id = auth.uid());

alter table messages enable row level security;

drop policy if exists "Participants can view messages in own conversations" on messages;
create policy "Participants can view messages in own conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.recruiter_id = auth.uid() or c.seeker_id = auth.uid())
    )
  );

drop policy if exists "Participants can send messages as themselves" on messages;
create policy "Participants can send messages as themselves"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.recruiter_id = auth.uid() or c.seeker_id = auth.uid())
    )
  );

drop policy if exists "Participants can mark messages read in own conversations" on messages;
create policy "Participants can mark messages read in own conversations"
  on messages for update
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.recruiter_id = auth.uid() or c.seeker_id = auth.uid())
    )
  );
