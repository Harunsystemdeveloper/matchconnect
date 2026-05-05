import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()

  if (profile?.user_type === 'recruiter') {
    const { data: applications } = await supabase
      .from('applications')
      .select('*, jobs!inner(title, recruiter_id), profiles(full_name, headline)')
      .eq('jobs.recruiter_id', user.id)
      .order('match_score', { ascending: false })

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Kandidater</h1>
        <div className="space-y-3">
          {applications?.map((app) => (
            <Card key={app.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1">
                  <p className="font-medium">{(app.profiles as { full_name: string } | null)?.full_name ?? 'Okänd'}</p>
                  <p className="text-sm text-muted-foreground">
                    {(app.profiles as { headline: string } | null)?.headline ?? '—'} · {(app.jobs as { title: string } | null)?.title}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {app.match_score != null && (
                    <div className="w-32">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>Match</span>
                        <span>{app.match_score}%</span>
                      </div>
                      <Progress value={app.match_score} />
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
          {(!applications || applications.length === 0) && (
            <p className="py-8 text-center text-muted-foreground">Inga ansökningar ännu</p>
          )}
        </div>
      </div>
    )
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('*, jobs(title, location, work_type, description)')
    .eq('seeker_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mina ansökningar</h1>
      <div className="space-y-3">
        {applications?.map((app) => (
          <Card key={app.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{(app.jobs as { title: string } | null)?.title ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">{(app.jobs as { location: string } | null)?.location ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {app.match_score != null && (
                    <span className="text-sm font-medium">{app.match_score}% match</span>
                  )}
                  <Badge variant={
                    app.status === 'accepted' ? 'default' :
                    app.status === 'rejected' ? 'destructive' : 'secondary'
                  }>
                    {app.status}
                  </Badge>
                </div>
              </div>
              {app.skill_gaps && app.skill_gaps.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-muted-foreground">Kompetensgap:</p>
                  <div className="flex flex-wrap gap-1">
                    {app.skill_gaps.map((gap: string) => (
                      <Badge key={gap} variant="outline" className="text-xs">{gap}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {(!applications || applications.length === 0) && (
          <div className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">Inga ansökningar ännu</p>
            <Button asChild><Link href="/seeker/jobs">Utforska jobb</Link></Button>
          </div>
        )}
      </div>
    </div>
  )
}
