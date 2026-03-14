import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  NormalizedSessionSchema,
  ClaimInputSchema,
  ClauseSetSchema,
  FinalDecisionSchema,
  EvaluatorOutputSchema,
} from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJson(name: string) {
  return JSON.parse(
    readFileSync(resolve(__dirname, "..", "fixtures", name), "utf-8")
  );
}

function loadClauses() {
  return JSON.parse(
    readFileSync(resolve(__dirname, "..", "clauses", "clauses.json"), "utf-8")
  );
}

describe("fixture validation", () => {
  it("sample-session.json validates as NormalizedSession", () => {
    const data = loadJson("sample-session.json");
    const result = NormalizedSessionSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("sample-harmful-session.json validates as NormalizedSession", () => {
    const data = loadJson("sample-harmful-session.json");
    const result = NormalizedSessionSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("sample-ambiguous-session.json validates as NormalizedSession", () => {
    const data = loadJson("sample-ambiguous-session.json");
    const result = NormalizedSessionSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("sample-claim.json validates as ClaimInput", () => {
    const data = loadJson("sample-claim.json");
    const result = ClaimInputSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("clauses.json validates as ClauseSet", () => {
    const data = loadClauses();
    const result = ClauseSetSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("clauses.json has 5 clauses", () => {
    const data = ClauseSetSchema.parse(loadClauses());
    expect(data.clauses).toHaveLength(5);
  });

  it("all clause IDs are unique", () => {
    const data = ClauseSetSchema.parse(loadClauses());
    const ids = data.clauses.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sample-output.json has valid decision and evaluator shapes", () => {
    const data = loadJson("sample-output.json");
    expect(FinalDecisionSchema.safeParse(data.finalDecision).success).toBe(
      true
    );
    expect(
      EvaluatorOutputSchema.safeParse(data.evaluatorOutput).success
    ).toBe(true);
  });

  it("all sessions have non-empty sessionId", () => {
    for (const name of [
      "sample-session.json",
      "sample-harmful-session.json",
      "sample-ambiguous-session.json",
    ]) {
      const data = NormalizedSessionSchema.parse(loadJson(name));
      expect(data.sessionId).toBeTruthy();
    }
  });
});
