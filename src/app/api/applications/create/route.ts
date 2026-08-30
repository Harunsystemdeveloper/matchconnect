import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendNewApplicationEmail } from '@/lib/email'

// Vad riktiga jobbannonser faktiskt kräver av en sökande: telefonnummer (för att kunna
// kontaktas) och ett personligt brev med faktiskt innehåll (inte bara ett par ord) — inte
// bara ett formellt CV-krav som redan finns på plattformen. Tillgänglighet och löneanspråk
// förblir frivilligt, precis som i verkliga ansökningsflöden.
const schema = z.object({
  job_id: z.string().uuid(),
  phone: z.string().trim().min(6, 'Ange ett giltigt telefonnummer').max(30),
  cover_letter: z.string().trim().min(80, 'Skriv minst några meningar om varför du söker (minst 80 tecken)').max(2000),
  availability: z.string().max(100).optional(),
  salary_expectation: z.string().max(100).optional(),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter' }, { status: 400 })
  }
  const { job_id, phone, cover_letter, availability, salary_expectation } = parsed.data

  // Ett CV med analyserade kompetenser krävs innan man kan ansöka — annars kan varken
  // rekryteraren eller AI-matchningen bedöma ansökan på riktigt.
  const { data: cv } = await supabase
    .from('cv_profiles')
    .select('skills')
    .eq('seeker_id', user.id)
    .maybeSingle()

  if (!cv?.skills?.length) {
    return NextResponse.json(
      { error: 'Ladda upp och analysera ditt CV innan du ansöker, så rekryteraren kan bedöma din ansökan.' },
      { status: 400 }
    )
  }

  // Bygg det strukturerade brevet av de separata fälten server-side (så valideringen
  // ovan träffar de faktiska fälten, inte en redan hopklistrad text).
  const metaParts: string[] = [`📱 Telefon: ${phone}`]
  if (availability) metaParts.push(`📅 Tillgänglighet: ${availability}`)
  if (salary_expectation) metaParts.push(`💰 Löneanspråk: ${salary_expectation}`)
  const fullCoverLetter = [metaParts.join('\n'), cover_letter].join('\n\n')

  const { data: application, error } = await supabase
    .from('applications')
    .insert({ job_id, seeker_id: user.id, cover_letter: fullCoverLetter, status: 'pending' })
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
