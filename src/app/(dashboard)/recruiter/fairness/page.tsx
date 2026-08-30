import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FairnessDashboardClient } from '@/components/recruiter/fairness-dashboard-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Fairness & Bias-övervakning' }

export default async function FairnessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'recruiter') redirect('/dashboard')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  return <FairnessDashboardClient jobs={jobs ?? []} />
}
