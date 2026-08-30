'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ClipboardCheck, Plus, Trash2, Star, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react'
import { toast } from 'sonner'
import type { InterviewScorecard, ScorecardRating, ScorecardRecommendation } from '@/types/database'

interface Props {
  applicationId: string
  seekerId: string
  seekerName: string
  suggestedQuestions?: string[]
}

const RECOMMENDATION_LABELS: Record<ScorecardRecommendation, { label: string; className: string }> = {
  strong_yes: { label: 'Starkt ja', className: 'bg-green-600 text-white' },
  yes: { label: 'Ja', className: 'bg-green-500/15 text-green-700 dark:text-green-400' },
  no: { label: 'Nej', className: 'bg-red-500/15 text-red-700 dark:text-red-400' },
  strong_no: { label: 'Starkt nej', className: 'bg-red-600 text-white' },
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
          <Star className={`h-4 w-4 ${n <= value ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  )
}

export function InterviewScorecardPanel({ applicationId, seekerId, seekerName, suggestedQuestions = [] }: Props) {
  const [scorecards, setScorecards] = useState<InterviewScorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState<{ summary: string; consensus: string; key_strengths: string[]; key_concerns: string[] } | null>(null)

  const [stage, setStage] = useState('Intervju')
  const [ratings, setRatings] = useState<ScorecardRating[]>(
    suggestedQuestions.length > 0
      ? suggestedQuestions.slice(0, 5).map(q => ({ question: q, rating: 3, comment: '' }))
      : [{ question: '', rating: 3, comment: '' }]
  )
  const [overallRating, setOverallRating] = useState(3)
  const [recommendation, setRecommendation] = useState<ScorecardRecommendation>('yes')
  const [notes, setNotes] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/interview-scorecards?application_id=${applicationId}`)
    const data = await res.json()
    setScorecards(data.scorecards ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId])

  function addQuestion() {
    setRatings(prev => [...prev, { question: '', rating: 3, comment: '' }])
  }

  function removeQuestion(i: number) {
    setRatings(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateRating(i: number, patch: Partial<ScorecardRating>) {
    setRatings(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  async function save() {
    const validRatings = ratings.filter(r => r.question.trim())
    setSaving(true)
    const res = await fetch('/api/interview-scorecards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: applicationId,
        seeker_id: seekerId,
        stage,
        ratings: validRatings,
        overall_rating: overallRating,
        recommendation,
        notes: notes || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error('Kunde inte spara scorecard'); setSaving(false); return }
    setScorecards(prev => [data.scorecard, ...prev])
    setStage('Intervju')
    setRatings([{ question: '', rating: 3, comment: '' }])
    setOverallRating(3)
    setRecommendation('yes')
    setNotes('')
    setSaving(false)
    toast.success('Scorecard sparad')
  }

  async function deleteScorecard(id: string) {
    const res = await fetch(`/api/interview-scorecards?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Kunde inte ta bort'); return }
    setScorecards(prev => prev.filter(s => s.id !== id))
    setSummary(null)
  }

  async function runSummary() {
    setSummarizing(true)
    const res = await fetch('/api/ai/summarize-interview-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? 'Sammanställning misslyckades'); setSummarizing(false); return }
    setSummary(data)
    setSummarizing(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">Strukturerad intervjuutvärdering — {seekerName}</p>
      </div>

      {/* New scorecard form */}
      <div className="space-y-3 rounded-lg border p-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Steg</label>
          <Input placeholder="Screening / Teknisk intervju / Kulturmöte..." value={stage} onChange={e => setStage(e.target.value)} className="h-8 text-sm" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Frågor & betyg (1–5)</label>
          {ratings.map((r, i) => (
            <div key={i} className="space-y-1.5 rounded-md bg-muted/30 p-2">
              <div className="flex gap-2 items-start">
                <Input
                  placeholder="Fråga..."
                  value={r.question}
                  onChange={e => updateRating(i, { question: e.target.value })}
                  className="h-7 text-xs flex-1"
                />
                <StarPicker value={r.rating} onChange={v => updateRating(i, { rating: v })} />
                {ratings.length > 1 && (
                  <button onClick={() => removeQuestion(i)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Textarea
                placeholder="Kommentar (valfritt)..."
                value={r.comment}
                onChange={e => updateRating(i, { comment: e.target.value })}
                className="min-h-8 text-xs resize-none"
              />
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={addQuestion}>
            <Plus className="mr-1 h-3 w-3" />Lägg till fråga
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Helhetsbetyg</label>
            <StarPicker value={overallRating} onChange={setOverallRating} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Rekommendation</label>
            <Select value={recommendation} onValueChange={v => v && setRecommendation(v as ScorecardRecommendation)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(RECOMMENDATION_LABELS) as ScorecardRecommendation[]).map(key => (
                  <SelectItem key={key} value={key}>{RECOMMENDATION_LABELS[key].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Övriga anteckningar</label>
          <Textarea placeholder="Sammanfattande intryck..." value={notes} onChange={e => setNotes(e.target.value)} className="min-h-16 text-xs resize-none" />
        </div>

        <Button size="sm" onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
          Spara scorecard
        </Button>
      </div>

      <Separator />

      {/* AI consensus summary */}
      {scorecards.length > 0 && (
        <div className="space-y-2">
          <Button size="sm" variant="outline" onClick={runSummary} disabled={summarizing} className="w-full text-xs">
            {summarizing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
            AI-sammanställning av alla scorecards
          </Button>
          {summary && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">Sammanvägd bild</span>
                <Badge variant="outline" className="text-xs capitalize">{summary.consensus === 'mixed' ? 'Delade meningar' : RECOMMENDATION_LABELS[summary.consensus as ScorecardRecommendation]?.label ?? summary.consensus}</Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{summary.summary}</p>
              {summary.key_strengths?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summary.key_strengths.map(s => (
                    <Badge key={s} variant="secondary" className="text-xs gap-1"><ThumbsUp className="h-2.5 w-2.5" />{s}</Badge>
                  ))}
                </div>
              )}
              {summary.key_concerns?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {summary.key_concerns.map(s => (
                    <Badge key={s} variant="outline" className="text-xs gap-1"><ThumbsDown className="h-2.5 w-2.5" />{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Existing scorecards */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : scorecards.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Inga scorecards ännu. Fyll i din första efter intervjun!</p>
      ) : (
        <div className="space-y-3">
          {scorecards.map(sc => (
            <div key={sc.id} className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{sc.stage}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {sc.overall_rating != null && <StarPicker value={sc.overall_rating} onChange={() => {}} />}
                    {sc.recommendation && (
                      <Badge className={`text-xs ${RECOMMENDATION_LABELS[sc.recommendation].className}`}>
                        {RECOMMENDATION_LABELS[sc.recommendation].label}
                      </Badge>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteScorecard(sc.id)} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {sc.ratings.length > 0 && (
                <div className="space-y-1">
                  {sc.ratings.map((r, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-medium">{r.question}</span> — {r.rating}/5
                      {r.comment && <span className="text-muted-foreground"> · {r.comment}</span>}
                    </div>
                  ))}
                </div>
              )}
              {sc.notes && <p className="text-xs text-muted-foreground italic">{sc.notes}</p>}
              <p className="text-xs text-muted-foreground">
                {new Date(sc.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
