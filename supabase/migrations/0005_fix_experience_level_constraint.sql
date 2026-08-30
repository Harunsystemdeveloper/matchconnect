-- 0005_fix_experience_level_constraint.sql
--
-- Buggfix: jobs.experience_level har en check-constraint i den live databasen (satt utanför
-- de spårade migrationerna) som bara tillåter 'junior' | 'mid' | 'senior' | 'lead'. Formuläret
-- för att skapa/redigera jobbannonser (job-form-client.tsx / job-edit-client.tsx) använder sedan
-- länge ett annat, mer användbart värdeset: 'ingen' | '1-2' | '3-5' | '5-10' | '10+' | 'chef' | 'executive'.
-- Det gör att ALLA nya jobbannonser misslyckas med:
--   new row for relation "jobs" violates check constraint "jobs_experience_level_check"
--
-- Fixen breddar constraint:en till att matcha formuläret (som ger bättre granularitet för
-- rekryterare än de fyra ursprungliga nivåerna).

alter table jobs drop constraint if exists jobs_experience_level_check;

alter table jobs add constraint jobs_experience_level_check
  check (experience_level is null or experience_level in (
    'ingen', '1-2', '3-5', '5-10', '10+', 'chef', 'executive'
  ));
