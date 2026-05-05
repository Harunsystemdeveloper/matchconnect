/**
 * Jaccard similarity between two skill sets.
 * Returns 0–1 where 1 = identical sets.
 * Used to pre-filter candidates before expensive Claude calls.
 */
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1
  if (a.length === 0 || b.length === 0) return 0

  const setA = new Set(a.map(s => s.toLowerCase().trim()))
  const setB = new Set(b.map(s => s.toLowerCase().trim()))

  let intersection = 0
  for (const skill of setA) {
    if (setB.has(skill)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return intersection / union
}

/**
 * Fast skill-overlap pre-score (0–100).
 * Weights required skills more heavily than candidate extras.
 */
export function preScoreCandidates<T extends {
  id: string
  cv_profile: { skills: string[] | null; experience_years: number | null } | null
}>(
  requiredSkills: string[],
  candidates: T[],
): Array<T & { preScore: number }> {
  if (requiredSkills.length === 0) {
    return candidates.map(c => ({ ...c, preScore: 50 }))
  }

  return candidates.map(c => {
    const candidateSkills = c.cv_profile?.skills ?? []
    const similarity = jaccardSimilarity(requiredSkills, candidateSkills)
    const preScore = Math.round(similarity * 100)
    return { ...c, preScore }
  })
}

/**
 * Returns top N candidates by pre-score.
 * Guarantees at least minCandidates are sent to Claude even with low scores.
 */
export function selectTopCandidates<T extends { preScore: number }>(
  candidates: T[],
  maxForClaude = 20,
): T[] {
  return [...candidates]
    .sort((a, b) => b.preScore - a.preScore)
    .slice(0, maxForClaude)
}
