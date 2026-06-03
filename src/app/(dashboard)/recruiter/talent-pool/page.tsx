import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TalentPoolClient } from '@/components/recruiter/talent-pool-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Talangpool' }

export default async function TalentPoolPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'recruiter') redirect('/dashboard')

  // Hämta alla jobbsökare med CV-profil
  // Use admin client to bypass RLS — recruiter needs to see all candidate profiles
  const admin = createAdminClient()

  const { data: cvProfiles } = await admin
    .from('cv_profiles')
    .select('seeker_id, skills, experience_years, education, languages, ai_summary, last_analyzed_at')
    .order('last_analyzed_at', { ascending: false, nullsFirst: false })

  // Fetch seeker profiles (only job_seekers) via admin to bypass RLS
  const seekerIds = (cvProfiles ?? []).map(c => c.seeker_id)
  const { data: seekerProfiles } = seekerIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, full_name, avatar_url, headline, bio, location, website, created_at, user_type')
        .in('id', seekerIds)
        .eq('user_type', 'job_seeker')
    : { data: [] }

  const seekerMap = new Map((seekerProfiles ?? []).map(p => [p.id, p]))

  const normalised = (cvProfiles ?? []).map(c => ({
    ...c,
    seeker: seekerMap.get(c.seeker_id) ?? null,
  }))

  // Hämta rekryterarens jobb för "matcha mot jobb"-filtret
  const { data: recruiterJobs } = await supabase
    .from('jobs')
    .select('id, title, skills_required')
    .eq('recruiter_id', user.id)
    .eq('status', 'active')

  return (
    <TalentPoolClient
      candidates={normalised}
      recruiterJobs={recruiterJobs ?? []}
      recruiterId={user.id}
    />
  )
}
