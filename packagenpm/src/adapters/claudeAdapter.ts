import * as os from 'os';
import * as path from 'path';
import { ToolAdapter } from './types';
import { findFiles, readFileContent } from '../utils/fsUtils';

/**
 * Claude Code Adapter
 *
 * Claude Code stores session logs as JSONL files at:
 *   ~/.claude/projects/<project_name>/sessions/<session>.jsonl
 *
 * Each file represents one coding session with line-delimited JSON events.
 */
export class ClaudeAdapter implements ToolAdapter {
    readonly name = 'claude_code';
    readonly cliCommand = 'claude';

    private get baseDir(): string {
        return path.join(os.homedir(), '.claude', 'projects');
    }

    async detectSessions(): Promise<string[]> {
        // Scan all project directories for session JSONL files
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
