
import { createClient } from '@supabase/supabase-js'
import type { AiDecisionType } from '@/types/database'
import { estimateCostUsd, type Usage } from './pricing'

// Uses service role to bypass RLS for logging — logs are read-only for users
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface LogAiDecisionParams {
  subjectUserId?: string | null
  triggeredByUserId: string
  decisionType: AiDecisionType
  jobId?: string
  applicationId?: string
  score?: number
  decisionSummary?: string
  decisionData?: Record<string, unknown>
  inputSkills?: string[]
  outputSkillsMatched?: string[]
  outputSkillsMissing?: string[]
  /** Vilken modell som faktiskt användes — default sonnet, ange 'claude-haiku-4-5-20251001' för lite-anrop. */
  modelId?: string
  /** Verklig token-usage från API-svaret (message.usage) — kostnad räknas ut därifrån, aldrig gissad. */
  usage?: Usage
}

export async function logAiDecision(params: LogAiDecisionParams): Promise<void> {
  const supabase = getServiceClient()
  const modelId = params.modelId ?? 'claude-sonnet-4-6'

  const { error } = await supabase.from('ai_decision_logs').insert({
    subject_user_id: params.subjectUserId ?? null,
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
    model_id: modelId,
    input_tokens: params.usage?.input_tokens ?? null,
    output_tokens: params.usage?.output_tokens ?? null,
    estimated_cost_usd: params.usage ? estimateCostUsd(modelId, params.usage) : null,
  })

  // Logging must never crash the main flow — only log errors
  if (error) {
    console.error('[AI Audit] Failed to log decision:', error.message)
  }
}
