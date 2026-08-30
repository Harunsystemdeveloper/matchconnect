'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Search, MapPin, MessageSquare, Users, Brain,
  Briefcase, GraduationCap, Globe, SlidersHorizontal, X
} from 'lucide-react'
import { InviteCandidateDialog } from '@/components/recruiter/invite-candidate-dialog'

interface Candidate {
  seeker_id: string
  skills: string[] | null
  experience_years: number | null
  education: string | null
  languages: string[] | null
  ai_summary: string | null
  last_analyzed_at: string | null
  seeker: {
    id: string
    full_name: string | null
    avatar_url: string | null
    headline: string | null
    bio: string | null
    location: string | null
    website: string | null
    created_at: string
  } | null
}

interface RecruiterJob {
  id: string
  title: string
  skills_required: string[] | null
}

export function TalentPoolClient({
  candidates,
  recruiterJobs,
}: {
  candidates: Candidate[]
  recruiterJobs: RecruiterJob[]
}) {
  const [search, setSearch] = useState('')
  const [filterExp, setFilterExp] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [filterJob, setFilterJob] = useState('all')
  const [skillSearch, setSkillSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const selectedJob = recruiterJobs.find(j => j.id === filterJob)

  const locations = useMemo(() => {
    const locs = candidates
      .map(c => c.seeker?.location)
      .filter((l): l is string => !!l)
    return [...new Set(locs)].sort()
  }, [candidates])

  const filtered = useMemo(() => {
    return candidates
      .map(c => {
        let matchPct: number | null = null
        if (selectedJob?.skills_required?.length) {
          const overlap = (c.skills ?? []).filter(s =>
            selectedJob.skills_required!.includes(s)
          ).length
          matchPct = Math.round((overlap / selectedJob.skills_required.length) * 100)
        }
        return { ...c, matchPct }
      })
      .filter(c => {
        const name = c.seeker?.full_name?.toLowerCase() ?? ''
        const headline = c.seeker?.headline?.toLowerCase() ?? ''
        const skills = (c.skills ?? []).map(s => s.toLowerCase())
        const loc = c.seeker?.location?.toLowerCase() ?? ''

        const q = search.toLowerCase()
        const matchSearch = !q ||
          name.includes(q) ||
          headline.includes(q) ||
          skills.some(s => s.includes(q)) ||
          loc.includes(q)

        const matchSkill = !skillSearch ||
          skills.some(s => s.toLowerCase().includes(skillSearch.toLowerCase()))

        const exp = c.experience_years ?? 0
        const matchExp = filterExp === 'all' ||
          (filterExp === '0' && exp === 0) ||
          (filterExp === '1-2' && exp >= 1 && exp <= 2) ||
          (filterExp === '3-5' && exp >= 3 && exp <= 5) ||
          (filterExp === '5-10' && exp >= 6 && exp <= 10) ||
          (filterExp === '10+' && exp > 10)

        const matchLoc = filterLocation === 'all' ||
          c.seeker?.location === filterLocation

        const matchJob = filterJob === 'all' ||
          (c.matchPct !== null && c.matchPct > 0)

        return matchSearch && matchSkill && matchExp && matchLoc && matchJob
      })
      .sort((a, b) => {
        if (filterJob !== 'all' && a.matchPct !== null && b.matchPct !== null) {
          return b.matchPct - a.matchPct
        }
        return new Date(b.last_analyzed_at ?? 0).getTime() - new Date(a.last_analyzed_at ?? 0).getTime()
      })
  }, [candidates, search, skillSearch, filterExp, filterLocation, filterJob, selectedJob])

  const activeFilters = [filterExp !== 'all', filterLocation !== 'all', filterJob !== 'all', !!skillSearch].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Talangpool
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {candidates.length} kandidater med analyserade CV:n · Hitta rätt person proaktivt
          </p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök namn, titel, kompetens, stad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filter
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg border">
            <div>
              <p className="text-xs font-medium mb-1.5">Erfarenhet</p>
              <Select value={filterExp} onValueChange={v => setFilterExp(v ?? 'all')}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla nivåer</SelectItem>
                  <SelectItem value="0">Ingen erfarenhet</SelectItem>
                  <SelectItem value="1-2">1–2 år</SelectItem>
                  <SelectItem value="3-5">3–5 år</SelectItem>
                  <SelectItem value="5-10">5–10 år</SelectItem>
                  <SelectItem value="10+">10+ år</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5">Stad</p>
              <Select value={filterLocation} onValueChange={v => setFilterLocation(v ?? 'all')}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla städer</SelectItem>
                  {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5">Matcha mot jobb</p>
              <Select value={filterJob} onValueChange={v => setFilterJob(v ?? 'all')}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Välj jobb...</SelectItem>
                  {recruiterJobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium mb-1.5">Specifik kompetens</p>
              <Input
                placeholder="ex. Bokföring, Truckkörkort, Pedagogik..."
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterJob !== 'all' && selectedJob && (
            <Badge variant="secondary" className="gap-1">
              <Brain className="h-3 w-3" />
              Matchar: {selectedJob.title}
              <button onClick={() => setFilterJob('all')}><X className="h-3 w-3 ml-0.5" /></button>
            </Badge>
          )}
          {filterExp !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filterExp === 'junior' ? 'Junior' : filterExp === 'mid' ? 'Mid' : 'Senior'}
              <button onClick={() => setFilterExp('all')}><X className="h-3 w-3 ml-0.5" /></button>
            </Badge>
          )}
          {filterLocation !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              {filterLocation}
              <button onClick={() => setFilterLocation('all')}><X className="h-3 w-3 ml-0.5" /></button>
            </Badge>
          )}
          {skillSearch && (
            <Badge variant="secondary" className="gap-1">
              {skillSearch}
              <button onClick={() => setSkillSearch('')}><X className="h-3 w-3 ml-0.5" /></button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => {
            setFilterExp('all'); setFilterLocation('all'); setFilterJob('all'); setSkillSearch('')
          }}>
            Rensa alla
          </Button>
        </div>
      )}

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        Visar <span className="font-medium text-foreground">{filtered.length}</span> av {candidates.length} kandidater
      </p>

      {/* Candidates grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Inga kandidater matchar sökningen</p>
          <p className="text-sm">Prova att justera dina filter</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(c => {
            const seeker = Array.isArray(c.seeker) ? c.seeker[0] : c.seeker
            if (!seeker) return null
            const initials = seeker.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
            const skillsToShow = (c.skills ?? []).slice(0, 6)
            const extraSkills = (c.skills ?? []).length - skillsToShow.length
            const jobSkills = selectedJob?.skills_required ?? []

            return (
              <Card key={c.seeker_id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={seeker.avatar_url ?? ''} />
                      <AvatarFallback className="gradient-primary text-white text-sm">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{seeker.full_name ?? 'Anonym kandidat'}</p>
                          {seeker.headline && (
                            <p className="text-sm text-muted-foreground">{seeker.headline}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                            {seeker.location && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />{seeker.location}
                              </span>
                            )}
                            {c.experience_years != null && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Briefcase className="h-3 w-3" />{c.experience_years} år erfarenhet
                              </span>
                            )}
                            {c.education && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <GraduationCap className="h-3 w-3" />{c.education.split('\n')[0].slice(0, 40)}
                              </span>
                            )}
                            {c.languages && c.languages.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Globe className="h-3 w-3" />{c.languages.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match score om jobb valt */}
                        {c.matchPct !== null && (
                          <div className="text-center flex-shrink-0">
                            <p className={`text-2xl font-bold ${c.matchPct >= 60 ? 'gradient-text' : 'text-muted-foreground'}`}>
                              {c.matchPct}%
                            </p>
                            <p className="text-xs text-muted-foreground">match</p>
                            <Progress value={c.matchPct} className="h-1 w-16 mt-1" />
                          </div>
                        )}
                      </div>

                      {c.ai_summary && (
                        <p className="text-sm text-muted-foreground mt-2 italic line-clamp-2">{c.ai_summary}</p>
                      )}

                      <Separator className="my-3" />

                      <div className="flex flex-wrap gap-1.5">
                        {skillsToShow.map(s => (
                          <Badge
                            key={s}
                            variant={jobSkills.includes(s) ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {s}
                          </Badge>
                        ))}
                        {extraSkills > 0 && (
                          <Badge variant="outline" className="text-xs">+{extraSkills} till</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" asChild>
                        <Link href={`/messages?user=${seeker.id}`}>
                          <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                          Kontakta
                        </Link>
                      </Button>
                      {recruiterJobs.length > 0 && (
                        <InviteCandidateDialog
                          seekerId={seeker.id}
                          seekerName={seeker.full_name ?? 'Kandidat'}
                          jobs={recruiterJobs}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
