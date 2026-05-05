'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend
} from 'recharts'
import {
  TrendingUp, Users, Briefcase, Star, Eye, Clock,
  CheckCircle2, XCircle, BarChart2
} from 'lucide-react'

interface Job {
  id: string
  title: string
  status: string
  created_at: string
  views: number
}

interface Application {
  id: string
  job_id: string
  status: string
  match_score: number | null
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  reviewed: '#60a5fa',
  shortlisted: '#a78bfa',
  accepted: '#34d399',
  rejected: '#f87171',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ny',
  reviewed: 'Granskad',
  shortlisted: 'Shortlistad',
  accepted: 'Accepterad',
  rejected: 'Avvisad',
}

export function RecruiterAnalyticsClient({
  jobs,
  applications,
  shortlistCount,
}: {
  jobs: Job[]
  applications: Application[]
  shortlistCount: number
}) {
  // Veckovis ansökningar (senaste 8 veckor)
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {}
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      const key = `v${Math.ceil((d.getDate()) / 7)}-${d.getMonth() + 1}`
      weeks[key] = 0
    }
    applications.forEach(a => {
      const d = new Date(a.created_at)
      const weeksAgo = Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000))
      if (weeksAgo <= 7) {
        const key = `v${Math.ceil((d.getDate()) / 7)}-${d.getMonth() + 1}`
        weeks[key] = (weeks[key] ?? 0) + 1
      }
    })
    return Object.entries(weeks).map(([week, count]) => ({ week, count }))
  }, [applications])

  // Pipeline-fördelning
  const pipelineData = useMemo(() => {
    const counts: Record<string, number> = {}
    applications.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1 })
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABELS[status] ?? status,
      value,
      color: STATUS_COLORS[status] ?? '#94a3b8',
    }))
  }, [applications])

  // Matchpoängsfördelning (buckets)
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { label: '0–20', min: 0, max: 20, count: 0 },
      { label: '21–40', min: 21, max: 40, count: 0 },
      { label: '41–60', min: 41, max: 60, count: 0 },
      { label: '61–80', min: 61, max: 80, count: 0 },
      { label: '81–100', min: 81, max: 100, count: 0 },
    ]
    applications.forEach(a => {
      if (a.match_score == null) return
      const bucket = buckets.find(b => a.match_score! >= b.min && a.match_score! <= b.max)
      if (bucket) bucket.count++
    })
    return buckets
  }, [applications])

  // Jobb per visningar
  const topJobsByViews = useMemo(() => {
    return [...jobs].sort((a, b) => b.views - a.views).slice(0, 5)
  }, [jobs])

  // Topp jobb per ansökningar
  const topJobsByApps = useMemo(() => {
    const counts: Record<string, number> = {}
    applications.forEach(a => { counts[a.job_id] = (counts[a.job_id] ?? 0) + 1 })
    return jobs
      .map(j => ({ ...j, appCount: counts[j.id] ?? 0 }))
      .sort((a, b) => b.appCount - a.appCount)
      .slice(0, 5)
  }, [jobs, applications])

  // KPI-nyckeltal
  const totalApps = applications.length
  const acceptedApps = applications.filter(a => a.status === 'accepted').length
  const conversionRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0
  const avgScore = applications.filter(a => a.match_score != null).length > 0
    ? Math.round(applications.filter(a => a.match_score != null).reduce((s, a) => s + (a.match_score ?? 0), 0) / applications.filter(a => a.match_score != null).length)
    : null
  const activeJobs = jobs.filter(j => j.status === 'active').length
  const totalViews = jobs.reduce((s, j) => s + j.views, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Rekryteringsstatistik och pipeline-analys</p>
        </div>
      </div>

      {/* KPI-kort */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva annonser</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">{jobs.length} totalt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totala ansökningar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApps}</div>
            <p className="text-xs text-muted-foreground">{shortlistCount} shortlistade</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">{acceptedApps} accepterade</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Snitt matchpoäng</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore != null ? `${avgScore}%` : '—'}</div>
            <p className="text-xs text-muted-foreground">{totalViews} annonsvisningar</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafer – rad 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Veckovis ansökningar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Ansökningar per vecka (8 veckor)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalApps === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Inga ansökningar ännu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, 'Ansökningar']} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pipeline-status (pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Pipeline-fördelning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pipelineData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Inga ansökningar ännu
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={pipelineData} dataKey="value" cx="50%" cy="50%" outerRadius={70} strokeWidth={0}>
                      {pipelineData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pipelineData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-xs">{d.name}</span>
                      </div>
                      <span className="text-xs font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafer – rad 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Matchpoängsfördelning */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Matchpoängsfördelning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {applications.filter(a => a.match_score != null).length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Kör AI-matchning på dina kandidater för att se data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, 'Kandidater']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Topp 5 jobb per ansökningar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              Topp 5 annonser (ansökningar)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topJobsByApps.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Inga jobb ännu
              </div>
            ) : (
              <div className="space-y-3">
                {topJobsByApps.map(job => {
                  const maxApps = topJobsByApps[0]?.appCount ?? 1
                  const pct = Math.round((job.appCount / maxApps) * 100)
                  return (
                    <div key={job.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm truncate flex-1 mr-2">{job.title}</p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {job.status === 'active' ? 'Aktiv' : 'Stängd'}
                          </Badge>
                          <span className="text-sm font-medium w-8 text-right">{job.appCount}</span>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Annonsvisningar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Annonsvisningar (topp 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topJobsByViews.filter(j => j.views > 0).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Inga visningar registrerade än</p>
          ) : (
            <div className="space-y-3">
              {topJobsByViews.filter(j => j.views > 0).map(job => {
                const maxViews = topJobsByViews[0]?.views ?? 1
                const pct = Math.round((job.views / maxViews) * 100)
                return (
                  <div key={job.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm truncate flex-1 mr-2">{job.title}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{job.views}</span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Konverteringsfunnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Rekryteringsfunnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[
              { key: 'pending', label: 'Ny', icon: Clock },
              { key: 'reviewed', label: 'Granskad', icon: Eye },
              { key: 'shortlisted', label: 'Shortlistad', icon: Star },
              { key: 'accepted', label: 'Accepterad', icon: CheckCircle2 },
              { key: 'rejected', label: 'Avvisad', icon: XCircle },
            ].map(({ key, label, icon: Icon }) => {
              const count = applications.filter(a => a.status === key).length
              const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
              return (
                <div key={key} className="text-center space-y-2">
                  <div
                    className="rounded-lg p-3 flex flex-col items-center gap-1"
                    style={{ backgroundColor: STATUS_COLORS[key] + '20' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: STATUS_COLORS[key] }} />
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{pct}%</p>
                  </div>
                  <p className="text-xs font-medium">{label}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
