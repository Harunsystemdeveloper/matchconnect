import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SeekerDashboard } from '@/components/dashboard/seeker-dashboard'
import RecruiterDashboard from '@/components/dashboard/recruiter-dashboard'
import { OnboardingTour } from '@/components/onboarding-tour'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.user_type === 'recruiter') {
    return (
      <>
        <RecruiterDashboard profile={profile} />
        <OnboardingTour userType="recruiter" />
      </>
    )
  }

  // Fetch seeker-specific data
  const [{ data: cvProfile }, { data: applications }, { count: savedJobsCount }] = await Promise.all([
    supabase.from('cv_profiles').select('*').eq('seeker_id', profile.id).single(),
    supabase
      .from('applications')
      .select('*, job:jobs(title, location, work_type, recruiter_id)')
      .eq('seeker_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase.from('saved_jobs').select('*', { count: 'exact', head: true }).eq('seeker_id', profile.id),
  ])

  // Fetch recommended jobs: active jobs whose skills overlap with seeker's skills, excluding already applied
  const appliedJobIds = (applications ?? []).map(a => a.job_id).filter(Boolean)
  let recommendedJobs: {
    id: string; title: string; location: string | null; work_type: string | null
    skills_required: string[] | null; salary_min: number | null; salary_max: number | null; currency: string
    company_profile: { company_name: string; industry: string | null } | null
    recruiter_id: string
  }[] = []

  if (cvProfile?.skills && cvProfile.skills.length > 0) {
    let query = supabase
      .from('jobs')
      .select('id, title, location, work_type, skills_required, salary_min, salary_max, currency, recruiter_id')
      .eq('status', 'active')
      .overlaps('skills_required', cvProfile.skills)
      .limit(8)

    if (appliedJobIds.length > 0) {
      query = query.not('id', 'in', `(${appliedJobIds.join(',')})`)
    }

    const { data: jobs } = await query

    // Fetch company profiles separately
    const recruiterIds = [...new Set((jobs ?? []).map(j => j.recruiter_id).filter(Boolean))]
    const { data: companyProfiles } = recruiterIds.length > 0
      ? await supabase.from('company_profiles').select('recruiter_id, company_name, industry').in('recruiter_id', recruiterIds)
      : { data: [] }
    const companyMap = new Map((companyProfiles ?? []).map(c => [c.recruiter_id, c]))

    // Sort by number of overlapping skills descending, take top 5
    recommendedJobs = ((jobs ?? []) as typeof recommendedJobs)
      .map(job => ({
        ...job,
        company_profile: companyMap.get(job.recruiter_id) ?? null,
        _overlap: (job.skills_required ?? []).filter(s => cvProfile.skills!.includes(s)).length,
      }))
      .sort((a, b) => (b as typeof b & { _overlap: number })._overlap - (a as typeof a & { _overlap: number })._overlap)
      .slice(0, 5)
  }

  return (
    <>
      <SeekerDashboard
        profile={profile}
        cvProfile={cvProfile}
        applications={applications ?? []}
        savedJobsCount={savedJobsCount ?? 0}
        recommendedJobs={recommendedJobs}
      />
      <OnboardingTour userType="job_seeker" />
    </>
  )
}
