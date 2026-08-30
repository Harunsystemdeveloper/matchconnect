import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ratingSchema = z.object({
  question: z.string().max(500),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(''),
})

const createSchema = z.object({
  application_id: z.string().uuid(),
  seeker_id: z.string().uuid(),
  stage: z.string().min(1).max(100).default('Intervju'),
  ratings: z.array(ratingSchema).default([]),
  overall_rating: z.number().int().min(1).max(5).optional(),
  recommendation: z.enum(['strong_yes', 'yes', 'no', 'strong_no']).optional(),
  notes: z.string().max(2000).optional(),
})

const updateSchema = createSchema.partial().extend({ id: z.string().uuid() })

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const applicationId = url.searchParams.get('application_id')
  if (!applicationId) return NextResponse.json({ error: 'application_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('interview_scorecards')
    .select('*')
    .eq('application_id', applicationId)
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scorecards: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'recruiter') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  // Verify the recruiter owns the job this application belongs to
  const { data: app } = await supabase
    .from('applications')
    .select('job:jobs(recruiter_id)')
    .eq('id', parsed.data.application_id)
    .single()
  const job = Array.isArray(app?.job) ? app.job[0] : app?.job
  if (!job || (job as { recruiter_id: string }).recruiter_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('interview_scorecards')
    .insert({ ...parsed.data, recruiter_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scorecard: data })
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { id, ...updates } = parsed.data
  const { data, error } = await supabase
    .from('interview_scorecards')
    .update(updates)
    .eq('id', id)
    .eq('recruiter_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scorecard: data })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('interview_scorecards')
    .delete()
    .eq('id', id)
    .eq('recruiter_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
