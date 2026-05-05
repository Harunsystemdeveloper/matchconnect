import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, MapPinIcon, BriefcaseIcon } from 'lucide-react'

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  if (profile?.user_type === 'recruiter') {
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('recruiter_id', user.id)
      .order('created_at', { ascending: false })

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mina jobbannonser</h1>
          <Button asChild>
            <Link href="/recruiter/jobs/new" className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Ny annons
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs?.map((job) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>{job.status}</Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  {job.location ?? 'Ingen plats'} · {job.work_type ?? '—'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={`/jobs/${job.id}`}>Hantera</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        {(!jobs || jobs.length === 0) && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <BriefcaseIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Inga jobbannonser ännu</p>
            <Button asChild><Link href="/recruiter/jobs/new">Skapa din första annons</Link></Button>
          </div>
        )}
      </div>
    )
  }

  // Job seeker view
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, profiles(full_name, headline)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Lediga jobb</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs?.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                {job.location ?? 'Ingen plats'} · {job.work_type ?? '—'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
              {job.salary_min && (
                <p className="mt-2 text-sm font-medium">
                  {job.salary_min.toLocaleString('sv-SE')}–{job.salary_max?.toLocaleString('sv-SE')} {job.currency}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button size="sm" asChild className="w-full">
                <Link href={`/jobs/${job.id}`}>Se mer &amp; ansök</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
