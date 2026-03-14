import * as path from 'path';
import { AgentCoverConfig, AgentInfo } from './config';
import { logger } from './utils/logger';
import { processSession, ProcessSessionOptions } from './processSession';

/**
 * Processes and uploads all new session files to the AgentCover backend.
 *
 * For each session:
 *   1. Parse JSONL → normalize → sanitize (strip secrets) → simplify → hash
 *   2. POST HashedSession to /api/sessions/ingest
 *   3. Print per-session status
 */
export async function reportEvidence(
  config: AgentCoverConfig,
  agent: AgentInfo,
  toolType: string,
  newSessions: string[],
  workspacePath: string,
): Promise<void> {
  logger.blank();
  logger.banner('AgentCover — Processing Evidence');
  logger.blank();

  logger.detail('Agent ENS:', agent.ensName);
  logger.detail('Agent ID:', String(agent.agentId));
  logger.detail('User Wallet:', config.walletAddress);
  logger.detail('Tool:', toolType);
  logger.detail('Workspace:', workspacePath);
  logger.detail('Sessions found:', String(newSessions.length));
  logger.blank();

  // orgId = walletAddress for solo users
  const orgId = config.walletAddress;

  let uploadedCount = 0;
  let failedCount = 0;

  for (const filePath of newSessions) {
    const fileName = path.basename(filePath);
    logger.info(`Processing ${fileName}...`);

    const opts: ProcessSessionOptions = {
      logFilePath: filePath,
      toolType:    toolType as 'claude_code' | 'codex',
      agentId:     String(agent.agentId),
      agentEns:    agent.ensName,
      walletId:    config.walletAddress,
      userId:      config.userId,
      orgId,
      fileverseUrl: config.fileverseUrl,
      platformUrl: config.platformUrl,
      token: config.token,
    };

    try {
      const result = await processSession(opts);

      if (result.uploaded) {
        logger.success(
          `  Uploaded: ${result.sessionId.slice(0, 12)}... (hash: ${result.contentHash.slice(0, 12)}...)`,
        );
        if (result.txHash) {
          logger.detail('  Base Tx:', result.txHash);
        }
        uploadedCount++;
      } else {
        logger.warn(`  Upload failed for ${fileName}: ${result.error}`);
        logger.info('  Session was processed locally but not recorded on-chain.');
        failedCount++;
      }
    } catch (err) {
      logger.error(`  Failed to process ${fileName}: ${(err as Error).message}`);
      failedCount++;
      // Continue to next session — do not abort
    }
  }

  logger.blank();

  if (uploadedCount > 0) {
    logger.success(`${uploadedCount} session(s) uploaded and anchored on-chain.`);
  }
  if (failedCount > 0) {
    logger.warn(`${failedCount} session(s) failed to upload. Check your connection and API key.`);
  }
  if (uploadedCount === 0 && failedCount === 0) {
    logger.info('No sessions processed.');
  }
}
