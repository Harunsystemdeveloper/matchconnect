import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  MapPin, Globe, Users, Briefcase, ArrowRight,
  Building2, ExternalLink
} from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('company_profiles').select('company_name').eq('id', id).single()
  return { title: data?.company_name ?? 'Företag' }
}

const SIZE_LABELS: Record<string, string> = {
  '1-10': '1–10 anställda',
  '11-50': '11–50 anställda',
  '51-200': '51–200 anställda',
  '201-500': '201–500 anställda',
  '500+': '500+ anställda',
}

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company } = await supabase
    .from('company_profiles')
    .select('*, recruiter:profiles!company_profiles_recruiter_id_fkey(id, full_name, headline)')
    .eq('id', id)
    .single()

  if (!company) notFound()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, location, work_type, salary_min, salary_max, currency, experience_level, created_at')
    .eq('recruiter_id', company.recruiter_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const initials = company.company_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24 flex-shrink-0 rounded-2xl border-2">
              <AvatarImage src={company.logo_url ?? ''} />
              <AvatarFallback className="gradient-primary text-white text-2xl rounded-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{company.company_name}</h1>
                {company.industry && (
                  <Badge variant="secondary">{company.industry}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {company.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />{company.location}
                  </span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />{SIZE_LABELS[company.size] ?? company.size}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10 grid gap-10 lg:grid-cols-3">
        {/* Left: Om företaget */}
        <div className="lg:col-span-2 space-y-8">
          {company.description && (
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Om oss
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{company.description}</p>
            </section>
          )}

          <Separator />

          {/* Aktiva jobb */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Öppna tjänster
                <Badge variant="outline">{jobs?.length ?? 0}</Badge>
              </h2>
            </div>

            {!jobs || jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Inga öppna tjänster just nu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{job.title}</p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {job.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{job.location}
                              </span>
                            )}
                            {job.work_type && (
                              <Badge variant="outline" className="text-xs capitalize">{job.work_type}</Badge>
                            )}
                            {job.experience_level && (
                              <Badge variant="secondary" className="text-xs">{job.experience_level}</Badge>
                            )}
                            {(job.salary_min || job.salary_max) && (
                              <span className="text-xs text-muted-foreground">
                                {job.salary_min?.toLocaleString('sv-SE')}
                                {job.salary_max ? `–${job.salary_max.toLocaleString('sv-SE')}` : '+'} {job.currency}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" asChild className="flex-shrink-0">
                          <Link href={`/seeker/jobs/${job.id}`}>
                            Sök nu <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5 pb-5 space-y-4">
              <h3 className="font-semibold text-sm">Snabbfakta</h3>
              <div className="space-y-3 text-sm">
                {company.industry && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bransch</span>
                    <span className="font-medium">{company.industry}</span>
                  </div>
                )}
                {company.size && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storlek</span>
                    <span className="font-medium">{SIZE_LABELS[company.size] ?? company.size}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plats</span>
                    <span className="font-medium">{company.location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Öppna tjänster</span>
                  <span className="font-medium text-primary">{jobs?.length ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {company.website && (
            <Button variant="outline" className="w-full" asChild>
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                Besök hemsida
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          )}

          <Button className="w-full" asChild>
            <Link href={`/seeker/jobs?recruiter=${company.recruiter_id}`}>
              <Briefcase className="mr-2 h-4 w-4" />
              Se alla tjänster
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
