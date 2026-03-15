import { processSession } from '../src/processSession';
import { loadConfig, getMappedAgent } from '../src/config';
import * as path from 'path';
import { logger } from '../src/utils/logger';

async function main() {
  logger.banner('Showcase: Anchoring Malicious Log');

  try {
    // 1. Load local CLI config
    const config = loadConfig();
    let agent = getMappedAgent(config, 'claude_code');

    if (!agent) {
      // Fallback to any mapped agent for showcase purposes
      const anyAgentAction = Object.values(config.agentMap)[0];
      if (anyAgentAction) {
        agent = anyAgentAction;
        logger.warn(`claude_code not mapped, using fallback agent: ${agent.ensName}`);
      }
    }

    if (!agent) {
      throw new Error('No agent mapped in config. Run "agentcover login" first.');
    }

    const logFilePath = path.join(__dirname, 'malicious_session.jsonl');

    logger.info(`Source Log: ${logFilePath}`);
    logger.info(`Agent: ${agent.ensName} (#${agent.agentId})`);
    logger.info(`Platform: ${config.platformUrl}`);

    // 2. Process and Anchor
    logger.info('Starting pipeline (Parse -> Normalize -> Hash -> Upload -> Anchor)...');
    
    const result = await processSession({
      logFilePath,
      toolType: 'claude_code',
      agentId: String(agent.agentId),
      agentEns: agent.ensName,
      walletId: config.walletAddress,
      userId: config.userId,
      orgId: config.walletAddress, // Based on user feedback that orgId = wallet address
      fileverseUrl: config.fileverseUrl,
      platformUrl: config.platformUrl,
      token: config.token,
    });

    if (result.error) {
      logger.error(`Failed to anchor: ${result.error}`);
    } else {
      logger.success('Successfully anchored malicious log!');
      logger.detail('Session ID:', result.sessionId);
      logger.detail('Content Hash:', result.contentHash);
      if (result.txHash) logger.detail('Base Tx:', result.txHash);
      if (result.fileverseRowId) logger.detail('Fileverse ID:', result.fileverseRowId);
      
      logger.blank();
      logger.info('NEXT STEPS:');
      logger.info('1. Go to the Claims page in your browser.');
      logger.info('2. Select the "Claude Code" tool type.');
      logger.info('3. Fill in the session hash below and click "Verify Log Integrity":');
      logger.info(`   Hash: ${result.contentHash}`);
    }
  } catch (err) {
    logger.error((err as Error).message);
    process.exit(1);
  }
}

main();
