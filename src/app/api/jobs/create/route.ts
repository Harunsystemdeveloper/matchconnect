import { createClient } from '@/lib/supabase/server'
import { normalizeSkills } from '@/lib/ai/skill-ontology'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(50).max(10000),
  requirements: z.string().max(5000).optional(),
  skills_required: z.array(z.string().min(1).max(100)).max(20).default([]),
  location: z.string().max(200).optional(),
  work_type: z.string().optional(),
  experience_level: z.string().optional(),
  salary_min: z.number().int().nonnegative().optional(),
  salary_max: z.number().int().nonnegative().optional(),
  currency: z.string().max(50).default('SEK'),
  deadline: z.string().optional(),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'recruiter') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const normalizedSkills = await normalizeSkills(parsed.data.skills_required)

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      recruiter_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      requirements: parsed.data.requirements || null,
      skills_required: normalizedSkills,
      location: parsed.data.location || null,
      work_type: parsed.data.work_type || null,
      experience_level: parsed.data.experience_level || null,
      salary_min: parsed.data.salary_min ?? null,
      salary_max: parsed.data.salary_max ?? null,
      currency: parsed.data.currency,
      deadline: parsed.data.deadline || null,
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ job })
}
