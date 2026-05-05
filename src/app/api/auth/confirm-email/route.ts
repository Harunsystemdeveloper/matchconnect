import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_id, email } = await req.json()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  let userId = user_id

  // Om vi bara har email, leta upp user_id
  if (!userId && email) {
    const { data } = await supabaseAdmin.auth.admin.listUsers()
    const user = data?.users?.find((u) => u.email === email)
    if (!user) {
      return NextResponse.json({ error: 'Användare hittades inte' }, { status: 404 })
    }
    userId = user.id
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
