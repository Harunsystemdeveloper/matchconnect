import { createClient } from '@/lib/supabase/server'
import { analyzeSkillGaps } from '@/lib/ai/claude'
import { logAiDecision } from '@/lib/ai/audit-log'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ job_id: z.string().uuid() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(`skill-gaps:${user.id}`, 20)) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen om en timme.' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ogiltigt job_id' }, { status: 400 })

  const [{ data: job }, { data: cvProfile }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', parsed.data.job_id).single(),
    supabase.from('cv_profiles').select('*').eq('seeker_id', user.id).single(),
  ])

  if (!job) return NextResponse.json({ error: 'Jobb hittades inte' }, { status: 404 })
  if (!cvProfile?.skills?.length) {
    return NextResponse.json({ error: 'Lägg till kompetenser i din profil först' }, { status: 400 })
  }

  try {
    const result = await analyzeSkillGaps(
      { title: job.title, description: job.description, skills_required: job.skills_required ?? [] },
      cvProfile.skills,
      cvProfile.experience_years ?? 0
    )

    // Save skill gaps to application if exists
    const { data: application } = await supabase.from('applications')
      .update({ skill_gaps: result.missing_skills, match_score: result.match_score })
      .eq('job_id', parsed.data.job_id)
      .eq('seeker_id', user.id)
      .select('id')
      .maybeSingle()

    void logAiDecision({
      subjectUserId: user.id,
      triggeredByUserId: user.id,
      decisionType: 'skill_gap_analysis',
      jobId: parsed.data.job_id,
      applicationId: application?.id,
      score: result.match_score,
      decisionSummary: result.gap_summary,
      inputSkills: cvProfile.skills,
      outputSkillsMatched: result.matching_skills,
      outputSkillsMissing: result.missing_skills,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Skill gap error:', error)
    return NextResponse.json({ error: 'Analys misslyckades' }, { status: 500 })
  }
}
