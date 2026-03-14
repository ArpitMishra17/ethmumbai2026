import {
  EvaluatorOutputSchema,
  type ChunkSummary,
  type ClaimInput,
  type ClauseSet,
  type EvaluatorOutput,
  type SessionChunk,
  type SessionSummary,
} from "../types.js";
import { llmEvaluateClaim } from "../llm/client.js";

export interface EvaluateClaimInput {
  claim: ClaimInput;
  clauses: ClauseSet;
  sessionSummary: SessionSummary;
  selectedChunks: SessionChunk[];
  selectedChunkSummaries: ChunkSummary[];
}

/**
 * Final evaluation: match claim against clauses using raw chunk evidence.
 * The evaluator must cite chunk ids and use only supplied clauses.
 */
export async function evaluateClaim(
  input: EvaluateClaimInput
): Promise<EvaluatorOutput> {
  const raw = await llmEvaluateClaim(input);
  return EvaluatorOutputSchema.parse(raw);
}
