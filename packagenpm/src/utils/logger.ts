import chalk from 'chalk';

export const logger = {
    info: (msg: string) => {
        console.log(chalk.blue('ℹ'), msg);
    },

    success: (msg: string) => {
        console.log(chalk.green('✔'), msg);
    },

    warn: (msg: string) => {
        console.log(chalk.yellow('⚠'), msg);
    },

    error: (msg: string) => {
        console.error(chalk.red('✖'), msg);
    },

    blank: () => {
        console.log();
    },

    banner: (msg: string) => {
        const line = '═'.repeat(50);
        console.log(chalk.cyan(line));
        console.log(chalk.cyan.bold(`  ${msg}`));
        console.log(chalk.cyan(line));
    },

    detail: (label: string, value: string) => {
        console.log(`  ${chalk.gray(label.padEnd(16))}${value}`);
    },
};
