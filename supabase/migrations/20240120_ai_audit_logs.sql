-- AI Decision Audit Log
-- Required by EU AI Act Article 12 (high-risk AI systems must maintain logs)
-- and GDPR Article 22 (automated decision-making transparency)

CREATE TABLE ai_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who was affected
  subject_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Who triggered the decision (could be same person or recruiter)
  triggered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What type of decision
  decision_type TEXT NOT NULL CHECK (decision_type IN (
    'cv_analysis',
    'match_score',
    'skill_gap_analysis',
    'interview_questions',
    'candidate_summary',
    'auto_match'
  )),

  -- Context
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,

  -- The AI decision output (sanitized — no raw CV text)
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  decision_summary TEXT,          -- Human-readable explanation from AI
  input_skills TEXT[],            -- Skills used as input (not raw text)
  output_skills_matched TEXT[],
  output_skills_missing TEXT[],

  -- AI model metadata
  model_id TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',

  -- Human oversight tracking
  was_reviewed_by_human BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  human_override_score INTEGER CHECK (human_override_score BETWEEN 0 AND 100),
  human_override_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_ai_logs_subject ON ai_decision_logs(subject_user_id);
CREATE INDEX idx_ai_logs_job ON ai_decision_logs(job_id);
CREATE INDEX idx_ai_logs_application ON ai_decision_logs(application_id);
CREATE INDEX idx_ai_logs_type ON ai_decision_logs(decision_type);
CREATE INDEX idx_ai_logs_created ON ai_decision_logs(created_at DESC);

-- RLS: users can only see logs where they are the subject
ALTER TABLE ai_decision_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own AI decision logs"
  ON ai_decision_logs FOR SELECT
  USING (auth.uid() = subject_user_id);

-- Recruiters can read logs they triggered (for jobs they own)
CREATE POLICY "Recruiters can read logs they triggered"
  ON ai_decision_logs FOR SELECT
  USING (auth.uid() = triggered_by_user_id);

-- Service role can insert (API routes use service role for logging)
CREATE POLICY "Service role can insert logs"
  ON ai_decision_logs FOR INSERT
  WITH CHECK (TRUE);

-- Recruiters can update human_override fields on logs they triggered
CREATE POLICY "Recruiters can mark logs as reviewed"
  ON ai_decision_logs FOR UPDATE
  USING (auth.uid() = triggered_by_user_id)
  WITH CHECK (auth.uid() = triggered_by_user_id);
