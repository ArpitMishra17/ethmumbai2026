import { config } from "../config.js";
import type {
  NormalizedSession,
  SessionChunk,
  SessionEvent,
} from "../types.js";

/**
 * Build a unified event timeline from a normalized session.
 * Deterministic: same input always produces same output.
 */
function buildEventTimeline(session: NormalizedSession): SessionEvent[] {
  const events: SessionEvent[] = [];
  let index = 0;

  // Interleave messages, tool calls, and approvals in a stable order.
  // Messages come first (they are the primary timeline), then tool calls,
  // then approvals — each group is appended in original order.

  for (const msg of session.messages) {
    events.push({
      index: index++,
      type: "message",
      role: msg.role,
      content: `[${msg.role}] ${msg.content}`,
      raw: msg,
    });
  }

  for (const tc of session.toolCalls) {
    events.push({
      index: index++,
      type: "tool_call",
      role: "assistant",
      content: `[tool_call:${tc.name}] input=${JSON.stringify(tc.input).slice(0, 500)} output=${tc.output.slice(0, 500)}`,
      raw: tc,
    });
  }

  for (const ap of session.approvals) {
    events.push({
      index: index++,
      type: "approval",
      role: "user",
      content: `[approval:${ap.decision}] ${ap.prompt}`,
      raw: ap,
    });
  }

  // Add system event for exit reason
  if (session.exitReason) {
    events.push({
      index: index++,
      type: "system",
      content: `[exit] ${session.exitReason}`,
      raw: { exitReason: session.exitReason },
    });
  }

  return events;
}

/**
 * Chunk a session into deterministic segments based on event boundaries.
 *
 * Strategy: walk through events and cut a new chunk when we hit the
 * max-events-per-chunk limit OR encounter a natural boundary (system event,
 * approval after a run of tool calls).  Never exceed maxChunksPerSession.
 */
export function chunkSession(session: NormalizedSession): SessionChunk[] {
  const { minEventsPerChunk, maxEventsPerChunk, maxChunksPerSession } =
    config.chunking;

  const events = buildEventTimeline(session);

  if (events.length === 0) {
    return [
      {
        chunkId: `${session.sessionId}-chunk-0`,
        chunkIndex: 0,
        eventStartIndex: 0,
        eventEndIndex: 0,
        events: [],
        rawText: "",
      },
    ];
  }

  const chunks: SessionChunk[] = [];
  let start = 0;

  while (start < events.length && chunks.length < maxChunksPerSession) {
    let end = Math.min(start + maxEventsPerChunk, events.length);

    // Try to find a natural boundary if we're past min chunk size
    if (end < events.length && end - start >= minEventsPerChunk) {
      // Look backwards from end for a natural break point
      for (let i = end; i > start + minEventsPerChunk; i--) {
        const ev = events[i];
        if (ev.type === "system" || ev.type === "approval") {
          end = i + 1; // include the boundary event
          break;
        }
        // Break between a tool_call and a message (user turn boundary)
        if (
          ev.type === "message" &&
          ev.role === "user" &&
          i > start + 1 &&
          events[i - 1].type !== "message"
        ) {
          end = i;
          break;
        }
      }
    }

    const chunkEvents = events.slice(start, end);
    const rawText = chunkEvents.map((e) => e.content).join("\n");

    chunks.push({
      chunkId: `${session.sessionId}-chunk-${chunks.length}`,
      chunkIndex: chunks.length,
      eventStartIndex: chunkEvents[0].index,
      eventEndIndex: chunkEvents[chunkEvents.length - 1].index,
      events: chunkEvents,
      rawText,
    });

    start = end;
  }

  // If we hit the chunk cap but have remaining events, fold them into the last chunk
  if (start < events.length && chunks.length > 0) {
    const last = chunks[chunks.length - 1];
    const remaining = events.slice(start);
    last.events.push(...remaining);
    last.eventEndIndex = remaining[remaining.length - 1].index;
    last.rawText += "\n" + remaining.map((e) => e.content).join("\n");
  }

  return chunks;
}
