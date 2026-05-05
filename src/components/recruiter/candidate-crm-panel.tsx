'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Loader2, StickyNote, Plus, Trash2, Tag, X } from 'lucide-react'
import { toast } from 'sonner'
import type { CandidateNote } from '@/types/database'

interface Props {
  seekerId: string
  seekerName: string
}

const PRESET_TAGS = ['Lovande', 'Toppkandidat', 'Erfarenhet saknas', 'Följ upp', 'Intervjuad', 'Avböjt']

export function CandidateCrmPanel({ seekerId, seekerName }: Props) {
  const [notes, setNotes] = useState<CandidateNote[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/candidate-notes?seeker_id=${seekerId}`)
    const data = await res.json()
    setNotes(data.notes ?? [])
    setLoading(false)
  }, [seekerId])

  useEffect(() => { loadNotes() }, [loadNotes])

  async function saveNote() {
    if (!newNote.trim()) return
    setSaving(true)
    const res = await fetch('/api/candidate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seeker_id: seekerId, note: newNote.trim(), tags: newTags }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setSaving(false); return }
    setNotes(prev => [data.note, ...prev])
    setNewNote('')
    setNewTags([])
    setSaving(false)
    toast.success('Anteckning sparad')
  }

  async function deleteNote(id: string) {
    const res = await fetch(`/api/candidate-notes?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Kunde inte ta bort'); return }
    setNotes(prev => prev.filter(n => n.id !== id))
    toast.success('Anteckning borttagen')
  }

  function addTag(tag: string) {
    const t = tag.trim()
    if (!t || newTags.includes(t)) return
    setNewTags(prev => [...prev, t])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setNewTags(prev => prev.filter(t => t !== tag))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">CRM-anteckningar för {seekerName}</p>
      </div>

      {/* New note form */}
      <div className="space-y-2">
        <Textarea
          placeholder="Skriv en intern anteckning om kandidaten..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="min-h-20 text-sm resize-none"
        />

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {PRESET_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => newTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  newTags.includes(tag)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Eget tagg..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
              className="h-7 text-xs"
            />
            <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => addTag(tagInput)}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {newTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {newTags.map(t => (
                <Badge key={t} variant="secondary" className="text-xs gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  {t}
                  <button onClick={() => removeTag(t)}><X className="h-2.5 w-2.5" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button size="sm" onClick={saveNote} disabled={saving || !newNote.trim()} className="w-full">
          {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
          Spara anteckning
        </Button>
      </div>

      <Separator />

      {/* Existing notes */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Inga anteckningar ännu. Lägg till din första!
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed flex-1">{note.note}</p>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map(t => (
                    <Badge key={t} variant="outline" className="text-xs">
                      <Tag className="mr-1 h-2.5 w-2.5" />{t}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(note.created_at).toLocaleDateString('sv-SE', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
