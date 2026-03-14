import { ToolAdapter } from './types';
import { ClaudeAdapter } from './claudeAdapter';
import { CodexAdapter } from './codexAdapter';

/**
 * Factory function — returns the correct adapter for the given tool type.
 */
export function getAdapter(toolType: string): ToolAdapter {
    switch (toolType) {
        case 'claude_code':
            return new ClaudeAdapter();
        case 'codex':
            return new CodexAdapter();
        default:
            throw new Error(
                `Unsupported tool type: "${toolType}". Supported types: claude_code, codex`
            );
    }
}
