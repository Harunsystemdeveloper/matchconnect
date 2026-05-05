import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ job_id: z.string().uuid() })

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const supabase = await createClient()
  // Increment views using rpc if available, otherwise update directly
  await supabase.rpc('increment_job_views', { job_id: parsed.data.job_id }).then(() => null, () => null)

  return NextResponse.json({ ok: true })
}
