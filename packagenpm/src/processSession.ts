import { parseClaudeCodeLog } from './adapters/parseClaudeCodeLog';
import { parseCodexLog } from './adapters/parseCodexLog';
import { normalize } from './pipeline/normalize';
import { sanitize } from './pipeline/sanitize';
import { simplify } from './pipeline/simplify';
import { addHash } from './pipeline/addHash';
import type { HashedSession } from './pipeline/types';

export interface ProcessSessionOptions {
  logFilePath: string;
  toolType: 'claude_code' | 'codex';
  agentId: string;
  agentEns: string;
  walletId: string;
  userId: string;
  orgId: string;
  platformUrl: string;
  apiKey: string;
}

export interface ProcessSessionResult {
  sessionId: string;
  contentHash: string;
  uploaded: boolean;
  error?: string;
}

async function uploadSession(
  session: HashedSession,
  platformUrl: string,
  apiKey: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = `${platformUrl.replace(/\/$/, '')}/api/sessions/ingest`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ session }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function processSession(
  opts: ProcessSessionOptions,
): Promise<ProcessSessionResult> {
  const parseOpts = {
    logFilePath: opts.logFilePath,
    agentId:     opts.agentId,
    agentEns:    opts.agentEns,
    walletId:    opts.walletId,
    userId:      opts.userId,
    orgId:       opts.orgId,
  };

  // 1. Parse JSONL
  const raw =
    opts.toolType === 'claude_code'
      ? parseClaudeCodeLog(parseOpts)
      : parseCodexLog(parseOpts);

  // 2. Pipeline: normalize → sanitize → simplify → hash
  const hashed = addHash(simplify(sanitize(normalize(raw))));

  // 3. Upload
  const result = await uploadSession(hashed, opts.platformUrl, opts.apiKey);
  if (!result.ok) {
    return {
      sessionId:   hashed.sessionId,
      contentHash: hashed.contentHash,
      uploaded:    false,
      error:       result.error,
    };
  }

  return {
    sessionId:   hashed.sessionId,
    contentHash: hashed.contentHash,
    uploaded:    true,
  };
}
