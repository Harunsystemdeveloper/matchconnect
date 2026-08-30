-- 0010_cost_optimization.sql
--
-- Steg 7: Kostnadsoptimering av AI-anrop.
--
-- - ai_decision_logs: verklig token-usage + uppskattad kostnad per AI-anrop, hämtat direkt
--   från Anthropics API-svar (usage.input_tokens/output_tokens) -- inga gissningar.
-- - cv_profiles.cv_text_hash: gör att identisk CV-text kan kännas igen och slippa
--   omanalyseras av Claude.
-- - applications.match_input_hash: gör att en omatchning kan hoppa över kandidater vars
--   jobb+CV-underlag inte ändrats sedan förra AI-matchningen.

alter table ai_decision_logs
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists estimated_cost_usd numeric(10, 6);

alter table cv_profiles
  add column if not exists cv_text_hash text;

alter table applications
  add column if not exists match_input_hash text;

create index if not exists applications_match_input_hash_idx on applications(match_input_hash);
