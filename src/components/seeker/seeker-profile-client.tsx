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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Loader2, Upload, X, Plus, Brain, Check, Trash2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile, CvProfile } from '@/types/database'

const profileSchema = z.object({
  full_name: z.string().min(2),
  headline: z.string().max(100).optional(),
  location: z.string().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
})

export function SeekerProfileClient({ profile, cvProfile: initialCv }: { profile: Profile; cvProfile: CvProfile | null }) {
  const [saving, setSaving] = useState(false)
  const [cvProfile, setCvProfile] = useState(initialCv)
  const [skills, setSkills] = useState<string[]>(initialCv?.skills ?? [])
  const [skillInput, setSkillInput] = useState('')
  const [cvUploading, setCvUploading] = useState(false)
  const [cvAnalyzing, setCvAnalyzing] = useState(false)
  const [cvDeleting, setCvDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const cvInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? '',
      headline: profile.headline ?? '',
      location: profile.location ?? '',
      bio: profile.bio ?? '',
      website: profile.website ?? '',
    },
  })

  async function saveProfile(data: z.infer<typeof profileSchema>) {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ ...data, updated_at: new Date().toISOString() }).eq('id', profile.id)
    if (error) { toast.error('Kunde inte spara', { description: error.message }); setSaving(false); return }

    // Save skills to cv_profiles (no updated_at column on this table)
    const { error: cvError } = await supabase
      .from('cv_profiles')
      .upsert({ seeker_id: profile.id, skills }, { onConflict: 'seeker_id' })
    if (cvError) toast.error('Kompetenser kunde inte sparas', { description: cvError.message })
    else toast.success('Profil sparad!')

    setSaving(false)
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const path = `avatars/${profile.id}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) { toast.error('Uppladdning misslyckades'); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    toast.success('Profilbild uppdaterad!')
    setAvatarUploading(false)
  }

  async function uploadAndAnalyzeCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { toast.error('CV får max vara 10 MB'); return }

    setCvUploading(true)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
    const path = `cvs/${profile.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('cvs').upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Uppladdning misslyckades'); setCvUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(path)
    await supabase.from('cv_profiles').upsert({ seeker_id: profile.id, cv_url: publicUrl }, { onConflict: 'seeker_id' })
    setCvUploading(false)

    // Extract text for AI analysis
    // PDFs are binary — send the file to the server-side extract endpoint instead of reading client-side
    setCvAnalyzing(true)
    toast.info('CV uppladdad – analyserar med AI...')

    let cvText = ''
    if (ext === 'txt') {
      // Plain text files can be read directly
      cvText = await file.text().catch(() => '')
    } else {
      // For PDF: send file to server for text extraction
      const formData = new FormData()
      formData.append('file', file)
      const extractRes = await fetch('/api/ai/extract-cv-text', { method: 'POST', body: formData })
      if (extractRes.ok) {
        const extracted = await extractRes.json()
        cvText = extracted.text ?? ''
      }
    }

    if (cvText.length > 50) {
      const res = await fetch('/api/ai/analyze-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_text: cvText }),
      })
      const data = await res.json()
      if (res.ok) {
        setCvProfile(prev => ({ ...prev!, ...data.analysis, cv_url: publicUrl }))
        if (data.analysis.skills) setSkills(data.analysis.skills)
        toast.success('CV analyserat!', { description: `Extraherade ${data.analysis.skills?.length ?? 0} kompetenser.` })

        // Auto-match against active jobs in background
        fetch('/api/ai/auto-match', { method: 'POST' })
          .then(r => r.json())
          .then(d => {
            if (d.ok && d.matched > 0) {
              toast.info(`Hittade ${d.matched} matchande jobb!`, { description: 'Se dina rekommendationer på dashboarden.' })
            }
          })
          .catch(() => null)
      } else {
        toast.warning('AI-analys misslyckades men CV är sparat')
      }
    } else {
      toast.warning('Kunde inte läsa CV-texten. Prova att ladda upp som .txt eller klistra in text manuellt.')
    }
    setCvAnalyzing(false)
  }

  async function deleteCv() {
    if (!cvProfile?.cv_url) return
    setCvDeleting(true)
    const ext = cvProfile.cv_url.split('.').pop()?.split('?')[0] ?? 'pdf'
    await supabase.storage.from('cvs').remove([`cvs/${profile.id}.${ext}`])
    await supabase.from('cv_profiles').update({
      cv_url: null,
      cv_text: null,
      skills: [],
      ai_summary: null,
      last_analyzed_at: null,
    }).eq('seeker_id', profile.id)
    setCvProfile(prev => prev ? { ...prev, cv_url: null, ai_summary: null } : null)
    setSkills([])
    toast.success('CV borttaget')
    setCvDeleting(false)
  }

  function addSkill() {
    const s = skillInput.trim()
    if (s && !skills.includes(s) && skills.length < 25) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }

  const initials = profile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Min profil</h1>

      {/* Avatar */}
      <Card>
        <CardHeader><CardTitle className="text-base">Profilbild</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url ?? ''} />
            <AvatarFallback className="gradient-primary text-white text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
              {avatarUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Byt bild
            </Button>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, max 5 MB</p>
          </div>
        </CardContent>
      </Card>

      {/* Basic info form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Grundinformation</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(saveProfile)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fullständigt namn *</Label>
                <Input {...register('full_name')} />
                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Rubrik</Label>
                <Input placeholder="Senior UX Designer" {...register('headline')} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ort</Label>
                <Input placeholder="Stockholm, Sverige" {...register('location')} />
              </div>
              <div className="space-y-2">
                <Label>Webbplats / LinkedIn</Label>
                <Input placeholder="https://linkedin.com/in/..." {...register('website')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea placeholder="Kort beskrivning av dig själv..." rows={3} {...register('bio')} />
            </div>
            <Separator />
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
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara profil
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* CV upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            CV & AI-analys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cvProfile?.cv_url && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              CV uppladdad och analyserad
              {cvProfile.last_analyzed_at && (
                <span className="text-muted-foreground text-xs">
                  · {new Date(cvProfile.last_analyzed_at).toLocaleDateString('sv-SE')}
                </span>
              )}
            </div>
          )}
          {cvProfile?.ai_summary && (
            <p className="text-sm text-muted-foreground italic">&quot;{cvProfile.ai_summary}&quot;</p>
          )}
          <input ref={cvInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={uploadAndAnalyzeCv} />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => cvInputRef.current?.click()}
              disabled={cvUploading || cvAnalyzing || cvDeleting}
            >
              {(cvUploading || cvAnalyzing) ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{cvAnalyzing ? 'AI analyserar...' : 'Laddar upp...'}</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" />{cvProfile?.cv_url ? 'Byt CV (PDF)' : 'Ladda upp CV (PDF)'}</>
              )}
            </Button>
            {cvProfile?.cv_url && (
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteDialog(true)}
                disabled={cvDeleting}
                title="Ta bort CV"
              >
                {cvDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            AI:n extraherar automatiskt kompetenser, erfarenhet och utbildning från ditt CV.
          </p>
        </CardContent>
      </Card>

      {/* CV delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort CV?</DialogTitle>
            <DialogDescription>
              Detta tar bort ditt CV och all AI-analys permanent. Dina kompetenser och matchningspoäng nollställs.
              Du kan alltid ladda upp ett nytt CV efteråt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Avbryt
            </Button>
            <Button
              variant="destructive"
              disabled={cvDeleting}
              onClick={async () => {
                setShowDeleteDialog(false)
                await deleteCv()
              }}
            >
              {cvDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ja, ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
