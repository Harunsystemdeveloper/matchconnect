'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Scale, AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { toast } from 'sonner'

interface GroupResult {
  name: string
  n: number
  selection_rate: number | null
  avg_match_score: number | null
  included: boolean
}

interface DimensionResult {
  dimension: 'gender' | 'age_bucket'
  groups: GroupResult[]
  adverse_impact: { reference_group: string | null; lowest_group: string | null; ratio: number | null; flagged: boolean }
  significance: { group_a: string; group_b: string; z_score: number; significant: boolean } | null
  human_review_required: boolean
  excluded_small_groups: string[]
}

interface AnalysisResult {
  total_applications: number
  total_candidates_with_demographics: number
  min_group_size: number
  gender: DimensionResult
  age_bucket: DimensionResult
  human_review_required: boolean
}

const DIMENSION_LABELS = { gender: 'Kön', age_bucket: 'Åldersgrupp' }

function DimensionCard({ result }: { result: DimensionResult }) {
  return (
    <Card className={result.human_review_required ? 'border-amber-400/60' : undefined}>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{DIMENSION_LABELS[result.dimension]}</span>
          {result.human_review_required ? (
            <Badge className="bg-amber-500 text-white gap-1"><AlertTriangle className="h-3 w-3" />Mänsklig granskning krävs</Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3" />Ingen flagga</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {result.groups.filter(g => g.included).length === 0 ? (
          <p className="text-sm text-muted-foreground">För få datapunkter per grupp (minst 5 krävs) för att visa statistik.</p>
        ) : (
          <div className="space-y-3">
            {result.groups.filter(g => g.included).map(g => (
              <div key={g.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{g.name} <span className="text-muted-foreground font-normal">({g.n} st)</span></span>
                  <span className="text-muted-foreground">
                    {g.selection_rate !== null ? `${Math.round(g.selection_rate * 100)}% gick vidare` : '–'}
                    {g.avg_match_score !== null ? ` · snitt ${g.avg_match_score}%` : ''}
                  </span>
                </div>
                <Progress value={(g.selection_rate ?? 0) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        )}

        {result.adverse_impact.ratio !== null && (
          <div className="rounded-lg bg-muted/40 border p-2.5 text-xs space-y-1">
            <p>
              <strong>Adverse impact ratio:</strong> {result.adverse_impact.ratio.toFixed(2)}
              {' '}({result.adverse_impact.lowest_group} vs {result.adverse_impact.reference_group})
              {result.adverse_impact.flagged && <span className="text-amber-600 font-medium"> — under 0.8, flaggat enligt 4/5-regeln</span>}
            </p>
            {result.significance && (
              <p>
                <strong>Signifikanstest:</strong> z = {result.significance.z_score}
                {result.significance.significant ? ' — statistiskt signifikant skillnad (p < 0.05)' : ' — ingen signifikant skillnad'}
              </p>
            )}
          </div>
        )}

        {result.excluded_small_groups.length > 0 && (
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            Exkluderat från statistik (för få datapunkter): {result.excluded_small_groups.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function FairnessDashboardClient({ jobs }: { jobs: { id: string; title: string }[] }) {
  const [jobId, setJobId] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  async function analyze() {
    setLoading(true)
    const res = await fetch('/api/fairness/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobId === 'all' ? {} : { job_id: jobId }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(typeof data.error === 'string' ? data.error : 'Analys misslyckades'); setLoading(false); return }
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          Fairness & Bias-övervakning
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Anonymiserad gruppstatistik baserad på kandidaters frivilliga samtycke. Individuella uppgifter visas aldrig.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={jobId} onValueChange={v => setJobId(v ?? 'all')}>
          <SelectTrigger className="sm:w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla mina jobbannonser</SelectItem>
            {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={analyze} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scale className="mr-2 h-4 w-4" />}
          Analysera
        </Button>
      </div>

      {result && (
        <>
          {result.human_review_required && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span><strong>Human Review Required.</strong> Analysen upptäckte en möjlig systematisk skillnad mellan grupper. Detta betyder inte nödvändigtvis att bias föreligger, men en människa bör granska matchningsresultaten manuellt innan beslut fattas.</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {result.total_applications} ansökningar totalt, {result.total_candidates_with_demographics} kandidater har lämnat frivilliga uppgifter. Minsta gruppstorlek för att visas: {result.min_group_size}.
          </p>

          <div className="grid gap-4">
            <DimensionCard result={result.gender} />
            <DimensionCard result={result.age_bucket} />
          </div>
        </>
      )}
    </div>
  )
}
