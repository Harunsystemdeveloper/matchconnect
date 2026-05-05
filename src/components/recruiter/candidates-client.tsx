'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Loader2, Star, StarOff, MessageSquare, Search,
  Brain, ArrowLeft, Users, MapPin, LayoutList, Columns, Download, StickyNote, Pencil
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CandidateCrmPanel } from '@/components/recruiter/candidate-crm-panel'
import { InterviewScheduleButton } from '@/components/recruiter/interview-schedule-button'

interface Candidate {
  id: string
  status: string
  match_score: number | null
  ai_summary: string | null
  skill_gaps: string[] | null
  is_shortlisted: boolean
  seeker: { id: string; full_name: string | null; avatar_url: string | null; headline: string | null; location: string | null } | null
  cv: { skills: string[] | null; experience_years: number | null; ai_summary: string | null; languages: string[] | null } | null
}

const statusOptions = [
  { value: 'pending', label: 'Ny' },
  { value: 'reviewed', label: 'Granskad' },
  { value: 'shortlisted', label: 'Shortlistad' },
  { value: 'accepted', label: 'Accepterad' },
  { value: 'rejected', label: 'Avvisad' },
]

interface SuggestedProfile {
  id: string; full_name: string | null; avatar_url: string | null
  headline: string | null; location: string | null
  cv: { skills: string[] | null; experience_years: number | null } | null
  overlap: number
}

export function CandidatesClient({
  job,
  applications: initialApps,
  recruiterId,
  suggestedProfiles = [],
}: {
  job: { id: string; title: string; skills_required: string[] | null }
  applications: Candidate[]
  recruiterId: string
  suggestedProfiles?: SuggestedProfile[]
}) {
  const [apps, setApps] = useState(initialApps)
  const [matching, setMatching] = useState(false)
  const [search, setSearch] = useState('')
  const [filterExp, setFilterExp] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [crmOpen, setCrmOpen] = useState(false)
  const [crmCandidate, setCrmCandidate] = useState<{ id: string; name: string } | null>(null)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideApp, setOverrideApp] = useState<{ id: string; name: string; currentScore: number | null } | null>(null)
  const [overrideScore, setOverrideScore] = useState<number>(50)
  const [overrideReason, setOverrideReason] = useState('')
  const [overriding, setOverriding] = useState(false)
  const supabase = createClient()

  function openOverride(appId: string, name: string, currentScore: number | null) {
    setOverrideApp({ id: appId, name, currentScore })
    setOverrideScore(currentScore ?? 50)
    setOverrideReason('')
    setOverrideOpen(true)
  }

  async function submitOverride() {
    if (!overrideApp || overrideReason.length < 10) return
    setOverriding(true)
    const res = await fetch('/api/applications/override-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: overrideApp.id,
        override_score: overrideScore,
        reason: overrideReason,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error)
    } else {
      setApps(apps.map(a => a.id === overrideApp.id ? { ...a, match_score: overrideScore } : a))
      toast.success('Poäng uppdaterad och loggad i AI-logg')
      setOverrideOpen(false)
    }
    setOverriding(false)
  }

  function openCrm(seekerId: string, name: string) {
    setCrmCandidate({ id: seekerId, name })
    setCrmOpen(true)
  }

  function exportCsv() {
    const headers = ['Namn', 'Titel', 'Plats', 'Erfarenhet (år)', 'Matchpoäng', 'Status', 'Shortlistad', 'Kompetenser', 'Saknar']
    const rows = filtered.map(a => [
      a.seeker?.full_name ?? '',
      a.seeker?.headline ?? '',
      a.seeker?.location ?? '',
      a.cv?.experience_years ?? '',
      a.match_score ?? '',
      a.status,
      a.is_shortlisted ? 'Ja' : 'Nej',
      (a.cv?.skills ?? []).join('; '),
      (a.skill_gaps ?? []).join('; '),
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kandidater-${job.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function runAiMatch() {
    setMatching(true)
    toast.info('AI matchar kandidater...')
    const res = await fetch('/api/ai/match-candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: job.id }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setMatching(false); return }
    toast.success(`Matchade ${data.matches?.length ?? 0} kandidater!`)
    // Reload page to get updated scores
    window.location.reload()
  }

  async function toggleShortlist(appId: string, isShortlisted: boolean) {
    if (isShortlisted) {
      await supabase.from('shortlist').delete().eq('application_id', appId).eq('recruiter_id', recruiterId)
      toast.success('Borttagen från shortlist')
    } else {
      await supabase.from('shortlist').insert({ application_id: appId, recruiter_id: recruiterId })
      toast.success('Tillagd i shortlist!')
    }
    setApps(apps.map(a => a.id === appId ? { ...a, is_shortlisted: !isShortlisted } : a))
  }

  async function updateStatus(appId: string, status: string) {
    await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId)
    setApps(apps.map(a => a.id === appId ? { ...a, status } : a))
    toast.success('Status uppdaterad')
  }

  const filtered = apps.filter(app => {
    const seeker = app.seeker
    const matchSearch = !search ||
      seeker?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.cv?.skills?.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
      seeker?.location?.toLowerCase().includes(search.toLowerCase())
    const matchExp = filterExp === 'all' ||
      (filterExp === 'junior' && (app.cv?.experience_years ?? 0) <= 2) ||
      (filterExp === 'mid' && (app.cv?.experience_years ?? 0) > 2 && (app.cv?.experience_years ?? 0) <= 5) ||
      (filterExp === 'senior' && (app.cv?.experience_years ?? 0) > 5)
    const matchStatus = filterStatus === 'all' || app.status === filterStatus
    return matchSearch && matchExp && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/recruiter/jobs" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{apps.length} kandidater</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-r-none border-r"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode('kanban')}
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>
          {filtered.length > 0 && (
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Exportera CSV
            </Button>
          )}
          <Button onClick={runAiMatch} disabled={matching}>
            {matching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
            {matching ? 'Matchar...' : 'AI-matcha kandidater'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Sök namn, kompetens, plats..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterExp} onValueChange={(v) => setFilterExp(v ?? 'all')}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All erfarenhet</SelectItem>
            <SelectItem value="junior">Junior (0-2 år)</SelectItem>
            <SelectItem value="mid">Mid (2-5 år)</SelectItem>
            <SelectItem value="senior">Senior (5+ år)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla statusar</SelectItem>
            {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Suggested profiles — seekers who haven't applied but match */}
      {suggestedProfiles.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Föreslagna profiler — har inte sökt ännu</p>
            <span className="text-xs text-muted-foreground">({suggestedProfiles.length} matchande)</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestedProfiles.map(p => {
              const initials = p.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
              const total = job.skills_required?.length ?? 1
              const pct = Math.round((p.overlap / total) * 100)
              return (
                <div key={p.id} className="bg-background rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={p.avatar_url ?? ''} />
                      <AvatarFallback className="gradient-primary text-white text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name ?? 'Anonym'}</p>
                      {p.headline && <p className="text-xs text-muted-foreground truncate">{p.headline}</p>}
                    </div>
                    <span className="ml-auto text-sm font-bold text-primary flex-shrink-0">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1" />
                  <div className="flex flex-wrap gap-1">
                    {p.cv?.skills?.slice(0, 4).map(s => (
                      <Badge
                        key={s}
                        variant={job.skills_required?.includes(s) ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="w-full h-7 text-xs" asChild>
                    <Link href={`/messages?user=${p.id}`}>
                      <MessageSquare className="mr-1 h-3 w-3" />Bjud in att söka
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {statusOptions.map(col => {
              const colApps = filtered.filter(a => a.status === col.value)
              return (
                <div key={col.value} className="w-64 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm font-medium">{col.label}</span>
                    <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">{colApps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colApps.length === 0 && (
                      <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Inga kandidater
                      </div>
                    )}
                    {colApps.map(app => {
                      const seeker = app.seeker
                      const initials = seeker?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
                      return (
                        <Card key={app.id} className="cursor-default hover:shadow-md transition-shadow">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={seeker?.avatar_url ?? ''} />
                                <AvatarFallback className="gradient-primary text-white text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{seeker?.full_name ?? 'Anonym'}</p>
                                {seeker?.headline && <p className="text-xs text-muted-foreground truncate">{seeker.headline}</p>}
                              </div>
                            </div>
                            {app.match_score != null && (
                              <div className="flex items-center gap-2">
                                <Progress value={app.match_score} className="h-1.5 flex-1" />
                                <span className="text-xs font-medium text-primary">{app.match_score}%</span>
                              </div>
                            )}
                            <div className="flex gap-1.5">
                              <Select value={app.status} onValueChange={v => v && updateStatus(app.id, v)}>
                                <SelectTrigger className="h-6 text-xs flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleShortlist(app.id, app.is_shortlisted)}
                              >
                                {app.is_shortlisted ? <Star className="h-3.5 w-3.5 fill-primary text-primary" /> : <Star className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List view — Candidates */}
      {viewMode === 'list' && filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {apps.length === 0 ? 'Inga kandidater ännu' : 'Inga kandidater matchar filtret'}
          </p>
          {apps.length === 0 && (
            <Button className="mt-4" onClick={runAiMatch} disabled={matching}>
              <Brain className="mr-2 h-4 w-4" /> Hitta kandidater med AI
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(app => {
            const seeker = app.seeker
            const initials = seeker?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
            return (
              <Card key={app.id} className={app.is_shortlisted ? 'ring-2 ring-primary/30' : ''}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={seeker?.avatar_url ?? ''} />
                      <AvatarFallback className="gradient-primary text-white text-sm">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{seeker?.full_name ?? 'Anonym kandidat'}</p>
                          {seeker?.headline && <p className="text-sm text-muted-foreground">{seeker.headline}</p>}
                          {seeker?.location && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />{seeker.location}
                            </p>
                          )}
                        </div>
                        {app.match_score != null && (
                          <div className="text-center flex-shrink-0">
                            <p className="text-2xl font-bold gradient-text">{app.match_score}%</p>
                            <p className="text-xs text-muted-foreground">AI-match</p>
                            <Progress value={app.match_score} className="h-1 w-16 mt-1" />
                          </div>
                        )}
                      </div>

                      {app.ai_summary && (
                        <p className="text-sm text-muted-foreground mt-2 italic">{app.ai_summary}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {app.cv?.experience_years != null && (
                          <Badge variant="outline" className="text-xs">{app.cv.experience_years} år erfarenhet</Badge>
                        )}
                        {app.cv?.skills?.slice(0, 4).map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {app.cv?.languages?.slice(0, 2).map(l => (
                          <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                        ))}
                      </div>

                      {app.skill_gaps && app.skill_gaps.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Saknar:</p>
                          <div className="flex flex-wrap gap-1">
                            {app.skill_gaps.slice(0, 3).map(s => (
                              <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Select value={app.status} onValueChange={v => v && updateStatus(app.id, v)}>
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant={app.is_shortlisted ? 'default' : 'outline'}
                        onClick={() => toggleShortlist(app.id, app.is_shortlisted)}
                      >
                        {app.is_shortlisted
                          ? <><StarOff className="mr-1 h-3.5 w-3.5" />Avlista</>
                          : <><Star className="mr-1 h-3.5 w-3.5" />Shortlist</>}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/messages?user=${seeker?.id}`}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" />Chatta
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCrm(seeker?.id ?? '', seeker?.full_name ?? 'Kandidat')}
                      >
                        <StickyNote className="mr-1 h-3.5 w-3.5" />Anteckna
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openOverride(app.id, seeker?.full_name ?? 'Kandidat', app.match_score)}
                        title="Överstyr AI-poäng (AI Act: human oversight)"
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />Justera poäng
                      </Button>
                      <InterviewScheduleButton
                        applicationId={app.id}
                        seekerId={seeker?.id ?? ''}
                        recruiterId={recruiterId}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Human override dialog — AI Act Article 14 */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Överstyr AI-matchpoäng</DialogTitle>
            <DialogDescription>
              {overrideApp?.name} · AI-poäng: {overrideApp?.currentScore ?? '–'}%
              <br />
              <span className="text-xs">Enligt EU AI Act krävs att mänskliga beslut loggas när AI-bedömningar åsidosätts.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nytt matchpoäng (0–100)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={overrideScore}
                  onChange={e => setOverrideScore(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-bold w-12 text-right">{overrideScore}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivering (krävs)</label>
              <Textarea
                placeholder="Förklara varför du justerar AI-poängen, t.ex. 'Kandidaten har relevant erfarenhet som inte framgår av CV:t'..."
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                rows={3}
                minLength={10}
              />
              <p className="text-xs text-muted-foreground">{overrideReason.length}/500 tecken (minst 10)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Avbryt</Button>
            <Button
              onClick={submitOverride}
              disabled={overriding || overrideReason.length < 10}
            >
              {overriding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara och logga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CRM Sheet */}
      <Sheet open={crmOpen} onOpenChange={setCrmOpen}>
        <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Kandidat-CRM</SheetTitle>
          </SheetHeader>
          {crmCandidate && (
            <div className="mt-4">
              <CandidateCrmPanel seekerId={crmCandidate.id} seekerName={crmCandidate.name} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
