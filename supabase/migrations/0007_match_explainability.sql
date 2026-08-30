-- 0007_match_explainability.sql
--
-- Steg 2: Förbättrad explainability av matchningspoäng.
--
-- Matchningspoängen är inte längre bara ett tal + fri text — den bryts nu ner i
-- poäng per kategori (kompetens/erfarenhet/utbildning/kultur), topp 3 positiva
-- faktorer, topp 3 gap/risker och en kort motivering per kategori. Sparas dels på
-- ansökan (för snabb visning i UI) och dels i AI-beslutsloggen (för EU AI Act
-- Article 12/13 -- spårbarhet och rätt till förklaring).

alter table applications
  add column if not exists match_breakdown jsonb;

alter table ai_decision_logs
  add column if not exists decision_data jsonb;
