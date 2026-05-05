'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SparklesIcon, UploadIcon, UserIcon } from 'lucide-react'
import type { Profile, CvProfile } from '@/types/database'

export default function ProfileView({ profile, cvProfile }: { profile: Profile; cvProfile: CvProfile | null }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cvText, setCvText] = useState(cvProfile?.cv_text ?? '')
  const [analysisResult, setAnalysisResult] = useState<{ ai_summary?: string; summary?: string; skills?: string[]; experience_years?: number } | null>(null)

  async function handleAnalyzeCV() {
    if (!cvText.trim()) return
    setIsAnalyzing(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch('/api/ai/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_text: cvText }),
      })
      const result = await res.json()
      const analysis = result.analysis ?? result
      setAnalysisResult(analysis)

      await supabase.from('cv_profiles').upsert({
        seeker_id: user.id,
        cv_text: cvText,
        skills: analysis.skills,
        experience_years: analysis.experience_years,
        education: analysis.education,
        ai_summary: analysis.summary ?? analysis.ai_summary,
        last_analyzed_at: new Date().toISOString(),
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Min profil</h1>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Profilinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Namn</p>
              <p className="font-medium">{profile.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roll</p>
              <p className="font-medium">{profile.user_type === 'recruiter' ? 'Rekryterare' : 'Jobbsökare'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rubrik</p>
              <p className="font-medium">{profile.headline ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plats</p>
              <p className="font-medium">{profile.location ?? '—'}</p>
            </div>
          </div>
          {profile.bio && (
            <div>
              <p className="text-sm text-muted-foreground">Bio</p>
              <p>{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CV section (only for job seekers) */}
      {profile.user_type === 'job_seeker' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              CV &amp; AI-analys
            </CardTitle>
            <CardDescription>
              Klistra in din CV-text nedan för AI-analys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-[200px] w-full rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Klistra in din CV-text här..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
            />
            <Button onClick={handleAnalyzeCV} disabled={isAnalyzing || !cvText.trim()}>
              <SparklesIcon className="mr-2 h-4 w-4" />
              {isAnalyzing ? 'Analyserar...' : 'Analysera CV'}
            </Button>

            {(cvProfile?.ai_summary || analysisResult?.ai_summary || analysisResult?.summary) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">AI-sammanfattning</p>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult?.ai_summary ?? analysisResult?.summary ?? cvProfile?.ai_summary}
                    </p>
                  </div>
                  {(analysisResult?.skills ?? cvProfile?.skills) && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Identifierade kompetenser</p>
                      <div className="flex flex-wrap gap-2">
                        {(analysisResult?.skills ?? cvProfile?.skills ?? []).map((skill: string) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(analysisResult?.experience_years ?? cvProfile?.experience_years) != null && (
                    <div>
                      <p className="text-sm font-medium">Erfarenhet</p>
                      <p className="text-sm text-muted-foreground">
                        {analysisResult?.experience_years ?? cvProfile?.experience_years} år
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
