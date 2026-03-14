import {
  SessionSummarySchema,
  type ChunkSummary,
  type NormalizedSession,
  type SessionSummary,
} from "../types.js";
import { llmSummarizeSession } from "../llm/client.js";

/**
 * Produce a single session-level summary from all chunk summaries.
 */
export async function summarizeSession(
  session: NormalizedSession,
  chunkSummaries: ChunkSummary[]
): Promise<SessionSummary> {
  const raw = await llmSummarizeSession(session.sessionId, chunkSummaries);
  return SessionSummarySchema.parse(raw);
}
