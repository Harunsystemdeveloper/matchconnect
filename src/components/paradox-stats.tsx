'use client'

import { CountUp } from '@/components/ui/count-up'
import { TrendingUp } from 'lucide-react'

const stats = [
  {
    end: 74,
    decimals: 0,
    suffix: '%',
    label: 'av svenska företag uppger kompetensbristen som ett allvarligt tillväxthinder',
    source: 'Svenskt Näringsliv 2025',
    change: '+4% YoY',
    color: 'from-orange-500 to-red-500',
    border: 'border-orange-500/25',
    bg: 'from-orange-500/6 to-red-500/6',
    glow: 'shadow-orange-500/15',
    dot: 'bg-orange-500',
  },
  {
    end: 8.2,
    decimals: 1,
    suffix: '%',
    label: 'akademikerarbetslöshet — paradoxalt bland de högsta i Norden',
    source: 'SCB Q4 2025',
    change: '+1,1% YoY',
    color: 'from-red-500 to-rose-600',
    border: 'border-red-500/25',
    bg: 'from-red-500/6 to-rose-500/6',
    glow: 'shadow-red-500/15',
    dot: 'bg-red-500',
  },
  {
    end: 180,
    decimals: 0,
    suffix: ' 000',
    label: 'lediga tjänster som inte kan tillsättas p.g.a. kompetensbrist',
    source: 'Arbetsförmedlingen 2025',
    change: '+22 000 YoY',
    color: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/25',
    bg: 'from-amber-500/6 to-orange-500/6',
    glow: 'shadow-amber-500/15',
    dot: 'bg-amber-500',
  },
  {
    end: 45,
    decimals: 0,
    suffix: ' mdr',
    label: 'kronor förloras varje år i produktion p.g.a. obemannade tjänster',
    source: 'Konjunkturinstitutet 2025',
    change: '+7 mdr YoY',
    color: 'from-rose-500 to-pink-600',
    border: 'border-rose-500/25',
    bg: 'from-rose-500/6 to-pink-500/6',
    glow: 'shadow-rose-500/15',
    dot: 'bg-rose-500',
  },
]

export function ParadoxStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <div
          key={i}
          className={`relative rounded-2xl border ${s.border} bg-gradient-to-br ${s.bg} p-5 overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-lg ${s.glow}`}
          style={{ animationDelay: `${i * 120}ms` }}
        >
          {/* Ambient glow blob */}
          <div className={`absolute -top-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />

          {/* Live indicator + change badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${s.dot} animate-pulse`} />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5">
              <TrendingUp className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-bold text-red-500">{s.change}</span>
            </div>
          </div>

          {/* Big animated number */}
          <p className={`text-4xl sm:text-5xl font-black leading-none mb-3 bg-gradient-to-r ${s.color} bg-clip-text text-transparent tabular-nums`}>
            <CountUp end={s.end} decimals={s.decimals} suffix={s.suffix} duration={1800 + i * 200} />
          </p>

          <p className="text-xs sm:text-sm font-medium text-foreground leading-snug mb-4">{s.label}</p>

          <p className="text-[11px] text-muted-foreground/60 font-medium border-t border-border/40 pt-3">{s.source}</p>
        </div>
      ))}
    </div>
  )
}
