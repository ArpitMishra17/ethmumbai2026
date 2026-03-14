/**
 * ToolAdapter interface — defines the contract every AI tool adapter must implement.
 * The core pipeline (snapshot → diff → report) is adapter-agnostic.
 */
export interface ToolAdapter {
    /** Identifier for this tool, e.g. "claude_code" or "codex" */
    readonly name: string;

    /** The CLI command to spawn, e.g. "claude" or "codex" */
    readonly cliCommand: string;

    /**
     * Returns absolute paths to all current session log files.
     * Called before and after the agent runs to enable diff-based detection.
     */
    detectSessions(): Promise<string[]>;

    /**
     * Given a "before" snapshot, returns only the session files
     * that were created after the snapshot was taken.
     */
    getNewSessions(snapshot: string[]): Promise<string[]>;

    /**
     * Reads and returns the raw content of a session log file.
     */
    getSessionContent(filePath: string): Promise<string>;
}
