import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { JobsListClient } from '@/components/seeker/jobs-list-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Hitta jobb' }

export default async function SeekerJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: jobs }, { data: savedJobs }, { data: applications }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase.from('saved_jobs').select('job_id').eq('seeker_id', user.id),
    supabase.from('applications').select('job_id, match_score, status').eq('seeker_id', user.id),
  ])

  // Fetch company profiles separately to avoid FK join issues
  const recruiterIds = [...new Set((jobs ?? []).map(j => j.recruiter_id).filter(Boolean))]
  const { data: companyProfiles } = recruiterIds.length > 0
    ? await supabase
        .from('company_profiles')
        .select('recruiter_id, company_name, logo_url, industry')
        .in('recruiter_id', recruiterIds)
    : { data: [] }

  const companyMap = new Map((companyProfiles ?? []).map(c => [c.recruiter_id, c]))
  const savedJobIds = new Set(savedJobs?.map(s => s.job_id) ?? [])
  const applicationMap = new Map(applications?.map(a => [a.job_id, a]) ?? [])

  const enrichedJobs = (jobs ?? []).map(job => ({
    ...job,
    company_profile: companyMap.get(job.recruiter_id) ?? null,
    is_saved: savedJobIds.has(job.id),
    user_application: applicationMap.get(job.id) ?? null,
  }))

  return <JobsListClient jobs={enrichedJobs} userId={user.id} />
}
