import * as os from 'os';
import * as path from 'path';
import { ToolAdapter } from './types';
import { findFiles, readFileContent } from '../utils/fsUtils';

/**
 * Codex CLI Adapter
 *
 * Codex stores session logs as JSONL files in a date-based hierarchy:
 *   ~/.codex/sessions/YYYY/MM/DD/rollout-<datetime>-<uuid>.jsonl
 *
 * The adapter recursively walks the sessions directory to find all log files.
 */
export class CodexAdapter implements ToolAdapter {
    readonly name = 'codex';
    readonly cliCommand = 'codex';

    private get baseDir(): string {
        return path.join(os.homedir(), '.codex', 'sessions');
    }

    async detectSessions(): Promise<string[]> {
        // Recursively find all .jsonl files under ~/.codex/sessions/
        // This walks through the YYYY/MM/DD directory structure automatically
        return findFiles(this.baseDir, '.jsonl');
    }

    async getNewSessions(snapshot: string[]): Promise<string[]> {
        const current = await this.detectSessions();
        const snapshotSet = new Set(snapshot);
        return current.filter((filePath) => !snapshotSet.has(filePath));
    }

    async getSessionContent(filePath: string): Promise<string> {
        return readFileContent(filePath);
    }
}
