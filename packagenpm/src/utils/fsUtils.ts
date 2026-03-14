import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensures a directory exists, creating it recursively if needed.
 */
export function ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Reads file content as a UTF-8 string.
 */
export function readFileContent(filePath: string): string {
    return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Returns the size of a file in bytes.
 */
export function getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
}

/**
 * Formats bytes into a human-readable string (e.g., "4.2 KB").
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Recursively finds all files matching an extension under a base directory.
 * Returns absolute file paths.
 */
export function findFiles(baseDir: string, extension: string): string[] {
    const results: string[] = [];

    if (!fs.existsSync(baseDir)) {
        return results;
    }

    function walk(dir: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            // Permission denied or directory unreadable — skip silently
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && entry.name.endsWith(extension)) {
                results.push(fullPath);
            }
        }
    }

    walk(baseDir);
    return results;
}

/**
 * Finds files matching a glob-like pattern in a directory.
 * Supports simple wildcard patterns like "*.jsonl" and "rollout-*.jsonl".
 * Searches recursively through subdirectories.
 */
export function globFiles(baseDir: string, pattern: string): string[] {
    const results: string[] = [];

    if (!fs.existsSync(baseDir)) {
        return results;
    }

    // Convert simple glob pattern to regex
    const regexStr = '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexStr);

    function walk(dir: string): void {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && regex.test(entry.name)) {
                results.push(fullPath);
            }
        }
    }

    walk(baseDir);
    return results;
}
