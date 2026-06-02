import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendStatusUpdateEmail } from '@/lib/email'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id, status } = await req.json()
  if (!application_id || !status) {
    return NextResponse.json({ error: 'application_id och status krävs' }, { status: 400 })
  }

  const validStatuses = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Ogiltigt status' }, { status: 400 })
  }

  // Verify the user is the recruiter who owns the job for this application
  const { data: app } = await supabase
    .from('applications')
    .select('job:jobs(recruiter_id)')
    .eq('id', application_id)
    .single()

  const job = Array.isArray(app?.job) ? app.job[0] : app?.job
  if (!job || (job as { recruiter_id: string }).recruiter_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', application_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Send email to seeker in background
  ;(async () => {
    try {
      const { data: application } = await supabase
        .from('applications')
        .select('seeker_id, job:jobs(id, title)')
        .eq('id', application_id)
        .single()

      if (!application) return
      const job = Array.isArray(application.job) ? application.job[0] : application.job
      if (!job) return

      const { data: seeker } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', application.seeker_id)
        .single()

      const { data: authData } = await supabase.auth.admin.getUserById(application.seeker_id)
      if (!authData?.user?.email) return

      await sendStatusUpdateEmail({
        seekerEmail: authData.user.email,
        seekerName: seeker?.full_name ?? 'Kandidat',
        jobTitle: job.title,
        newStatus: status,
        jobId: job.id,
      })
    } catch (err) {
      console.error('[update-status] email error:', err)
    }
  })()

  return NextResponse.json({ ok: true })
}
