import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { JobFormClient } from '@/components/recruiter/job-form-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Skapa jobbannons' }

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'recruiter') redirect('/dashboard')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Skapa jobbannons</h1>
      <JobFormClient recruiterId={user.id} />
    </div>
  )
}
