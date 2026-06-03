'use client'

import { useState, useEffect } from 'react'
import { Brain, Loader2, CheckCircle } from 'lucide-react'
import { CountUp } from '@/components/ui/count-up'

const jobs = [
  { role: 'Senior React Dev', co: 'Tech-startup', score: 94, color: 'text-emerald-500', bar: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { role: 'Frontend Engineer', co: 'SaaS-bolag', score: 87, color: 'text-blue-500', bar: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  { role: 'UI/UX Developer', co: 'E-handel', score: 79, color: 'text-violet-500', bar: 'bg-violet-500', badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
]

export function AnimatedHeroWidget() {
  const [phase, setPhase] = useState<'analyzing' | 'done'>('analyzing')

  useEffect(() => {
    const t = setTimeout(() => setPhase('done'), 1600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative float-animation">
      {/* Outer glow ring */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/30 via-violet-500/30 to-primary/30 blur-sm" />

      <div className="relative rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm shadow-2xl shadow-primary/10 overflow-hidden">

        {/* Browser chrome */}
        <div className="border-b border-border/60 px-4 py-2.5 flex items-center gap-2 bg-muted/40">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 mx-3 h-5 rounded-md bg-muted/60 flex items-center px-3">
            <span className="text-[10px] text-muted-foreground">matchconnect.se/seeker/jobs</span>
          </div>
          <div className="flex items-center gap-1 transition-all duration-300">
            {phase === 'analyzing' ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[9px] text-primary font-semibold">AI analyserar...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Klar</span>
              </>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="p-4 grid grid-cols-3 gap-2.5">
          {jobs.map((job, i) => (
            <div
              key={job.role}
              className="rounded-xl border border-border/60 bg-background/80 p-3 text-left transition-all duration-500"
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center shadow-sm shadow-primary/30">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
                <span className={`text-base font-bold tabular-nums ${job.color}`}>
                  {phase === 'analyzing'
                    ? <span className="text-muted-foreground/40">—</span>
                    : <CountUp end={job.score} suffix="%" duration={900 + i * 150} />
                  }
                </span>
              </div>
              <p className="text-xs font-semibold leading-snug">{job.role}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 mb-2.5">{job.co}</p>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full ${job.bar} transition-all duration-1000 ease-out`}
                  style={{
                    width: phase === 'done' ? `${job.score}%` : '0%',
                    transitionDelay: `${200 + i * 150}ms`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom status bar */}
        <div className="border-t border-border/40 px-4 py-2 bg-muted/20 flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">3 matchningar hittades</span>
          <span className="text-[9px] font-medium text-primary">
            {phase === 'analyzing' ? 'Bearbetar CV...' : 'Sortera efter matchning ↑'}
          </span>
        </div>
      </div>
    </div>
  )
}
