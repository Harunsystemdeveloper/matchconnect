import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function analyzeCv(cvText: string) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `Du är en expert HR-analytiker och karriärcoach med djup kunskap om den svenska arbetsmarknaden.
Din uppgift är att analysera CV-text och extrahera strukturerad information. Du hanterar ALLA typer av yrken — IT, vård, ekonomi, juridik, handel, bygg, pedagogik, kreativa yrken, m.fl.

Returnera ALLTID giltig JSON med exakt följande struktur:
{
  "skills": ["kompetens1", "kompetens2"],
  "tools_and_methods": ["verktyg1", "metod1"],
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
- skills: yrkeskompetenser och mjuka kompetenser relevanta för kandidatens bransch (max 20)
- tools_and_methods: specifika verktyg, system, metoder eller program som används i yrket (t.ex. journalsystem för vård, CAD för ingenjörer, Excel för ekonomi, programspråk för IT)
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

VIKTIGA REGLER:
- "matching_skills" och "missing_skills" får ENDAST innehålla kompetenser från jobbets "Krav"-lista
- Lägg ALDRIG till egna kompetenser som inte finns i Krav-listan
- Om Krav-listan är tom, sätt båda till tomma arrayer

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
    system: `Du är en karriärcoach. Analysera kompetensgap mellan en kandidat och en jobbannons.

VIKTIGA REGLER:
- "missing_skills" får ENDAST innehålla kompetenser från listan "Efterfrågade kompetenser" — lägg ALDRIG till egna förslag eller kompetenser från beskrivningen
- "matching_skills" får ENDAST innehålla kompetenser från "Efterfrågade kompetenser" som kandidaten faktiskt har
- Om jobbkravslistan är tom, sätt missing_skills och matching_skills till tomma arrayer
- recommendations: 2-3 konkreta råd baserade enbart på de faktiska gapen

Returnera giltig JSON:
{
  "match_score": 75,
  "missing_skills": ["skill1"],
  "matching_skills": ["skill2"],
  "recommendations": ["Råd 1", "Råd 2"],
  "gap_summary": "1-2 meningar om gapet på svenska"
}

Svara ENDAST med JSON.`,
    messages: [{
      role: 'user',
      content: `Jobb: ${job.title}\nEfterfrågade kompetenser: ${job.skills_required?.join(', ') || '(inga specificerade)'}\nJobbeskrivning: ${job.description}\n\nKandidatens kompetenser: ${candidateSkills.join(', ')}\nErfarenhet: ${experienceYears} år`,
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
    system: `Du är en erfaren rekryteringskonsult med bred branschkunskap. Skapa personaliserade intervjufrågor anpassade till ALLA typer av yrken och branscher — IT, vård, ekonomi, juridik, handel, pedagogik, bygg, kreativa yrken m.fl.

Returnera giltig JSON:
{
  "questions": [
    {
      "question": "Frågetext på svenska",
      "category": "yrkesspecifik|beteendemässig|situationell|motivation",
      "why": "Varför denna fråga är relevant (kort)"
    }
  ]
}

Regler:
- yrkesspecifik: frågor om konkreta färdigheter och kunskaper relevanta för just detta yrke (kan vara medicinska för vård, tekniska för IT, juridiska för jurister, pedagogiska för lärare osv.)
- beteendemässig: hur kandidaten hanterat situationer tidigare
- situationell: hur kandidaten skulle agera i hypotetiska scenarion
- motivation: varför kandidaten vill ha jobbet och passar rollen

Skapa 6-8 frågor. Blanda kategorier. Anpassa frågorna till kandidatens bakgrund OCH jobbets specifika krav.
Svara ENDAST med JSON.`,
    messages: [{
      role: 'user',
      content: `Jobb: ${job.title}\nKrav: ${job.skills_required?.join(', ')}\nBeskrivning: ${job.description}\n\nKandidatprofil:\nKompetenser: ${candidateProfile.skills.join(', ')}\nErfarenhet: ${candidateProfile.experience_years} år\nSammanfattning: ${candidateProfile.summary}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
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

export async function summarizeInterviewFeedback(
  candidateName: string,
  scorecards: Array<{
    stage: string
    overall_rating: number | null
    recommendation: string | null
    ratings: Array<{ question: string; rating: number; comment: string }>
    notes: string | null
  }>
) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: `Du är en erfaren rekryteringschef. Du får strukturerad intervjufeedback (scorecards) från ett eller flera intervjusteg för en och samma kandidat.
Din uppgift är att sammanställa en objektiv, balanserad rekommendation baserad ENDAST på det underlag som ges — hitta inte på egna intryck.

Returnera giltig JSON:
{
  "summary": "3-4 meningar som sammanfattar styrkor, svagheter och samstämmighet/oenighet mellan intervjustegen, på svenska",
  "consensus": "strong_yes|yes|no|strong_no|mixed",
  "key_strengths": ["styrka1", "styrka2"],
  "key_concerns": ["oro1", "oro2"]
}

Regler:
- "consensus" = "mixed" om rekommendationerna spretar mellan stegen
- Basera key_strengths/key_concerns enbart på kommentarerna i underlaget
- Svara ENDAST med JSON.`,
    messages: [{
      role: 'user',
      content: `Kandidat: ${candidateName}\n\nScorecards:\n${JSON.stringify(scorecards, null, 2)}`,
    }],
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
