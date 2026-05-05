import { NextRequest, NextResponse } from 'next/server'
import { calculateMatchScore } from '@/lib/ai/claude'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { cvText, jobDescription, jobRequirements } = await request.json()
    const result = await calculateMatchScore(cvText, jobDescription, jobRequirements ?? '')
    return NextResponse.json(result)
  } catch (error) {
    console.error('match-score error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
