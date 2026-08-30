import { Progress } from '@/components/ui/progress'
import { ThumbsUp, AlertTriangle } from 'lucide-react'
import type { MatchBreakdown } from '@/types/database'

const CATEGORY_LABELS: Record<keyof MatchBreakdown['category_scores'], string> = {
  kompetens: 'Kompetens',
  erfarenhet: 'Erfarenhet',
  utbildning: 'Utbildning',
  kultur_mjuka_kompetenser: 'Kultur / mjuka kompetenser',
}

export function MatchBreakdownView({ breakdown }: { breakdown: MatchBreakdown }) {
  const categories = Object.keys(CATEGORY_LABELS) as Array<keyof MatchBreakdown['category_scores']>

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-4 text-sm">
      {/* Kategoripoäng */}
      <div className="space-y-2.5">
        {categories.map(cat => (
          <div key={cat}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">{CATEGORY_LABELS[cat]}</span>
              <span className="text-xs font-semibold text-primary">{breakdown.category_scores[cat]}%</span>
            </div>
            <Progress value={breakdown.category_scores[cat]} className="h-1.5" />
            {breakdown.category_reasoning?.[cat] && (
              <p className="text-xs text-muted-foreground mt-1">{breakdown.category_reasoning[cat]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Styrkor och gap */}
      <div className="grid sm:grid-cols-2 gap-3">
        {breakdown.top_positive_factors?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1.5 text-green-700 dark:text-green-400">
              <ThumbsUp className="h-3 w-3" />Starkaste faktorer
            </p>
            <ul className="space-y-1">
              {breakdown.top_positive_factors.map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-green-500">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
        {breakdown.top_gaps?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />Gap / risker
            </p>
            <ul className="space-y-1">
              {breakdown.top_gaps.map((g, i) => (
                <li key={i} className="text-xs text-muted-foreground pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500">
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
