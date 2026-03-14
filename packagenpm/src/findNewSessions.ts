import { ToolAdapter } from './adapters/types';
import { logger } from './utils/logger';

/**
 * Finds session files that were created after the snapshot was taken.
 * Compares the current file list against the "before" snapshot.
 */
export async function findNewSessions(
    adapter: ToolAdapter,
    snapshot: string[]
): Promise<string[]> {
    logger.info('Detecting new session logs...');
    const newSessions = await adapter.getNewSessions(snapshot);

    if (newSessions.length === 0) {
        logger.warn('No new sessions detected.');
    } else {
        logger.success(`Found ${newSessions.length} new session log(s)`);
    }

    return newSessions;
}
