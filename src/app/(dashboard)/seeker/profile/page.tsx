import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SeekerProfileClient } from '@/components/seeker/seeker-profile-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Min profil' }

export default async function SeekerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: cvProfile }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('cv_profiles').select('*').eq('seeker_id', user.id).single(),
  ])

  if (!profile) redirect('/onboarding')

  return <SeekerProfileClient profile={profile} cvProfile={cvProfile} />
}
