
import { createClient } from '@supabase/supabase-js'
import type { AiDecisionType, MatchBreakdown } from '@/types/database'

// Uses service role to bypass RLS for logging — logs are read-only for users
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface LogAiDecisionParams {
  subjectUserId: string
  triggeredByUserId: string
  decisionType: AiDecisionType
  jobId?: string
  applicationId?: string
  score?: number
  decisionSummary?: string
  decisionData?: MatchBreakdown
  inputSkills?: string[]
  outputSkillsMatched?: string[]
  outputSkillsMissing?: string[]
}

export async function logAiDecision(params: LogAiDecisionParams): Promise<void> {
  const supabase = getServiceClient()

  const { error } = await supabase.from('ai_decision_logs').insert({
    subject_user_id: params.subjectUserId,
    triggered_by_user_id: params.triggeredByUserId,
    decision_type: params.decisionType,
    job_id: params.jobId ?? null,
    application_id: params.applicationId ?? null,
    score: params.score ?? null,
    decision_summary: params.decisionSummary ?? null,
    decision_data: params.decisionData ?? null,
    input_skills: params.inputSkills ?? null,
    output_skills_matched: params.outputSkillsMatched ?? null,
    output_skills_missing: params.outputSkillsMissing ?? null,
    model_id: 'claude-sonnet-4-6',
  })

  // Logging must never crash the main flow — only log errors
  if (error) {
    console.error('[AI Audit] Failed to log decision:', error.message)
  }
}
