import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RecruiterAnalyticsClient } from '@/components/recruiter/analytics-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'recruiter') redirect('/dashboard')

  // Alla jobb för denna rekryterare
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, created_at, views')
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  const jobIds = (jobs ?? []).map(j => j.id)

  // Alla ansökningar
  const { data: applications } = jobIds.length > 0
    ? await supabase
        .from('applications')
        .select('id, job_id, status, match_score, first_matched_at, decided_at, created_at, updated_at')
        .in('job_id', jobIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const applicationIds = (applications ?? []).map(a => a.id)

  // Shortlists (för både antal och time-to-shortlist)
  const { data: shortlistRows } = await supabase
    .from('shortlist')
    .select('application_id, created_at')
    .eq('recruiter_id', user.id)

  // Intervjubokningar (för time-to-interview och andel som når intervju)
  const { data: interviewRows } = applicationIds.length > 0
    ? await supabase
        .from('interview_schedules')
        .select('application_id, created_at')
        .in('application_id', applicationIds)
    : { data: [] }

  return (
    <RecruiterAnalyticsClient
      jobs={jobs ?? []}
      applications={applications ?? []}
      shortlistCount={shortlistRows?.length ?? 0}
      shortlistEvents={shortlistRows ?? []}
      interviewEvents={interviewRows ?? []}
    />
  )
}
