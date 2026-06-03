'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const schema = z.object({
  full_name: z.string().min(2, 'Ange ditt fullständiga namn'),
  headline: z.string().max(100).optional(),
  location: z.string().optional(),
  bio: z.string().max(500).optional(),
})
type FormData = z.infer<typeof schema>

export function StepBasicInfo({ profile, onNext }: { profile: Profile; onNext: () => void }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile.full_name ?? '',
      headline: profile.headline ?? '',
      location: profile.location ?? '',
      bio: profile.bio ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      toast.error('Kunde inte spara', { description: error.message })
      setLoading(false)
      return
    }
    onNext()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Berätta om dig själv</h2>
          <p className="text-sm text-muted-foreground mt-1">Den här informationen syns för andra på plattformen.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Fullständigt namn <span className="text-destructive">*</span>
            </Label>
            <Input id="full_name" placeholder="Anna Andersson" className="h-11" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">
              Rubrik <span className="text-xs text-muted-foreground font-normal">(valfritt)</span>
            </Label>
            <Input
              id="headline"
              placeholder={profile.user_type === 'recruiter' ? 'Rekryteringschef på Acme AB' : 'T.ex. Sjuksköterska, Ekonom, Lagerarbetare, Lärare...'}
              className="h-11"
              {...register('headline')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ort</Label>
            <Input id="location" placeholder="Stockholm, Sverige" className="h-11" {...register('location')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Kort bio</Label>
            <Textarea id="bio" placeholder="Berätta kort om dig själv..." rows={3} {...register('bio')} />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 gradient-primary text-white font-semibold mt-2">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fortsätt
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
