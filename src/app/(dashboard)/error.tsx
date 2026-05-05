'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mb-6">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Något gick fel</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Ett oväntat fel uppstod. Försök igen eller gå till dashboard.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>Försök igen</Button>
        <Button asChild>
          <Link href="/dashboard">Till dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
