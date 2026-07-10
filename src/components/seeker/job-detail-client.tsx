'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin, Globe, Bookmark, BookmarkCheck, Loader2,
  Brain, Target, MessageSquare, CheckCircle, XCircle, ArrowLeft, Calendar, AlertCircle, Share2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { daysUntil } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  job: {
    id: string; title: string; description: string; requirements: string | null
    skills_required: string[] | null; location: string | null; work_type: string | null
    salary_min: number | null; salary_max: number | null; currency: string
    experience_level: string | null; deadline: string | null
    company_profile: { company_name: string; logo_url: string | null; industry: string | null; location: string | null; website: string | null } | null
  }
  application: { id: string; status: string; match_score: number | null; skill_gaps: string[] | null; interview_questions: string[] | null; ai_summary: string | null } | null
  isSaved: boolean
  cvProfile: { skills: string[] | null; experience_years: number | null } | null
  userId: string
  similarJobs?: { id: string; title: string; location: string | null; work_type: string | null; skills_required: string[] | null; company_profile: { company_name: string } | null }[]
}

export function JobDetailClient({ job, application: initialApplication, isSaved: initialSaved, cvProfile, userId, similarJobs = [] }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [applying, setApplying] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [application, setApplication] = useState(initialApplication)
  const [skillGaps, setSkillGaps] = useState<{ match_score: number; missing_skills: string[]; matching_skills: string[]; gap_summary: string } | null>(null)
  const [questions, setQuestions] = useState<{ question: string; category: string; why: string }[]>([])
  const [loadingGaps, setLoadingGaps] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [phone, setPhone] = useState('')
  const [availability, setAvailability] = useState('')
  const [salaryExpectation, setSalaryExpectation] = useState('')
  const [applyStep, setApplyStep] = useState<1 | 2>(1)
  const supabase = createClient()

  async function toggleSave() {
    if (saved) {
      await supabase.from('saved_jobs').delete().eq('seeker_id', userId).eq('job_id', job.id)
      toast.success('Borttaget från sparade')
    } else {
      await supabase.from('saved_jobs').insert({ seeker_id: userId, job_id: job.id })
      toast.success('Jobb sparat!')
    }
    setSaved(!saved)
  }

  async function applyToJob() {
    setApplying(true)

    // Build structured cover letter from all fields
    const parts: string[] = []
    if (phone) parts.push(`📱 Telefon: ${phone}`)
    if (availability) parts.push(`📅 Tillgänglighet: ${availability}`)
    if (salaryExpectation) parts.push(`💰 Löneanspråk: ${salaryExpectation}`)
    const metaBlock = parts.join('\n')
    const fullCoverLetter = [metaBlock, coverLetter].filter(Boolean).join('\n\n')

    const res = await fetch('/api/applications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id, cover_letter: fullCoverLetter || null }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error('Ansökan misslyckades', { description: data.error })
      setApplying(false)
      return
    }
    setApplication(data)
    toast.success('Ansökan skickad!')
    setApplying(false)
  }

  async function analyzeGaps() {
    setLoadingGaps(true)
    const res = await fetch('/api/ai/skill-gaps', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setLoadingGaps(false); return }
    setSkillGaps(data)
    setLoadingGaps(false)
  }

  async function generateQuestions() {
    setLoadingQuestions(true)
    const res = await fetch('/api/ai/interview-questions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setLoadingQuestions(false); return }
    setQuestions(data.questions ?? [])
    setLoadingQuestions(false)
  }

  const categoryColors: Record<string, string> = {
    teknisk: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    beteendemässig: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    situationell: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    motivation: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/seeker/jobs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Tillbaka till jobb
        </Link>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/jobs/${job.id}`)
            toast.success('Länk kopierad!')
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" /> Dela annons
        </button>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <p className="text-muted-foreground mt-1">
                {job.company_profile?.company_name ?? 'Okänt företag'}
                {job.company_profile?.industry && ` · ${job.company_profile.industry}`}
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {job.location && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />{job.location}
                  </span>
                )}
                {job.work_type && <Badge variant="outline">{job.work_type}</Badge>}
                {job.experience_level && <Badge variant="outline">{job.experience_level}</Badge>}
                {(() => {
                  const cur = job.currency ?? ''
                  if (cur.startsWith('ök')) return <span className="text-sm text-muted-foreground font-medium">Lön enligt överenskommelse</span>
                  if (job.salary_min || job.salary_max) {
                    const label = cur.startsWith('fast+rörlig') ? 'Fast + rörlig' : cur.startsWith('provision') ? 'Provision' : cur.startsWith('SEK/tim') ? 'SEK/tim' : cur.startsWith('SEK/år') ? 'SEK/år' : 'SEK/mån'
                    const range = job.salary_min && job.salary_max
                      ? `${job.salary_min.toLocaleString('sv-SE')}–${job.salary_max.toLocaleString('sv-SE')}`
                      : job.salary_min ? `från ${job.salary_min.toLocaleString('sv-SE')}` : `upp till ${job.salary_max?.toLocaleString('sv-SE')}`
                    return <span className="text-sm font-medium text-foreground">{range} {label}</span>
                  }
                  return null
                })()}
                {job.deadline && (() => {
                  const days = daysUntil(job.deadline)
                  const urgent = days <= 3
                  return (
                    <span className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded-full ${
                      urgent ? 'bg-destructive/10 text-destructive font-medium' : 'bg-muted text-muted-foreground'
                    }`}>
                      {urgent ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                      {days <= 0 ? 'Sista dag!' : `Sista dag: ${new Date(job.deadline).toLocaleDateString('sv-SE')} (${days} dag${days !== 1 ? 'ar' : ''} kvar)`}
                    </span>
                  )
                })()}
                {job.company_profile?.website && (
                  <a href={job.company_profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <Globe className="h-3.5 w-3.5" /> Webbplats
                  </a>
                )}
              </div>
            </div>
            <button onClick={toggleSave} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
              {saved ? <BookmarkCheck className="h-6 w-6 text-primary" /> : <Bookmark className="h-6 w-6" />}
            </button>
          </div>

          {job.skills_required && job.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {job.skills_required.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Beskrivning</TabsTrigger>
              <TabsTrigger value="skillgap">
                <Target className="mr-1.5 h-3.5 w-3.5" />Kompetensgap
              </TabsTrigger>
              <TabsTrigger value="interview">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />Intervjufrågor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{job.description}</div>
                  {job.requirements && (
                    <>
                      <h3 className="font-semibold mt-6 mb-2">Krav</h3>
                      <div className="whitespace-pre-wrap text-sm">{job.requirements}</div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skillgap" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    AI Kompetensgap-analys
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!cvProfile?.skills?.length ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Lägg till kompetenser i din profil för att se kompetensgap.{' '}
                        <Link href="/seeker/profile" className="text-primary hover:underline">Uppdatera profil</Link>
                      </p>
                      <p className="text-xs text-muted-foreground">💡 Ju mer detaljerat din profil är, desto mer träffsäker blir analysen.</p>
                    </div>
                  ) : !skillGaps ? (
                    <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">AI:n jämför dina kompetenser mot jobbets krav och visar exakt vad du har och vad du saknar.</p>
                    <Button onClick={analyzeGaps} disabled={loadingGaps} className="w-full">
                      {loadingGaps ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyserar...</> : 'Analysera mina kompetensgap'}
                    </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Matchningspoäng</span>
                          <span className="font-bold gradient-text">{skillGaps.match_score}%</span>
                        </div>
                        <Progress value={skillGaps.match_score} className="h-2" />
                      </div>
                      <p className="text-sm text-muted-foreground">{skillGaps.gap_summary}</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Du har ({skillGaps.matching_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {skillGaps.matching_skills.map(s => (
                              <Badge key={s} className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Du saknar ({skillGaps.missing_skills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {skillGaps.missing_skills.map(s => (
                              <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    AI-genererade intervjufrågor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.length === 0 ? (
                    <Button onClick={generateQuestions} disabled={loadingQuestions} className="w-full">
                      {loadingQuestions ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Genererar frågor...</> : 'Generera intervjufrågor'}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((q, i) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-medium text-sm">{i + 1}. {q.question}</p>
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${categoryColors[q.category] ?? ''}`}>
                              {q.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{q.why}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Apply sidebar */}
        <div>
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {application ? 'Ansökan skickad' : 'Ansök nu'}
              </CardTitle>
              {!application && (
                <div className="flex gap-1 mt-2">
                  {[1, 2].map(s => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-colors ${applyStep >= s ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {application ? (
                <div className="text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Ansökan skickad!</p>
                    <p className="text-xs text-muted-foreground mt-1">Rekryteraren granskar din ansökan</p>
                  </div>
                  {application.match_score != null && (
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-2xl font-bold gradient-text">{application.match_score}%</p>
                      <p className="text-xs text-muted-foreground">AI-matchningspoäng</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {application.match_score >= 70 ? 'Stark matchning mot jobbets krav' : application.match_score >= 40 ? 'Delvis matchning — se kompetensgap' : 'Låg matchning mot jobbets krav'}
                      </p>
                    </div>
                  )}
                  {application.ai_summary && (
                    <p className="text-xs text-muted-foreground italic leading-relaxed">{application.ai_summary}</p>
                  )}
                  <Link href="/seeker/applications" className="block text-xs text-primary hover:underline">
                    Se alla mina ansökningar →
                  </Link>
                </div>
              ) : applyStep === 1 ? (
                <>
                  <p className="text-xs text-muted-foreground">Steg 1 av 2 — Grunduppgifter</p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Telefonnummer <span className="text-muted-foreground font-normal">(valfritt)</span></label>
                      <input
                        type="tel"
                        placeholder="070-123 45 67"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Tillgänglighet <span className="text-muted-foreground font-normal">(valfritt)</span></label>
                      <select
                        value={availability}
                        onChange={e => setAvailability(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Välj tillgänglighet</option>
                        <option value="Omgående">Omgående</option>
                        <option value="Inom 1 månad">Inom 1 månad</option>
                        <option value="Inom 2 månader">Inom 2 månader</option>
                        <option value="Inom 3 månader">Inom 3 månader</option>
                        <option value="Enligt överenskommelse">Enligt överenskommelse</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Löneanspråk <span className="text-muted-foreground font-normal">(valfritt)</span></label>
                      <input
                        type="text"
                        placeholder="t.ex. 42 000 SEK/mån"
                        value={salaryExpectation}
                        onChange={e => setSalaryExpectation(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  {!cvProfile?.skills?.length && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
                      Tips: <Link href="/seeker/profile" className="underline">Lägg till kompetenser</Link> för ett bättre AI-matchningspoäng.
                    </p>
                  )}

                  <Button className="w-full" onClick={() => setApplyStep(2)}>
                    Nästa steg →
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Steg 2 av 2 — Personligt brev</p>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Berätta om dig själv <span className="text-muted-foreground font-normal">(valfritt)</span>
                    </label>
                    <Textarea
                      placeholder={`Varför söker du den här rollen?\nVad gör dig till en bra kandidat?\nVad vill du bidra med?`}
                      rows={7}
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{coverLetter.length}/1000 tecken</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setApplyStep(1)}>
                      ← Tillbaka
                    </Button>
                    <Button className="flex-1" onClick={applyToJob} disabled={applying}>
                      {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Skicka
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Similar jobs */}
      {similarJobs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Liknande jobb</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarJobs.map(sj => (
              <Link key={sj.id} href={`/seeker/jobs/${sj.id}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <p className="font-medium text-sm leading-snug">{sj.title}</p>
                    <p className="text-xs text-muted-foreground">{sj.company_profile?.company_name ?? 'Okänt företag'}</p>
                    <div className="flex flex-wrap gap-1">
                      {sj.location && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="h-2.5 w-2.5 mr-1" />{sj.location}
                        </Badge>
                      )}
                      {sj.work_type && <Badge variant="outline" className="text-xs">{sj.work_type}</Badge>}
                    </div>
                    {sj.skills_required && (
                      <div className="flex flex-wrap gap-1">
                        {sj.skills_required.slice(0, 3).map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
