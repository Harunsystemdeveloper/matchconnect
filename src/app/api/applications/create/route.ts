import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendNewApplicationEmail } from '@/lib/email'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { job_id, cover_letter } = await req.json()
  if (!job_id) return NextResponse.json({ error: 'job_id krävs' }, { status: 400 })

  const { data: application, error } = await supabase
    .from('applications')
    .insert({ job_id, seeker_id: user.id, cover_letter: cover_letter || null, status: 'pending' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Send email to recruiter in background (non-blocking)
  ;(async () => {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('title, recruiter_id')
        .eq('id', job_id)
        .single()

      const { data: seeker } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (!job) return

      const { data: recruiter } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', job.recruiter_id)
        .single()

      // .auth.admin kräver service-role — den vanliga sessionsklienten har inte rättigheten.
      const admin = createAdminClient()
      const { data: authData } = await admin.auth.admin.getUserById(job.recruiter_id)

      if (!authData?.user?.email) return

      await sendNewApplicationEmail({
        recruiterEmail: authData.user.email,
        recruiterName: recruiter?.full_name ?? 'Rekryterare',
        seekerName: seeker?.full_name ?? 'En kandidat',
        jobTitle: job.title,
        jobId: job_id,
      })
    } catch (err) {
      console.error('[apply] email error:', err)
    }
  })()

  return NextResponse.json(application)
}
