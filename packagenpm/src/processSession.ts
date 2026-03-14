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
  fileverseUrl: string;
  platformUrl: string;
  token: string;
}

export interface ProcessSessionResult {
  sessionId: string;
  contentHash: string;
  uploaded: boolean;
  fileverseRowId?: string;
  txHash?: string;
  error?: string;
}

interface FileverseUploadResult {
  ok: boolean;
  fileverseRowId?: string;
  error?: string;
}

interface AnchorResult {
  ok: boolean;
  txHash?: string;
  error?: string;
}

async function uploadSession(
  session: HashedSession,
  fileverseUrl: string,
): Promise<FileverseUploadResult> {
  const url = `${fileverseUrl.replace(/\/$/, '')}/sessions/upload`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: session.sessionId,
        agentId: session.agentId,
        ensId: session.agentEns,
        content: JSON.stringify(session),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }

    const payload = await res.json().catch(() => ({} as Record<string, unknown>));
    const data = payload && typeof payload === 'object' ? (payload as Record<string, unknown>).data : undefined;
    const fileverseRowId =
      data && typeof data === 'object' && typeof (data as Record<string, unknown>).ddocId === 'string'
        ? ((data as Record<string, unknown>).ddocId as string)
        : undefined;

    return { ok: true, fileverseRowId };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function toBytes32Hex(hash: string): `0x${string}` {
  const normalized = hash.startsWith('0x') ? hash : `0x${hash}`;
  return normalized as `0x${string}`;
}

async function anchorSession(
  session: HashedSession,
  fileverseRowId: string | undefined,
  platformUrl: string,
  token: string,
): Promise<AnchorResult> {
  const url = `${platformUrl.replace(/\/$/, '')}/api/anchor`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionHash: toBytes32Hex(session.contentHash),
        sessionId: session.sessionId,
        agentEns: session.agentEns,
        userId: session.walletId,
        fileverseRowId: fileverseRowId ?? null,
      }),
    });

    const payload = await res.json().catch(() => ({} as Record<string, unknown>));
    if (!res.ok) {
      const error =
        payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).error === 'string'
          ? ((payload as Record<string, unknown>).error as string)
          : `HTTP ${res.status}`;
      return { ok: false, error };
    }

    const txHash =
      payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).txHash === 'string'
        ? ((payload as Record<string, unknown>).txHash as string)
        : undefined;

    return { ok: true, txHash };
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

  // 3. Upload to Fileverse
  const result = await uploadSession(hashed, opts.fileverseUrl);
  if (!result.ok) {
    return {
      sessionId:   hashed.sessionId,
      contentHash: hashed.contentHash,
      uploaded:    false,
      error:       result.error,
    };
  }

  const anchorResult = await anchorSession(
    hashed,
    result.fileverseRowId,
    opts.platformUrl,
    opts.token,
  );

  if (!anchorResult.ok) {
    return {
      sessionId: hashed.sessionId,
      contentHash: hashed.contentHash,
      uploaded: false,
      fileverseRowId: result.fileverseRowId,
      error: `Fileverse upload succeeded, but Base anchoring failed: ${anchorResult.error}`,
    };
  }

  return {
    sessionId:   hashed.sessionId,
    contentHash: hashed.contentHash,
    uploaded:    true,
    fileverseRowId: result.fileverseRowId,
    txHash: anchorResult.txHash,
  };
}
