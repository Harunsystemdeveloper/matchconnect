'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Briefcase, FileText, Bookmark, TrendingUp, ArrowRight,
  User, MapPin, Star, AlertCircle, Sparkles
} from 'lucide-react'
import type { Profile, CvProfile, Application } from '@/types/database'

interface JobRelation {
  title: string
  location: string | null
  company_profiles?: { company_name: string }[] | { company_name: string } | null
}

interface RecommendedJob {
  id: string; title: string; location: string | null; work_type: string | null
  skills_required: string[] | null; salary_min: number | null; salary_max: number | null; currency: string
  company_profile: { company_name: string; industry: string | null } | null
}

interface Props {
  profile: Profile
  cvProfile: CvProfile | null
  applications: (Application & { job?: JobRelation | null })[]
  savedJobsCount: number
  recommendedJobs?: RecommendedJob[]
}

function getProfileStrength(profile: Profile, cvProfile: CvProfile | null): number {
  let score = 0
  if (profile.full_name) score += 15
  if (profile.avatar_url) score += 10
  if (profile.headline) score += 10
  if (profile.bio) score += 10
  if (profile.location) score += 5
  if (cvProfile?.cv_url) score += 20
  if (cvProfile?.skills && cvProfile.skills.length >= 5) score += 15
  if (cvProfile?.experience_years != null) score += 10
  if (cvProfile?.education) score += 5
  return score
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  shortlisted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const statusLabels: Record<string, string> = {
  pending: 'Väntar', reviewed: 'Granskad', shortlisted: 'Shortlistad',
  accepted: 'Accepterad', rejected: 'Avvisad',
}

export function SeekerDashboard({ profile, cvProfile, applications, savedJobsCount, recommendedJobs = [] }: Props) {
  const profileStrength = getProfileStrength(profile, cvProfile)

  // Build chart data from applications per week
  const weekData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (5 - i) * 7)
    const week = d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
    const count = applications.filter(a => {
      const ad = new Date(a.created_at)
      const diff = (new Date().getTime() - ad.getTime()) / (1000 * 60 * 60 * 24 * 7)
      return diff >= (5 - i) && diff < (6 - i)
    }).length
    return { week, ansökningar: count }
  })

  const topApplications = applications
    .filter(a => a.match_score != null)
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, 5)

  const missingSkills = applications
    .flatMap(a => a.skill_gaps ?? [])
    .reduce<Record<string, number>>((acc, skill) => {
      acc[skill] = (acc[skill] ?? 0) + 1
      return acc
    }, {})

  const topGaps = Object.entries(missingSkills)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Hej, {profile.full_name?.split(' ')[0] ?? 'där'}!
        </h1>
        <p className="text-muted-foreground">Här är din jobbsökaröversikt.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: 'Ansökningar', value: applications.length, href: '/seeker/applications' },
          { icon: Star, label: 'Shortlistade', value: applications.filter(a => a.status === 'shortlisted').length, href: '/seeker/applications' },
          { icon: Bookmark, label: 'Sparade jobb', value: savedJobsCount, href: '/seeker/saved' },
          { icon: TrendingUp, label: 'Profilstyrka', value: `${profileStrength}%`, href: '/seeker/profile' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile strength */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Profilstyrka
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold gradient-text">{profileStrength}%</span>
              <Badge variant={profileStrength >= 80 ? 'default' : 'secondary'}>
                {profileStrength >= 80 ? 'Stark' : profileStrength >= 50 ? 'OK' : 'Svag'}
              </Badge>
            </div>
            <Progress value={profileStrength} className="h-2" />
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {!cvProfile?.cv_url && (
                <p className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" /> Ladda upp ditt CV (+20p)
                </p>
              )}
              {!profile.avatar_url && (
                <p className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Lägg till profilbild (+10p)
                </p>
              )}
              {(!cvProfile?.skills || cvProfile.skills.length < 5) && (
                <p className="flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Lägg till minst 5 kompetenser (+15p)
                </p>
              )}
            </div>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href="/seeker/profile">Förbättra profil</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Application chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ansökningsaktivitet</CardTitle>
            <CardDescription>Senaste 6 veckorna</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                Inga ansökningar ännu.{' '}
                <Link href="/seeker/jobs" className="text-primary ml-1 hover:underline">Bläddra bland jobb</Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={weekData}>
                  <defs>
                    <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="ansökningar" stroke="hsl(var(--primary))" fill="url(#colorApp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Senaste ansökningar</CardTitle>
              <CardDescription>Dina {Math.min(5, applications.length)} senaste</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seeker/applications">Se alla</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Inga ansökningar ännu</p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href="/seeker/jobs">Hitta jobb</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{app.job?.title ?? 'Okänt jobb'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {app.job?.location ?? 'Plats ej angiven'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {app.match_score != null && (
                        <span className="text-xs font-medium text-primary">{app.match_score}%</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[app.status]}`}>
                        {statusLabels[app.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vanligaste kompetensgap</CardTitle>
            <CardDescription>Kompetenser du ofta saknar i ansökningar</CardDescription>
          </CardHeader>
          <CardContent>
            {topGaps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>Inga gap identifierade ännu</p>
                <p className="text-xs mt-1">Sök på jobb för att se din matchning</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topGaps.map(([skill, count]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{skill}</span>
                      <span className="text-muted-foreground text-xs">Saknas i {count} jobb</span>
                    </div>
                    <Progress value={Math.min((count / (topApplications.length || 1)) * 100, 100)} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended jobs */}
      {recommendedJobs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Rekommenderade för dig
              </CardTitle>
              <CardDescription>Baserat på dina kompetenser</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seeker/jobs">Se alla</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedJobs.map(job => {
                const overlap = (job.skills_required ?? []).filter(s =>
                  cvProfile?.skills?.includes(s)
                ).length
                const total = (job.skills_required ?? []).length
                const pct = total > 0 ? Math.round((overlap / total) * 100) : 0
                return (
                  <Link key={job.id} href={`/seeker/jobs/${job.id}`}>
                    <div className="rounded-lg border border-border hover:border-primary/40 hover:shadow-sm transition-all p-3 space-y-2 h-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{job.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {job.company_profile?.company_name ?? 'Okänt företag'}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-primary">{pct}%</p>
                          <p className="text-xs text-muted-foreground">match</p>
                        </div>
                      </div>
                      <Progress value={pct} className="h-1" />
                      <div className="flex flex-wrap gap-1">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" />{job.location}
                          </span>
                        )}
                        {job.work_type && (
                          <Badge variant="outline" className="text-xs">{job.work_type}</Badge>
                        )}
                      </div>
                      {job.skills_required && (
                        <div className="flex flex-wrap gap-1">
                          {job.skills_required.slice(0, 3).map(s => (
                            <Badge
                              key={s}
                              variant={cvProfile?.skills?.includes(s) ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No CV = prompt to upload */}
      {!cvProfile?.skills?.length && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center space-y-3">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-sm">Ladda upp ditt CV för att se rekommenderade jobb</p>
            <Button size="sm" asChild>
              <Link href="/seeker/profile">Ladda upp CV</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Browse jobs CTA */}
      <Card className="gradient-primary text-white">
        <CardContent className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-lg">Redo att hitta nästa jobb?</p>
            <p className="text-white/80 text-sm">AI matchar dig mot hundratals jobb i realtid.</p>
          </div>
          <Button variant="secondary" asChild>
            <Link href="/seeker/jobs">
              Bläddra bland jobb <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
