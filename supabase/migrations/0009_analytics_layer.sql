-- 0009_analytics_layer.sql
--
-- Steg 4: Mätbara resultat & ROI-underlag.
--
-- Lägger till två tidsstämplar på applications som sätts EN GÅNG (aldrig skrivs över) av
-- triggers, så att befintlig appkod (match-candidates, update-status) inte behöver ändras --
-- first_matched_at och decided_at fylls i automatiskt första gången match_score respektive
-- ett slutgiltigt status sätts. Time-to-shortlist och time-to-interview räknas istället ut
-- direkt från shortlist.created_at / interview_schedules.created_at, som redan finns.

alter table applications
  add column if not exists first_matched_at timestamptz,
  add column if not exists decided_at timestamptz;

create or replace function track_application_milestones()
returns trigger as $$
begin
  if new.match_score is not null and old.first_matched_at is null then
    new.first_matched_at = now();
  end if;

  if new.status in ('accepted', 'rejected') and old.status not in ('accepted', 'rejected') then
    new.decided_at = now();
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_track_milestones on applications;
create trigger applications_track_milestones
  before update on applications
  for each row execute function track_application_milestones();
