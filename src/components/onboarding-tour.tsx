'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowRight } from 'lucide-react'

const SEEKER_STEPS = [
  {
    title: 'Ladda upp ditt CV',
    description: 'Gå till "Min profil" och ladda upp ditt CV. AI:n analyserar det automatiskt och extraherar dina kompetenser.',
    cta: 'Gå till profil',
    href: '/seeker/profile',
  },
  {
    title: 'Hitta matchande jobb',
    description: 'Under "Hitta jobb" ser du aktiva annonser. AI:n beräknar ett matchningspoäng baserat på ditt CV.',
    cta: 'Bläddra jobb',
    href: '/seeker/jobs',
  },
  {
    title: 'Förbered intervjun',
    description: 'På varje jobbsida kan du se kompetensgap och få AI-genererade intervjufrågor anpassade till dig.',
    cta: 'Klar!',
    href: null,
  },
]

const RECRUITER_STEPS = [
  {
    title: 'Skapa din första annons',
    description: 'Under "Mina annonser" → "Ny annons" fyller du i jobbets krav. Ju mer detaljerat desto bättre AI-matchning.',
    cta: 'Skapa annons',
    href: '/recruiter/jobs/new',
  },
  {
    title: 'AI-matcha kandidater',
    description: 'När ansökningar kommit in, klicka på "AI-matcha kandidater" för att få rankade matchningspoäng.',
    cta: 'Mina annonser',
    href: '/recruiter/jobs',
  },
  {
    title: 'Hantera pipeline',
    description: 'Använd kanban-vyn för att flytta kandidater mellan Ny → Granskas → Shortlist → Erbjuds.',
    cta: 'Klar!',
    href: null,
  },
]

const TOUR_KEY = 'matchconnect_tour_done'

export function OnboardingTour({ userType }: { userType: 'job_seeker' | 'recruiter' }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  const steps = userType === 'recruiter' ? RECRUITER_STEPS : SEEKER_STEPS

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(TOUR_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(TOUR_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!visible) return null

  const current = steps[step]

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-popover border border-border rounded-xl shadow-xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`}
              />
            ))}
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="font-semibold text-sm mb-1">{current.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{current.description}</p>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss} className="text-muted-foreground">
            Hoppa över
          </Button>
          {current.href ? (
            <Button size="sm" className="flex-1" asChild onClick={next}>
              <a href={current.href}>
                {current.cta} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <Button size="sm" className="flex-1" onClick={next}>
              {current.cta}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
