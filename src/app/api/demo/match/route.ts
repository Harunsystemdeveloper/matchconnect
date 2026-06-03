import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!rateLimit(`demo:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'För många försök. Prova igen om en timme.' }, { status: 429 })
  }

  const { job_title, job_skills, candidate_skills } = await req.json()

  if (!job_title || !job_skills?.length || !candidate_skills?.length) {
    return NextResponse.json({ error: 'Fyll i alla fält.' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Analysera matchningen mellan en kandidat och ett jobb. Svara ENDAST med giltig JSON.

Jobb: ${job_title}
Jobbkrav (kompetenser): ${(job_skills as string[]).join(', ')}
Kandidatens kompetenser: ${(candidate_skills as string[]).join(', ')}

Returnera:
{
  "score": <0-100>,
  "matching": ["kompetens1", "kompetens2"],
  "missing": ["kompetens3"],
  "verdict": "<En mening på svenska om matchningen>"
}`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Analys misslyckades. Försök igen.' }, { status: 500 })
  }
}
