import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { JobDetailClient } from '@/components/seeker/job-detail-client'
import { JobViewTracker } from '@/components/job-view-tracker'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: job } = await supabase.from('jobs').select('title').eq('id', id).single()
  return { title: job?.title ?? 'Jobb' }
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: job }, { data: application }, { data: saved }, { data: cvProfile }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single(),
    supabase.from('applications').select('*').eq('job_id', id).eq('seeker_id', user.id).single(),
    supabase.from('saved_jobs').select('id').eq('job_id', id).eq('seeker_id', user.id).single(),
    supabase.from('cv_profiles').select('*').eq('seeker_id', user.id).single(),
  ])

  if (!job) notFound()

  // Fetch company profile separately
  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('company_name, logo_url, industry, location, website')
    .eq('recruiter_id', job.recruiter_id)
    .single()

  // Fetch similar jobs based on overlapping skills
  let similarJobs: { id: string; title: string; location: string | null; work_type: string | null; skills_required: string[] | null; company_profile: { company_name: string } | null }[] = []
  if (job.skills_required && job.skills_required.length > 0) {
    const { data: candidates } = await supabase
      .from('jobs')
      .select('id, title, location, work_type, skills_required, recruiter_id')
      .eq('status', 'active')
      .neq('id', id)
      .overlaps('skills_required', job.skills_required)
      .limit(3)

    if (candidates && candidates.length > 0) {
      const recruiterIds = [...new Set(candidates.map(j => j.recruiter_id))]
      const { data: companies } = await supabase
        .from('company_profiles')
        .select('recruiter_id, company_name')
        .in('recruiter_id', recruiterIds)
      const companyMap = new Map((companies ?? []).map(c => [c.recruiter_id, c]))
      similarJobs = candidates.map(j => ({
        ...j,
        company_profile: companyMap.get(j.recruiter_id) ?? null,
      }))
    }
  }

  const jobWithCompany = { ...job, company_profile: companyProfile ?? null }

  return (
    <>
      <JobViewTracker jobId={id} />
      <JobDetailClient
        job={jobWithCompany}
        application={application}
        isSaved={!!saved}
        cvProfile={cvProfile}
        userId={user.id}
        similarJobs={similarJobs}
      />
    </>
  )
}
