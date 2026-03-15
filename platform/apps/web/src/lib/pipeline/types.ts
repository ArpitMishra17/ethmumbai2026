export type ToolType = 'claude_code' | 'codex' | 'gemini_cli';

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionToolCall {
  id: string;
  name: string;
  input: unknown;
  output: string;
}

export interface SessionApproval {
  prompt: string;
  decision: 'approved' | 'denied';
}

/**
 * Raw parsed session before any simplification or sanitization.
 * Produced by tool-specific adapters.
 */
export interface NormalizedSession {
  sessionId: string;        // deterministic: sha256(logFilePath + startedAt)
  tool: ToolType;
  agentId: string;          // registered agent identifier
  agentEns: string;         // ENS name of the agent (e.g. myagent.eth)
  walletId: string;         // user's wallet address (0x...)
  userId: string;           // platform user identifier
  orgId: string;            // org identifier (may equal walletId for solo users)
  workspacePath: string;
  startedAt: string;        // ISO 8601
  endedAt: string;          // ISO 8601
  messages: SessionMessage[];
  toolCalls: SessionToolCall[];
  filesChanged: string[];
  shellCommands: string[];
  approvals: SessionApproval[];
  exitReason: string;
}

/**
 * Sanitized and simplified session — secrets stripped, verbose noise removed.
 * This is the version stored in Fileverse dDoc as Markdown.
 */
export interface SimplifiedSession extends NormalizedSession {
  summary: string;
  tokenEstimate: number;
  toolCallCount: number;
  sanitized: true;
}

/**
 * SimplifiedSession with a deterministic content hash.
 * The hash is anchored on Base Sepolia via EAS.
 */
export interface HashedSession extends SimplifiedSession {
  contentHash: string;      // sha256 of canonical JSON of SimplifiedSession
  hashVersion: '1';
}