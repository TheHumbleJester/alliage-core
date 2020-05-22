import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';

export enum SIGNAL {
  SIGTERM = '@process-manager/SIGNAL/SIGTERM',
  SIGINT = '@process-manager/SIGNAL/SIGINT',
  UNCAUGHT_EXCEPTION = '@process-manager/SIGNAL/UNCAUGHT_EXCEPTION',
  UNHANDLED_REJECTION = '@process-manager/SIGNAL/UNHANDLED_REJECTION',
  SUCCESS_SHUTDOWN = '@process-manager/SIGNAL/SUCCESS_SHUTDOWN',
  FAILURE_SHUTDOWN = '@process-manager/SIGNAL/FAILURE_SHUTDOWN',
}

export interface SignalPayload {
  error?: Error;
  reason?: {} | null;
  promise?: Promise<any>;
}

export const SUCCESSFUL_SIGNALS = [SIGNAL.SIGINT, SIGNAL.SIGTERM, SIGNAL.SUCCESS_SHUTDOWN];

export abstract class AbstractProcess {
  private shutdownPromiseResolver?: Function;

  abstract getName(): string;

  abstract execute(args: Arguments, env: string): Promise<boolean>;

  /* istanbul ignore next */
  async terminate(
    _args: Arguments,
    _env: string,
    _signal: SIGNAL,
    _payload: SignalPayload,
  ): Promise<void> {
    await Promise.resolve();
  }

  protected waitToBeShutdown(): Promise<boolean> {
    return new Promise((resolve) => {
      this.shutdownPromiseResolver = resolve;
    });
  }

  shutdown(success: boolean) {
    if (this.shutdownPromiseResolver) {
      this.shutdownPromiseResolver(success);
    }
  }

  configure(_config: CommandBuilder) {}
}
