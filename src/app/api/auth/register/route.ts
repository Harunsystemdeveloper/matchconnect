import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { sendWelcomeEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenord måste vara minst 6 tecken'),
  user_type: z.enum(['job_seeker', 'recruiter']),
  full_name: z.string().max(200).optional(),
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'För många registreringsförsök. Försök igen om en timme.' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Ogiltiga uppgifter' }, { status: 400 })
  }
  const { email, password, user_type, full_name } = parsed.data

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { user_type },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Skicka välkomstmail i bakgrunden utan att blockera svaret
  ;(async () => {
    try {
      await sendWelcomeEmail({
        email,
        name: full_name ?? email.split('@')[0],
        userType: user_type,
      })
    } catch (err) {
      console.error('[register] welcome email error:', err)
    }
  })()

  return NextResponse.json({ user_id: data.user.id })
}
