/**
 * Simplify step — converts a NormalizedSession into a SimplifiedSession.
 *
 * Trims:
 * - Empty messages
 * - Tool call outputs longer than 4000 chars (truncated with marker)
 * - Duplicate shell commands
 *
 * Adds:
 * - summary: first user message (or "No summary available")
 * - tokenEstimate: rough estimate from total character count
 * - toolCallCount
 */
import type { NormalizedSession, SimplifiedSession } from './types';

const MAX_OUTPUT_CHARS = 4000;
const CHARS_PER_TOKEN = 4;

export function simplify(session: NormalizedSession): SimplifiedSession {
  const messages = session.messages
    .filter((m) => m.content.trim().length > 0);

  const toolCalls = session.toolCalls.map((tc) => ({
    ...tc,
    output:
      tc.output.length > MAX_OUTPUT_CHARS
        ? tc.output.slice(0, MAX_OUTPUT_CHARS) + '\n... [truncated]'
        : tc.output,
  }));

  const shellCommands = [...new Set(session.shellCommands)];

  const summary =
    messages.find((m) => m.role === 'user')?.content.slice(0, 300) ??
    'No summary available';

  const totalChars =
    messages.reduce((n, m) => n + m.content.length, 0) +
    toolCalls.reduce((n, tc) => n + tc.output.length, 0);

  return {
    ...session,
    messages,
    toolCalls,
    shellCommands,
    summary,
    tokenEstimate: Math.ceil(totalChars / CHARS_PER_TOKEN),
    toolCallCount: toolCalls.length,
    sanitized: true,
  };
}
