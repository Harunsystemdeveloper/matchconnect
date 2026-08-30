import { createClient, createAdminClient } from '@/lib/supabase/server'
import { logAiDecision } from '@/lib/ai/audit-log'
import { analyzeDimension, ageBucket, MIN_GROUP_SIZE, type GroupInput } from '@/lib/fairness/analysis'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ job_id: z.string().uuid().optional() })

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'recruiter') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!rateLimit(`fairness-analyze:${user.id}`, 30)) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen om en timme.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ogiltigt job_id' }, { status: 400 })

  // Jobb som ska ingå — antingen ett specifikt (måste ägas av rekryteraren) eller alla.
  let jobIds: string[]
  if (parsed.data.job_id) {
    const { data: job } = await supabase.from('jobs').select('id').eq('id', parsed.data.job_id).eq('recruiter_id', user.id).single()
    if (!job) return NextResponse.json({ error: 'Jobb hittades inte' }, { status: 404 })
    jobIds = [job.id]
  } else {
    const { data: jobs } = await supabase.from('jobs').select('id').eq('recruiter_id', user.id)
    jobIds = (jobs ?? []).map(j => j.id)
  }

  if (jobIds.length === 0) {
    return NextResponse.json({ error: 'Inga jobbannonser att analysera' }, { status: 400 })
  }

  // Admin-klient krävs: candidate_demographics har ingen RLS-policy för rekryterare,
  // med flit -- vi läser här bara för att bygga ANONYMISERAD aggregatstatistik,
  // enskilda kandidaters uppgifter returneras aldrig till klienten.
  const admin = createAdminClient()

  const { data: applications } = await admin
    .from('applications')
    .select('seeker_id, status, match_score')
    .in('job_id', jobIds)

  if (!applications || applications.length === 0) {
    return NextResponse.json({ error: 'Inga ansökningar att analysera' }, { status: 400 })
  }

  const seekerIds = [...new Set(applications.map(a => a.seeker_id))]
  const { data: demographics } = await admin
    .from('candidate_demographics')
    .select('seeker_id, gender, birth_year')
    .in('seeker_id', seekerIds)

  const demoMap = new Map((demographics ?? []).map(d => [d.seeker_id, d]))
  const isSelected = (status: string) => status === 'shortlisted' || status === 'accepted'

  function buildGroups(getGroupName: (seekerId: string) => string | null): GroupInput[] {
    const groups = new Map<string, GroupInput>()
    for (const app of applications ?? []) {
      const name = getGroupName(app.seeker_id)
      if (!name) continue
      if (!groups.has(name)) groups.set(name, { name, n: 0, selected: 0, scoreSum: 0, scoreCount: 0 })
      const g = groups.get(name)!
      g.n++
      if (isSelected(app.status)) g.selected++
      if (typeof app.match_score === 'number') { g.scoreSum += app.match_score; g.scoreCount++ }
    }
    return [...groups.values()]
  }

  const genderGroups = buildGroups(seekerId => demoMap.get(seekerId)?.gender ?? null)
  const ageGroups = buildGroups(seekerId => {
    const by = demoMap.get(seekerId)?.birth_year
    return by ? ageBucket(by) : null
  })

  const genderResult = analyzeDimension('gender', genderGroups)
  const ageResult = analyzeDimension('age_bucket', ageGroups)

  const totalWithDemographics = seekerIds.filter(id => demoMap.has(id)).length
  const humanReviewRequired = genderResult.human_review_required || ageResult.human_review_required

  const result = {
    job_ids: jobIds,
    total_applications: applications.length,
    total_candidates_with_demographics: totalWithDemographics,
    min_group_size: MIN_GROUP_SIZE,
    gender: genderResult,
    age_bucket: ageResult,
    human_review_required: humanReviewRequired,
    analyzed_at: new Date().toISOString(),
  }

  // AI Act / GDPR: logga fairness-beräkningen. Ingen enskild "subject" här -- gäller en grupp.
  void logAiDecision({
    triggeredByUserId: user.id,
    decisionType: 'fairness_analysis',
    jobId: parsed.data.job_id,
    decisionSummary: humanReviewRequired
      ? 'Möjlig systematisk skillnad upptäckt mellan grupper — mänsklig granskning krävs.'
      : 'Ingen statistiskt signifikant skillnad mellan grupper upptäckt.',
    decisionData: result,
  })

  return NextResponse.json(result)
}
