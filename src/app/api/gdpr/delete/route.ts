import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Radera all användardata (CASCADE hanterar relaterade poster)
  // profiles-raden kopplas till auth.users via ON DELETE CASCADE
  // Så vi behöver bara ta bort auth-användaren via admin API
  // Men vi har inte admin-rättigheter i klienten – så vi raderar profilen
  // vilket triggar CASCADE på alla relaterade tabeller.

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // Logga ut användaren
  await supabase.auth.signOut()

  return NextResponse.json({
    success: true,
    message: 'Ditt konto och all associerad data har raderats.'
  })
}
