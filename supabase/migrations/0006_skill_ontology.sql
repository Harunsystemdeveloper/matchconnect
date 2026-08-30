-- 0006_skill_ontology.sql
--
-- Steg 1: Skill Ontology & Normalisering.
--
-- En kanonisk kompetenstabell så att t.ex. "React", "React.js" och "ReactJS" behandlas som
-- SAMMA kompetens vid matchning/kompetensgap/filtrering, medan genuint olika kompetenser som
-- råkar likna varandra i namn (t.ex. "React" och "React Native") hålls isär.
--
-- Tabellen växer själv: normalizeSkills() i src/lib/ai/skill-ontology.ts slår först upp mot
-- denna tabell (gratis, instant), och ber Claude kanonisera bara de kompetenser som aldrig
-- setts förut — resultatet sparas tillbaka hit så nästa uppslag är gratis igen.

create table if not exists skill_ontology (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  aliases text[] not null default '{}',
  category text, -- 'språk' | 'ramverk' | 'verktyg' | 'metodik' | 'certifiering' | 'mjuk kompetens' | 'domänkunskap' | 'övrigt'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Skiftlägesokänslig unikhet på det kanoniska namnet.
create unique index if not exists skill_ontology_canonical_lower_idx
  on skill_ontology (lower(canonical_name));

create index if not exists skill_ontology_aliases_idx
  on skill_ontology using gin (aliases);

drop trigger if exists skill_ontology_updated_at on skill_ontology;
create trigger skill_ontology_updated_at
  before update on skill_ontology
  for each row execute function set_timestamp();

alter table skill_ontology enable row level security;

-- Referensdata: läsbar av alla inloggade användare (visas i UI för både kandidat och
-- rekryterare), men skrivs bara av servern (service role, kringgår RLS) via
-- normalizeSkills() — aldrig direkt av klienten.
drop policy if exists "Anyone authenticated can read skill ontology" on skill_ontology;
create policy "Anyone authenticated can read skill ontology"
  on skill_ontology for select
  using (auth.role() = 'authenticated');

-- Startdata. Notera att "React" och "React Native" MEDVETET hålls som separata kanoniska
-- kompetenser (olika ramverk), medan "React"/"React.js"/"ReactJS" slås ihop till en.
insert into skill_ontology (canonical_name, aliases, category) values
  ('React', array['react.js', 'reactjs', 'react js'], 'ramverk'),
  ('React Native', array['react-native', 'reactnative', 'react native'], 'ramverk'),
  ('Next.js', array['nextjs', 'next js', 'next'], 'ramverk'),
  ('Vue.js', array['vue', 'vuejs', 'vue js'], 'ramverk'),
  ('Angular', array['angularjs', 'angular.js', 'angular js'], 'ramverk'),
  ('Node.js', array['nodejs', 'node js', 'node'], 'ramverk'),
  ('Express.js', array['express', 'expressjs'], 'ramverk'),
  ('TypeScript', array['ts'], 'språk'),
  ('JavaScript', array['js', 'ecmascript', 'javascript es6'], 'språk'),
  ('Python', array['python3', 'py'], 'språk'),
  ('Java', array['java se', 'java ee'], 'språk'),
  ('C#', array['csharp', 'c sharp'], 'språk'),
  ('C++', array['cpp', 'c plus plus'], 'språk'),
  ('SQL', array['structured query language'], 'språk'),
  ('Docker', array['containerization', 'docker containers'], 'verktyg'),
  ('Kubernetes', array['k8s'], 'verktyg'),
  ('AWS', array['amazon web services'], 'verktyg'),
  ('Microsoft Azure', array['azure'], 'verktyg'),
  ('Git', array['git version control'], 'verktyg'),
  ('GitHub', array['github.com'], 'verktyg'),
  ('Figma', array['figma design'], 'verktyg'),
  ('Adobe Photoshop', array['photoshop', 'ps'], 'verktyg'),
  ('Machine Learning', array['ml', 'maskininlärning'], 'domänkunskap'),
  ('Projektledning', array['project management', 'projektledare'], 'mjuk kompetens'),
  ('Bokföring', array['book-keeping', 'löpande bokföring'], 'domänkunskap'),
  ('Redovisning', array['accounting', 'ekonomisk redovisning'], 'domänkunskap'),
  ('Patientvård', array['patient care'], 'domänkunskap'),
  ('Journalföring', array['journalsystem', 'patientjournal'], 'domänkunskap'),
  ('Pedagogik', array['pedagogisk kompetens', 'pedagogics'], 'domänkunskap'),
  ('Klassrumsledning', array['classroom management'], 'mjuk kompetens'),
  ('Försäljning', array['sales', 'säljteknik'], 'mjuk kompetens'),
  ('Kundservice', array['customer service', 'kundbemötande'], 'mjuk kompetens'),
  ('CAD', array['computer aided design', 'cad-ritning'], 'verktyg'),
  ('Excel', array['microsoft excel', 'ms excel'], 'verktyg'),
  ('Kommunikation', array['communication skills', 'kommunikationsförmåga'], 'mjuk kompetens'),
  ('Ledarskap', array['leadership', 'ledarskapsförmåga'], 'mjuk kompetens')
on conflict do nothing;
