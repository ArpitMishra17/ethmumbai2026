import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { chunkSession } from "../pipeline/chunkSession.js";
import { NormalizedSessionSchema } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string) {
  const raw = readFileSync(
    resolve(__dirname, "..", "fixtures", name),
    "utf-8"
  );
  return NormalizedSessionSchema.parse(JSON.parse(raw));
}

describe("chunkSession", () => {
  it("produces deterministic output for the same input", () => {
    const session = loadFixture("sample-session.json");
    const chunks1 = chunkSession(session);
    const chunks2 = chunkSession(session);

    expect(chunks1.length).toBe(chunks2.length);
    for (let i = 0; i < chunks1.length; i++) {
      expect(chunks1[i].chunkId).toBe(chunks2[i].chunkId);
      expect(chunks1[i].rawText).toBe(chunks2[i].rawText);
      expect(chunks1[i].events.length).toBe(chunks2[i].events.length);
    }
  });

  it("chunks a harmless session into at least 1 chunk", () => {
    const session = loadFixture("sample-session.json");
    const chunks = chunkSession(session);

    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].chunkId).toContain(session.sessionId);
  });

  it("includes all events across chunks", () => {
    const session = loadFixture("sample-harmful-session.json");
    const chunks = chunkSession(session);

    const totalEvents = chunks.reduce((sum, c) => sum + c.events.length, 0);
    const expectedEvents =
      session.messages.length +
      session.toolCalls.length +
      session.approvals.length +
      (session.exitReason ? 1 : 0);

    expect(totalEvents).toBe(expectedEvents);
  });

  it("assigns sequential chunk indices", () => {
    const session = loadFixture("sample-ambiguous-session.json");
    const chunks = chunkSession(session);

    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].chunkIndex).toBe(i);
    }
  });

  it("each chunk has non-empty rawText", () => {
    const session = loadFixture("sample-harmful-session.json");
    const chunks = chunkSession(session);

    for (const chunk of chunks) {
      if (chunk.events.length > 0) {
        expect(chunk.rawText.length).toBeGreaterThan(0);
      }
    }
  });

  it("handles a session with minimal events", () => {
    const minimal = NormalizedSessionSchema.parse({
      sessionId: "minimal-001",
      tool: "claude_code",
      agentId: "a1",
      agentEns: "a.eth",
      walletId: "0x0",
      userId: "u1",
      orgId: "o1",
      workspacePath: "/tmp",
      startedAt: "2025-01-01T00:00:00Z",
      endedAt: "2025-01-01T00:01:00Z",
      messages: [{ role: "user", content: "hello" }],
      toolCalls: [],
      filesChanged: [],
      shellCommands: [],
      approvals: [],
      exitReason: "user_ended",
    });

    const chunks = chunkSession(minimal);
    expect(chunks.length).toBe(1);
    expect(chunks[0].events.length).toBe(2); // 1 message + 1 exit event
  });
});
