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
    const res = await fetch('/api/applications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id, cover_letter: coverLetter || null }),
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
                {job.salary_min && job.salary_max && (
                  <span className="text-sm text-muted-foreground">
                    {job.salary_min.toLocaleString('sv-SE')}–{job.salary_max.toLocaleString('sv-SE')} {job.currency}/mån
                  </span>
                )}
                {job.deadline && (() => {
                  const days = Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
                    <p className="text-sm text-muted-foreground">
                      Lägg till kompetenser i din profil för att se kompetensgap.{' '}
                      <Link href="/seeker/profile" className="text-primary hover:underline">Uppdatera profil</Link>
                    </p>
                  ) : !skillGaps ? (
                    <Button onClick={analyzeGaps} disabled={loadingGaps} className="w-full">
                      {loadingGaps ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyserar...</> : 'Analysera mina kompetensgap'}
                    </Button>
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
            <CardHeader>
              <CardTitle className="text-base">
                {application ? 'Ansökan skickad' : 'Ansök nu'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application ? (
                <div className="text-center space-y-2">
                  <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
                  <p className="text-sm font-medium">Du har ansökt!</p>
                  {application.ai_summary && (
                    <p className="text-xs text-muted-foreground">{application.ai_summary}</p>
                  )}
                  {application.match_score != null && (
                    <div>
                      <p className="text-2xl font-bold gradient-text">{application.match_score}%</p>
                      <p className="text-xs text-muted-foreground">matchningspoäng</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Personligt brev (valfritt)</label>
                    <Textarea
                      placeholder="Berätta varför du passar för den här rollen..."
                      rows={5}
                      value={coverLetter}
                      onChange={e => setCoverLetter(e.target.value)}
                    />
                  </div>
                  {!cvProfile && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Tips: Ladda upp ditt CV för bättre matchning.
                    </p>
                  )}
                  <Button className="w-full" onClick={applyToJob} disabled={applying}>
                    {applying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Skicka ansökan
                  </Button>
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
          <div className="grid sm:grid-cols-3 gap-4">
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
