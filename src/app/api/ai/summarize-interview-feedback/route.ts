import { createClient } from '@/lib/supabase/server'
import { summarizeInterviewFeedback } from '@/lib/ai/claude'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ application_id: z.string().uuid() })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(`interview-feedback-summary:${user.id}`, 20)) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen om en timme.' }, { status: 429 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ogiltigt application_id' }, { status: 400 })

  const { data: scorecards, error } = await supabase
    .from('interview_scorecards')
    .select('stage, overall_rating, recommendation, ratings, notes')
    .eq('application_id', parsed.data.application_id)
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!scorecards || scorecards.length === 0) {
    return NextResponse.json({ error: 'Inga scorecards att sammanfatta ännu' }, { status: 400 })
  }

  const { data: application } = await supabase
    .from('applications')
    .select('seeker:profiles!applications_seeker_id_fkey(full_name)')
    .eq('id', parsed.data.application_id)
    .single()
  const seeker = Array.isArray(application?.seeker) ? application.seeker[0] : application?.seeker
  const candidateName = (seeker as { full_name: string | null } | undefined)?.full_name ?? 'Kandidaten'

  try {
    const result = await summarizeInterviewFeedback(candidateName, scorecards)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Interview feedback summary error:', err)
    return NextResponse.json({ error: 'Sammanställning misslyckades' }, { status: 500 })
  }
}
