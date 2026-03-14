import { ToolAdapter } from './adapters/types';
import { logger } from './utils/logger';

/**
 * Takes a "before" snapshot of all existing session files.
 * Called before the AI agent process is spawned.
 */
export async function snapshotSessions(adapter: ToolAdapter): Promise<string[]> {
    logger.info(`Scanning existing ${adapter.name} sessions...`);
    const sessions = await adapter.detectSessions();
    logger.info(`Found ${sessions.length} existing session file(s)`);
    return sessions;
}
