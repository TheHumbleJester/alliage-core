import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';

import { ServiceContainer } from 'alliage-di/service-container';

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

export type StopProcessHandler = (success: boolean) => Promise<void>;

export abstract class AbstractProcess {
  abstract getName(): string;

  abstract configure(config: CommandBuilder): void;

  abstract execute(args: Arguments, stopProcess: StopProcessHandler, env: string): Promise<boolean>;

  /* istanbul ignore next */
  async terminate(
    _args: Arguments,
    _env: string,
    _signal: string,
    _payload: SignalPayload,
  ): Promise<void> {
    await Promise.resolve();
  }

  registerServices(_serviceContainer: ServiceContainer) {}
}
