/**
 * End-to-end test runner for the aieval pipeline.
 * Usage: pnpm run eval
 *
 * Runs all 3 fixture sessions through the full pipeline and prints results.
 * Requires GROQ_API_KEY in .env or environment.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { runClaimEvaluation } from "./index.js";
import type { NormalizedSession } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture<T>(name: string): T {
  return JSON.parse(
    readFileSync(resolve(__dirname, "fixtures", name), "utf-8")
  );
}

interface TestCase {
  label: string;
  sessionFile: string;
  claimText: string;
  requestedAmount: number;
  expectedDecision?: string;
}

const testCases: TestCase[] = [
  {
    label: "Harmless session (should reject — no incident)",
    sessionFile: "sample-session.json",
    claimText:
      "The AI coding agent deleted my production database migration files without my approval.",
    requestedAmount: 5000,
    expectedDecision: "reject",
  },
  {
    label: "Harmful session (should approve — unauthorized file deletion)",
    sessionFile: "sample-harmful-session.json",
    claimText:
      "The AI coding agent deleted my production database migration files without my approval, causing a failed deployment and 4 hours of downtime.",
    requestedAmount: 8000,
    expectedDecision: "approve",
  },
  {
    label: "Ambiguous session (should review — mixed signals)",
    sessionFile: "sample-ambiguous-session.json",
    claimText:
      "The AI agent committed a hardcoded JWT secret to the repository and broke the CI pipeline by removing SESSION_SECRET from the environment.",
    requestedAmount: 6000,
    expectedDecision: "review",
  },
];

async function runTest(tc: TestCase, index: number) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`TEST ${index + 1}: ${tc.label}`);
  console.log(`${"=".repeat(70)}`);

  const session = loadFixture<NormalizedSession>(tc.sessionFile);

  const startTime = Date.now();
  try {
    const result = await runClaimEvaluation({
      session,
      claimText: tc.claimText,
      requestedAmount: tc.requestedAmount,
    });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\nCompleted in ${elapsed}s`);
    console.log(`\nChunks: ${result.chunks.length}`);
    console.log(
      `Chunk summaries: ${result.chunkSummaries.length}`
    );
    console.log(
      `Session incident relevance: ${result.sessionSummary.incidentRelevance}`
    );
    console.log(
      `Retrieved chunks: ${result.retrieverOutput.selectedChunks.length}`
    );
    console.log(
      `Retrieval confidence: ${result.retrieverOutput.retrievalConfidence}`
    );

    console.log(`\n--- Evaluator Output ---`);
    console.log(`Decision: ${result.evaluatorOutput.decision}`);
    console.log(`Confidence: ${result.evaluatorOutput.confidence}`);
    console.log(
      `Matched clauses: ${result.evaluatorOutput.matchedClauses.join(", ") || "(none)"}`
    );
    console.log(
      `Missing evidence: ${result.evaluatorOutput.missingEvidence.join(", ") || "(none)"}`
    );
    console.log(`Recommended payout: $${result.evaluatorOutput.recommendedPayout}`);
    console.log(`Reason: ${result.evaluatorOutput.reason}`);

    console.log(`\n--- Final Decision (after routing) ---`);
    console.log(`Decision: ${result.finalDecision.decision}`);
    console.log(`Payout: $${result.finalDecision.recommendedPayout}`);
    console.log(`Human review: ${result.finalDecision.needsHumanReview}`);
    console.log(
      `Routing flags: ${result.finalDecision.routingFlags.join("; ") || "(none)"}`
    );

    if (tc.expectedDecision) {
      const match = result.finalDecision.decision === tc.expectedDecision;
      console.log(
        `\n${match ? "PASS" : "MISMATCH"}: expected=${tc.expectedDecision}, got=${result.finalDecision.decision}`
      );
    }

    return { label: tc.label, decision: result.finalDecision.decision, pass: true };
  } catch (err) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\nFAILED after ${elapsed}s:`, err);
    return { label: tc.label, decision: "error", pass: false };
  }
}

async function main() {
  console.log("AgentCover AI Evaluation Layer — End-to-End Test");
  console.log(`Model: ${process.env.LLM_MODEL ?? "llama-3.3-70b-versatile"}`);
  console.log(`Running ${testCases.length} test cases...\n`);

  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    results.push(await runTest(testCases[i], i));
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(70)}`);
  for (const r of results) {
    console.log(`  ${r.pass ? "OK" : "FAIL"}  ${r.decision.padEnd(8)} ${r.label}`);
  }

  const allPassed = results.every((r) => r.pass);
  console.log(`\n${allPassed ? "All tests completed successfully." : "Some tests failed."}`);
  process.exit(allPassed ? 0 : 1);
}

main();
