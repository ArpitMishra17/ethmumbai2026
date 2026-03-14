import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import type {
  NormalizedSession,
  SessionMessage,
  SessionToolCall,
  SessionApproval,
} from '../pipeline/types';

// ---------------------------------------------------------------------------
// Actual Claude Code JSONL line shapes (from real log files)
// ---------------------------------------------------------------------------

interface BaseEvent {
  type: string;
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  cwd: string;
  timestamp?: string;
  isSidechain?: boolean;
  userType?: string;
  version?: string;
  gitBranch?: string;
  slug?: string;
}

// User turn: message.content is a string (human prompt)
// OR an array of tool_result objects (tool outputs returned to model)
interface UserEvent extends BaseEvent {
  type: 'user';
  message: {
    role: 'user';
    content:
      | string
      | Array<{
          type: 'tool_result';
          tool_use_id: string;
          content: string | Array<{ type: string; text?: string }>;
        }>;
  };
}

interface AssistantContentText    { type: 'text';     text: string }
interface AssistantContentThinking { type: 'thinking'; thinking: string; signature?: string }
interface AssistantContentToolUse {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type AssistantContentItem = AssistantContentText | AssistantContentThinking | AssistantContentToolUse;

interface AssistantEvent extends BaseEvent {
  type: 'assistant';
  message: {
    id: string;
    role: 'assistant';
    model?: string;
    content: AssistantContentItem[];
    stop_reason: string | null;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
}

// system subtype:"turn_duration" marks end of a turn
interface SystemEvent extends BaseEvent {
  type: 'system';
  subtype: string;
  durationMs?: number;
}

interface FileHistorySnapshotEvent extends BaseEvent {
  type: 'file-history-snapshot';
}

interface ProgressEvent extends BaseEvent {
  type: 'progress';
}

type ClaudeCodeEvent =
  | UserEvent
  | AssistantEvent
  | SystemEvent
  | FileHistorySnapshotEvent
  | ProgressEvent;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractText(content: string | Array<{ type: string; text?: string }> | unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === 'object' && c !== null && 'text' in c) return String(c.text ?? '');
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export interface ParseOptions {
  logFilePath: string;
  agentId: string;
  agentEns: string;
  walletId: string;
  userId: string;
  orgId: string;
}

export function parseClaudeCodeLog(opts: ParseOptions): NormalizedSession {
  const raw = readFileSync(opts.logFilePath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);

  const events: ClaudeCodeEvent[] = [];
  for (const line of lines) {
    try {
      events.push(JSON.parse(line) as ClaudeCodeEvent);
    } catch {
      // skip malformed/partial writes
    }
  }

  if (events.length === 0) {
    throw new Error(`No parseable events in ${opts.logFilePath}`);
  }

  // Derive sessionId and workspace from first event
  const firstEvent = events[0]!;
  const nativeSessionId = firstEvent.sessionId ?? '';
  const cwd = firstEvent.cwd ?? '';

  const messages: SessionMessage[] = [];
  // Map tool_use_id → tool call so we can attach tool_result content later
  const toolCallMap = new Map<string, SessionToolCall>();
  const approvals: SessionApproval[] = [];
  const filesChanged = new Set<string>();
  const shellCommands: string[] = [];

  let startedAt = '';
  let endedAt = '';
  let exitReason = 'unknown';

  for (const event of events) {
    const ts = event.timestamp ?? '';
    if (!startedAt && ts) startedAt = ts;
    if (ts) endedAt = ts;

    // ── USER turn ──────────────────────────────────────────────────────────
    if (event.type === 'user') {
      const e = event as UserEvent;
      const content = e.message.content;

      if (typeof content === 'string') {
        // Actual human prompt
        if (content.trim()) {
          messages.push({ role: 'user', content: content.trim() });
        }
      } else if (Array.isArray(content)) {
        // Tool results — attach output back to matching tool calls
        for (const item of content) {
          if (item.type === 'tool_result') {
            const call = toolCallMap.get(item.tool_use_id);
            if (call) {
              call.output = extractText(item.content);
            }
          }
        }
      }
    }

    // ── ASSISTANT turn ─────────────────────────────────────────────────────
    if (event.type === 'assistant') {
      const e = event as AssistantEvent;

      const textParts: string[] = [];
      for (const item of e.message.content) {
        if (item.type === 'text' && item.text.trim()) {
          textParts.push(item.text.trim());
        }

        if (item.type === 'tool_use') {
          const call: SessionToolCall = {
            id:     item.id,
            name:   item.name,
            input:  item.input,
            output: '', // filled in when the matching tool_result arrives
          };
          toolCallMap.set(item.id, call);

          // Track file changes
          if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(item.name)) {
            const filePath =
              String(item.input['file_path'] ?? item.input['notebook_path'] ?? '');
            if (filePath) filesChanged.add(filePath);
          }

          // Track shell commands
          if (item.name === 'Bash') {
            const cmd = String(item.input['command'] ?? '');
            if (cmd) shellCommands.push(cmd);
          }
        }
      }

      if (textParts.length > 0) {
        messages.push({ role: 'assistant', content: textParts.join('\n\n') });
      }
    }

    // ── SYSTEM (turn_duration = session end marker) ─────────────────────────
    if (event.type === 'system') {
      const e = event as SystemEvent;
      if (e.subtype === 'turn_duration') {
        exitReason = 'completed';
      }
    }
  }

  // Deterministic session ID: use native sessionId from log if available,
  // otherwise derive from file path + start time
  const sessionId = nativeSessionId
    || createHash('sha256')
        .update(opts.logFilePath + startedAt)
        .digest('hex')
        .slice(0, 32);

  return {
    sessionId,
    tool: 'claude_code',
    agentId:  opts.agentId,
    agentEns: opts.agentEns,
    walletId: opts.walletId,
    userId:   opts.userId,
    orgId:    opts.orgId,
    workspacePath: cwd || opts.logFilePath,
    startedAt: startedAt || new Date().toISOString(),
    endedAt:   endedAt   || new Date().toISOString(),
    messages,
    toolCalls: [...toolCallMap.values()],
    filesChanged: [...filesChanged],
    shellCommands,
    approvals,
    exitReason,
  };
}
