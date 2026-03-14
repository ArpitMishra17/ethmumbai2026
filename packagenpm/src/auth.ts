import { exec } from 'child_process';
import * as os from 'os';
import { logger } from './utils/logger';

// ─── Types ──────────────────────────────────────────────────────────

export interface PlatformUser {
  userId: string;
  address: string;
}

export interface PlatformAgent {
  id: string;
  agentId: number;
  name: string;
  ensName: string | null;
  description: string;
  verificationStatus: string;
  isActive: boolean;
}

// ─── API Functions ──────────────────────────────────────────────────

/**
 * Validates a CLI token against the platform.
 * Calls GET /api/cli/auth with Bearer token.
 */
export async function validateToken(
  platformUrl: string,
  token: string
): Promise<PlatformUser> {
  if (!/^[\x00-\x7F]*$/.test(token)) {
    throw new Error("Invalid token format (contains non-ASCII characters).");
  }

  const url = `${platformUrl}/api/cli/auth`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as any).error || `Token validation failed (HTTP ${res.status})`
    );
  }

  return (await res.json()) as PlatformUser;
}

/**
 * Fetches the user's registered agents from the platform.
 * Calls GET /api/cli/agents with Bearer token.
 */
export async function fetchAgents(
  platformUrl: string,
  token: string
): Promise<PlatformAgent[]> {
  if (!/^[\x00-\x7F]*$/.test(token)) {
    throw new Error("Invalid token format (contains non-ASCII characters).");
  }

  const url = `${platformUrl}/api/cli/agents`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as any).error || `Failed to fetch agents (HTTP ${res.status})`
    );
  }

  const data = (await res.json()) as { agents: PlatformAgent[] };
  return data.agents;
}

// ─── Browser ────────────────────────────────────────────────────────

/**
 * Opens a URL in the user's default browser.
 * Works cross-platform: Windows (start), macOS (open), Linux (xdg-open).
 */
export function openBrowser(url: string): void {
  const platform = os.platform();
  let command: string;

  switch (platform) {
    case 'win32':
      command = `start "" "${url}"`;
      break;
    case 'darwin':
      command = `open "${url}"`;
      break;
    default:
      command = `xdg-open "${url}"`;
      break;
  }

  exec(command, (err) => {
    if (err) {
      logger.warn(`Could not open browser. Visit manually: ${url}`);
    }
  });
}
