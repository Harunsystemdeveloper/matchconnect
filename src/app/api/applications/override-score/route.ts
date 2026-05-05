import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  application_id: z.string().uuid(),
  override_score: z.number().int().min(0).max(100),
  reason: z.string().min(10).max(500),
})

// AI Act Article 14: human oversight — recruiter can override AI score
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'recruiter') {
    return NextResponse.json({ error: 'Endast rekryterare kan överskriva AI-poäng' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ogiltig indata', details: parsed.error.flatten() }, { status: 400 })
  }

  // Verify recruiter owns the job this application belongs to
  const { data: application } = await supabase
    .from('applications')
    .select('id, seeker_id, match_score, job:jobs(id, recruiter_id)')
    .eq('id', parsed.data.application_id)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Ansökan hittades inte' }, { status: 404 })
  }

  const job = Array.isArray(application.job) ? application.job[0] : application.job
  if (job?.recruiter_id !== user.id) {
    return NextResponse.json({ error: 'Åtkomst nekad' }, { status: 403 })
  }

  // Update application with human override score
  const { error: updateError } = await supabase
    .from('applications')
    .update({
      match_score: parsed.data.override_score,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.application_id)

  if (updateError) {
    return NextResponse.json({ error: 'Kunde inte uppdatera poäng' }, { status: 500 })
  }

  // Log the human override in audit trail
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await serviceClient.from('ai_decision_logs').insert({
    subject_user_id: application.seeker_id,
    triggered_by_user_id: user.id,
    decision_type: 'match_score',
    job_id: job?.id,
    application_id: parsed.data.application_id,
    score: parsed.data.override_score,
    decision_summary: `Manuell överstyring av rekryterare: ${parsed.data.reason}`,
    model_id: 'human',
    was_reviewed_by_human: true,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    human_override_score: parsed.data.override_score,
    human_override_reason: parsed.data.reason,
  })

  return NextResponse.json({
    success: true,
    new_score: parsed.data.override_score,
  })
}
