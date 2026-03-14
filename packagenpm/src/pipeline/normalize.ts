/**
 * The normalize step converts adapter output into a clean NormalizedSession.
 * For Claude Code this is trivial since the adapter already produces the right shape.
 * For future adapters (Codex, Gemini) this is where format differences are resolved.
 */
import type { NormalizedSession } from './types';

export function normalize(session: NormalizedSession): NormalizedSession {
  return {
    ...session,
    // Ensure dates are valid ISO strings
    startedAt: toISO(session.startedAt),
    endedAt:   toISO(session.endedAt),
    // Trim whitespace from string arrays
    filesChanged:  session.filesChanged.map((f) => f.trim()).filter(Boolean),
    shellCommands: session.shellCommands.map((c) => c.trim()).filter(Boolean),
  };
}

function toISO(ts: string): string {
  if (!ts) return new Date().toISOString();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}
