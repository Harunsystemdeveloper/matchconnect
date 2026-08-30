import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  conversation_id: z.string().uuid(),
  action: z.enum(['opened', 'responded']),
})

// Anropas av kandidaten själv (RLS begränsar till egna invites) när de öppnar en
// inbjudan-konversation eller svarar på den. No-op om ingen invite finns för
// konversationen (helt vanliga konversationer utan koppling till en inbjudan).
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ogiltig indata' }, { status: 400 })

  const { data: invite } = await supabase
    .from('candidate_invites')
    .select('id, opened_at, responded_at')
    .eq('conversation_id', parsed.data.conversation_id)
    .eq('seeker_id', user.id)
    .maybeSingle()

  if (!invite) return NextResponse.json({ ok: true, tracked: false })

  const column = parsed.data.action === 'opened' ? 'opened_at' : 'responded_at'
  if (invite[column]) return NextResponse.json({ ok: true, tracked: false }) // redan satt — sätts bara första gången

  await supabase.from('candidate_invites').update({ [column]: new Date().toISOString() }).eq('id', invite.id)
  return NextResponse.json({ ok: true, tracked: true })
}
