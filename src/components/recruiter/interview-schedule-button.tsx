'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, Plus, X, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import type { InterviewSchedule } from '@/types/database'

interface Props {
  applicationId: string
  seekerId: string
}

export function InterviewScheduleButton({ applicationId, seekerId }: Props) {
  const [open, setOpen] = useState(false)
  const [schedule, setSchedule] = useState<InterviewSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [proposedTimes, setProposedTimes] = useState<string[]>([''])
  const [location, setLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')

  async function loadSchedule() {
    setLoading(true)
    const res = await fetch(`/api/interview-schedule?application_id=${applicationId}`)
    const data = await res.json()
    setSchedule(data.schedule)
    if (data.schedule) {
      setProposedTimes(data.schedule.proposed_times)
      setLocation(data.schedule.location ?? '')
      setMeetingLink(data.schedule.meeting_link ?? '')
      setNotes(data.schedule.notes ?? '')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) loadSchedule()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function save() {
    const validTimes = proposedTimes.filter(t => t.trim())
    if (validTimes.length === 0) { toast.error('Lägg till minst en tid'); return }
    setSaving(true)
    const res = await fetch('/api/interview-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: applicationId,
        seeker_id: seekerId,
        proposed_times: validTimes,
        location: location || undefined,
        meeting_link: meetingLink || undefined,
        notes: notes || undefined,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(typeof data.error === 'string' ? data.error : 'Något gick fel'); setSaving(false); return }
    setSchedule(data.schedule)
    setSaving(false)
    setOpen(false)
    toast.success('Intervjuinbjudan skickad till kandidaten!')
  }

  async function cancel() {
    if (!schedule) return
    const res = await fetch('/api/interview-schedule', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', id: schedule.id }),
    })
    if (!res.ok) { toast.error('Kunde inte avboka'); return }
    setSchedule(prev => prev ? { ...prev, status: 'cancelled' } : null)
    toast.success('Intervju avbokad')
  }

  const statusBadge = schedule ? {
    pending: <Badge variant="outline" className="text-xs gap-1"><Clock className="h-2.5 w-2.5" />Väntar svar</Badge>,
    confirmed: <Badge variant="default" className="text-xs gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Bekräftad</Badge>,
    cancelled: <Badge variant="destructive" className="text-xs">Avbokad</Badge>,
    completed: <Badge variant="secondary" className="text-xs">Genomförd</Badge>,
  }[schedule.status] : null

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1">
        <Calendar className="h-3.5 w-3.5" />
        {schedule && schedule.status !== 'cancelled' ? 'Intervju' : 'Boka intervju'}
        {statusBadge && <span className="ml-1">{statusBadge}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Boka intervju
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {schedule?.status === 'confirmed' && schedule.confirmed_time && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Bekräftad tid:</p>
                  <p className="text-sm mt-0.5">
                    {new Date(schedule.confirmed_time).toLocaleDateString('sv-SE', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Proposed times */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Föreslagna tider (välj 1–3)</p>
                {proposedTimes.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="datetime-local"
                      value={t}
                      onChange={e => {
                        const next = [...proposedTimes]
                        next[i] = e.target.value
                        setProposedTimes(next)
                      }}
                      className="text-sm flex-1"
                    />
                    {proposedTimes.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-2"
                        onClick={() => setProposedTimes(prev => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {proposedTimes.length < 3 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => setProposedTimes(prev => [...prev, ''])}
                  >
                    <Plus className="mr-1 h-3 w-3" />Lägg till alternativ
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Plats / format</p>
                <Input
                  placeholder="Google Meet, Teams, Kontoret..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Möteslänk (valfritt)</p>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Meddelande till kandidaten</p>
                <Textarea
                  placeholder="Vi vill gärna lära känna dig bättre..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="text-sm min-h-16 resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {schedule && schedule.status !== 'cancelled' && (
              <Button variant="outline" size="sm" onClick={cancel} className="text-destructive hover:text-destructive">
                Avboka
              </Button>
            )}
            <Button onClick={save} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
              {schedule && schedule.status !== 'cancelled' ? 'Uppdatera' : 'Skicka inbjudan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
