import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CONSENT_VERSION = 'v1'

const upsertSchema = z.object({
  gender: z.enum(['kvinna', 'man', 'annat']).optional(),
  birth_year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
})

// Endast kandidaten själv kan någonsin nå denna route för sin egen rad — RLS på
// candidate_demographics tillåter dessutom bara auth.uid() = seeker_id oavsett.

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('candidate_demographics')
    .select('*')
    .eq('seeker_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ demographics: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'job_seeker') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  if (!parsed.data.gender && !parsed.data.birth_year) {
    return NextResponse.json({ error: 'Ange minst en uppgift' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('candidate_demographics')
    .upsert({
      seeker_id: user.id,
      gender: parsed.data.gender ?? null,
      birth_year: parsed.data.birth_year ?? null,
      consent_given_at: new Date().toISOString(),
      consent_version: CONSENT_VERSION,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ demographics: data })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('candidate_demographics').delete().eq('seeker_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
