import chalk from 'chalk';
import { AbstractModule } from 'alliage/core/module';

const EXCLUDED_PROPERTIES = ['message', 'stack'];

export = class ErrorHandlerModule extends AbstractModule {
  getKernelEventHandlers() {
    return {
      init: this.handleInit,
    };
  }

  displayError = (error: any) => {
    if (error instanceof Error) {
      const errorType = (error.constructor && error.constructor.name) || 'Error';
      const message = error.message || 'An unknown error occured';
      console.error(chalk.white.bgRed(`${chalk.underline.bold(errorType)}: ${message}`));

      Object.getOwnPropertyNames(error)
        .filter((p: string) => !EXCLUDED_PROPERTIES.includes(p))
        .forEach((p: string) => {
          console.error(chalk.blue.underline(`${p}:`));
          console.error((error as any)[p], '\n');
        });
      console.error(chalk.blue.underline('stack trace:'));
      console.error(error.stack);
    }
  };

  handleInit = () => {
    process.on('unhandledRejection', (error) => this.displayError(error));
    process.on('uncaughtException', (error) => this.displayError(error));
  };
};
