import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import type { NormalizedSession } from '../pipeline/types';

export interface CodexParseOptions {
  logFilePath: string;
  agentId: string;
  agentEns: string;
  walletId: string;
  userId: string;
  orgId: string;
}

export function parseCodexLog(opts: CodexParseOptions): NormalizedSession {
  const raw = readFileSync(opts.logFilePath, 'utf-8');
  const events: Record<string, unknown>[] = [];
  for (const line of raw.split('\n').filter((l) => l.trim())) {
    try { events.push(JSON.parse(line)); } catch { /* skip malformed lines */ }
  }

  if (events.length === 0) {
    throw new Error(`No parseable events in ${opts.logFilePath}`);
  }

  const first = events[0]!;
  const nativeId = String(first['sessionId'] ?? first['id'] ?? '');
  const sessionId = nativeId
    || createHash('sha256').update(opts.logFilePath).digest('hex').slice(0, 32);

  const startedAt = String(first['timestamp'] ?? new Date().toISOString());
  const endedAt = String(events.at(-1)?.['timestamp'] ?? new Date().toISOString());

  const messages = events
    .filter((e) => e['role'] === 'user' || e['role'] === 'assistant')
    .map((e) => ({
      role: e['role'] as 'user' | 'assistant',
      content: String(e['content'] ?? ''),
    }))
    .filter((m) => m.content.trim().length > 0);

  return {
    sessionId,
    tool: 'codex',
    agentId:  opts.agentId,
    agentEns: opts.agentEns,
    walletId: opts.walletId,
    userId:   opts.userId,
    orgId:    opts.orgId,
    workspacePath: opts.logFilePath,
    startedAt,
    endedAt,
    messages,
    toolCalls: [],
    filesChanged: [],
    shellCommands: [],
    approvals: [],
    exitReason: 'unknown',
  };
}
