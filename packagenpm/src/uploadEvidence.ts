import * as path from 'path';
import { AgentCoverConfig, AgentInfo } from './config';
import { logger } from './utils/logger';
import { getFileSize, formatFileSize } from './utils/fsUtils';

/**
 * Evidence upload payload — what will eventually be sent to the backend.
 */
export interface EvidencePayload {
  agentEns: string;
  agentId: number;
  userWallet: string;
  toolType: string;
  sessionFiles: {
    fileName: string;
    fileSize: number;
    lineCount: number;
  }[];
  workspacePath: string;
  timestamp: number;
}

/**
 * Counts the number of lines in a file by reading it.
 */
function countLines(filePath: string): number {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').filter((l: string) => l.trim().length > 0).length;
  } catch {
    return 0;
  }
}

/**
 * Reports evidence as ready for upload.
 * Prints the full payload that would be sent to the backend.
 */
export async function reportEvidence(
  config: AgentCoverConfig,
  agent: AgentInfo,
  toolType: string,
  newSessions: string[],
  workspacePath: string
): Promise<void> {
  const timestamp = Date.now();

  // Build session file details
  const sessionFiles = newSessions.map((filePath) => {
    const size = getFileSize(filePath);
    const lines = countLines(filePath);
    return {
      fileName: path.basename(filePath),
      fileSize: size,
      lineCount: lines,
      fullPath: filePath,
    };
  });

  // Build payload
  const payload: EvidencePayload = {
    agentEns: agent.ensName,
    agentId: agent.agentId,
    userWallet: config.walletAddress,
    toolType,
    sessionFiles: sessionFiles.map(({ fileName, fileSize, lineCount }) => ({
      fileName,
      fileSize,
      lineCount,
    })),
    workspacePath,
    timestamp,
  };

  // ─── Print Summary ────────────────────────────────────────────

  logger.blank();
  logger.banner('📋 Evidence Summary — Ready to Upload');
  logger.blank();

  // Identity
  console.log('  IDENTITY');
  logger.detail('Agent ENS:', agent.ensName);
  logger.detail('Agent ID:', String(agent.agentId));
  logger.detail('User Wallet:', config.walletAddress);
  logger.detail('User ID:', config.userId);
  logger.blank();

  // Session
  console.log('  SESSION');
  logger.detail('Tool:', toolType);
  logger.detail('Workspace:', workspacePath);
  logger.detail('Timestamp:', new Date(timestamp).toISOString());
  logger.blank();

  // Log files
  console.log('  LOG FILES');
  for (let i = 0; i < sessionFiles.length; i++) {
    const f = sessionFiles[i];
    console.log(`  ┌${'─'.repeat(48)}┐`);
    console.log(`  │ ${(i + 1 + '. ' + f.fileName).padEnd(47)}│`);
    console.log(`  │ ${'Size:  '.padEnd(10)}${formatFileSize(f.fileSize).padEnd(37)}│`);
    console.log(`  │ ${'Lines: '.padEnd(10)}${String(f.lineCount).padEnd(37)}│`);
    console.log(`  │ ${'Path:  '.padEnd(10)}${f.fullPath.substring(0, 37).padEnd(37)}│`);
    console.log(`  └${'─'.repeat(48)}┘`);
  }
  logger.blank();

  // Payload preview
  console.log('  UPLOAD PAYLOAD (will be sent to backend)');
  console.log(JSON.stringify(payload, null, 2).split('\n').map(l => '  ' + l).join('\n'));
  logger.blank();

  logger.success('Evidence is ready for upload');
  logger.info('Upload to backend will be enabled in a future version.');

  // ─── TODO: Actual upload ──────────────────────────────────────
  //
  // When backend is ready, POST each session to:
  //   ${config.platformUrl}/api/evidence/upload
  //
  // Include config.token as Authorization: Bearer header.
  // Include raw sessionFileContent in the payload.
  // Retry 3x with exponential backoff.
  // ──────────────────────────────────────────────────────────────
}
