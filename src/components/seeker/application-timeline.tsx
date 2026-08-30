import { Check, X } from 'lucide-react'

interface Props {
  status: string
  hasInterview: boolean
  decided: boolean
}

const STEPS = [
  { key: 'submitted', label: 'Inskickad' },
  { key: 'reviewed', label: 'Granskad' },
  { key: 'shortlisted', label: 'Shortlist' },
  { key: 'interview', label: 'Intervju' },
  { key: 'decided', label: 'Beslut' },
] as const

/**
 * Härleder vilka steg som är uppnådda från flera olika signaler (status, om en intervju
 * bokats, om ett slutgiltigt beslut fattats) istället för att anta att pipelinen alltid
 * går i en rak stegordning — en rekryterare kan t.ex. hoppa direkt från "Ny" till
 * "Accepterad" utan att någonsin markera "Shortlistad".
 */
function reachedSteps(status: string, hasInterview: boolean, decided: boolean): boolean[] {
  return [
    true,
    status !== 'pending' || decided,
    status === 'shortlisted' || status === 'accepted',
    hasInterview,
    decided,
  ]
}

export function ApplicationTimeline({ status, hasInterview, decided }: Props) {
  const reached = reachedSteps(status, hasInterview, decided)
  const isRejected = decided && status === 'rejected'

  return (
    <div className="flex items-start w-full">
      {STEPS.map((step, i) => {
        const done = reached[i]
        const isLast = i === STEPS.length - 1
        const isFinalRejected = isLast && isRejected
        return (
          <div key={step.key} className="flex items-start flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  !done
                    ? 'bg-muted text-muted-foreground border border-border'
                    : isFinalRejected
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground'
                }`}
              >
                {done ? (isFinalRejected ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />) : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 mx-1 mt-2.5 ${reached[i + 1] ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
