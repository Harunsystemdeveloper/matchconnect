import Anthropic from '@anthropic-ai/sdk'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const tools: Anthropic.Tool[] = [
  {
    name: 'get_my_profile',
    description: 'Hämtar användarens profil och CV-data: kompetenser, erfarenhet, utbildning, sammanfattning.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_active_jobs',
    description: 'Hämtar aktiva jobbannonser på plattformen. Använd när användaren frågar om jobb som passar dem.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Max antal jobb (default 15)' },
      },
      required: [],
    },
  },
  {
    name: 'get_job_details',
    description: 'Hämtar fullständiga detaljer om ett specifikt jobb inklusive beskrivning och krav.',
    input_schema: {
      type: 'object' as const,
      properties: {
        job_id: { type: 'string', description: 'Jobbets UUID' },
      },
      required: ['job_id'],
    },
  },
  {
    name: 'get_my_applications',
    description: 'Hämtar användarens ansökningar med matchningspoäng och status.',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
]

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<string> {
  try {
    switch (name) {
      case 'get_my_profile': {
        const [{ data: profile }, { data: cv }] = await Promise.all([
          admin.from('profiles').select('full_name, headline, bio, location').eq('id', userId).single(),
          admin.from('cv_profiles').select('skills, experience_years, education, ai_summary, languages').eq('seeker_id', userId).single(),
        ])
        return JSON.stringify({ profile, cv_profile: cv })
      }
      case 'get_active_jobs': {
        const limit = (input.limit as number) || 15
        const { data: jobs } = await admin
          .from('jobs')
          .select('id, title, location, work_type, skills_required, salary_min, salary_max, currency, experience_level, description')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(limit)
        return JSON.stringify(jobs ?? [])
      }
      case 'get_job_details': {
        const { data: job } = await admin
          .from('jobs')
          .select('*')
          .eq('id', input.job_id as string)
          .single()
        return JSON.stringify(job)
      }
      case 'get_my_applications': {
        const { data: apps } = await admin
          .from('applications')
          .select('id, status, match_score, skill_gaps, ai_summary, created_at, job:jobs(id, title, location, skills_required)')
          .eq('seeker_id', userId)
          .order('created_at', { ascending: false })
        return JSON.stringify(apps ?? [])
      }
      default:
        return JSON.stringify({ error: 'Okänt verktyg' })
    }
  } catch {
    return JSON.stringify({ error: 'Kunde inte hämta data' })
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!rateLimit(`career-coach:${user.id}`, 30)) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen om en timme.' }, { status: 429 })
  }

  const { messages: inputMessages } = await request.json()
  if (!Array.isArray(inputMessages) || inputMessages.length === 0) {
    return NextResponse.json({ error: 'Ogiltiga meddelanden' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const systemPrompt = `Du är MatchConnects AI-karriärcoach — en personlig assistent för jobbsökare på den svenska arbetsmarknaden.

Du hjälper ${profile?.full_name ?? 'användaren'} med:
- Analysera deras CV och ge konkreta, handlingsbara förbättringstips
- Rekommendera passande jobb från plattformen baserat på deras profil och kompetenser
- Skriva personliga brev och ansökningstextar anpassade till specifika jobb
- Förbereda för intervjuer med träningsfrågor och råd
- Förklara kompetensgap och ge råd om hur de kan fyllas (kurser, certifikat, erfarenhet)
- Tolka och förklara matchningspoäng

Du har tillgång till verktyg för att hämta användarens profil, aktiva jobb och ansökningar i realtid — använd dem proaktivt.

Regler:
- Svara alltid på svenska
- Var konkret och handlingsinriktad — ge specifika råd, inte generella
- Använd punktlistor och rubriker för att göra svaren lättlästa
- Referera till verkliga jobb och kompetenser från databasen när möjligt
- Om användaren frågar om ett specifikt jobb, hämta detaljerna med get_job_details`

  // Agentic loop — handle tool calls before streaming final response
  let messages: Anthropic.MessageParam[] = inputMessages

  for (let i = 0; i < 6; i++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools,
      messages,
    })

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('')

      // Stream the response character by character
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        start(controller) {
          let i = 0
          const chunk = 8
          function push() {
            if (i >= text.length) { controller.close(); return }
            controller.enqueue(encoder.encode(text.slice(i, i + chunk)))
            i += chunk
            setTimeout(push, 8)
          }
          push()
        },
      })
      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
      })
    }

    if (response.stop_reason === 'tool_use') {
      const toolBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
      messages = [...messages, { role: 'assistant', content: response.content }]

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolBlocks.map(async tool => ({
          type: 'tool_result' as const,
          tool_use_id: tool.id,
          content: await executeTool(tool.name, tool.input as Record<string, unknown>, admin, user.id),
        }))
      )
      messages = [...messages, { role: 'user', content: toolResults }]
    } else {
      break
    }
  }

  return NextResponse.json({ error: 'Något gick fel. Försök igen.' }, { status: 500 })
}
