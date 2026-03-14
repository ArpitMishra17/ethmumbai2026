import { config } from "../config.js";
import type { ClauseSet, EvaluatorOutput, FinalDecision } from "../types.js";

/**
 * Deterministic business-rule routing. No LLM calls.
 *
 * Enforces hard constraints the model cannot override:
 * - Low confidence → review
 * - High amount → review
 * - No matched clauses → reject
 * - Missing required evidence → review or reject
 * - Payout exceeds clause max → clamp or review
 */
export function routeDecision(
  evaluatorOutput: EvaluatorOutput,
  requestedAmount: number,
  clauses: ClauseSet
): FinalDecision {
  const flags: string[] = [];
  let decision = evaluatorOutput.decision;
  let payout = evaluatorOutput.recommendedPayout;
  let needsReview = evaluatorOutput.needsHumanReview;

  const { confidenceThreshold, reviewAmountThreshold, maxPayoutHardCap } =
    config.routing;

  // Rule 1: Low confidence → review
  if (evaluatorOutput.confidence < confidenceThreshold) {
    flags.push(
      `confidence_below_threshold (${evaluatorOutput.confidence} < ${confidenceThreshold})`
    );
    decision = "review";
    needsReview = true;
  }

  // Rule 2: High requested amount → review
  if (requestedAmount > reviewAmountThreshold) {
    flags.push(
      `amount_above_review_threshold ($${requestedAmount} > $${reviewAmountThreshold})`
    );
    if (decision === "approve") {
      decision = "review";
      needsReview = true;
    }
  }

  // Rule 3: No matched clauses → reject
  if (evaluatorOutput.matchedClauses.length === 0 && decision !== "reject") {
    flags.push("no_matched_clauses");
    decision = "reject";
    payout = 0;
  }

  // Rule 4: Missing required evidence → review (unless already rejected)
  if (
    evaluatorOutput.missingEvidence.length > 0 &&
    decision === "approve"
  ) {
    flags.push(
      `missing_evidence: ${evaluatorOutput.missingEvidence.join(", ")}`
    );
    decision = "review";
    needsReview = true;
  }

  // Rule 5: Payout exceeds per-clause max → clamp
  if (evaluatorOutput.matchedClauses.length > 0) {
    const maxAllowed = evaluatorOutput.matchedClauses.reduce((max, clauseId) => {
      const clause = clauses.clauses.find((c) => c.id === clauseId);
      return clause ? Math.max(max, clause.maxPayout) : max;
    }, 0);

    if (payout > maxAllowed) {
      flags.push(
        `payout_clamped_to_clause_max ($${payout} → $${maxAllowed})`
      );
      payout = maxAllowed;
    }
  }

  // Rule 6: Hard cap
  if (payout > maxPayoutHardCap) {
    flags.push(`payout_clamped_to_hard_cap ($${payout} → $${maxPayoutHardCap})`);
    payout = maxPayoutHardCap;
  }

  // Rule 7: Rejected → zero payout
  if (decision === "reject") {
    payout = 0;
  }

  return {
    decision,
    recommendedPayout: payout,
    needsHumanReview: needsReview,
    reason: evaluatorOutput.reason,
    routingFlags: flags,
    evaluatorDecision: evaluatorOutput.decision,
    evaluatorConfidence: evaluatorOutput.confidence,
  };
}
