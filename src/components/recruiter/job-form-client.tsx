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
import { Loader2, Plus, X } from 'lucide-react'
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
  deadline: z.string().optional(),
})

export function JobFormClient({ recruiterId }: { recruiterId: string }) {
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }

  async function onSubmit(data: z.infer<typeof schema>) {
    setLoading(true)
    const { data: job, error } = await supabase.from('jobs').insert({
      recruiter_id: recruiterId,
      title: data.title,
      description: data.description,
      requirements: data.requirements || null,
      skills_required: skills,
      location: data.location || null,
      work_type: data.work_type || null,
      experience_level: data.experience_level || null,
      salary_min: data.salary_min ? parseInt(data.salary_min) : null,
      salary_max: data.salary_max ? parseInt(data.salary_max) : null,
      currency: 'SEK',
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
          <div className="space-y-2">
            <Label>Jobbtitel *</Label>
            <Input placeholder="t.ex. Sjuksköterska, Ekonom, Lärare, Säljare, Utvecklare..." {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

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
                <SelectTrigger><SelectValue placeholder="Välj nivå" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior (0-2 år)</SelectItem>
                  <SelectItem value="mid">Mid (2-5 år)</SelectItem>
                  <SelectItem value="senior">Senior (5+ år)</SelectItem>
                  <SelectItem value="lead">Lead / Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ort</Label>
            <Input placeholder="Stockholm, Sverige" {...register('location')} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lön från (SEK/mån)</Label>
              <Input type="number" placeholder="40000" {...register('salary_min')} />
            </div>
            <div className="space-y-2">
              <Label>Lön till (SEK/mån)</Label>
              <Input type="number" placeholder="65000" {...register('salary_max')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sista ansökningsdag <span className="text-muted-foreground text-xs">(valfritt)</span></Label>
            <Input type="date" {...register('deadline')} />
          </div>

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

          <div className="space-y-2">
            <Label>Jobbeskrivning *</Label>
            <Textarea
              placeholder="Beskriv rollen, ansvarsområden och vad ni erbjuder..."
              rows={6}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Krav <span className="text-muted-foreground text-xs">(valfritt)</span></Label>
            <Textarea
              placeholder="Formella krav: utbildning, certifieringar, antal års erfarenhet..."
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
