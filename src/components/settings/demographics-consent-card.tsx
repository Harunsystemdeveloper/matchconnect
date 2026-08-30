'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Scale, Trash2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { CandidateDemographics, Gender } from '@/types/database'

export function DemographicsConsentCard() {
  const [userType, setUserType] = useState<'job_seeker' | 'recruiter' | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState<CandidateDemographics | null>(null)
  const [gender, setGender] = useState<Gender | ''>('')
  const [birthYear, setBirthYear] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('user_type').eq('id', user.id).single()
      setUserType(profile?.user_type ?? null)

      if (profile?.user_type === 'job_seeker') {
        const res = await fetch('/api/fairness/consent')
        const data = await res.json()
        if (data.demographics) {
          setExisting(data.demographics)
          setGender(data.demographics.gender ?? '')
          setBirthYear(data.demographics.birth_year?.toString() ?? '')
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    if (!gender && !birthYear) { toast.error('Ange minst en uppgift'); return }
    setSaving(true)
    const res = await fetch('/api/fairness/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gender: gender || undefined,
        birth_year: birthYear ? parseInt(birthYear) : undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error('Kunde inte spara', { description: typeof data.error === 'string' ? data.error : undefined }); setSaving(false); return }
    setExisting(data.demographics)
    toast.success('Samtycke och uppgifter sparade')
    setSaving(false)
  }

  async function remove() {
    setSaving(true)
    const res = await fetch('/api/fairness/consent', { method: 'DELETE' })
    if (!res.ok) { toast.error('Kunde inte radera'); setSaving(false); return }
    setExisting(null)
    setGender('')
    setBirthYear('')
    toast.success('Uppgifterna är raderade')
    setSaving(false)
  }

  if (loading || userType !== 'job_seeker') return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          Frivilliga uppgifter för rättvis rekrytering
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1.5">
          <p>
            Helt frivilligt. Om du anger kön och/eller födelseår använder vi det ENDAST för att i efterhand
            kontrollera att vår AI-matchning inte systematiskt missgynnar någon grupp.
          </p>
          <p className="font-medium text-foreground">Viktigt att veta:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Skickas ALDRIG till AI:n och påverkar ALDRIG ditt matchningspoäng</li>
            <li>Rekryterare ser ALDRIG dina individuella uppgifter — bara anonymiserad gruppstatistik</li>
            <li>Statistik visas bara för grupper med minst 5 personer, för att ingen ska kunna pekas ut</li>
            <li>Du kan radera uppgifterna när som helst</li>
          </ul>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Kön</label>
            <Select value={gender} onValueChange={v => setGender((v as Gender) ?? '')}>
              <SelectTrigger><SelectValue placeholder="Vill inte ange" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kvinna">Kvinna</SelectItem>
                <SelectItem value="man">Man</SelectItem>
                <SelectItem value="annat">Annat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Födelseår</label>
            <Input
              type="number"
              placeholder="t.ex. 1990"
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              min={1900}
              max={new Date().getFullYear()}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
            {existing ? 'Uppdatera samtycke' : 'Ge samtycke och spara'}
          </Button>
          {existing && (
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={remove} disabled={saving}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />Radera uppgifter
            </Button>
          )}
        </div>

        {existing && (
          <p className="text-xs text-muted-foreground">
            Samtycke lämnat {new Date(existing.consent_given_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
