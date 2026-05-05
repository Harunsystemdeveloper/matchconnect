import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BriefcaseIcon, FileTextIcon, TrendingUpIcon, SparklesIcon } from 'lucide-react'
import type { Profile } from '@/types/database'

export default async function JobSeekerDashboard({ profile }: { profile: Profile }) {
  const supabase = await createClient()

  const [{ data: cvProfile }, { data: applications }, { count: jobCount }] = await Promise.all([
    supabase.from('cv_profiles').select('*').eq('seeker_id', profile.id).single(),
    supabase.from('applications').select('*, jobs(title, location, work_type)').eq('seeker_id', profile.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Välkommen, {profile.full_name}!</h1>
        <p className="text-muted-foreground">Här är din översikt</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktiva jobb</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mina ansökningar</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CV-status</CardTitle>
            <SparklesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cvProfile ? 'Analyserat' : 'Ej uppladdad'}</div>
          </CardContent>
        </Card>
      </div>

      {/* CV prompt */}
      {!cvProfile && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary" />
              Ladda upp ditt CV
            </CardTitle>
            <CardDescription>
              Ladda upp ditt CV för att få AI-analys och matchningspoäng mot jobb.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/seeker/profile">Gå till profil</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent applications */}
      {applications && applications.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Senaste ansökningar</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seeker/applications">Se alla</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{(app.jobs as { title: string } | null)?.title ?? 'Okänd tjänst'}</p>
                    <p className="text-sm text-muted-foreground">
                      {(app.jobs as { location: string } | null)?.location ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.match_score != null && (
                      <div className="flex items-center gap-1">
                        <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{app.match_score}%</span>
                      </div>
                    )}
                    <Badge variant={
                      app.status === 'accepted' ? 'default' :
                      app.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {app.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
