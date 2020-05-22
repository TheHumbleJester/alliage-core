import { exec, ExecException } from 'child_process';

import { EventManager } from 'alliage-lifecycle/event-manager';

import { AbstractTask } from '..';
import { ShellTaskBeforeRunEvent, ShellTaskErrorEvent, ShellTaskSuccessEvent } from './events';

export const TASK_NAME = '@builder/tasks/SHELL_TASK';

export interface Params {
  cmd: string;
}

export class CommandError extends Error {
  public stdout: string;

  public stderr: string;

  public error: ExecException;

  constructor(error: ExecException, stdout: string, stderr: string) {
    super(error.message);
    this.error = error;
    this.stderr = stderr;
    this.stdout = stdout;
  }
}

export class ShellTask extends AbstractTask {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  getName() {
    return 'shell';
  }

  getParamsSchema() {
    return {
      type: 'object',
      properties: {
        cmd: {
          type: 'string',
        },
      },
    };
  }

  async run(params: Params): Promise<void> {
    return new Promise((resolve, reject) => {
      const beforeRunEvent = new ShellTaskBeforeRunEvent(params.cmd);
      this.eventManager.emit(beforeRunEvent.getType(), beforeRunEvent);
      const cmd = beforeRunEvent.getCommand();

      exec(cmd, (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          const exception = new CommandError(error, stdout, stderr);
          this.eventManager.emit(...ShellTaskErrorEvent.getParams(cmd, exception));
          reject(exception);
        } else {
          this.eventManager.emit(...ShellTaskSuccessEvent.getParams(cmd, stdout, stderr));
          resolve();
        }
      });
    });
  }
}
