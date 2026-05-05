import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Bookmark } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sparade jobb' }

export default async function SavedJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: saved } = await supabase
    .from('saved_jobs')
    .select('id, created_at, job:jobs(id, title, location, work_type, skills_required, status, recruiter_id)')
    .eq('seeker_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch company profiles separately
  const recruiterIds = [...new Set(
    (saved ?? [])
      .map(s => (s.job as { recruiter_id?: string } | null)?.recruiter_id)
      .filter(Boolean) as string[]
  )]
  const { data: companyProfiles } = recruiterIds.length > 0
    ? await supabase.from('company_profiles').select('recruiter_id, company_name').in('recruiter_id', recruiterIds)
    : { data: [] }
  const companyMap = new Map((companyProfiles ?? []).map(c => [c.recruiter_id, c.company_name]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sparade jobb</h1>
        <p className="text-muted-foreground">{saved?.length ?? 0} sparade jobb</p>
      </div>

      {!saved?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Inga sparade jobb</p>
          <Link href="/seeker/jobs" className="text-primary text-sm hover:underline mt-2 inline-block">
            Bläddra bland jobb
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {saved.map((item) => {
            const job = item.job as unknown as {
              id: string; title: string; location: string | null
              work_type: string | null; skills_required: string[] | null; status: string; recruiter_id: string
            } | null
            if (!job) return null
            const companyName = companyMap.get(job.recruiter_id) ?? 'Okänt företag'
            return (
              <Card key={item.id}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <Link href={`/seeker/jobs/${job.id}`} className="hover:underline">
                        <h3 className="font-semibold">{job.title}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{companyName}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{job.location}
                          </span>
                        )}
                        {job.work_type && <Badge variant="outline" className="text-xs">{job.work_type}</Badge>}
                        {job.status !== 'active' && <Badge variant="destructive" className="text-xs">Stängd</Badge>}
                      </div>
                      {job.skills_required && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills_required.slice(0, 4).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button size="sm" asChild disabled={job.status !== 'active'}>
                        <Link href={`/seeker/jobs/${job.id}`}>Ansök</Link>
                      </Button>
                      <p className="text-xs text-muted-foreground text-right">
                        {new Date(item.created_at).toLocaleDateString('sv-SE')}
                      </p>
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
