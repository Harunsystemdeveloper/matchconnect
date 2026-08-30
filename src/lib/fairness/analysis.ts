// Statistikmotor för fairness-analys. Ren funktionell logik, inga DB-/nätverksanrop här —
// gör den lätt att testa och gör att /api/fairness/analyze bara behöver orkestrera data in/ut.

/** Minsta antal sökande en grupp måste ha innan vi visar någon statistik för den
 *  (k-anonymitet — skyddar mot att peka ut enskilda kandidater i små urval). */
export const MIN_GROUP_SIZE = 5

/** 95% tvåsidigt kritiskt z-värde. */
const Z_CRITICAL = 1.96

export interface GroupInput {
  name: string
  n: number
  selected: number // t.ex. antal shortlistade/intervjuade/anställda i gruppen
  scoreSum: number // summan av match_score för gruppen (för att räkna snitt)
  scoreCount: number // antal ansökningar med ett faktiskt match_score i gruppen
}

export interface GroupResult {
  name: string
  n: number
  selection_rate: number | null // andel som gick vidare, null om under MIN_GROUP_SIZE
  avg_match_score: number | null
  included: boolean // false om gruppen är för liten för att visas
}

export interface AdverseImpactResult {
  reference_group: string | null
  lowest_group: string | null
  ratio: number | null // lägsta urvalsfrekvens / högsta urvalsfrekvens
  flagged: boolean // true om ratio < 0.8 (EEOC "4/5-regeln")
}

export interface SignificanceResult {
  group_a: string
  group_b: string
  z_score: number
  significant: boolean // |z| > 1.96
}

export interface FairnessDimensionResult {
  dimension: 'gender' | 'age_bucket'
  groups: GroupResult[]
  adverse_impact: AdverseImpactResult
  significance: SignificanceResult | null
  human_review_required: boolean
  excluded_small_groups: string[]
}

function twoProportionZ(n1: number, x1: number, n2: number, x2: number): number {
  if (n1 === 0 || n2 === 0) return 0
  const p1 = x1 / n1
  const p2 = x2 / n2
  const pPooled = (x1 + x2) / (n1 + n2)
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2))
  if (se === 0) return 0
  return (p1 - p2) / se
}

/**
 * Kör fullständig fairness-analys för en dimension (t.ex. kön eller åldersgrupp).
 * Grupper under MIN_GROUP_SIZE exkluderas helt från statistiken (visas bara som "för få
 * datapunkter"), så att ingen enskild kandidat kan pekas ut.
 */
export function analyzeDimension(
  dimension: 'gender' | 'age_bucket',
  inputs: GroupInput[]
): FairnessDimensionResult {
  const excluded_small_groups: string[] = []
  const eligible = inputs.filter(g => {
    if (g.n < MIN_GROUP_SIZE) {
      excluded_small_groups.push(g.name)
      return false
    }
    return true
  })

  const groups: GroupResult[] = inputs.map(g => {
    const isEligible = g.n >= MIN_GROUP_SIZE
    return {
      name: g.name,
      n: g.n,
      selection_rate: isEligible ? g.selected / g.n : null,
      avg_match_score: isEligible && g.scoreCount > 0 ? Math.round((g.scoreSum / g.scoreCount) * 10) / 10 : null,
      included: isEligible,
    }
  })

  // Adverse impact ratio (EEOC 4/5-regeln): lägsta urvalsfrekvens delat med högsta.
  let adverse_impact: AdverseImpactResult = { reference_group: null, lowest_group: null, ratio: null, flagged: false }
  if (eligible.length >= 2) {
    const withRates = eligible.map(g => ({ name: g.name, rate: g.selected / g.n }))
    const highest = withRates.reduce((a, b) => (b.rate > a.rate ? b : a))
    const lowest = withRates.reduce((a, b) => (b.rate < a.rate ? b : a))
    const ratio = highest.rate > 0 ? lowest.rate / highest.rate : null
    adverse_impact = {
      reference_group: highest.name,
      lowest_group: lowest.name,
      ratio: ratio !== null ? Math.round(ratio * 1000) / 1000 : null,
      flagged: ratio !== null && ratio < 0.8,
    }
  }

  // Statistisk signifikans mellan gruppen med högst och lägst urvalsfrekvens.
  let significance: SignificanceResult | null = null
  if (eligible.length >= 2) {
    const withRates = eligible.map(g => ({ ...g, rate: g.selected / g.n }))
    const a = withRates.reduce((x, y) => (y.rate > x.rate ? y : x))
    const b = withRates.reduce((x, y) => (y.rate < x.rate ? y : x))
    if (a.name !== b.name) {
      const z = twoProportionZ(a.n, a.selected, b.n, b.selected)
      significance = {
        group_a: a.name,
        group_b: b.name,
        z_score: Math.round(z * 100) / 100,
        significant: Math.abs(z) > Z_CRITICAL,
      }
    }
  }

  const human_review_required = adverse_impact.flagged || (significance?.significant ?? false)

  return { dimension, groups, adverse_impact, significance, human_review_required, excluded_small_groups }
}

/** Åldersgrupp från födelseår, samma indelning som används genomgående i dashboarden. */
export function ageBucket(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear
  if (age < 25) return '<25'
  if (age < 35) return '25–34'
  if (age < 45) return '35–44'
  if (age < 55) return '45–54'
  return '55+'
}
