import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import {
  NormalizedSessionSchema,
  ClauseSetSchema,
  type ClaimInput,
  type NormalizedSession,
  type PipelineResult,
} from "./types.js";
import { chunkSession } from "./pipeline/chunkSession.js";
import { summarizeAllChunks } from "./pipeline/summarizeChunk.js";
import { summarizeSession } from "./pipeline/summarizeSession.js";
import { retrieveRelevantChunks } from "./pipeline/retrieveRelevantChunks.js";
import { evaluateClaim } from "./pipeline/evaluateClaim.js";
import { routeDecision } from "./pipeline/routeDecision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadClauses() {
  const raw = readFileSync(
    resolve(__dirname, "clauses", "clauses.json"),
    "utf-8"
  );
  return ClauseSetSchema.parse(JSON.parse(raw));
}

export interface RunClaimEvaluationInput {
  session: NormalizedSession;
  claimText: string;
  requestedAmount: number;
  claimantId?: string;
  agentId?: string;
}

/**
 * Main pipeline: evaluate a claim against a verified session log.
 *
 * Stages:
 * 1. Chunk session
 * 2. Summarize chunks (LLM)
 * 3. Summarize session (LLM)
 * 4. Retrieve relevant chunks (LLM)
 * 5. Evaluate claim against clauses (LLM)
 * 6. Route decision (deterministic)
 */
export async function runClaimEvaluation(
  input: RunClaimEvaluationInput
): Promise<PipelineResult> {
  // Validate input session
  const session = NormalizedSessionSchema.parse(input.session);
  const clauses = loadClauses();

  const claim: ClaimInput = {
    claimText: input.claimText,
    requestedAmount: input.requestedAmount,
    claimantId: input.claimantId,
    agentId: input.agentId,
  };

  // Stage 1: Chunk
  const chunks = chunkSession(session);

  // Stage 2: Summarize chunks
  const chunkSummaries = await summarizeAllChunks(chunks);

  // Stage 3: Summarize session
  const sessionSummary = await summarizeSession(session, chunkSummaries);

  // Stage 4: Retrieve relevant chunks
  const retrieverOutput = await retrieveRelevantChunks(
    claim,
    sessionSummary,
    chunkSummaries
  );

  // Stage 5: Select raw chunks for evaluator
  const selectedChunkIds = new Set(
    retrieverOutput.selectedChunks.map((sc) => sc.chunkId)
  );
  const selectedChunks = chunks.filter((c) => selectedChunkIds.has(c.chunkId));
  const selectedChunkSummaries = chunkSummaries.filter((cs) =>
    selectedChunkIds.has(cs.chunkId)
  );

  // Stage 6: Evaluate claim
  const evaluatorOutput = await evaluateClaim({
    claim,
    clauses,
    sessionSummary,
    selectedChunks,
    selectedChunkSummaries,
  });

  // Stage 7: Route decision (deterministic)
  const finalDecision = routeDecision(
    evaluatorOutput,
    input.requestedAmount,
    clauses
  );

  return {
    sessionId: session.sessionId,
    chunks,
    chunkSummaries,
    sessionSummary,
    retrieverOutput,
    evaluatorOutput,
    finalDecision,
  };
}

// Re-export types for consumers
export * from "./types.js";
export { chunkSession } from "./pipeline/chunkSession.js";
export { routeDecision } from "./pipeline/routeDecision.js";
