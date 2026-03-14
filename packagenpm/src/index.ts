import { Command } from 'commander';
import * as readline from 'readline';
import {
  loadConfig,
  saveConfig,
  configExists,
  getConfigPath,
  getMappedAgent,
  AgentCoverConfig,
  AgentInfo,
  DEFAULT_FILEVERSE_URL,
} from './config';
import { validateToken, fetchAgents, openBrowser, PlatformAgent } from './auth';
import { getAdapter } from './adapters';
import { snapshotSessions } from './snapshotSessions';
import { findNewSessions } from './findNewSessions';
import { reportEvidence } from './uploadEvidence';
import { runAgent } from './runAgent';
import { logger } from './utils/logger';

// ─── Default platform URL ──────────────────────────────────────────

const DEFAULT_PLATFORM_URL = process.env.AGENTCOVER_PLATFORM_URL || 'http://localhost:3000';

// ─── Interactive Prompt Helper ──────────────────────────────────────

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Login Command ──────────────────────────────────────────────────

async function handleLogin(): Promise<void> {
  logger.banner('AgentCover — Login');
  logger.blank();

  // 1. Get platform URL
  const platformUrl = await prompt(
    `  Platform URL (${DEFAULT_PLATFORM_URL}): `
  );
  const url = platformUrl || DEFAULT_PLATFORM_URL;

  // 1b. Get Fileverse backend URL
  const fileverseInput = await prompt(
    `  Fileverse URL (${DEFAULT_FILEVERSE_URL}): `
  );
  const fileverseUrl = fileverseInput || DEFAULT_FILEVERSE_URL;

  // 2. Open browser
  logger.info('Opening platform in your browser...');
  openBrowser(`${url}/dashboard`);
  logger.info(`If it doesn't open, visit: ${url}/dashboard`);
  logger.blank();

  // 3. Get token
  const token = await prompt('  Paste your CLI token: ');
  if (!token) {
    logger.error('Token is required.');
    process.exit(1);
  }

  // 4. Validate token
  logger.info('Validating token...');
  let user;
  try {
    user = await validateToken(url, token);
  } catch (err) {
    logger.error(`Login failed: ${(err as Error).message}`);
    process.exit(1);
  }

  const shortAddr =
    user.address.substring(0, 6) + '...' + user.address.substring(user.address.length - 4);
  logger.success(`Logged in! (${shortAddr})`);
  logger.blank();

  // 5. Fetch agents
  let agents: PlatformAgent[];
  try {
    agents = await fetchAgents(url, token);
  } catch (err) {
    logger.error(`Failed to fetch agents: ${(err as Error).message}`);
    process.exit(1);
  }

  if (agents.length === 0) {
    logger.warn('No registered agents found.');
    logger.info(`Register an agent at: ${url}/onboarding`);
    // Save config without agent map so user can login again later
    saveConfig({
      token,
      platformUrl: url,
      fileverseUrl,
      userId: user.userId,
      walletAddress: user.address,
      agentMap: {},
    });
    return;
  }

  // 6. Display agents
  console.log('  Your registered agents:');
  agents.forEach((agent, i) => {
    const ens = agent.ensName || 'no ENS';
    console.log(`  ${i + 1}. ${agent.name.padEnd(20)} (${ens})`);
  });
  logger.blank();

  // 7. Map agents to tools
  console.log('  Map your agents to AI tools:');
  logger.blank();

  const agentMap: AgentCoverConfig['agentMap'] = {};

  // Claude mapping
  const claudeInput = await prompt('  Agent for Claude Code [number, or skip]: ');
  if (claudeInput && claudeInput.toLowerCase() !== 'skip') {
    const idx = parseInt(claudeInput, 10) - 1;
    if (idx >= 0 && idx < agents.length) {
      const a = agents[idx];
      agentMap.claude_code = {
        agentId: a.agentId,
        name: a.name,
        ensName: a.ensName || `${a.name}.agentcover.eth`,
      };
      logger.success(`Claude → ${agentMap.claude_code.ensName}`);
    } else {
      logger.warn('Invalid selection, skipping Claude mapping.');
    }
  }

  // Codex mapping
  const codexInput = await prompt('  Agent for Codex [number, or skip]: ');
  if (codexInput && codexInput.toLowerCase() !== 'skip') {
    const idx = parseInt(codexInput, 10) - 1;
    if (idx >= 0 && idx < agents.length) {
      const a = agents[idx];
      agentMap.codex = {
        agentId: a.agentId,
        name: a.name,
        ensName: a.ensName || `${a.name}.agentcover.eth`,
      };
      logger.success(`Codex  → ${agentMap.codex.ensName}`);
    } else {
      logger.warn('Invalid selection, skipping Codex mapping.');
    }
  }

  // 8. Save config
  const config: AgentCoverConfig = {
    token,
    platformUrl: url,
    fileverseUrl,
    userId: user.userId,
    walletAddress: user.address,
    agentMap,
  };

  saveConfig(config);

  logger.blank();
  logger.success(`Config saved to ${getConfigPath()}`);
  logger.blank();

  if (agentMap.claude_code) {
    logger.detail('Claude:', agentMap.claude_code.ensName);
  }
  if (agentMap.codex) {
    logger.detail('Codex:', agentMap.codex.ensName);
  }

  logger.blank();
  logger.info('Run: agentcover codex  or  agentcover claude');
}

// ─── Status Command ─────────────────────────────────────────────────

async function handleStatus(): Promise<void> {
  if (!configExists()) {
    logger.error('Not logged in. Run "agentcover login" first.');
    process.exit(1);
  }

  const config = loadConfig();
  const shortAddr =
    config.walletAddress.substring(0, 6) +
    '...' +
    config.walletAddress.substring(config.walletAddress.length - 4);

  logger.banner('AgentCover — Status');
  logger.blank();
  logger.detail('Wallet:', shortAddr);
  logger.detail('User ID:', config.userId);
  logger.detail('Platform:', config.platformUrl);
  logger.detail('Token:', config.token.substring(0, 8) + '...');
  logger.blank();

  console.log('  Agent Mappings:');
  if (config.agentMap.claude_code) {
    logger.detail('Claude:', config.agentMap.claude_code.ensName);
  } else {
    logger.detail('Claude:', '(not mapped)');
  }
  if (config.agentMap.codex) {
    logger.detail('Codex:', config.agentMap.codex.ensName);
  } else {
    logger.detail('Codex:', '(not mapped)');
  }
  logger.blank();
}

// ─── Run Agent Command ──────────────────────────────────────────────

async function handleRun(toolType: 'claude_code' | 'codex'): Promise<void> {
  // 1. Load config
  let config: AgentCoverConfig;
  try {
    config = loadConfig();
  } catch (err) {
    logger.error((err as Error).message);
    process.exit(1);
  }

  // 2. Get mapped agent
  const agent = getMappedAgent(config, toolType);
  if (!agent) {
    const toolName = toolType === 'claude_code' ? 'Claude Code' : 'Codex';
    logger.error(
      `No agent mapped for ${toolName}. Run "agentcover login" to set up agent mappings.`
    );
    process.exit(1);
  }

  logger.success(`Agent: ${agent.ensName}`);

  // 3. Get adapter
  const adapter = getAdapter(toolType);

  // 4. Snapshot existing sessions
  const snapshot = await snapshotSessions(adapter);

  // 5. Run the agent
  try {
    const exitCode = await runAgent(adapter.cliCommand);
    if (exitCode !== 0) {
      logger.warn(`${adapter.cliCommand} exited with non-zero code: ${exitCode}`);
      logger.info('Attempting to collect evidence anyway...');
    }
  } catch (err) {
    logger.error((err as Error).message);
    process.exit(1);
  }

  // 6. Find new sessions
  const newSessions = await findNewSessions(adapter, snapshot);

  if (newSessions.length === 0) {
    logger.blank();
    logger.info('No evidence to report. Exiting.');
    return;
  }

  // 7. Report evidence with full payload
  const workspacePath = process.cwd();
  await reportEvidence(config, agent, toolType, newSessions, workspacePath);
}

// ─── CLI Setup ──────────────────────────────────────────────────────

export function main(): void {
  const program = new Command();

  program
    .name('agentcover')
    .description('AgentCover Evidence Collector — capture AI coding session logs')
    .version('0.1.0');

  program
    .command('login')
    .description('Login to AgentCover platform and map agents to tools')
    .action(async () => {
      try {
        await handleLogin();
      } catch (err) {
        logger.error(`Login failed: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  // Keep 'init' as alias for 'login'
  program
    .command('init')
    .description('Alias for "login"')
    .action(async () => {
      try {
        await handleLogin();
      } catch (err) {
        logger.error(`Login failed: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  program
    .command('status')
    .description('Show current login and agent mapping status')
    .action(async () => {
      try {
        await handleStatus();
      } catch (err) {
        logger.error(`Failed: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  program
    .command('claude')
    .description('Run Claude Code and collect session evidence')
    .action(async () => {
      try {
        await handleRun('claude_code');
      } catch (err) {
        logger.error(`Failed: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  program
    .command('codex')
    .description('Run Codex and collect session evidence')
    .action(async () => {
      try {
        await handleRun('codex');
      } catch (err) {
        logger.error(`Failed: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}
