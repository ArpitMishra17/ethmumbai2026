/**
 * JSON schemas passed to the LLM for structured output.
 * These mirror the Zod schemas in types.ts but as plain objects
 * for inclusion in prompts.
 */

export const CHUNK_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    chunkId: { type: "string" },
    summary: { type: "string" },
    riskLevel: { type: "string", enum: ["low", "medium", "high", "unknown"] },
    riskTags: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
    filesOrPaths: { type: "array", items: { type: "string" } },
    approvalsPresent: { type: "boolean" },
    claimRelevanceHint: {
      type: "string",
      enum: ["none", "low", "medium", "high", "unknown"],
    },
  },
  required: [
    "chunkId",
    "summary",
    "riskLevel",
    "riskTags",
    "actions",
    "filesOrPaths",
    "approvalsPresent",
    "claimRelevanceHint",
  ],
} as const;

export const SESSION_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    sessionId: { type: "string" },
    overallSummary: { type: "string" },
    overallRiskTags: { type: "array", items: { type: "string" } },
    notableActions: { type: "array", items: { type: "string" } },
    incidentRelevance: { type: "string", enum: ["low", "medium", "high"] },
    totalChunks: { type: "number" },
    totalEvents: { type: "number" },
  },
  required: [
    "sessionId",
    "overallSummary",
    "overallRiskTags",
    "notableActions",
    "incidentRelevance",
    "totalChunks",
    "totalEvents",
  ],
} as const;

export const RETRIEVER_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    selectedChunks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chunkId: { type: "string" },
          justification: { type: "string" },
          relevanceScore: { type: "number", minimum: 0, maximum: 1 },
        },
        required: ["chunkId", "justification", "relevanceScore"],
      },
    },
    retrievalConfidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["selectedChunks", "retrievalConfidence"],
} as const;

export const EVALUATOR_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["approve", "reject", "review"] },
    matchedClauses: { type: "array", items: { type: "string" } },
    excludedClauses: { type: "array", items: { type: "string" } },
    missingEvidence: { type: "array", items: { type: "string" } },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    recommendedPayout: { type: "number" },
    needsHumanReview: { type: "boolean" },
    reason: { type: "string" },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chunkId: { type: "string" },
          excerpt: { type: "string" },
          relevance: { type: "string" },
        },
        required: ["chunkId", "excerpt", "relevance"],
      },
    },
  },
  required: [
    "decision",
    "matchedClauses",
    "excludedClauses",
    "missingEvidence",
    "confidence",
    "recommendedPayout",
    "needsHumanReview",
    "reason",
    "evidence",
  ],
} as const;
