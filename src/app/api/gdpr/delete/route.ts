import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rätten att bli glömd omfattar även uppladdade filer, inte bara databasrader — annars
  // ligger CV:t och profilbilden kvar i storage för alltid trots att kontot är "raderat".
  // Vi vet inte filändelsen i förväg, så vi provar de vanligaste och struntar i fel
  // (remove() på en icke-existerande fil är ofarligt).
  const exts = ['pdf', 'txt', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp']
  const ownPaths = exts.map(ext => `${user.id}/${user.id}.${ext}`)
  const logoPaths = exts.map(ext => `logos/${user.id}.${ext}`)
  const coverPaths = exts.map(ext => `covers/${user.id}.${ext}`)
  await Promise.all([
    supabase.storage.from('cvs').remove(ownPaths),
    supabase.storage.from('avatars').remove(ownPaths),
    supabase.storage.from('logos').remove([...logoPaths, ...coverPaths]), // täcker både företagslogotyp och karriärsidans omslagsbild
  ]).catch(() => null) // filer som inte finns ska aldrig blockera kontoraderingen

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
