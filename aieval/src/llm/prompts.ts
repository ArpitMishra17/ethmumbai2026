import type { ChunkSummary, ClaimInput, SessionSummary } from "../types.js";
import type { EvaluateClaimInput } from "../pipeline/evaluateClaim.js";
import {
  CHUNK_SUMMARY_SCHEMA,
  EVALUATOR_OUTPUT_SCHEMA,
  RETRIEVER_OUTPUT_SCHEMA,
  SESSION_SUMMARY_SCHEMA,
} from "./schemas.js";

// ── Chunk summarization ──

export function buildChunkSummaryPrompt(
  chunkId: string,
  rawText: string
): string {
  return `You are an AI session log analyst for an insurance claim evaluation system.

Summarize the following chunk of a coding-agent session log. Extract structured information about what happened.

RULES:
- Do NOT decide coverage or fault — only summarize facts.
- If you are uncertain about a field, use "unknown" or empty array.
- Do NOT hallucinate actions or files that are not in the log.
- The chunkId MUST be exactly: "${chunkId}"

OUTPUT FORMAT: Respond with ONLY a JSON object matching this schema:
${JSON.stringify(CHUNK_SUMMARY_SCHEMA, null, 2)}

SESSION CHUNK:
${rawText}`;
}

// ── Session summarization ──

export function buildSessionSummaryPrompt(
  sessionId: string,
  chunkSummaries: ChunkSummary[]
): string {
  const summariesText = chunkSummaries
    .map(
      (cs) =>
        `Chunk ${cs.chunkId}:\n  Summary: ${cs.summary}\n  Risk: ${cs.riskLevel}\n  Tags: ${cs.riskTags.join(", ")}\n  Actions: ${cs.actions.join(", ")}`
    )
    .join("\n\n");

  return `You are an AI session log analyst. Produce a single session-level summary from the chunk summaries below.

RULES:
- Synthesize across all chunks — do not just repeat them.
- The sessionId MUST be exactly: "${sessionId}"
- totalChunks must be ${chunkSummaries.length}
- totalEvents: estimate from the chunk data.
- incidentRelevance: "low" if session looks routine, "medium" if suspicious actions, "high" if clearly harmful.

OUTPUT FORMAT: Respond with ONLY a JSON object matching this schema:
${JSON.stringify(SESSION_SUMMARY_SCHEMA, null, 2)}

CHUNK SUMMARIES:
${summariesText}`;
}

// ── Retrieval ──

export function buildRetrievalPrompt(
  claim: ClaimInput,
  sessionSummary: SessionSummary,
  chunkSummaries: ChunkSummary[]
): string {
  const chunkList = chunkSummaries
    .map(
      (cs) =>
        `- ${cs.chunkId}: ${cs.summary} [risk=${cs.riskLevel}, tags=${cs.riskTags.join(",")}]`
    )
    .join("\n");

  return `You are a retrieval agent for an insurance claim evaluation system.

Given a claim and session data, identify which session chunks are most relevant to evaluating the claim. Select up to 6 chunks.

RULES:
- Do NOT evaluate coverage — only select relevant chunks.
- Do NOT use clause definitions — retrieval is claim-focused only.
- Justify each selection briefly.
- Return a confidence score for the overall retrieval quality.

CLAIM:
Text: ${claim.claimText}
Requested amount: $${claim.requestedAmount}

SESSION SUMMARY:
${sessionSummary.overallSummary}
Risk tags: ${sessionSummary.overallRiskTags.join(", ")}
Incident relevance: ${sessionSummary.incidentRelevance}

AVAILABLE CHUNKS:
${chunkList}

OUTPUT FORMAT: Respond with ONLY a JSON object matching this schema:
${JSON.stringify(RETRIEVER_OUTPUT_SCHEMA, null, 2)}`;
}

// ── Final evaluation ──

export function buildEvaluationPrompt(input: EvaluateClaimInput): string {
  const clauseText = input.clauses.clauses
    .map(
      (c) =>
        `${c.id} — ${c.title}\n  Covered if: ${c.coveredIf.join("; ")}\n  Excluded if: ${c.excludedIf.join("; ")}\n  Required evidence: ${c.requiredEvidence.join("; ")}\n  Max payout: $${c.maxPayout}`
    )
    .join("\n\n");

  const chunksText = input.selectedChunks
    .map((ch) => `--- ${ch.chunkId} ---\n${ch.rawText}`)
    .join("\n\n");

  const summariesText = input.selectedChunkSummaries
    .map((cs) => `${cs.chunkId}: ${cs.summary} [risk=${cs.riskLevel}]`)
    .join("\n");

  return `You are the final evaluator for an AI agent insurance claim.

Evaluate the claim against the provided clauses using the session evidence.

STRICT RULES:
- Use ONLY the supplied clauses — do not invent coverage terms.
- Cite specific chunk IDs when providing evidence.
- Use raw chunk text as source of truth, not summaries alone.
- Do NOT invent evidence that is not in the chunks.
- If evidence is insufficient, say so — do not guess.
- Recommended payout must not exceed the max_payout of matched clauses.

CLAIM:
Text: ${input.claim.claimText}
Requested amount: $${input.claim.requestedAmount}

CLAUSES:
${clauseText}

SESSION SUMMARY:
${input.sessionSummary.overallSummary}

CHUNK SUMMARIES:
${summariesText}

RAW CHUNKS (source of truth):
${chunksText}

OUTPUT FORMAT: Respond with ONLY a JSON object matching this schema:
${JSON.stringify(EVALUATOR_OUTPUT_SCHEMA, null, 2)}`;
}
