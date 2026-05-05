'use client'

import { CountUp } from '@/components/ui/count-up'
import { Zap, CheckCircle, Users, TrendingUp } from 'lucide-react'

const metrics = [
  { end: 2, suffix: 'x', label: 'snabbare matchning', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  { end: 87, suffix: '%', label: 'rekryterar-nöjdhet', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { end: 3, suffix: 'x', label: 'fler relevanta ansökningar', icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { end: 60, suffix: '%', label: 'kortare time-to-hire', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
]

export function ImpactStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-background p-5 text-center group hover:border-primary/20 transition-colors card-hover">
          <div className={`h-10 w-10 rounded-xl ${m.bg} flex items-center justify-center mx-auto mb-3`}>
            <m.icon className={`h-5 w-5 ${m.color}`} />
          </div>
          <p className="text-3xl font-black gradient-text tabular-nums">
            <CountUp end={m.end} suffix={m.suffix} duration={1400 + i * 150} />
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-snug">{m.label}</p>
        </div>
      ))}
    </div>
  )
}
