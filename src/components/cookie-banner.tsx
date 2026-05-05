'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'

const COOKIE_KEY = 'mc_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  function accept() {
    localStorage.setItem(COOKIE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-popover shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Vi använder cookies</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Vi använder nödvändiga cookies för att sajten ska fungera. Läs mer i vår{' '}
              <Link href="/cookies" className="text-primary hover:underline">cookiepolicy</Link>.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={decline} className="flex-1 sm:flex-none">
            Avvisa
          </Button>
          <Button size="sm" onClick={accept} className="flex-1 sm:flex-none gradient-primary text-white">
            Acceptera
          </Button>
        </div>
      </div>
    </div>
  )
}
