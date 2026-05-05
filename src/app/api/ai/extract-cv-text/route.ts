import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractText } from 'unpdf'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Ingen fil skickad' }, { status: 400 })

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Filen är för stor (max 10 MB)' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'txt') {
      const text = await file.text()
      return NextResponse.json({ text })
    }

    if (ext === 'pdf') {
      const buffer = await file.arrayBuffer()
      const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
      return NextResponse.json({ text })
    }

    return NextResponse.json({ error: 'Filformat stöds inte. Använd PDF eller TXT.' }, { status: 400 })
  } catch (error) {
    console.error('CV text extraction error:', error)
    return NextResponse.json({ error: 'Kunde inte läsa filen' }, { status: 500 })
  }
}
