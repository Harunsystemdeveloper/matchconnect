import { createClient, createAdminClient } from '@/lib/supabase/server'
import { matchCandidates, matchCandidatesLite } from '@/lib/ai/claude'
import { logAiDecision } from '@/lib/ai/audit-log'
import { preScoreCandidates, selectTopCandidates } from '@/lib/ai/skill-similarity'
import { contentHash } from '@/lib/ai/cache-keys'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ job_id: z.string().uuid() })

// Steg 7: tre nivåer i matchningspipelinen, kostnad avtagande med relevans.
// 1) Gratis skill-overlap-filter (alla kandidater)
// 2) Nästa skikt -> Claude Haiku (billigare, "medium"-nivå, för de flesta kandidaterna)
// 3) Toppkandidaterna -> Claude Sonnet (fullständig kategoriuppdelning, dyrare men bäst)
const TOP_TIER_SONNET = 8
const MID_TIER_HAIKU = 20

function buildMatchInputHash(job: { title: string; description: string; skills_required: string[]; experience_level: string | null }, cv: { skills: string[] | null; experience_years: number | null; ai_summary: string | null } | null): string {
  return contentHash(
    job.title, job.description, job.skills_required?.join(','), job.experience_level,
    cv?.skills?.join(','), cv?.experience_years, cv?.ai_summary
  )
}

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
    .select('id, seeker_id, match_score, match_breakdown, ai_summary, skill_gaps, match_input_hash, seeker:profiles(id, full_name)')
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

  const jobForHash = { title: job.title, description: job.description, skills_required: job.skills_required ?? [], experience_level: job.experience_level }

  // Build candidate list from actual applicants only
  const candidates = applications.map((app) => {
    const seeker = Array.isArray(app.seeker) ? app.seeker[0] : app.seeker
    const cvProfile = cvMap.get(app.seeker_id) ?? null
    return {
      applicationId: app.id,
      id: seeker?.id ?? app.seeker_id,
      full_name: seeker?.full_name ?? null,
      cv_profile: cvProfile,
      currentHash: buildMatchInputHash(jobForHash, cvProfile),
      prevApp: app,
    }
  })

  try {
    // Steg 1: gratis skill-overlap-filter
    const requiredSkills = job.skills_required ?? []
    const prescored = preScoreCandidates(requiredSkills, candidates)
    const aiEligible = selectTopCandidates(prescored, TOP_TIER_SONNET + MID_TIER_HAIKU)
    const belowThreshold = prescored.filter(c => !aiEligible.includes(c))

    const sonnetTier = aiEligible.slice(0, TOP_TIER_SONNET)
    const haikuTier = aiEligible.slice(TOP_TIER_SONNET)

    // Steg 7-cache: kandidater vars jobb+CV-underlag är oförändrat sedan förra matchningen
    // behöver inte skickas till Claude igen — vi återanvänder den sparade bedömningen.
    const splitByCache = (tier: typeof aiEligible) => ({
      cached: tier.filter(c => c.prevApp.match_input_hash === c.currentHash && c.prevApp.match_score != null),
      fresh: tier.filter(c => !(c.prevApp.match_input_hash === c.currentHash && c.prevApp.match_score != null)),
    })
    const sonnetSplit = splitByCache(sonnetTier)
    const haikuSplit = splitByCache(haikuTier)

    const toClaudeInput = (c: typeof aiEligible[number]) => ({ id: c.id, full_name: c.full_name, cv_profile: c.cv_profile })

    const [sonnetResult, haikuResult] = await Promise.all([
      sonnetSplit.fresh.length > 0
        ? matchCandidates(jobForHash, sonnetSplit.fresh.map(toClaudeInput))
        : Promise.resolve({ matches: [], usage: null }),
      haikuSplit.fresh.length > 0
        ? matchCandidatesLite(jobForHash, haikuSplit.fresh.map(toClaudeInput))
        : Promise.resolve({ matches: [], usage: null }),
    ])

    const allMatches: Array<{
      candidate_id: string
      score: number
      summary: string
      matching_skills: string[]
      missing_skills: string[]
      category_scores?: Record<string, number>
      category_reasoning?: Record<string, string>
      top_positive_factors?: string[]
      top_gaps?: string[]
      _tier: 'sonnet' | 'haiku' | 'cached' | 'prefiltered'
      _hash?: string
    }> = []

    for (const m of sonnetResult.matches ?? []) allMatches.push({ ...m, _tier: 'sonnet', _hash: sonnetSplit.fresh.find(c => c.id === m.candidate_id)?.currentHash })
    for (const m of haikuResult.matches ?? []) allMatches.push({ ...m, _tier: 'haiku', _hash: haikuSplit.fresh.find(c => c.id === m.candidate_id)?.currentHash })

    // Cachade — återanvänd sparad bedömning, ingen ny AI-kostnad.
    for (const c of [...sonnetSplit.cached, ...haikuSplit.cached]) {
      const breakdown = c.prevApp.match_breakdown as { category_scores?: Record<string, number>; category_reasoning?: Record<string, string>; top_positive_factors?: string[]; top_gaps?: string[] } | null
      allMatches.push({
        candidate_id: c.id,
        score: c.prevApp.match_score!,
        summary: c.prevApp.ai_summary ?? '',
        matching_skills: [],
        missing_skills: c.prevApp.skill_gaps ?? [],
        ...breakdown,
        _tier: 'cached',
        _hash: c.currentHash,
      })
    }

    // Under tröskeln — gratis pre-score, ingen AI alls.
    for (const c of belowThreshold) {
      allMatches.push({
        candidate_id: c.id,
        score: c.preScore,
        summary: 'Förfiltrerad: låg kompetensmatchning mot jobbkrav.',
        matching_skills: [],
        missing_skills: requiredSkills,
        _tier: 'prefiltered',
      })
    }

    // Uppdatera bara ansökningar som faktiskt fick en NY bedömning (spar DB-skrivningar för cache-träffar).
    for (const match of allMatches) {
      if (match._tier === 'cached') continue

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
          match_input_hash: match._hash ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('job_id', parsed.data.job_id)
        .eq('seeker_id', match.candidate_id)
        .select('id')
        .maybeSingle()

      if (match._tier === 'sonnet' || match._tier === 'haiku') {
        void logAiDecision({
          subjectUserId: match.candidate_id,
          triggeredByUserId: user.id,
          decisionType: 'match_score',
          jobId: parsed.data.job_id,
          applicationId: updatedApp?.id,
          score: match.score,
          decisionSummary: match.summary,
          decisionData: { ...breakdown, tier: match._tier },
          outputSkillsMatched: match.matching_skills,
          outputSkillsMissing: match.missing_skills,
          modelId: match._tier === 'haiku' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6',
          usage: match._tier === 'sonnet' ? sonnetResult.usage ?? undefined : haikuResult.usage ?? undefined,
        })
      }
    }

    const cacheHits = sonnetSplit.cached.length + haikuSplit.cached.length
    return NextResponse.json({
      matches: allMatches.map(({ _tier, _hash, ...m }) => m),
      cost_optimization: {
        sent_to_sonnet: sonnetSplit.fresh.length,
        sent_to_haiku: haikuSplit.fresh.length,
        cache_hits: cacheHits,
        prefiltered_free: belowThreshold.length,
      },
    })
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json({ error: 'Matchning misslyckades' }, { status: 500 })
  }
}
