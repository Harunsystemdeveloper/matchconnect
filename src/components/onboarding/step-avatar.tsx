'use client'

import { useState, useRef } from 'react'
import { Loader2, Upload, Check, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'

export function StepAvatar({ profile, onNext, onBack }: { profile: Profile; onNext: () => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(profile.avatar_url)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { toast.error('Filen är för stor (max 5 MB)'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  async function handleUpload() {
    if (!file) { onNext(); return }
    setLoading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Uppladdning misslyckades', { description: uploadError.message }); setLoading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    await supabase.from('profiles').update({ avatar_url: publicUrl, onboarding_complete: true, updated_at: new Date().toISOString() }).eq('id', profile.id)
    toast.success('Profil skapad! Välkommen till MatchConnect.')
    onNext()
  }

  async function skipUpload() {
    setLoading(true)
    await supabase.from('profiles').update({ onboarding_complete: true, updated_at: new Date().toISOString() }).eq('id', profile.id)
    onNext()
  }

  const initials = profile.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Lägg till profilbild</h2>
          <p className="text-sm text-muted-foreground mt-1">Profiler med bild får fler svar. Helt valfritt.</p>
        </div>

        <div className="flex flex-col items-center gap-5 py-4">
          <button
            type="button"
            className="relative group cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={preview ?? ''} />
              <AvatarFallback className="gradient-primary text-white text-3xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </button>

          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

          <Button type="button" variant="outline" className="h-10 px-5" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Välj bild
          </Button>

          {file && (
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-4 py-1.5 text-xs text-green-700 dark:text-green-400">
              <Check className="h-3 w-3" strokeWidth={3} />
              {file.name}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="outline" className="flex-1 h-11" onClick={onBack}>Tillbaka</Button>
          {file ? (
            <Button className="flex-1 h-11 gradient-primary text-white font-semibold" onClick={handleUpload} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Spara & klar!
            </Button>
          ) : (
            <Button variant="secondary" className="flex-1 h-11 font-semibold" onClick={skipUpload} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hoppa över
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
