'use client'

import { useState } from 'react'
import { StepBasicInfo } from './step-basic-info'
import { StepRoleDetails } from './step-role-details'
import { StepAvatar } from './step-avatar'
import { Check } from 'lucide-react'
import type { Profile } from '@/types/database'

interface Props { profile: Profile }

export function OnboardingWizard({ profile }: Props) {
  const [step, setStep] = useState(1)
  const totalSteps = 3

  function next() {
    if (step < totalSteps) setStep(step + 1)
    else window.location.href = '/dashboard'
  }
  function back() {
    if (step > 1) setStep(step - 1)
  }

  const stepLabels = [
    { label: 'Grundinfo', sub: 'Namn & bio' },
    {
      label: profile.user_type === 'recruiter' ? 'Företag' : 'Kompetenser',
      sub: profile.user_type === 'recruiter' ? 'Företagsinfo' : 'Dina skills',
    },
    { label: 'Profilbild', sub: 'Valfritt' },
  ]

  const progressPct = ((step - 1) / (totalSteps - 1)) * 100

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="mb-8 px-2">
        <div className="relative flex justify-between items-start">
          {/* Background track */}
          <div className="absolute left-5 right-5 top-5 h-0.5 bg-border z-0" />
          {/* Progress track */}
          <div
            className="absolute left-5 top-5 h-0.5 bg-gradient-to-r from-primary to-violet-500 z-[1] transition-all duration-500"
            style={{ width: `calc(${progressPct}% - 0px)`, maxWidth: 'calc(100% - 40px)' }}
          />

          {stepLabels.map((s, i) => {
            const num = i + 1
            const done = num < step
            const active = num === step
            return (
              <div key={i} className="relative z-[2] flex flex-col items-center gap-2 w-20">
                <div className={`
                  h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${done ? 'gradient-primary text-white shadow-md shadow-primary/30' : ''}
                  ${active ? 'bg-background border-2 border-primary text-primary shadow-[0_0_0_4px_rgba(99,102,241,0.15)]' : ''}
                  ${!done && !active ? 'bg-background border-2 border-border text-muted-foreground' : ''}
                `}>
                  {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : num}
                </div>
                <div className="text-center">
                  <p className={`text-xs font-semibold leading-tight ${active ? 'text-foreground' : done ? 'text-primary' : 'text-muted-foreground'}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {step === 1 && <StepBasicInfo profile={profile} onNext={next} />}
        {step === 2 && <StepRoleDetails profile={profile} onNext={next} onBack={back} />}
        {step === 3 && <StepAvatar profile={profile} onNext={next} onBack={back} />}
      </div>
    </div>
  )
}
