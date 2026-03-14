import {
  RetrieverOutputSchema,
  type ChunkSummary,
  type ClaimInput,
  type RetrieverOutput,
  type SessionSummary,
} from "../types.js";
import { llmRetrieveRelevantChunks } from "../llm/client.js";

/**
 * Identify the most relevant chunks for the given claim.
 * Does NOT use clause definitions — retrieval is claim-only.
 */
export async function retrieveRelevantChunks(
  claim: ClaimInput,
  sessionSummary: SessionSummary,
  chunkSummaries: ChunkSummary[]
): Promise<RetrieverOutput> {
  const raw = await llmRetrieveRelevantChunks(claim, sessionSummary, chunkSummaries);
  return RetrieverOutputSchema.parse(raw);
}
