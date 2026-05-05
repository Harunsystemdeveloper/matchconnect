'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const jobSchema = z.object({
  title: z.string().min(2, 'Titel krävs'),
  description: z.string().min(20, 'Beskrivning måste vara minst 20 tecken'),
  requirements: z.string().optional(),
  skills_required: z.string().optional(),
  location: z.string().optional(),
  work_type: z.enum(['remote', 'hybrid', 'on-site']).optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
})

type JobForm = z.infer<typeof jobSchema>

export default function NewJobForm() {
  const router = useRouter()
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
  })

  async function onSubmit(data: JobForm) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('jobs').insert({
      recruiter_id: user.id,
      title: data.title,
      description: data.description,
      requirements: data.requirements ?? null,
      skills_required: data.skills_required ? data.skills_required.split(',').map(s => s.trim()) : null,
      location: data.location ?? null,
      work_type: data.work_type ?? null,
      salary_min: data.salary_min ? parseInt(data.salary_min) : null,
      salary_max: data.salary_max ? parseInt(data.salary_max) : null,
    })

    if (error) {
      toast.error('Kunde inte publicera annons', { description: error.message })
    } else {
      toast.success('Annons publicerad!')
      router.push('/recruiter/jobs')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Annonsdetaljer</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Jobbtitel *</Label>
            <Input id="title" placeholder="Senior Frontend Developer" {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning *</Label>
            <Textarea id="description" rows={5} placeholder="Beskriv tjänsten..." {...register('description')} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="requirements">Krav (valfri)</Label>
            <Textarea id="requirements" rows={3} placeholder="3+ år React, TypeScript..." {...register('requirements')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills_required">Kompetenser (kommaseparerade)</Label>
            <Input id="skills_required" placeholder="React, TypeScript, Node.js" {...register('skills_required')} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Plats</Label>
              <Input id="location" placeholder="Stockholm" {...register('location')} />
            </div>
            <div className="space-y-2">
              <Label>Arbetsform</Label>
              <Select onValueChange={(v) => setValue('work_type', v as 'remote' | 'hybrid' | 'on-site')}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj arbetsform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salary_min">Lön min (SEK)</Label>
              <Input id="salary_min" type="number" placeholder="45000" {...register('salary_min')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary_max">Lön max (SEK)</Label>
              <Input id="salary_max" type="number" placeholder="65000" {...register('salary_max')} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publicerar...' : 'Publicera annons'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Avbryt</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
