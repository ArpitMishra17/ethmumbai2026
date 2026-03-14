import { describe, it, expect } from "vitest";
import { routeDecision } from "../pipeline/routeDecision.js";
import type { ClauseSet, EvaluatorOutput } from "../types.js";

const mockClauses: ClauseSet = {
  version: "0.1.0",
  clauses: [
    {
      id: "CLW-001",
      title: "Unauthorized File Deletion",
      description: "Test clause",
      coveredIf: ["File deleted without approval"],
      excludedIf: ["User approved deletion"],
      requiredEvidence: ["Tool call showing deletion"],
      maxPayout: 10000,
      reviewThreshold: 5000,
    },
    {
      id: "CLW-002",
      title: "Malicious Command",
      description: "Test clause",
      coveredIf: ["Harmful command executed"],
      excludedIf: ["User requested command"],
      requiredEvidence: ["Shell command log"],
      maxPayout: 25000,
      reviewThreshold: 10000,
    },
  ],
};

function makeEvaluatorOutput(
  overrides: Partial<EvaluatorOutput> = {}
): EvaluatorOutput {
  return {
    decision: "approve",
    matchedClauses: ["CLW-001"],
    excludedClauses: [],
    missingEvidence: [],
    confidence: 0.9,
    recommendedPayout: 5000,
    needsHumanReview: false,
    reason: "Clear evidence of unauthorized file deletion.",
    evidence: [
      {
        chunkId: "chunk-1",
        excerpt: "delete_file called",
        relevance: "Direct evidence",
      },
    ],
    ...overrides,
  };
}

describe("routeDecision", () => {
  it("passes through a clean approval", () => {
    const result = routeDecision(makeEvaluatorOutput(), 5000, mockClauses);

    expect(result.decision).toBe("approve");
    expect(result.recommendedPayout).toBe(5000);
    expect(result.needsHumanReview).toBe(false);
    expect(result.routingFlags).toHaveLength(0);
  });

  it("routes to review when confidence is below threshold", () => {
    const result = routeDecision(
      makeEvaluatorOutput({ confidence: 0.5 }),
      3000,
      mockClauses
    );

    expect(result.decision).toBe("review");
    expect(result.needsHumanReview).toBe(true);
    expect(result.routingFlags).toEqual(
      expect.arrayContaining([expect.stringContaining("confidence_below")])
    );
  });

  it("routes to review when amount exceeds review threshold", () => {
    const result = routeDecision(makeEvaluatorOutput(), 6000, mockClauses);

    expect(result.decision).toBe("review");
    expect(result.needsHumanReview).toBe(true);
    expect(result.routingFlags).toEqual(
      expect.arrayContaining([expect.stringContaining("amount_above")])
    );
  });

  it("rejects when no clauses matched", () => {
    const result = routeDecision(
      makeEvaluatorOutput({ matchedClauses: [] }),
      3000,
      mockClauses
    );

    expect(result.decision).toBe("reject");
    expect(result.recommendedPayout).toBe(0);
    expect(result.routingFlags).toEqual(
      expect.arrayContaining([expect.stringContaining("no_matched_clauses")])
    );
  });

  it("routes to review when evidence is missing", () => {
    const result = routeDecision(
      makeEvaluatorOutput({
        missingEvidence: ["User approval record"],
      }),
      3000,
      mockClauses
    );

    expect(result.decision).toBe("review");
    expect(result.needsHumanReview).toBe(true);
    expect(result.routingFlags).toEqual(
      expect.arrayContaining([expect.stringContaining("missing_evidence")])
    );
  });

  it("clamps payout to clause max", () => {
    const result = routeDecision(
      makeEvaluatorOutput({ recommendedPayout: 15000 }),
      3000,
      mockClauses
    );

    expect(result.recommendedPayout).toBe(10000);
    expect(result.routingFlags).toEqual(
      expect.arrayContaining([expect.stringContaining("clamped_to_clause_max")])
    );
  });

  it("sets payout to 0 on rejection", () => {
    const result = routeDecision(
      makeEvaluatorOutput({ decision: "reject", matchedClauses: ["CLW-001"] }),
      3000,
      mockClauses
    );

    expect(result.decision).toBe("reject");
    expect(result.recommendedPayout).toBe(0);
  });

  it("preserves evaluator decision in output", () => {
    const result = routeDecision(
      makeEvaluatorOutput({ confidence: 0.4 }),
      3000,
      mockClauses
    );

    expect(result.evaluatorDecision).toBe("approve");
    expect(result.decision).toBe("review");
  });
});
