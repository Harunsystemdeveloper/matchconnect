import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompanyProfileClient } from '@/components/recruiter/company-profile-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Företagsprofil' }

export default async function CompanyProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: company }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('company_profiles').select('*').eq('recruiter_id', user.id).single(),
  ])

  if (!profile || profile.user_type !== 'recruiter') redirect('/dashboard')

  return <CompanyProfileClient profile={profile} company={company} />
}
