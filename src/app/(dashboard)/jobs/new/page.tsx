import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NewJobForm from '@/components/jobs/new-job-form'

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'recruiter') redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Skapa jobbannons</h1>
      <NewJobForm />
    </div>
  )
}
