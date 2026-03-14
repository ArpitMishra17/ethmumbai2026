import { z } from "zod";

// ── Normalized Session (mirrors upstream pipeline output) ──

export const SessionMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const SessionToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  input: z.unknown(),
  output: z.string(),
});

export const SessionApprovalSchema = z.object({
  prompt: z.string(),
  decision: z.enum(["approved", "denied"]),
});

export const NormalizedSessionSchema = z.object({
  sessionId: z.string(),
  tool: z.enum(["claude_code", "codex", "gemini_cli"]),
  agentId: z.string(),
  agentEns: z.string(),
  walletId: z.string(),
  userId: z.string(),
  orgId: z.string(),
  workspacePath: z.string(),
  startedAt: z.string(),
  endedAt: z.string(),
  messages: z.array(SessionMessageSchema),
  toolCalls: z.array(SessionToolCallSchema),
  filesChanged: z.array(z.string()),
  shellCommands: z.array(z.string()),
  approvals: z.array(SessionApprovalSchema),
  exitReason: z.string(),
});

export type NormalizedSession = z.infer<typeof NormalizedSessionSchema>;
export type SessionMessage = z.infer<typeof SessionMessageSchema>;
export type SessionToolCall = z.infer<typeof SessionToolCallSchema>;
export type SessionApproval = z.infer<typeof SessionApprovalSchema>;

// ── Session Events (unified timeline for chunking) ──

export const SessionEventSchema = z.object({
  index: z.number(),
  type: z.enum(["message", "tool_call", "approval", "system"]),
  role: z.string().optional(),
  content: z.string(),
  raw: z.unknown(),
});

export type SessionEvent = z.infer<typeof SessionEventSchema>;

// ── Chunks ──

export const SessionChunkSchema = z.object({
  chunkId: z.string(),
  chunkIndex: z.number(),
  eventStartIndex: z.number(),
  eventEndIndex: z.number(),
  events: z.array(SessionEventSchema),
  rawText: z.string(),
});

export type SessionChunk = z.infer<typeof SessionChunkSchema>;

// ── Chunk Summary ──

export const ChunkSummarySchema = z.object({
  chunkId: z.string(),
  summary: z.string(),
  riskLevel: z.enum(["low", "medium", "high", "unknown"]),
  riskTags: z.array(z.string()),
  actions: z.array(z.string()),
  filesOrPaths: z.array(z.string()),
  approvalsPresent: z.boolean(),
  claimRelevanceHint: z.enum(["none", "low", "medium", "high", "unknown"]),
});

export type ChunkSummary = z.infer<typeof ChunkSummarySchema>;

// ── Session Summary ──

export const SessionSummarySchema = z.object({
  sessionId: z.string(),
  overallSummary: z.string(),
  overallRiskTags: z.array(z.string()),
  notableActions: z.array(z.string()),
  incidentRelevance: z.enum(["low", "medium", "high"]),
  totalChunks: z.number(),
  totalEvents: z.number(),
});

export type SessionSummary = z.infer<typeof SessionSummarySchema>;

// ── Claim Input ──

export const ClaimInputSchema = z.object({
  claimText: z.string(),
  requestedAmount: z.number(),
  claimantId: z.string().optional(),
  agentId: z.string().optional(),
});

export type ClaimInput = z.infer<typeof ClaimInputSchema>;

// ── Retriever Output ──

export const RetrievedChunkSchema = z.object({
  chunkId: z.string(),
  justification: z.string(),
  relevanceScore: z.number().min(0).max(1),
});

export const RetrieverOutputSchema = z.object({
  selectedChunks: z.array(RetrievedChunkSchema),
  retrievalConfidence: z.number().min(0).max(1),
});

export type RetrievedChunk = z.infer<typeof RetrievedChunkSchema>;
export type RetrieverOutput = z.infer<typeof RetrieverOutputSchema>;

// ── Clauses ──

export const ClauseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  coveredIf: z.array(z.string()),
  excludedIf: z.array(z.string()),
  requiredEvidence: z.array(z.string()),
  maxPayout: z.number(),
  reviewThreshold: z.number(),
});

export const ClauseSetSchema = z.object({
  version: z.string(),
  clauses: z.array(ClauseSchema),
});

export type Clause = z.infer<typeof ClauseSchema>;
export type ClauseSet = z.infer<typeof ClauseSetSchema>;

// ── Evaluator Output ──

export const EvidenceCitationSchema = z.object({
  chunkId: z.string(),
  excerpt: z.string(),
  relevance: z.string(),
});

export const EvaluatorOutputSchema = z.object({
  decision: z.enum(["approve", "reject", "review"]),
  matchedClauses: z.array(z.string()),
  excludedClauses: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  recommendedPayout: z.number(),
  needsHumanReview: z.boolean(),
  reason: z.string(),
  evidence: z.array(EvidenceCitationSchema),
});

export type EvidenceCitation = z.infer<typeof EvidenceCitationSchema>;
export type EvaluatorOutput = z.infer<typeof EvaluatorOutputSchema>;

// ── Final Decision (after routing) ──

export const FinalDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "review"]),
  recommendedPayout: z.number(),
  needsHumanReview: z.boolean(),
  reason: z.string(),
  routingFlags: z.array(z.string()),
  evaluatorDecision: z.enum(["approve", "reject", "review"]),
  evaluatorConfidence: z.number(),
});

export type FinalDecision = z.infer<typeof FinalDecisionSchema>;

// ── Full Pipeline Result ──

export interface PipelineResult {
  sessionId: string;
  chunks: SessionChunk[];
  chunkSummaries: ChunkSummary[];
  sessionSummary: SessionSummary;
  retrieverOutput: RetrieverOutput;
  evaluatorOutput: EvaluatorOutput;
  finalDecision: FinalDecision;
}
