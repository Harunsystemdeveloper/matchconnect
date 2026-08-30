import { createClient } from '@/lib/supabase/server'
import { analyzeCv } from '@/lib/ai/claude'
import { logAiDecision } from '@/lib/ai/audit-log'
import { normalizeSkills } from '@/lib/ai/skill-ontology'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ cv_text: z.string().min(50).max(20000) })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(`analyze-cv:${user.id}`, 10)) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen om en timme.' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ogiltig indata' }, { status: 400 })

  try {
    const analysis = await analyzeCv(parsed.data.cv_text)
    const normalizedSkills = await normalizeSkills(analysis.skills ?? [])

    await supabase.from('cv_profiles').upsert({
      seeker_id: user.id,
      cv_text: parsed.data.cv_text,
      skills: normalizedSkills,
      experience_years: analysis.experience_years,
      education: analysis.education,
      languages: analysis.languages,
      ai_summary: analysis.summary,
      last_analyzed_at: new Date().toISOString(),
    })

    // AI Act: log the decision (fire-and-forget)
    void logAiDecision({
      subjectUserId: user.id,
      triggeredByUserId: user.id,
      decisionType: 'cv_analysis',
      decisionSummary: analysis.summary,
      outputSkillsMatched: normalizedSkills,
    })

    return NextResponse.json({ analysis: { ...analysis, skills: normalizedSkills } })
  } catch (error) {
    console.error('CV analysis error:', error)
    return NextResponse.json({ error: 'AI-analys misslyckades' }, { status: 500 })
  }
}
