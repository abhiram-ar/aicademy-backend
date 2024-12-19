import chalk from "chalk";

export const log = console.log;
export const logWarning = (message) => console.log(chalk.yellow(message));

export const logErrorMessage = (message = "no error msg") =>
    console.log(chalk.red(message));

export const logSuccess = (message) => console.log(chalk.green(message))
