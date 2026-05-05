import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CandidatesClient } from '@/components/recruiter/candidates-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Kandidater' }

export default async function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('recruiter_id', user.id)
    .single()

  if (!job) notFound()

  const { data: applications } = await supabase
    .from('applications')
    .select('*, seeker:profiles(id, full_name, avatar_url, headline, location), cv:cv_profiles(skills, experience_years, ai_summary, languages)')
    .eq('job_id', id)
    .order('match_score', { ascending: false, nullsFirst: false })

  const { data: shortlisted } = await supabase
    .from('shortlist')
    .select('application_id')
    .eq('recruiter_id', user.id)

  const shortlistedIds = new Set(shortlisted?.map(s => s.application_id) ?? [])
  const appliedSeekerIds = new Set((applications ?? []).map(a => a.seeker_id))

  // Suggested: seekers who have NOT applied but whose skills overlap with the job
  let suggestedProfiles: {
    id: string; full_name: string | null; avatar_url: string | null
    headline: string | null; location: string | null
    cv: { skills: string[] | null; experience_years: number | null } | null
    overlap: number
  }[] = []

  if (job.skills_required?.length) {
    const { data: cvMatches } = await supabase
      .from('cv_profiles')
      .select('seeker_id, skills, experience_years, seeker:profiles(id, full_name, avatar_url, headline, location)')
      .overlaps('skills', job.skills_required)
      .limit(20)

    suggestedProfiles = (cvMatches ?? [])
      .filter(cv => !appliedSeekerIds.has(cv.seeker_id))
      .map(cv => {
        const seeker = Array.isArray(cv.seeker) ? cv.seeker[0] : cv.seeker
        return {
          id: cv.seeker_id,
          full_name: seeker?.full_name ?? null,
          avatar_url: seeker?.avatar_url ?? null,
          headline: seeker?.headline ?? null,
          location: seeker?.location ?? null,
          cv: { skills: cv.skills, experience_years: cv.experience_years },
          overlap: (cv.skills ?? []).filter((s: string) => job.skills_required!.includes(s)).length,
        }
      })
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 5)
  }

  return (
    <CandidatesClient
      job={job}
      applications={(applications ?? []).map(a => ({ ...a, is_shortlisted: shortlistedIds.has(a.id) }))}
      recruiterId={user.id}
      suggestedProfiles={suggestedProfiles}
    />
  )
}
