import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  application_id: z.string().uuid(),
  seeker_id: z.string().uuid(),
  proposed_times: z.array(z.string().datetime()).min(1).max(5),
  location: z.string().max(200).optional(),
  meeting_link: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
})

const confirmSchema = z.object({
  id: z.string().uuid(),
  confirmed_time: z.string().datetime(),
})

const cancelSchema = z.object({
  id: z.string().uuid(),
})

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const applicationId = url.searchParams.get('application_id')
  if (!applicationId) return NextResponse.json({ error: 'application_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('interview_schedules')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ schedule: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('interview_schedules')
    .upsert({
      ...parsed.data,
      recruiter_id: user.id,
      status: 'pending',
      confirmed_time: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Skicka notis till kandidaten
  await supabase.from('notifications').insert({
    user_id: parsed.data.seeker_id,
    type: 'interview_invite',
    title: 'Intervjuinbjudan!',
    body: 'Du har fått en intervjuinbjudan. Välj en tid som passar dig.',
    href: '/seeker/interviews',
  })

  return NextResponse.json({ schedule: data })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.action === 'confirm') {
    const parsed = confirmSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await supabase
      .from('interview_schedules')
      .update({ confirmed_time: parsed.data.confirmed_time, status: 'confirmed' })
      .eq('id', parsed.data.id)
      .eq('seeker_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ schedule: data })
  }

  if (body.action === 'cancel') {
    const parsed = cancelSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await supabase
      .from('interview_schedules')
      .update({ status: 'cancelled' })
      .eq('id', parsed.data.id)
      .or(`recruiter_id.eq.${user.id},seeker_id.eq.${user.id}`)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ schedule: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
