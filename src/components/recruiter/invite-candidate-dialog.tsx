'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  seekerId: string
  seekerName: string
  jobs: { id: string; title: string }[]
  trigger?: React.ReactNode
}

export function InviteCandidateDialog({ seekerId, seekerName, jobs, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [jobId, setJobId] = useState('')
  const [sending, setSending] = useState(false)
  const [sentMessage, setSentMessage] = useState<string | null>(null)

  async function send() {
    if (!jobId) return
    setSending(true)
    const res = await fetch('/api/candidate-invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, seeker_id: seekerId }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error('Kunde inte skicka inbjudan', { description: typeof data.error === 'string' ? data.error : undefined })
      setSending(false)
      return
    }
    setSentMessage(data.message)
    toast.success('Inbjudan skickad!')
    setSending(false)
  }

  function reset() {
    setJobId('')
    setSentMessage(null)
  }

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Send className="mr-1.5 h-3.5 w-3.5" />Bjud in till jobb
        </Button>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Bjud in {seekerName}
          </DialogTitle>
          <DialogDescription>
            AI skriver ett personligt meddelande baserat på kandidatens faktiska kompetenser mot jobbets krav.
          </DialogDescription>
        </DialogHeader>

        {sentMessage ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              Skickat till {seekerName}
            </div>
            <div className="rounded-lg bg-muted/50 border p-3 text-sm whitespace-pre-wrap">
              {sentMessage}
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <Select value={jobId} onValueChange={v => setJobId(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Välj jobbannons" /></SelectTrigger>
              <SelectContent>
                {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          {sentMessage ? (
            <Button onClick={() => setOpen(false)} className="w-full">Stäng</Button>
          ) : (
            <Button onClick={send} disabled={!jobId || sending} className="w-full">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {sending ? 'Genererar och skickar...' : 'Generera & skicka'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
