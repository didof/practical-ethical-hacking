import chalk from "chalk";

export const log = {
  info: (message) => {
    console.log(chalk.cyan(`[INFO] ${message}`));
  },
  success: (message) => {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  },
  warn: (message) => {
    console.log(chalk.yellow(`[WARN] ${message}`));
  },
  error: (message) => {
    console.log(chalk.red.bold(`[ERROR] ${message}`));
  },
  title: (message) => {
    console.log(chalk.magenta.bold.underline(`\n${message}\n`));
  },
  critical: (message) => {
    console.log(chalk.bgRed.white.bold(`\n${message}\n`));
  },
};