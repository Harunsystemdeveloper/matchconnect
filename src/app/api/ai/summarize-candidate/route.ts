import { NextRequest, NextResponse } from 'next/server'
import { summarizeCandidate } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cvText, matchScore, skillGaps } = await request.json()
    const result = await summarizeCandidate(cvText, matchScore, skillGaps ?? [])
    return NextResponse.json(result)
  } catch (error) {
    console.error('summarize-candidate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
