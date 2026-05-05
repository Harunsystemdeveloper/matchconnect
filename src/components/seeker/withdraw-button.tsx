'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function WithdrawButton({ applicationId }: { applicationId: string }) {
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function withdraw() {
    setLoading(true)
    const { error } = await supabase.from('applications').delete().eq('id', applicationId)
    if (error) {
      toast.error('Kunde inte dra tillbaka ansökan')
      setLoading(false)
      setConfirmed(false)
    } else {
      toast.success('Ansökan återkallad')
      router.refresh()
    }
  }

  if (!confirmed) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setConfirmed(true)}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Återkalla
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">Säker?</span>
      <Button size="sm" variant="destructive" onClick={withdraw} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Ja'}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirmed(false)} disabled={loading}>
        Nej
      </Button>
    </div>
  )
}
