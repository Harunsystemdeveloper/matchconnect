'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Bookmark, BookmarkCheck, Search, Briefcase, Clock, ChevronLeft, ChevronRight, SlidersHorizontal, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Job {
  id: string
  title: string
  description: string
  skills_required: string[] | null
  location: string | null
  work_type: string | null
  salary_min: number | null
  salary_max: number | null
  currency: string
  created_at: string
  deadline: string | null
  is_saved: boolean
  user_application: { match_score: number | null; status: string } | null
  company_profile: { company_name: string; logo_url: string | null; industry: string | null } | null
}

const PAGE_SIZE = 12

function daysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function JobsListClient({ jobs: initialJobs, userId }: { jobs: Job[]; userId: string }) {
  const [jobs, setJobs] = useState(initialJobs)
  const [search, setSearch] = useState('')
  const [workType, setWorkType] = useState('all')
  const [minSalary, setMinSalary] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const supabase = createClient()

  async function toggleSave(jobId: string, isSaved: boolean) {
    if (isSaved) {
      await supabase.from('saved_jobs').delete().eq('seeker_id', userId).eq('job_id', jobId)
      toast.success('Jobb borttaget från sparade')
    } else {
      await supabase.from('saved_jobs').insert({ seeker_id: userId, job_id: jobId })
      toast.success('Jobb sparat!')
    }
    setJobs(jobs.map(j => j.id === jobId ? { ...j, is_saved: !isSaved } : j))
  }

  const filtered = useMemo(() => {
    const minSal = minSalary ? parseInt(minSalary) : 0
    return jobs.filter(j => {
      const matchSearch = !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.company_profile?.company_name.toLowerCase().includes(search.toLowerCase()) ||
        j.location?.toLowerCase().includes(search.toLowerCase()) ||
        j.skills_required?.some(s => s.toLowerCase().includes(search.toLowerCase()))
      const matchWork = workType === 'all' || j.work_type === workType
      const matchSalary = !minSal || (j.salary_max != null && j.salary_max >= minSal)
      // Filter out expired deadlines
      const notExpired = !j.deadline || new Date(j.deadline) >= new Date()
      return matchSearch && matchWork && matchSalary && notExpired
    })
  }, [jobs, search, workType, minSalary])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'match') {
        return (b.user_application?.match_score ?? -1) - (a.user_application?.match_score ?? -1)
      }
      if (sortBy === 'salary') {
        return (b.salary_max ?? 0) - (a.salary_max ?? 0)
      }
      if (sortBy === 'deadline') {
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      // newest (default)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [filtered, sortBy])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function changePage(newPage: number) {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleFilter(fn: () => void) { fn(); setPage(1) }

  const hasActiveFilters = search || workType !== 'all' || minSalary

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hitta jobb</h1>
        <p className="text-muted-foreground">{jobs.length} aktiva annonser</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök titel, företag, ort, kompetens..."
              value={search}
              onChange={e => handleFilter(() => setSearch(e.target.value))}
              className="pl-9"
            />
          </div>
          <Select value={workType} onValueChange={v => handleFilter(() => setWorkType(v ?? 'all'))}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Arbetsform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla former</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="on-site">På plats</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={v => handleFilter(() => setSortBy(v ?? 'newest'))}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sortera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Nyast först</SelectItem>
              <SelectItem value="match">Bäst match</SelectItem>
              <SelectItem value="salary">Högst lön</SelectItem>
              <SelectItem value="deadline">Sista datum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Salary filter */}
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="relative w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Min</span>
            <Input
              type="number"
              placeholder="40 000 kr/mån"
              value={minSalary}
              onChange={e => handleFilter(() => setMinSalary(e.target.value))}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setWorkType('all'); setMinSalary(''); setPage(1) }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Rensa filter
            </button>
          )}
          {filtered.length !== jobs.length && (
            <p className="text-xs text-muted-foreground">{filtered.length} av {jobs.length} jobb</p>
          )}
        </div>
      </div>

      {/* Results */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Inga jobb matchar din sökning</p>
          <p className="text-sm mt-1">Prova att ändra filter</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {paginated.map(job => {
            const days = job.deadline ? daysLeft(job.deadline) : null
            const urgentDeadline = days !== null && days <= 3

            return (
              <Card key={job.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <Link href={`/seeker/jobs/${job.id}`} className="hover:underline flex-1 min-w-0">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                            {job.title}
                          </h3>
                        </Link>
                        {days !== null && (
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                            urgentDeadline
                              ? 'bg-destructive/10 text-destructive font-medium'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <AlertCircle className="h-2.5 w-2.5" />
                            {days <= 0 ? 'Sista dag!' : `${days} dag${days !== 1 ? 'ar' : ''} kvar`}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.company_profile?.company_name ?? 'Okänt företag'}
                        {job.company_profile?.industry && ` · ${job.company_profile.industry}`}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{job.location}
                          </span>
                        )}
                        {job.work_type && (
                          <Badge variant="outline" className="text-xs">{job.work_type}</Badge>
                        )}
                        {job.salary_min && job.salary_max && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {job.salary_min.toLocaleString('sv-SE')}–{job.salary_max.toLocaleString('sv-SE')} {job.currency}/mån
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(job.created_at).toLocaleDateString('sv-SE')}
                        </span>
                      </div>

                      {job.skills_required && job.skills_required.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {job.skills_required.slice(0, 5).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                          {job.skills_required.length > 5 && (
                            <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 5}</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {job.user_application?.match_score != null && (
                        <div className="text-center">
                          <p className="text-lg font-bold gradient-text">{job.user_application.match_score}%</p>
                          <p className="text-xs text-muted-foreground">match</p>
                        </div>
                      )}
                      <button
                        onClick={() => toggleSave(job.id, job.is_saved)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label={job.is_saved ? 'Ta bort bokmärke' : 'Spara jobb'}
                      >
                        {job.is_saved
                          ? <BookmarkCheck className="h-5 w-5 text-primary" />
                          : <Bookmark className="h-5 w-5" />}
                      </button>
                      {job.user_application ? (
                        <Badge variant="outline" className="text-xs">Sökt</Badge>
                      ) : (
                        <Button size="sm" asChild>
                          <Link href={`/seeker/jobs/${job.id}`}>Ansök</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Visar {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} av {sorted.length} jobb
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => changePage(page - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => changePage(page + 1)} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
