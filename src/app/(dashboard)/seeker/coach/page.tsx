import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CoachClient } from '@/components/seeker/coach-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'AI-karriärcoach' }

export default async function CoachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')
  if (profile.user_type !== 'job_seeker') redirect('/dashboard')

  return <CoachClient profile={profile} />
}
