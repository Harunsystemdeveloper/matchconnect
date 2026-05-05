import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MessageSquare, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Shortlist' }

export default async function ShortlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: shortlisted } = await supabase
    .from('shortlist')
    .select(`
      id, note, created_at,
      application:applications(
        id, status, match_score, ai_summary, skill_gaps,
        job:jobs(id, title),
        seeker:profiles(id, full_name, avatar_url, headline, location),
        cv:cv_profiles(skills, experience_years)
      )
    `)
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shortlist</h1>
        <p className="text-muted-foreground">{shortlisted?.length ?? 0} shortlistade kandidater</p>
      </div>

      {!shortlisted?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Inga shortlistade kandidater</p>
          <p className="text-sm mt-1">Shortlista kandidater från kandidatvyn för varje jobb.</p>
          <Button className="mt-4" asChild>
            <Link href="/recruiter/jobs">Gå till annonser</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {shortlisted.map(item => {
            const app = item.application as unknown as {
              id: string; status: string; match_score: number | null; ai_summary: string | null; skill_gaps: string[] | null
              job: { id: string; title: string } | null
              seeker: { id: string; full_name: string | null; avatar_url: string | null; headline: string | null; location: string | null } | null
              cv: { skills: string[] | null; experience_years: number | null } | null
            } | null
            if (!app?.seeker) return null
            const initials = app.seeker.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
            return (
              <Card key={item.id} className="ring-2 ring-primary/20">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={app.seeker.avatar_url ?? ''} />
                      <AvatarFallback className="gradient-primary text-white text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{app.seeker.full_name}</p>
                      {app.seeker.headline && <p className="text-sm text-muted-foreground">{app.seeker.headline}</p>}
                      {app.seeker.location && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{app.seeker.location}
                        </p>
                      )}
                      {app.job && (
                        <p className="text-xs text-primary mt-1">
                          Sökte: <Link href={`/recruiter/jobs/${app.job.id}/candidates`} className="hover:underline">{app.job.title}</Link>
                        </p>
                      )}
                      {app.ai_summary && <p className="text-sm text-muted-foreground mt-1 italic">{app.ai_summary}</p>}
                      {app.cv?.skills && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.cv.skills.slice(0, 5).map(s => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
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
                      <Button size="sm" asChild>
                        <Link href={`/messages?user=${app.seeker.id}`}>
                          <MessageSquare className="mr-1 h-3.5 w-3.5" />Chatta
                        </Link>
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
