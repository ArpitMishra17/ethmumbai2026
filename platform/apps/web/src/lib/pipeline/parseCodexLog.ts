import type { NormalizedSession } from './types';

export interface CodexParseOptions {
  text: string;
  fileName: string;
  agentId: string;
  agentEns: string;
  walletId: string;
  userId: string;
  orgId: string;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function parseCodexLogText(opts: CodexParseOptions): Promise<NormalizedSession> {
  const events: Record<string, unknown>[] = [];
  for (const line of opts.text.split('\n').filter((l) => l.trim())) {
    try { events.push(JSON.parse(line)); } catch { /* skip malformed lines */ }
  }

  if (events.length === 0) {
    throw new Error(`No parseable events in ${opts.fileName}`);
  }

  const first = events[0]!;
  const nativeId = String(first['sessionId'] ?? first['id'] ?? '');
  const sessionId = nativeId || (await sha256(opts.fileName)).slice(0, 32);

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
    workspacePath: opts.fileName, // in-browser we don't have absolute paths
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
