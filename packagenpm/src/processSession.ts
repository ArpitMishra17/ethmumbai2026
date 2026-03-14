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
  fileverseUrl: string,
  apiKey: string,
  agentId: string,
  ensId: string
): Promise<{ ok: boolean; error?: string }> {
  // Use the Fileverse endpoint
  const url = `${fileverseUrl.replace(/\/$/, '')}/sessions/upload`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'x-api-key': apiKey, // Keeping this in headers in case Fileverse adds auth later
      },
      body: JSON.stringify({
        sessionId: session.sessionId,
        agentId: agentId,
        ensId: ensId,
        // The Fileverse backend expects a 'content' string.
        // We stringify the hashed session object into a formatted JSON string.
        content: JSON.stringify(session, null, 2)
      }),
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

  // 3. Upload to Fileverse (defaulting to localhost:3001 if not overridden)
  // For the hackathon, we assume Fileverse is running natively on port 3001.
  const fileverseUrl = process.env.FILEVERSE_URL || 'http://localhost:3001';

  const result = await uploadSession(
    hashed, 
    fileverseUrl, 
    opts.apiKey, 
    opts.agentId, 
    opts.agentEns
  );
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
