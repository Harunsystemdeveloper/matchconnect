import { createClient } from '@/lib/supabase/server'
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
  const { data: candidates } = await supabase
    .from('cv_profiles')
    .select(`
      seeker_id,
      skills,
      experience_years,
      education,
      languages,
      ai_summary,
      last_analyzed_at,
      seeker:profiles!cv_profiles_seeker_id_fkey(
        id, full_name, avatar_url, headline, bio, location, website, created_at
      )
    `)
    .not('skills', 'is', null)
    .order('last_analyzed_at', { ascending: false })

  // Hämta rekryterarens jobb för "matcha mot jobb"-filtret
  const { data: recruiterJobs } = await supabase
    .from('jobs')
    .select('id, title, skills_required')
    .eq('recruiter_id', user.id)
    .eq('status', 'active')

  // Supabase returns joined relations as arrays — normalise to single object
  const normalised = (candidates ?? []).map(c => ({
    ...c,
    seeker: Array.isArray(c.seeker) ? (c.seeker[0] ?? null) : c.seeker,
  }))

  return (
    <TalentPoolClient
      candidates={normalised}
      recruiterJobs={recruiterJobs ?? []}
      recruiterId={user.id}
    />
  )
}
