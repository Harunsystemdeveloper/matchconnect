'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

const seekerSchema = z.object({ experience_years: z.string().optional() })
const recruiterSchema = z.object({
  company_name: z.string().min(1, 'Ange företagsnamn'),
  industry: z.string().optional(),
})

export function StepRoleDetails({ profile, onNext, onBack }: { profile: Profile; onNext: () => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const supabase = createClient()

  const isRecruiter = profile.user_type === 'recruiter'
  const schema = isRecruiter ? recruiterSchema : seekerSchema
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 20) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }

  function removeSkill(s: string) { setSkills(skills.filter((sk) => sk !== s)) }

  async function onSubmit(data: Record<string, string>) {
    setLoading(true)
    if (isRecruiter) {
      const { error } = await supabase.from('company_profiles').upsert({
        recruiter_id: profile.id,
        company_name: data.company_name,
        industry: data.industry ?? null,
        updated_at: new Date().toISOString(),
      })
      if (error) { toast.error('Kunde inte spara företagsprofil'); setLoading(false); return }
    } else {
      const { error } = await supabase.from('cv_profiles').upsert({
        seeker_id: profile.id, skills,
        experience_years: data.experience_years ? parseInt(data.experience_years) : null,
      }, { onConflict: 'seeker_id' })
      if (error) { toast.error('Kunde inte spara kompetenser'); setLoading(false); return }
    }
    onNext()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">
            {isRecruiter ? 'Ditt företag' : 'Dina kompetenser'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isRecruiter ? 'Berätta om ditt företag för att attrahera rätt kandidater.' : 'Lägg till dina viktigaste kompetenser.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isRecruiter ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="company_name">
                  Företagsnamn <span className="text-destructive">*</span>
                </Label>
                <Input id="company_name" placeholder="Acme AB" className="h-11" {...register('company_name')} />
                {(errors as Record<string, { message?: string }>).company_name && (
                  <p className="text-xs text-destructive">
                    {(errors as Record<string, { message?: string }>).company_name?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Bransch</Label>
                <Select onValueChange={(v) => setValue('industry', v as string)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Välj bransch" /></SelectTrigger>
                  <SelectContent>
                    {['IT & Tech', 'Finans', 'Hälsovård', 'Utbildning', 'Handel', 'Tillverkning', 'Konsult', 'Media', 'Offentlig sektor', 'Annat'].map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Kompetenser</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="T.ex. React, Python, Projektledning..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                    className="h-11"
                  />
                  <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-3 rounded-lg bg-muted/50 border">
                    {skills.map((s) => (
                      <Badge key={s} variant="secondary" className="gap-1 pr-1">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="ml-1 rounded-full">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Antal års erfarenhet</Label>
                <Select onValueChange={(v) => setValue('experience_years', v as string)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Välj erfarenhetsnivå" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nyexaminerad / Ingen erfarenhet</SelectItem>
                    <SelectItem value="1">1 år</SelectItem>
                    <SelectItem value="2">2 år</SelectItem>
                    <SelectItem value="3">3 år</SelectItem>
                    <SelectItem value="5">4–5 år</SelectItem>
                    <SelectItem value="8">6–10 år</SelectItem>
                    <SelectItem value="15">10+ år</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-2">
            <Button type="button" variant="outline" className="flex-1 h-11" onClick={onBack}>Tillbaka</Button>
            <Button type="submit" disabled={loading} className="flex-1 h-11 gradient-primary text-white font-semibold">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fortsätt
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
