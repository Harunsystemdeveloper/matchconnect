import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { JobEditClient } from '@/components/recruiter/job-edit-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Redigera annons' }

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Redigera annons</h1>
      <JobEditClient job={job} />
    </div>
  )
}
