import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, MessageSquare, Globe, Clock } from 'lucide-react'
import { WithdrawButton } from '@/components/seeker/withdraw-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mina ansökningar' }

const statusConfig: Record<string, { label: string; color: string; description: string }> = {
  pending: {
    label: 'Inskickad',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    description: 'Din ansökan är mottagen och väntar på att rekryteraren granskar den.',
  },
  reviewed: {
    label: 'Granskad',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Rekryteraren har läst din ansökan. Vänta på nästa steg.',
  },
  shortlisted: {
    label: 'Shortlistad',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    description: 'Du är bland favoritkandidaterna! Rekryteraren kan ta kontakt snart.',
  },
  accepted: {
    label: 'Accepterad',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    description: 'Grattis! Du har fått jobbet eller gått vidare i processen.',
  },
  rejected: {
    label: 'Ej vidare',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    description: 'Den här gången gick det inte. Fortsätt söka – rätt jobb väntar!',
  },
}

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: applications } = await supabase
    .from('applications')
    .select('*, job:jobs(id, title, location, skills_required, recruiter_id)')
    .eq('seeker_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch company profiles and recruiter profiles separately
  const recruiterIds = [...new Set(
    (applications ?? [])
      .map(a => (a.job as { recruiter_id?: string } | null)?.recruiter_id)
      .filter(Boolean) as string[]
  )]

  const [{ data: companyProfiles }, { data: recruiterProfiles }] = await Promise.all(
    recruiterIds.length > 0
      ? [
          supabase.from('company_profiles').select('recruiter_id, company_name, website').in('recruiter_id', recruiterIds),
          supabase.from('profiles').select('id, full_name').in('id', recruiterIds),
        ]
      : [{ data: [] }, { data: [] }]
  )

  const companyMap = new Map((companyProfiles ?? []).map(c => [c.recruiter_id, c]))
  const recruiterNameMap = new Map((recruiterProfiles ?? []).map(r => [r.id, r.full_name]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mina ansökningar</h1>
        <p className="text-muted-foreground">{applications?.length ?? 0} ansökningar totalt</p>
      </div>

      {/* Status legend */}
      {(applications?.length ?? 0) > 0 && (
        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Vad betyder statusarna?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {Object.entries(statusConfig).map(([, cfg]) => (
              <div key={cfg.label} className="flex items-start gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${cfg.color}`}>{cfg.label}</span>
                <p className="text-xs text-muted-foreground leading-snug">{cfg.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!applications?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Inga ansökningar ännu</p>
          <Link href="/seeker/jobs" className="text-primary text-sm hover:underline mt-2 inline-block">
            Bläddra bland jobb
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => {
            const job = app.job as { id: string; title: string; location: string | null; recruiter_id: string } | null
            const company = job ? companyMap.get(job.recruiter_id) : null
            const companyName = company?.company_name ?? 'Okänt företag'
            const recruiterName = job ? recruiterNameMap.get(job.recruiter_id) : null
            const cfg = statusConfig[app.status] ?? statusConfig.pending

            return (
              <Card key={app.id}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/seeker/jobs/${job?.id}`} className="hover:underline">
                        <h3 className="font-semibold">{job?.title ?? 'Okänt jobb'}</h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">{companyName}</p>

                      <div className="flex flex-wrap gap-3 mt-2">
                        {job?.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{job.location}
                          </span>
                        )}
                        {company?.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Globe className="h-3 w-3" />Företagets webbsida
                          </a>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Sökt {new Date(app.created_at).toLocaleDateString('sv-SE')}
                        </span>
                      </div>

                      {/* Status description */}
                      <p className="text-xs text-muted-foreground mt-2 italic">{cfg.description}</p>

                      {app.ai_summary && (
                        <p className="text-xs text-muted-foreground mt-2 border-l-2 border-primary/30 pl-2">{app.ai_summary}</p>
                      )}
                      {app.skill_gaps && app.skill_gaps.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs text-muted-foreground">Kompetensgap:</span>
                          {app.skill_gaps.slice(0, 3).map((s: string) => (
                            <Badge key={s} variant="destructive" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {app.match_score != null && (
                        <div className="text-center">
                          <p className="text-xl font-bold gradient-text">{app.match_score}%</p>
                          <p className="text-xs text-muted-foreground">match</p>
                        </div>
                      )}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {job?.recruiter_id && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/messages?user=${job.recruiter_id}`}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            {recruiterName ? `Kontakta ${recruiterName.split(' ')[0]}` : 'Kontakta rekryteraren'}
                          </Link>
                        </Button>
                      )}
                      {(app.status === 'pending' || app.status === 'reviewed') && (
                        <WithdrawButton applicationId={app.id} />
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
