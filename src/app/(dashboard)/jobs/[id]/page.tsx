import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Globe, Calendar, Briefcase, AlertCircle, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: job } = await supabase.from('jobs').select('title').eq('id', id).single()
  return { title: job?.title ?? 'Jobbannons' }
}

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Logged-in users: redirect to the right role-specific page
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profile?.user_type === 'recruiter') {
      redirect(`/recruiter/jobs/${id}/candidates`)
    } else {
      redirect(`/seeker/jobs/${id}`)
    }
  }

  // Not logged in: show public job view
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!job) {
    redirect('/login')
  }

  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('company_name, logo_url, industry, location, website')
    .eq('recruiter_id', job.recruiter_id)
    .single()

  const deadline = job.deadline ? new Date(job.deadline) : null
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
  const urgentDeadline = daysLeft !== null && daysLeft <= 3

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            MatchConnect
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Logga in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Registrera dig</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <p className="text-muted-foreground mt-1">
                  {companyProfile?.company_name ?? 'Okänt företag'}
                  {companyProfile?.industry && ` · ${companyProfile.industry}`}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {job.location && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />{job.location}
                  </span>
                )}
                {job.work_type && <Badge variant="outline">{job.work_type}</Badge>}
                {job.experience_level && <Badge variant="outline">{job.experience_level}</Badge>}
                {job.salary_min && job.salary_max && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {job.salary_min.toLocaleString('sv-SE')}–{job.salary_max.toLocaleString('sv-SE')} {job.currency}/mån
                  </span>
                )}
                {companyProfile?.website && (
                  <a href={companyProfile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <Globe className="h-3.5 w-3.5" /> Webbplats
                  </a>
                )}
              </div>

              {daysLeft !== null && (
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${
                  urgentDeadline
                    ? 'bg-destructive/10 text-destructive font-medium'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {urgentDeadline ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                  {daysLeft <= 0
                    ? 'Sista dag att ansöka!'
                    : `Sista ansökningsdag: ${deadline!.toLocaleDateString('sv-SE')} (${daysLeft} dag${daysLeft !== 1 ? 'ar' : ''} kvar)`}
                </span>
              )}

              {job.skills_required && job.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(job.skills_required as string[]).map(s => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Apply CTA */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Intresserad av det här jobbet?</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Skapa ett konto och låt AI matcha dig mot annonsen direkt.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" asChild>
                  <Link href="/login">Logga in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Sök jobbet
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="pt-6 pb-6">
            <h2 className="font-semibold text-base mb-3">Om rollen</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </div>
            {job.requirements && (
              <>
                <h2 className="font-semibold text-base mt-6 mb-3">Krav</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.requirements}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">Redo att söka?</p>
          <Button size="lg" asChild>
            <Link href="/register">Skapa konto och ansök gratis</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
