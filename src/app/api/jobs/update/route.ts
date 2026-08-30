import { createClient } from '@/lib/supabase/server'
import { normalizeSkills } from '@/lib/ai/skill-ontology'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  job_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().min(50).max(10000),
  requirements: z.string().max(5000).optional(),
  skills_required: z.array(z.string().min(1).max(100)).max(20).default([]),
  location: z.string().max(200).optional(),
  work_type: z.string().optional(),
  experience_level: z.string().optional(),
  status: z.enum(['active', 'paused', 'closed']),
  salary_min: z.number().int().nonnegative().optional(),
  salary_max: z.number().int().nonnegative().optional(),
  deadline: z.string().optional(),
})

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const normalizedSkills = await normalizeSkills(parsed.data.skills_required)

  const { data: job, error } = await supabase
    .from('jobs')
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      requirements: parsed.data.requirements || null,
      skills_required: normalizedSkills,
      location: parsed.data.location || null,
      work_type: parsed.data.work_type || null,
      experience_level: parsed.data.experience_level || null,
      status: parsed.data.status,
      salary_min: parsed.data.salary_min ?? null,
      salary_max: parsed.data.salary_max ?? null,
      deadline: parsed.data.deadline || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.job_id)
    .eq('recruiter_id', user.id) // ägarskap kontrolleras även av RLS, men gör felet tydligt
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ job })
}
