import { createClient } from '@/lib/supabase/server'
import { matchCandidates } from '@/lib/ai/claude'
import { NextResponse } from 'next/server'

/**
 * Called automatically after a seeker uploads and analyzes their CV.
 * Finds the top active jobs that overlap with the seeker's skills,
 * runs AI match scoring, and stores results in applications (if applied)
 * or as pre-scored suggestions readable from cv_profiles.top_matches.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get seeker's cv profile
  const { data: cv } = await supabase
    .from('cv_profiles')
    .select('skills, experience_years, ai_summary')
    .eq('seeker_id', user.id)
    .single()

  if (!cv?.skills?.length) {
    return NextResponse.json({ ok: true, message: 'No skills to match against' })
  }

  // Find top active jobs with overlapping skills (max 10 to keep AI cost low)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, description, skills_required, requirements')
    .eq('status', 'active')
    .overlaps('skills_required', cv.skills)
    .limit(10)

  if (!jobs?.length) {
    return NextResponse.json({ ok: true, matched: 0 })
  }

  try {
    // Run AI match for this candidate against found jobs
    const candidate = {
      id: user.id,
      full_name: null,
      cv_profile: {
        skills: cv.skills,
        experience_years: cv.experience_years,
        ai_summary: cv.ai_summary,
      },
    }

    const results = await Promise.all(
      jobs.map(async (job) => {
        const result = await matchCandidates(
          {
            title: job.title,
            description: job.description,
            skills_required: job.skills_required ?? [],
            experience_level: null,
          },
          [candidate]
        )
        const match = result.matches?.[0]
        return match ? { job_id: job.id, score: match.score as number, summary: match.summary as string } : null
      })
    )

    const scored = results
      .filter((r): r is { job_id: string; score: number; summary: string } => r !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // Store top matches in cv_profiles as JSON for fast dashboard reads
    await supabase
      .from('cv_profiles')
      .update({ top_matches: scored } as Record<string, unknown>)
      .eq('seeker_id', user.id)

    return NextResponse.json({ ok: true, matched: scored.length, top: scored })
  } catch (err) {
    console.error('Auto-match error:', err)
    return NextResponse.json({ ok: false, error: 'Match failed' }, { status: 500 })
  }
}
