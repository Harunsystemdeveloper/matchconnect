import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeCv(cvText: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `Du är en expert HR-analytiker och karriärcoach med djup kunskap om den svenska arbetsmarknaden.
Din uppgift är att analysera CV-text och extrahera strukturerad information.

Returnera ALLTID giltig JSON med exakt följande struktur:
{
  "skills": ["kompetens1", "kompetens2"],
  "technologies": ["tech1", "tech2"],
  "experience_years": 5,
  "experience_level": "junior|mid|senior|lead",
  "current_role": "Senaste jobbtitel",
  "education": "Högsta utbildning",
  "languages": ["Svenska", "Engelska"],
  "summary": "2-3 meningar som sammanfattar kandidatens profil",
  "strengths": ["styrka1", "styrka2", "styrka3"],
  "industries": ["bransch1", "bransch2"]
}

Regler:
- skills: tekniska och mjuka kompetenser (max 20)
- technologies: specifika verktyg/programspråk/ramverk
- experience_years: uppskattad total erfarenhet i år (heltal)
- languages: alla språk som nämns i CV
- Svara ENDAST med JSON, inga förklaringar utanför`,
    messages: [{ role: 'user', content: `Analysera detta CV:\n\n${cvText}` }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

export async function matchCandidates(job: {
  title: string
  description: string
  skills_required: string[]
  experience_level: string | null
}, candidates: Array<{
  id: string
  full_name: string | null
  cv_profile: { skills: string[] | null; experience_years: number | null; ai_summary: string | null } | null
}>) {
  const candidateList = candidates.map((c, i) => ({
    index: i,
    id: c.id,
    name: c.full_name ?? 'Anonym',
    skills: c.cv_profile?.skills ?? [],
    experience_years: c.cv_profile?.experience_years ?? 0,
    summary: c.cv_profile?.ai_summary ?? '',
  }))

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `Du är en expert rekryteringsanalytiker. Matcha kandidater mot jobbannonser med precision.

Returnera ALLTID giltig JSON:
{
  "matches": [
    {
      "candidate_id": "uuid",
      "score": 85,
      "summary": "Kort motivering (1-2 meningar) på svenska",
      "matching_skills": ["skill1", "skill2"],
      "missing_skills": ["skill3"]
    }
  ]
}

Poängsättning (0-100):
- 90-100: Utmärkt match, uppfyller alla krav
- 70-89: Bra match, uppfyller de flesta krav
- 50-69: Godkänd match, uppfyller grundkraven
- 30-49: Svag match, saknar viktiga kompetenser
- 0-29: Dålig match

Sortera efter score (högst först). Svara ENDAST med JSON.`,
    messages: [{
      role: 'user',
      content: `Jobb: ${job.title}\nBeskrivning: ${job.description}\nKrav: ${job.skills_required?.join(', ')}\nNivå: ${job.experience_level ?? 'Ej angiven'}\n\nKandidater:\n${JSON.stringify(candidateList, null, 2)}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

export async function analyzeSkillGaps(job: {
  title: string
  description: string
  skills_required: string[]
}, candidateSkills: string[], experienceYears: number) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `Du är en karriärcoach. Analysera kompetensgap mellan kandidat och jobb.

Returnera giltig JSON:
{
  "match_score": 75,
  "missing_skills": ["skill1", "skill2"],
  "matching_skills": ["skill3", "skill4"],
  "recommendations": ["Rekommendation 1", "Rekommendation 2"],
  "gap_summary": "1-2 meningar om gapet på svenska"
}

Svara ENDAST med JSON.`,
    messages: [{
      role: 'user',
      content: `Jobb: ${job.title}\nJobbkrav: ${job.skills_required?.join(', ')}\nJobbeskrivning: ${job.description}\n\nKandidatens kompetenser: ${candidateSkills.join(', ')}\nErfarenhet: ${experienceYears} år`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

export async function generateInterviewQuestions(job: {
  title: string
  description: string
  skills_required: string[]
}, candidateProfile: { skills: string[]; experience_years: number; summary: string }) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: `Du är en erfaren rekryteringskonsult. Skapa personaliserade intervjufrågor.

Returnera giltig JSON:
{
  "questions": [
    {
      "question": "Frågetext på svenska",
      "category": "teknisk|beteendemässig|situationell|motivation",
      "why": "Varför denna fråga är relevant (kort)"
    }
  ]
}

Skapa 6-8 frågor. Blanda kategorier. Anpassa till kandidatens bakgrund OCH jobbets krav.
Svara ENDAST med JSON.`,
    messages: [{
      role: 'user',
      content: `Jobb: ${job.title}\nKrav: ${job.skills_required?.join(', ')}\nBeskrivning: ${job.description}\n\nKandidatprofil:\nKompetenser: ${candidateProfile.skills.join(', ')}\nErfarenhet: ${candidateProfile.experience_years} år\nSammanfattning: ${candidateProfile.summary}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

// Spec-compatible function aliases used by the API routes

export async function analyzeCV(cvText: string) {
  return analyzeCv(cvText)
}

export async function calculateMatchScore(cvText: string, jobDescription: string, jobRequirements: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Calculate a job match score for this candidate. Return a JSON object with:
- score: number (0-100)
- reasoning: string (2-3 sentences explaining the score)
- strengths: string[] (top 3 matching strengths)

CV:
${cvText}

Job Description:
${jobDescription}

Requirements:
${jobRequirements}

Return only valid JSON, no markdown.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

export async function identifySkillGaps(cvText: string, jobDescription: string, skillsRequired: string[]) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Identify skill gaps between this candidate and job. Return a JSON object with:
- skill_gaps: string[] (skills the candidate is missing or needs improvement in)
- recommendation: string (brief advice for the candidate)

CV:
${cvText}

Job Description:
${jobDescription}

Required Skills:
${skillsRequired.join(', ')}

Return only valid JSON, no markdown.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}

export async function summarizeCandidate(cvText: string, matchScore: number, skillGaps: string[]) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Write a concise recruiter-facing summary of this candidate. Return a JSON object with:
- summary: string (3-4 sentences for recruiters, highlighting fit and notable gaps)

CV:
${cvText}

Match Score: ${matchScore}/100
Skill Gaps: ${skillGaps.join(', ')}

Return only valid JSON, no markdown.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
}
