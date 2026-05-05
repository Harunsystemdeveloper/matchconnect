import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BriefcaseIcon, FileTextIcon, PlusIcon, UsersIcon, Brain, MessageSquare, Star, Clock } from 'lucide-react'
import type { Profile } from '@/types/database'

export default async function RecruiterDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient()

  const [{ data: jobs }, { count: appCount }, { count: pendingCount }] = await Promise.all([
    supabase.from('jobs').select('*, applications(count)').eq('recruiter_id', profile.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('applications').select('*, jobs!inner(recruiter_id)', { count: 'exact', head: true }).eq('jobs.recruiter_id', profile.id),
    supabase.from('applications').select('*, jobs!inner(recruiter_id)', { count: 'exact', head: true }).eq('jobs.recruiter_id', profile.id).eq('status', 'pending'),
  ])

  const activeJobs = jobs?.filter(j => j.status === 'active').length ?? 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Välkommen, {profile.full_name}!</h1>
          <p className="text-muted-foreground">Hantera dina jobbannonser och kandidater</p>
        </div>
        <Button asChild>
          <Link href="/recruiter/jobs/new" className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Ny jobbannons
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva annonser</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totala annonser</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Totala ansökningar</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card className={(pendingCount ?? 0) > 0 ? 'border-primary/40 bg-primary/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Att granska</CardTitle>
            <Clock className={`h-4 w-4 ${(pendingCount ?? 0) > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(pendingCount ?? 0) > 0 ? 'gradient-text' : ''}`}>{pendingCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">nya ansökningar</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent jobs */}
      {jobs && jobs.length > 0 ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Senaste annonser</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/recruiter/jobs">Se alla</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.location ?? '—'} · {job.work_type ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {(job.applications as { count: number }[])?.[0]?.count ?? 0} ansökningar
                    </span>
                    <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                      {job.status === 'active' ? 'Aktiv' : job.status === 'paused' ? 'Pausad' : 'Stängd'}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/recruiter/jobs/${job.id}/candidates`}>Visa</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome card */}
          <Card className="gradient-primary text-white">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold">Välkommen till MatchConnect!</p>
                  <p className="text-white/80 text-sm mt-1">
                    Skapa din första jobbannons och låt AI hitta rätt kandidater åt dig.
                  </p>
                </div>
                <Button variant="secondary" asChild className="flex-shrink-0">
                  <Link href="/recruiter/jobs/new">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Skapa annons
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How it works */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Så här fungerar det</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: BriefcaseIcon,
                  step: '1',
                  title: 'Skapa en jobbannons',
                  desc: 'Beskriv rollen, kompetenskrav och erfarenhetsnivå. Ju mer detaljerat desto bättre AI-matchning.',
                },
                {
                  icon: Brain,
                  step: '2',
                  title: 'AI matchar kandidater',
                  desc: 'När sökande kommer in klickar du "AI-matcha" — systemet rankar alla efter lämplighet.',
                },
                {
                  icon: MessageSquare,
                  step: '3',
                  title: 'Kontakta de bästa',
                  desc: 'Shortlista favoriter och chatta direkt med kandidaterna via meddelandefunktionen.',
                },
              ].map(({ icon: Icon, step, title, desc }) => (
                <Card key={step}>
                  <CardContent className="pt-5 pb-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white text-sm font-bold flex-shrink-0">
                        {step}
                      </div>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <Card className="border-dashed">
            <CardContent className="pt-5 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Fyll i din företagsprofil</p>
                  <p className="text-xs text-muted-foreground">Kandidater ser ditt företag på jobbannonsen</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/recruiter/company">Företagsprofil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
