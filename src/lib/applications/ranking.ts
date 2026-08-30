// Hjälpfunktioner för att visa kandidaten en ANONYMISERAD känsla för konkurrensen om ett
// jobb -- aldrig andra sökandes identitet eller exakta poäng, bara en grov bucket.

/** Minsta antal sökande innan vi visar någon jämförelse alls -- annars skulle en bucket
 *  kunna avslöja för mycket i ett litet urval (t.ex. "topp 50%" av 2 sökande = du eller den andra). */
export const MIN_APPLICANTS_FOR_RANKING = 5

export function percentileBucketLabel(percentile: number): string {
  if (percentile >= 90) return 'topp 10%'
  if (percentile >= 75) return 'topp 25%'
  if (percentile >= 50) return 'övre hälften'
  return 'nedre hälften'
}

/**
 * Beräknar hur stor andel av OWNSCORE-jämförelserna som ligger under kandidatens egen
 * poäng -- dvs. en percentil. otherScores ska vara enbart siffror (aldrig kopplade till
 * vem de tillhör) för de ÖVRIGA sökande till samma jobb.
 */
export function computePercentile(ownScore: number, otherScores: number[]): number {
  if (otherScores.length === 0) return 100
  const lower = otherScores.filter(s => s < ownScore).length
  return Math.round((lower / otherScores.length) * 100)
}
