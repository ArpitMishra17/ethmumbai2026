import { spawn } from 'child_process';
import { logger } from './utils/logger';

/**
 * Spawns an AI coding tool CLI as a child process.
 *
 * The process inherits stdio so the user interacts with the agent normally.
 * Returns a promise that resolves with the exit code when the agent exits.
 */
export function runAgent(cliCommand: string): Promise<number> {
    return new Promise((resolve, reject) => {
        logger.info(`Starting ${cliCommand}...`);
        logger.blank();

        const child = spawn(cliCommand, [], {
            stdio: 'inherit',
            shell: true,
        });

        child.on('error', (err) => {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                reject(
                    new Error(
                        `"${cliCommand}" not found. Make sure it is installed and available in your PATH.`
                    )
                );
            } else {
                reject(err);
            }
        });

        child.on('close', (code) => {
            logger.blank();
            logger.info(`${cliCommand} exited with code ${code ?? 0}`);
            resolve(code ?? 0);
        });
    });
}
