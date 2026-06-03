'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(3, 'Ange jobbtitel'),
  description: z.string().min(50, 'Beskrivning måste vara minst 50 tecken'),
  requirements: z.string().optional(),
  location: z.string().optional(),
  work_type: z.string().optional(),
  experience_level: z.string().optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  variable_pct: z.string().optional(),
  deadline: z.string().optional(),
})

const SALARY_MODELS = [
  {
    value: 'SEK/mån',
    label: 'Fast månadslön',
    desc: 'Garanterad fast lön varje månad',
    showRange: true,
    minLabel: 'Lägsta lön (SEK/mån)',
    maxLabel: 'Högsta lön (SEK/mån)',
    minPlaceholder: '32 000',
    maxPlaceholder: '55 000',
  },
  {
    value: 'SEK/tim',
    label: 'Timlön',
    desc: 'Betalning per arbetad timme',
    showRange: true,
    minLabel: 'Lägsta timlön (SEK)',
    maxLabel: 'Högsta timlön (SEK)',
    minPlaceholder: '175',
    maxPlaceholder: '280',
  },
  {
    value: 'SEK/år',
    label: 'Årsarvode',
    desc: 'Vanligt för chefer och konsulter',
    showRange: true,
    minLabel: 'Lägsta årsarvode (SEK)',
    maxLabel: 'Högsta årsarvode (SEK)',
    minPlaceholder: '600 000',
    maxPlaceholder: '900 000',
  },
  {
    value: 'fast+rörlig',
    label: 'Fast lön + rörlig del',
    desc: 'Grundlön med bonus/provision ovanpå',
    showRange: true,
    showVariable: true,
    minLabel: 'Fast grundlön (SEK/mån)',
    maxLabel: 'Max total lön inkl. rörlig (SEK/mån)',
    minPlaceholder: '35 000',
    maxPlaceholder: '70 000',
  },
  {
    value: 'provision',
    label: 'Provision / Kommission',
    desc: 'Lön baserad på försäljning eller prestation',
    showRange: true,
    showVariable: true,
    minLabel: 'Garantibelopp/mån (SEK, om det finns)',
    maxLabel: 'Förväntad OTE/mån (SEK)',
    minPlaceholder: '20 000',
    maxPlaceholder: '80 000',
  },
  {
    value: 'ök',
    label: 'Enligt överenskommelse',
    desc: 'Lönen diskuteras individuellt',
    showRange: false,
  },
] as const

const BENEFITS = [
  'Friskvårdsbidrag',
  'Tjänstebil',
  'Sjukvårdsförsäkring',
  'Pension utöver kollektivavtal',
  'Bonusprogram',
  'Aktier / optioner',
  'Flexibla arbetstider',
  'Hemarbete-dagar',
  'Utbildningsbudget',
  'Lunchförmån / friskvård',
  'Föräldralön',
  'Mobiltelefon / surfplatta',
]

export function JobFormClient({ recruiterId }: { recruiterId: string }) {
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [salaryModel, setSalaryModel] = useState<string>('SEK/mån')
  const [benefits, setBenefits] = useState<string[]>([])
  const [showBenefits, setShowBenefits] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const currentModel = SALARY_MODELS.find(m => m.value === salaryModel) ?? SALARY_MODELS[0]

  function addSkill() {
    const s = skillInput.trim().toLowerCase()
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }

  function toggleBenefit(b: string) {
    setBenefits(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])
  }

  async function onSubmit(data: z.infer<typeof schema>) {
    setLoading(true)

    // Build requirements text: user requirements + benefits
    const benefitsText = benefits.length > 0
      ? `\n\n### Förmåner\n${benefits.map(b => `• ${b}`).join('\n')}`
      : ''
    const fullRequirements = (data.requirements || '') + benefitsText

    // Build variable note for fast+rörlig / provision
    const variableNote = data.variable_pct
      ? ` (rörlig del: upp till ${data.variable_pct}%)`
      : ''

    const { data: job, error } = await supabase.from('jobs').insert({
      recruiter_id: recruiterId,
      title: data.title,
      description: data.description,
      requirements: fullRequirements || null,
      skills_required: skills,
      location: data.location || null,
      work_type: data.work_type || null,
      experience_level: data.experience_level || null,
      salary_min: data.salary_min ? parseInt(data.salary_min.replace(/\s/g, '')) : null,
      salary_max: data.salary_max ? parseInt(data.salary_max.replace(/\s/g, '')) : null,
      currency: salaryModel + variableNote,
      deadline: data.deadline || null,
      status: 'active',
    }).select().single()

    if (error) {
      toast.error('Kunde inte skapa annons', { description: error.message })
      setLoading(false)
      return
    }
    toast.success('Annons skapad!')
    router.push(`/recruiter/jobs/${job.id}/candidates`)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Titel */}
          <div className="space-y-2">
            <Label>Jobbtitel *</Label>
            <Input placeholder="t.ex. Sjuksköterska, Ekonom, Lärare, Säljare, Utvecklare..." {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Arbetsform + Erfarenhet */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arbetsform</Label>
              <Select onValueChange={(v) => setValue('work_type', (v as string) ?? undefined)}>
                <SelectTrigger><SelectValue placeholder="Välj arbetsform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="on-site">På plats</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Erfarenhetsnivå</Label>
              <Select onValueChange={(v) => setValue('experience_level', (v as string) ?? undefined)}>
                <SelectTrigger><SelectValue placeholder="Välj erfarenhetsnivå" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingen">Ingen erfarenhet krävs</SelectItem>
                  <SelectItem value="1-2">1–2 års erfarenhet</SelectItem>
                  <SelectItem value="3-5">3–5 års erfarenhet</SelectItem>
                  <SelectItem value="5-10">5–10 års erfarenhet</SelectItem>
                  <SelectItem value="10+">10+ års erfarenhet</SelectItem>
                  <SelectItem value="chef">Chefsroll / Ledare</SelectItem>
                  <SelectItem value="executive">Ledningsgrupp / C-nivå</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ort */}
          <div className="space-y-2">
            <Label>Ort</Label>
            <Input placeholder="Stockholm, Sverige" {...register('location')} />
          </div>

          {/* ── Lönesektion ── */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <div>
              <Label className="text-sm font-semibold">Lönemodell</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Välj den modell som stämmer bäst för tjänsten</p>
            </div>

            {/* Lönemodell-knappar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SALARY_MODELS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSalaryModel(m.value)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    salaryModel === m.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border bg-background hover:border-primary/30 hover:bg-accent'
                  }`}
                >
                  <p className={`text-sm font-medium ${salaryModel === m.value ? 'text-primary' : ''}`}>{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Beloppsintervall — visas ej för "Enligt överenskommelse" */}
            {currentModel.showRange && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{currentModel.minLabel}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={currentModel.minPlaceholder}
                    {...register('salary_min')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{currentModel.maxLabel}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={currentModel.maxPlaceholder}
                    {...register('salary_max')}
                  />
                </div>
              </div>
            )}

            {/* Rörlig del % — visas för fast+rörlig och provision */}
            {'showVariable' in currentModel && currentModel.showVariable && (
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {salaryModel === 'provision' ? 'Provisionsandel (% av försäljning, valfritt)' : 'Rörlig del (% av fast lön, valfritt)'}
                </Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    placeholder="20"
                    {...register('variable_pct')}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            )}

            {salaryModel === 'ök' && (
              <p className="text-xs text-muted-foreground italic">
                Lönen visas som "Enligt överenskommelse" för kandidaten. Du kan beskriva ersättningsnivån i jobbeskrivningen.
              </p>
            )}
          </div>

          {/* ── Förmåner ── */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <button
              type="button"
              className="w-full flex items-center justify-between"
              onClick={() => setShowBenefits(v => !v)}
            >
              <div className="text-left">
                <p className="text-sm font-semibold">Förmåner & extras</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {benefits.length > 0 ? `${benefits.length} förmåner valda` : 'Vad erbjuder ni utöver lönen?'}
                </p>
              </div>
              {showBenefits ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {showBenefits && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {BENEFITS.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBenefit(b)}
                    className={`rounded-lg border px-3 py-2 text-xs text-left transition-all ${
                      benefits.includes(b)
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background hover:border-primary/30 hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {benefits.includes(b) ? '✓ ' : ''}{b}
                  </button>
                ))}
              </div>
            )}

            {benefits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {benefits.map(b => (
                  <Badge key={b} variant="secondary" className="text-xs gap-1">
                    {b}
                    <button type="button" onClick={() => toggleBenefit(b)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sista ansökningsdag */}
          <div className="space-y-2">
            <Label>Sista ansökningsdag <span className="text-muted-foreground text-xs">(valfritt)</span></Label>
            <Input type="date" {...register('deadline')} />
          </div>

          {/* Kompetenser */}
          <div className="space-y-2">
            <Label>Kompetenser som krävs</Label>
            <div className="flex gap-2">
              <Input
                placeholder="t.ex. Patientvård, Bokföring, Pedagogik, Försäljning..."
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter(sk => sk !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Jobbeskrivning */}
          <div className="space-y-2">
            <Label>Jobbeskrivning *</Label>
            <Textarea
              placeholder="Beskriv rollen, ansvarsområden och vad ni erbjuder..."
              rows={6}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {/* Krav */}
          <div className="space-y-2">
            <Label>Formella krav <span className="text-muted-foreground text-xs">(valfritt)</span></Label>
            <Textarea
              placeholder="Utbildning, certifieringar, antal års erfarenhet..."
              rows={3}
              {...register('requirements')}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publicera annons
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
