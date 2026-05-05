'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile, CompanyProfile } from '@/types/database'

const schema = z.object({
  company_name: z.string().min(1, 'Ange företagsnamn'),
  industry: z.string().optional(),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  size: z.string().optional(),
})

export function CompanyProfileClient({ profile, company }: { profile: Profile; company: CompanyProfile | null }) {
  const [saving, setSaving] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(company?.logo_url ?? '')
  const logoRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: company?.company_name ?? '',
      industry: company?.industry ?? '',
      description: company?.description ?? '',
      website: company?.website ?? '',
      location: company?.location ?? '',
      size: company?.size ?? '',
    },
  })

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    const path = `logos/${profile.id}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (error) { toast.error('Uppladdning misslyckades'); setLogoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    setLogoUrl(publicUrl)
    toast.success('Logotyp uppladdad!')
    setLogoUploading(false)
  }

  async function onSubmit(data: z.infer<typeof schema>) {
    setSaving(true)
    const { error } = await supabase.from('company_profiles').upsert({
      recruiter_id: profile.id,
      ...data,
      logo_url: logoUrl || null,
      updated_at: new Date().toISOString(),
    })
    if (error) toast.error('Kunde inte spara', { description: error.message })
    else toast.success('Företagsprofil sparad!')
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Företagsprofil</h1>

      {/* Logo */}
      <Card>
        <CardHeader><CardTitle className="text-base">Företagslogotyp</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-20 w-20 rounded-lg">
            <AvatarImage src={logoUrl} className="object-contain" />
            <AvatarFallback className="rounded-lg bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={logoUploading}>
              {logoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Ladda upp logotyp
            </Button>
            <p className="text-xs text-muted-foreground mt-1">PNG, SVG, max 2 MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Company form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Företagsinformation</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Företagsnamn *</Label>
              <Input placeholder="Acme AB" {...register('company_name')} />
              {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bransch</Label>
                <Select defaultValue={company?.industry ?? ''} onValueChange={(v) => setValue('industry', (v as string) ?? undefined)}>
                  <SelectTrigger><SelectValue placeholder="Välj bransch" /></SelectTrigger>
                  <SelectContent>
                    {['IT & Tech', 'Finans', 'Hälsovård', 'Utbildning', 'Handel', 'Tillverkning', 'Konsult', 'Media', 'Offentlig sektor', 'Annat'].map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Antal anställda</Label>
                <Select defaultValue={company?.size ?? ''} onValueChange={(v) => setValue('size', (v as string) ?? undefined)}>
                  <SelectTrigger><SelectValue placeholder="Välj storlek" /></SelectTrigger>
                  <SelectContent>
                    {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => (
                      <SelectItem key={s} value={s}>{s} anställda</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ort</Label>
                <Input placeholder="Stockholm, Sverige" {...register('location')} />
              </div>
              <div className="space-y-2">
                <Label>Webbplats</Label>
                <Input placeholder="https://acme.se" {...register('website')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Företagsbeskrivning</Label>
              <Textarea placeholder="Berätta om ert företag, kultur och mission..." rows={4} {...register('description')} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara företagsprofil
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
