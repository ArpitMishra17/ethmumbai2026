/**
 * Rough token estimate: ~4 characters per token for English text.
 * Good enough for chunking heuristics — not used for billing.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
