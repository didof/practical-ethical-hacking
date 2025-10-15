import chalk from "chalk";
import readline from "readline";

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

export function printStep(n, title) {
  console.log("\n" + "=".repeat(60));
  console.log(chalk.bgMagenta.white.bold(`STEP ${n}: ${title}`));
  console.log("=".repeat(60));
}

export function wait_for_enter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(chalk.yellow(`\nPress Enter to continue...`), () => {
      rl.close();
      resolve();
    });
  });
}

export async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise(resolve => {
    rl.question(chalk.cyan(question), resolve);
  });
  rl.close();
  return answer;
}