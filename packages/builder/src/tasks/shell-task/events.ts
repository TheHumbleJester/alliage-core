import { AbstractWritableEvent, AbstractEvent } from 'alliage-lifecycle/events';

import { CommandError } from '.';

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
  successOutput: string;
  errorOutput: string;
}

export class ShellTaskSuccessEvent extends AbstractEvent<
  BUILDER_SHELL_TASK_EVENTS,
  ShellTaskSuccessEventPayload
> {
  constructor(command: string, successOutput: string, errorOutput: string) {
    super(BUILDER_SHELL_TASK_EVENTS.SUCCESS, { command, successOutput, errorOutput });
  }

  getCommand() {
    return this.getPayload().command;
  }

  getSuccessOutput() {
    return this.getPayload().successOutput;
  }

  getErrorOutput() {
    return this.getPayload().errorOutput;
  }

  static getParams(command: string, successOutput: string, errorOutput: string) {
    return super.getParams(command, successOutput, errorOutput);
  }
}

export interface ShellTaskErrorEventPayload {
  command: string;
  error: CommandError;
}

export class ShellTaskErrorEvent extends AbstractEvent<
  BUILDER_SHELL_TASK_EVENTS,
  ShellTaskErrorEventPayload
> {
  constructor(command: string, error: CommandError) {
    super(BUILDER_SHELL_TASK_EVENTS.ERROR, { command, error });
  }

  getCommand() {
    return this.getPayload().command;
  }

  getError() {
    return this.getPayload().error;
  }

  static getParams(command: string, error: CommandError) {
    return super.getParams(command, error);
  }
}
