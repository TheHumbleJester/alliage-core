import { AbstractWritableEvent, AbstractEvent } from 'alliage-lifecycle/events';
import { ExecException } from 'child_process';

export enum BUILDER_SHELL_TASK_EVENTS {
  BEFORE_RUN = '@builder/tasks/SHELL_TASK/EVENTS/BEFORE_RUN',
  SUCCESS = '@builder/tasks/SHELL_TASK/EVENTS/SUCCESS',
  ERROR = '@builder/tasks/SHELL_TASK/EVENTS/ERROR',
}

export interface ShellTaskBeforeRunEventPayload {
  command: string;
}

export class ShellTaskBeforeRunEvent extends AbstractWritableEvent<
  BUILDER_SHELL_TASK_EVENTS,
  ShellTaskBeforeRunEventPayload
> {
  constructor(command: string) {
    super(BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN, { command });
  }

  getCommand() {
    return this.getWritablePayload().command;
  }

  setCommand(command: string) {
    this.getWritablePayload().command = command;
    return this;
  }
}

export interface ShellTaskSuccessEventPayload {
  command: string;
  output: string;
}

export class ShellTaskSuccessEvent extends AbstractEvent<
  BUILDER_SHELL_TASK_EVENTS,
  ShellTaskSuccessEventPayload
> {
  constructor(command: string, output: string) {
    super(BUILDER_SHELL_TASK_EVENTS.SUCCESS, { command, output });
  }

  getCommand() {
    return this.getPayload().command;
  }

  getOutput() {
    return this.getPayload().output;
  }

  static getParams(command: string, output: string) {
    return super.getParams(command, output);
  }
}

export interface ShellTaskErrorEventPayload {
  command: string;
  output: string;
  exception: ExecException;
}

export class ShellTaskErrorEvent extends AbstractEvent<
  BUILDER_SHELL_TASK_EVENTS,
  ShellTaskErrorEventPayload
> {
  constructor(command: string, output: string, exception: ExecException) {
    super(BUILDER_SHELL_TASK_EVENTS.ERROR, { command, output, exception });
  }

  getCommand() {
    return this.getPayload().command;
  }

  getOutput() {
    return this.getPayload().output;
  }

  getException() {
    return this.getPayload().exception;
  }

  static getParams(command: string, output: string, exception: ExecException) {
    return super.getParams(command, output, exception);
  }
}
