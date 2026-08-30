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
    max_tokens: 4000,
    system: `Du är en expert rekryteringsanalytiker. Matcha kandidater mot jobbannonser med precision OCH ge en strukturerad, granskningsbar förklaring till varje poäng — inte bara ett tal.

VIKTIGA REGLER:
- "matching_skills" och "missing_skills" får ENDAST innehålla kompetenser från jobbets "Krav"-lista
- Lägg ALDRIG till egna kompetenser som inte finns i Krav-listan
- Om Krav-listan är tom, sätt båda till tomma arrayer
- category_scores ska vara fyra delpoäng (0-100) som tillsammans motiverar helhetspoängen "score":
  - kompetens: hur väl kandidatens kompetenser täcker jobbets krav
  - erfarenhet: om antal års erfarenhet och nivå passar rollen
  - utbildning: relevans av utbildning/bakgrund för rollen (sätt 50 om okänt/ej angivet -- gissa inte)
  - kultur_mjuka_kompetenser: indikationer på mjuka kompetenser/kulturpassning utifrån sammanfattningen (sätt 50 om inget underlag finns)
- top_positive_factors: max 3 konkreta, faktabaserade styrkor (inte generiska fraser)
- top_gaps: max 3 konkreta gap/risker (inte generiska fraser) -- tom array om inga finns
- category_reasoning: en kort mening (max ~15 ord) per kategori som motiverar just den delpoängen

Returnera ALLTID giltig JSON:
{
  "matches": [
    {
      "candidate_id": "uuid",
      "score": 85,
      "summary": "Kort helhetsmotivering (1-2 meningar) på svenska",
      "matching_skills": ["skill1", "skill2"],
      "missing_skills": ["skill3"],
      "category_scores": { "kompetens": 90, "erfarenhet": 80, "utbildning": 50, "kultur_mjuka_kompetenser": 50 },
      "category_reasoning": { "kompetens": "...", "erfarenhet": "...", "utbildning": "...", "kultur_mjuka_kompetenser": "..." },
      "top_positive_factors": ["faktor1", "faktor2", "faktor3"],
      "top_gaps": ["gap1", "gap2"]
    }
  ]
}

Poängsättning för "score" (0-100), en sammanvägning av delpoängen med tyngdpunkt på kompetens och erfarenhet:
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

export interface CanonicalizedSkill {
  raw: string
  canonical_name: string
  category: string
}

export async function canonicalizeSkills(
  rawSkills: string[],
  existingCanonicalNames: string[]
): Promise<CanonicalizedSkill[]> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `Du är expert på att normalisera yrkeskompetenser till en kanonisk kompetensontologi som täcker alla branscher (IT, vård, ekonomi, pedagogik, bygg, handel, juridik m.fl.).

VIKTIGA REGLER:
- Om en inskickad kompetens är en ren stavnings-/formatvariant av en BEFINTLIG kanonisk kompetens (t.ex. "React.js" eller "ReactJS" är samma sak som "React") — återanvänd EXAKT det befintliga kanoniska namnet, teckenexakt.
- Slå ALDRIG ihop två kompetenser som är genuint olika bara för att namnen liknar varandra. Exempel: "React" och "React Native" är OLIKA kompetenser (webb vs mobilramverk) — de ska ALDRIG få samma canonical_name. "Bokföring" och "Redovisning" är närliggande men olika — behåll dem separata om båda redan finns som egna kanoniska poster.
- Om kompetensen inte matchar något befintligt — föreslå ett nytt kanoniskt namn med korrekt kapitalisering (t.ex. "React", "Node.js", "Patientvård"), inte versaler/gemener rakt av.
- category ska vara exakt en av: "språk", "ramverk", "verktyg", "metodik", "certifiering", "mjuk kompetens", "domänkunskap", "övrigt"

Befintliga kanoniska kompetenser i systemet just nu:
${existingCanonicalNames.length > 0 ? existingCanonicalNames.join(', ') : '(inga registrerade än)'}

Returnera ENDAST giltig JSON:
{
  "results": [
    { "raw": "exakt den inskickade texten", "canonical_name": "Kanoniskt namn", "category": "kategori" }
  ]
}
En rad per inskickad kompetens, i samma ordning som indata.`,
    messages: [{
      role: 'user',
      content: `Normalisera dessa kompetenser:\n${rawSkills.map(s => `- ${s}`).join('\n')}`,
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  return parsed.results
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
