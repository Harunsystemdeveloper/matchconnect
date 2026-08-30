import { createClient, createAdminClient } from '@/lib/supabase/server'
import { matchCandidates } from '@/lib/ai/claude'
import { logAiDecision } from '@/lib/ai/audit-log'
import { preScoreCandidates, selectTopCandidates } from '@/lib/ai/skill-similarity'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ job_id: z.string().uuid() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(`match-candidates:${user.id}`, 10)) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen om en timme.' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ogiltigt job_id' }, { status: 400 })

  // Verify recruiter owns the job
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', parsed.data.job_id)
    .eq('recruiter_id', user.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Jobb hittades inte' }, { status: 404 })

  // Fetch only applicants who have actually applied for this specific job
  const { data: applications } = await supabase
    .from('applications')
    .select('id, seeker_id, seeker:profiles(id, full_name)')
    .eq('job_id', parsed.data.job_id)

  if (!applications || applications.length === 0) {
    return NextResponse.json({ matches: [], message: 'Inga ansökningar att matcha än.' })
  }

  // Fetch cv_profiles via admin to bypass RLS — recruiter can't read other users' cv_profiles
  const admin = createAdminClient()
  const seekerIds = applications.map(a => a.seeker_id)
  const { data: cvProfiles } = await admin
    .from('cv_profiles')
    .select('seeker_id, skills, experience_years, ai_summary')
    .in('seeker_id', seekerIds)
  const cvMap = new Map((cvProfiles ?? []).map(cv => [cv.seeker_id, cv]))

  // Build candidate list from actual applicants only
  const candidates = applications.map((app) => {
    const seeker = Array.isArray(app.seeker) ? app.seeker[0] : app.seeker
    const cvProfile = cvMap.get(app.seeker_id) ?? null
    return {
      applicationId: app.id,
      id: seeker?.id ?? app.seeker_id,
      full_name: seeker?.full_name ?? null,
      cv_profile: cvProfile,
    }
  })

  try {
    // Hybrid step 1: fast skill-overlap pre-filter (free, instant)
    // Limits Claude calls to top 20 candidates max — cheaper + more focused
    const requiredSkills = job.skills_required ?? []
    const prescored = preScoreCandidates(requiredSkills, candidates)
    const topCandidates = selectTopCandidates(prescored, 20)

    // Candidates below threshold get pre-score directly without Claude
    const belowThreshold = prescored.filter(c => !topCandidates.includes(c))

    // Hybrid step 2: Claude deep-analysis on top candidates only
    const result = await matchCandidates(
      {
        title: job.title,
        description: job.description,
        skills_required: requiredSkills,
        experience_level: job.experience_level,
      },
      topCandidates.map((c) => ({
        id: c.id,
        full_name: c.full_name,
        cv_profile: c.cv_profile,
      }))
    )

    // Apply pre-scores for candidates not sent to Claude
    for (const c of belowThreshold) {
      result.matches.push({
        candidate_id: c.id,
        score: c.preScore,
        summary: 'Förfiltrerad: låg kompetensmatchning mot jobbkrav.',
        matching_skills: [],
        missing_skills: requiredSkills,
      })
    }

    // Update match scores on existing applications only — never create new ones
    for (const match of result.matches) {
      const breakdown = match.category_scores ? {
        category_scores: match.category_scores,
        category_reasoning: match.category_reasoning ?? {},
        top_positive_factors: match.top_positive_factors ?? [],
        top_gaps: match.top_gaps ?? [],
      } : null

      const { data: updatedApp } = await supabase
        .from('applications')
        .update({
          match_score: match.score,
          match_breakdown: breakdown,
          ai_summary: match.summary,
          skill_gaps: match.missing_skills,
          updated_at: new Date().toISOString(),
        })
        .eq('job_id', parsed.data.job_id)
        .eq('seeker_id', match.candidate_id)
        .select('id')
        .maybeSingle()

      void logAiDecision({
        subjectUserId: match.candidate_id,
        triggeredByUserId: user.id,
        decisionType: 'match_score',
        jobId: parsed.data.job_id,
        applicationId: updatedApp?.id,
        score: match.score,
        decisionSummary: match.summary,
        decisionData: breakdown ?? undefined,
        outputSkillsMatched: match.matching_skills,
        outputSkillsMissing: match.missing_skills,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json({ error: 'Matchning misslyckades' }, { status: 500 })
  }
}
