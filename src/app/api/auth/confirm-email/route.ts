import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// VIKTIGT: Detta endpoint använder service-role-nyckeln för att tvångsbekräfta e-post.
// Det får ALDRIG gå att anropa med bara ett e-postadress — det skulle låta vem som helst
// bekräfta (och enumerera) godtyckliga konton utan att äga inkorgen. Vi kräver därför att
// anroparen redan bevisar att de känner till rätt lösenord innan vi rör kontot.
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!rateLimit(`confirm-email:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'För många försök. Försök igen om en timme.' }, { status: 429 })
  }

  const { email, password } = await req.json()
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json({ error: 'E-post och lösenord krävs' }, { status: 400 })
  }

  // Bevisa att anroparen faktiskt känner till lösenordet innan något admin-anrop görs.
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { error: signInError } = await anonClient.auth.signInWithPassword({ email, password })

  if (!signInError) {
    // Kontot kunde redan logga in — inget att bekräfta.
    return NextResponse.json({ ok: true })
  }
  if (!signInError.message?.toLowerCase().includes('email not confirmed')) {
    // Fel lösenord / okänt konto — svara generiskt så vi inte avslöjar vilket.
    return NextResponse.json({ error: 'Ogiltiga uppgifter' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await supabaseAdmin.auth.admin.listUsers()
  const user = data?.users?.find((u) => u.email === email)
  if (!user) return NextResponse.json({ error: 'Ogiltiga uppgifter' }, { status: 401 })

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
