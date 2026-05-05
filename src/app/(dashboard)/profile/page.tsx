import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileView from '@/components/dashboard/profile-view'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: cvProfile }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('cv_profiles').select('*').eq('seeker_id', user.id).maybeSingle(),
  ])

  if (!profile) redirect('/login')

  return <ProfileView profile={profile} cvProfile={cvProfile} />
}
