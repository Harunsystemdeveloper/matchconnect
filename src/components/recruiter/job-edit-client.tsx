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
import { Loader2, Plus, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Job } from '@/types/database'

const schema = z.object({
  title: z.string().min(3, 'Ange jobbtitel'),
  description: z.string().min(50, 'Beskrivning måste vara minst 50 tecken'),
  requirements: z.string().optional(),
  location: z.string().optional(),
  work_type: z.string().optional(),
  experience_level: z.string().optional(),
  status: z.string(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  deadline: z.string().optional(),
})

export function JobEditClient({ job }: { job: Job }) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [skills, setSkills] = useState<string[]>(job.skills_required ?? [])
  const [skillInput, setSkillInput] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: job.title,
      description: job.description,
      requirements: job.requirements ?? '',
      location: job.location ?? '',
      work_type: job.work_type ?? '',
      experience_level: job.experience_level ?? '',
      status: job.status,
      salary_min: job.salary_min?.toString() ?? '',
      salary_max: job.salary_max?.toString() ?? '',
      deadline: job.deadline ?? '',
    },
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
    const { error } = await supabase.from('jobs').update({
      title: data.title,
      description: data.description,
      requirements: data.requirements || null,
      skills_required: skills,
      location: data.location || null,
      work_type: data.work_type || null,
      experience_level: data.experience_level || null,
      status: data.status,
      salary_min: data.salary_min ? parseInt(data.salary_min) : null,
      salary_max: data.salary_max ? parseInt(data.salary_max) : null,
      deadline: data.deadline || null,
      updated_at: new Date().toISOString(),
    }).eq('id', job.id)

    if (error) {
      toast.error('Kunde inte spara', { description: error.message })
    } else {
      toast.success('Annons uppdaterad!')
      router.push('/recruiter/jobs')
    }
    setLoading(false)
  }

  async function deleteJob() {
    if (!confirm('Är du säker på att du vill ta bort annonsen? Alla ansökningar tas också bort.')) return
    setDeleting(true)
    const { error } = await supabase.from('jobs').delete().eq('id', job.id)
    if (error) {
      toast.error('Kunde inte ta bort annons')
      setDeleting(false)
    } else {
      toast.success('Annons borttagen')
      router.push('/recruiter/jobs')
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Jobbtitel *</Label>
            <Input {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Arbetsform</Label>
              <Select defaultValue={job.work_type ?? ''} onValueChange={(v) => setValue('work_type', v ?? '')}>
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
              <Select defaultValue={job.experience_level ?? ''} onValueChange={(v) => setValue('experience_level', v ?? '')}>
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ort</Label>
              <Input placeholder="Stockholm" {...register('location')} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue={job.status} onValueChange={(v) => setValue('status', v ?? job.status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="paused">Pausad</SelectItem>
                  <SelectItem value="closed">Stängd</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lön från (SEK/mån)</Label>
              <Input type="number" {...register('salary_min')} />
            </div>
            <div className="space-y-2">
              <Label>Lön till (SEK/mån)</Label>
              <Input type="number" {...register('salary_max')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sista ansökningsdag <span className="text-muted-foreground text-xs">(valfritt)</span></Label>
            <Input type="date" {...register('deadline')} />
          </div>

          <div className="space-y-2">
            <Label>Kompetenser</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Lägg till kompetens..."
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
            <Textarea rows={6} {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Krav</Label>
            <Textarea rows={3} {...register('requirements')} />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara ändringar
            </Button>
            <Button type="button" variant="destructive" onClick={deleteJob} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
