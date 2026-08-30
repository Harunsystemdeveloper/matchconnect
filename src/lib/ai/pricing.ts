// Priser i USD per 1 miljon tokens. Källa: Anthropics officiella prislista (kontrollerad
// mot aktuell dokumentation). Uppdatera om Anthropic ändrar priserna.
export const MODEL_PRICING = {
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
} as const

export interface Usage {
  input_tokens: number
  output_tokens: number
}

export function estimateCostUsd(modelId: string, usage: Usage): number {
  const price = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING]
  if (!price) return 0
  return (usage.input_tokens * price.input + usage.output_tokens * price.output) / 1_000_000
}
