import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ensureDir } from './utils/fsUtils';

// ─── Types ──────────────────────────────────────────────────────────

export interface AgentInfo {
  agentId: number;
  name: string;
  ensName: string;
}

export interface AgentCoverConfig {
  // Auth
  token: string;
  platformUrl: string;

  // User identity
  userId: string;
  walletAddress: string;

  // Agent-to-tool mapping (set during login)
  agentMap: {
    claude_code?: AgentInfo;
    codex?: AgentInfo;
  };
}

// ─── Paths ──────────────────────────────────────────────────────────

const CONFIG_DIR = path.join(os.homedir(), '.agentcover');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

// ─── Functions ──────────────────────────────────────────────────────

/**
 * Checks whether a config file exists.
 */
export function configExists(): boolean {
  return fs.existsSync(CONFIG_PATH);
}

/**
 * Loads and returns the config from disk.
 */
export function loadConfig(): AgentCoverConfig {
  if (!configExists()) {
    throw new Error(
      'Not logged in. Run "agentcover login" first.'
    );
  }

  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const config: AgentCoverConfig = JSON.parse(raw);

  if (!config.token || !config.platformUrl) {
    throw new Error(
      'Invalid configuration. Run "agentcover login" again.'
    );
  }

  return config;
}

/**
 * Saves config to disk.
 */
export function saveConfig(config: AgentCoverConfig): void {
  ensureDir(CONFIG_DIR);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Returns the config file path (for display).
 */
export function getConfigPath(): string {
  return CONFIG_PATH;
}

/**
 * Gets the mapped agent for a given tool type.
 * Returns null if no agent is mapped.
 */
export function getMappedAgent(
  config: AgentCoverConfig,
  toolType: 'claude_code' | 'codex'
): AgentInfo | null {
  return config.agentMap[toolType] || null;
}
