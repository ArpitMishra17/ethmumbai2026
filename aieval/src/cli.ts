#!/usr/bin/env node
/**
 * CLI to evaluate a claim against a normalized session log.
 *
 * Usage:
 *   pnpm run evaluate -- --session <path> --claim "claim text" --amount 5000
 *   pnpm run evaluate -- --session <path>   (interactive — prompts for claim)
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { runClaimEvaluation } from "./index.js";
import { NormalizedSessionSchema } from "./types.js";

function usage(): never {
  console.log(`
Usage:
  pnpm run evaluate -- --session <path> --claim "<text>" --amount <number>

Options:
  --session, -s   Path to normalized session JSON file (required)
  --claim, -c     Claim text describing the incident (required)
  --amount, -a    Requested payout amount in USD (required)
  --verbose, -v   Print full intermediate artifacts
  --help, -h      Show this help

Example:
  pnpm run evaluate -- -s ./session.json -c "Agent deleted my files" -a 5000
`);
  process.exit(1);
}

function parseArgs(args: string[]): {
  session?: string;
  claim?: string;
  amount?: string;
  verbose: boolean;
} {
  const parsed: Record<string, string> = {};
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") usage();
    if (arg === "--verbose" || arg === "-v") {
      verbose = true;
      continue;
    }
    if (
      (arg === "--session" || arg === "-s") &&
      args[i + 1]
    ) {
      parsed.session = args[++i];
    } else if (
      (arg === "--claim" || arg === "-c") &&
      args[i + 1]
    ) {
      parsed.claim = args[++i];
    } else if (
      (arg === "--amount" || arg === "-a") &&
      args[i + 1]
    ) {
      parsed.amount = args[++i];
    }
  }

  return { ...parsed, verbose };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.session || !args.claim || !args.amount) {
    console.error("Error: --session, --claim, and --amount are all required.\n");
    usage();
  }

  const amount = Number(args.amount);
  if (isNaN(amount) || amount <= 0) {
    console.error("Error: --amount must be a positive number.\n");
    process.exit(1);
  }

  // Load and validate session
  const sessionPath = resolve(args.session);
  let rawSession: unknown;
  try {
    rawSession = JSON.parse(readFileSync(sessionPath, "utf-8"));
  } catch (err) {
    console.error(`Error: Could not read session file: ${sessionPath}`);
    process.exit(1);
  }

  const sessionResult = NormalizedSessionSchema.safeParse(rawSession);
  if (!sessionResult.success) {
    console.error("Error: Session file does not match NormalizedSession schema:");
    for (const issue of sessionResult.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  const session = sessionResult.data;

  console.log("AgentCover AI Evaluation");
  console.log("========================");
  console.log(`Session: ${session.sessionId}`);
  console.log(`Tool: ${session.tool}`);
  console.log(`Agent: ${session.agentEns}`);
  console.log(`Messages: ${session.messages.length}`);
  console.log(`Tool calls: ${session.toolCalls.length}`);
  console.log(`Claim: ${args.claim}`);
  console.log(`Amount: $${amount}`);
  console.log(`\nRunning pipeline...\n`);

  const startTime = Date.now();

  try {
    const result = await runClaimEvaluation({
      session,
      claimText: args.claim,
      requestedAmount: amount,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (args.verbose) {
      console.log("--- Chunks ---");
      for (const chunk of result.chunks) {
        console.log(`  ${chunk.chunkId}: ${chunk.events.length} events (idx ${chunk.eventStartIndex}-${chunk.eventEndIndex})`);
      }

      console.log("\n--- Chunk Summaries ---");
      for (const cs of result.chunkSummaries) {
        console.log(`  ${cs.chunkId}: [${cs.riskLevel}] ${cs.summary}`);
      }

      console.log("\n--- Session Summary ---");
      console.log(`  ${result.sessionSummary.overallSummary}`);
      console.log(`  Incident relevance: ${result.sessionSummary.incidentRelevance}`);
      console.log(`  Risk tags: ${result.sessionSummary.overallRiskTags.join(", ") || "(none)"}`);

      console.log("\n--- Retrieval ---");
      for (const rc of result.retrieverOutput.selectedChunks) {
        console.log(`  ${rc.chunkId} (${rc.relevanceScore}): ${rc.justification}`);
      }
      console.log(`  Confidence: ${result.retrieverOutput.retrievalConfidence}`);

      console.log("\n--- Evaluator ---");
      console.log(`  Decision: ${result.evaluatorOutput.decision}`);
      console.log(`  Confidence: ${result.evaluatorOutput.confidence}`);
      console.log(`  Matched: ${result.evaluatorOutput.matchedClauses.join(", ") || "(none)"}`);
      console.log(`  Excluded: ${result.evaluatorOutput.excludedClauses.join(", ") || "(none)"}`);
      console.log(`  Missing evidence: ${result.evaluatorOutput.missingEvidence.join(", ") || "(none)"}`);
      console.log(`  Reason: ${result.evaluatorOutput.reason}`);
      for (const ev of result.evaluatorOutput.evidence) {
        console.log(`  Evidence [${ev.chunkId}]: ${ev.excerpt.slice(0, 100)}`);
      }
    }

    console.log("\n========== FINAL DECISION ==========");
    console.log(`Decision:       ${result.finalDecision.decision.toUpperCase()}`);
    console.log(`Payout:         $${result.finalDecision.recommendedPayout}`);
    console.log(`Human review:   ${result.finalDecision.needsHumanReview}`);
    console.log(`Reason:         ${result.finalDecision.reason}`);
    if (result.finalDecision.routingFlags.length > 0) {
      console.log(`Routing flags:  ${result.finalDecision.routingFlags.join("; ")}`);
    }
    console.log(`Evaluator said: ${result.finalDecision.evaluatorDecision} (confidence: ${result.finalDecision.evaluatorConfidence})`);
    console.log(`\nCompleted in ${elapsed}s`);

    // Also write full result to stdout-friendly JSON
    const outPath = sessionPath.replace(/\.json$/, "-eval-result.json");
    const { writeFileSync } = await import("fs");
    writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(`\nFull result written to: ${outPath}`);
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\nPipeline failed after ${elapsed}s:`);
    console.error(err);
    process.exit(1);
  }
}

main();
