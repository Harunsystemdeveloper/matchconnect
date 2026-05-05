import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, Users, Settings, FileText, Eye, Calendar, Share2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mina annonser' }

const statusLabels = { active: 'Aktiv', paused: 'Pausad', closed: 'Stängd' }
const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default async function RecruiterJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, application_count:applications(count)')
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mina annonser</h1>
          <p className="text-muted-foreground">{jobs?.length ?? 0} annonser totalt</p>
        </div>
        <Button asChild>
          <Link href="/recruiter/jobs/new"><Plus className="mr-2 h-4 w-4" />Ny annons</Link>
        </Button>
      </div>

      {!jobs?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Inga annonser ännu</p>
          <Button className="mt-4" asChild>
            <Link href="/recruiter/jobs/new">Skapa din första annons</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => {
            const appCount = Array.isArray(job.application_count) ? job.application_count[0]?.count ?? 0 : 0
            return (
              <Card key={job.id}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{job.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[job.status as keyof typeof statusColors]}`}>
                          {statusLabels[job.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                        )}
                        {job.work_type && <Badge variant="outline" className="text-xs">{job.work_type}</Badge>}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{appCount} ansökning{appCount !== 1 ? 'ar' : ''}
                        </span>
                        {(job.views ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />{job.views} visning{job.views !== 1 ? 'ar' : ''}
                          </span>
                        )}
                        {job.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Sista dag: {new Date(job.deadline).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                      </div>
                      {job.skills_required && job.skills_required.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills_required.slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/recruiter/jobs/${job.id}/candidates`}><Users className="h-3.5 w-3.5 mr-1" />Kandidater</Link>
                      </Button>
                      <Button size="sm" variant="ghost" asChild title="Publik annonsssida">
                        <Link href={`/jobs/${job.id}`} target="_blank"><Share2 className="h-3.5 w-3.5" /></Link>
                      </Button>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/recruiter/jobs/${job.id}/edit`}><Settings className="h-3.5 w-3.5" /></Link>
                      </Button>
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
