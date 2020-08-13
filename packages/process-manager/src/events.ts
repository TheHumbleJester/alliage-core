import { AbstractEvent, AbstractWritableEvent } from 'alliage-lifecycle/events';
import { CommandBuilder, Arguments } from 'alliage/core/utils/cli';
import { AbstractProcess, SIGNAL, SignalPayload } from './process';

export enum PROCESS_EVENTS {
  PRE_CONFIGURE = '@process-manager/PROCESS_EVENT/PRE_CONFIGURE',
  POST_CONFIGURE = '@process-manager/PROCESS_EVENT/POST_CONFIGURE',

  PRE_EXECUTE = '@process-manager/PROCESS_EVENT/PRE_EXECUTE',

  PRE_TERMINATE = '@process-manager/PROCESS_EVENT/PRE_TERMINATE',
  POST_TERMINATE = '@process-manager/PROCESS_EVENT/POST_TERMINATE',
}

export interface ConfigureEventPayload {
  process: AbstractProcess;
  config: CommandBuilder;
  env: string;
}

export abstract class AbstractConfigureEvent extends AbstractEvent<
  PROCESS_EVENTS,
  ConfigureEventPayload
> {
  constructor(type: PROCESS_EVENTS, process: AbstractProcess, config: CommandBuilder, env: string) {
    super(type, { process, config, env });
  }

  getProcess() {
    return this.getPayload().process;
  }

  getConfig() {
    return this.getPayload().config;
  }

  getEnv() {
    return this.getPayload().env;
  }

  static getParams(process: AbstractProcess, config: CommandBuilder, env: string) {
    return super.getParams(process, config, env);
  }
}

export class PreConfigureEvent extends AbstractConfigureEvent {
  constructor(process: AbstractProcess, config: CommandBuilder, env: string) {
    super(PROCESS_EVENTS.PRE_CONFIGURE, process, config, env);
  }
}

export class PostConfigureEvent extends AbstractConfigureEvent {
  constructor(process: AbstractProcess, config: CommandBuilder, env: string) {
    super(PROCESS_EVENTS.POST_CONFIGURE, process, config, env);
  }
}

export interface ExecuteEventPayload {
  process: AbstractProcess;
  args: Arguments;
  env: string;
}

export abstract class AbstractExecuteEvent extends AbstractWritableEvent<
  PROCESS_EVENTS,
  ExecuteEventPayload
> {
  constructor(type: PROCESS_EVENTS, process: AbstractProcess, args: Arguments, env: string) {
    super(type, { process, args, env });
  }

  getProcess() {
    return this.getWritablePayload().process;
  }

  getArgs() {
    return this.getPayload().args;
  }

  getEnv() {
    return this.getPayload().env;
  }

  setProcess(process: AbstractProcess) {
    this.getWritablePayload().process = process;
    return this;
  }

  static getParams(process: AbstractProcess, args: Arguments, env: string) {
    return super.getParams(process, args, env);
  }
}

export class PreExecuteEvent extends AbstractExecuteEvent {
  constructor(process: AbstractProcess, args: Arguments, env: string) {
    super(PROCESS_EVENTS.PRE_EXECUTE, process, args, env);
  }
}

export interface TerminateEventPayload {
  process: AbstractProcess;
  args: Arguments;
  signal: SIGNAL;
  payload: SignalPayload;
  env: string;
}

export abstract class AbstractTerminateEvent extends AbstractEvent<
  PROCESS_EVENTS,
  TerminateEventPayload
> {
  constructor(
    type: PROCESS_EVENTS,
    process: AbstractProcess,
    args: Arguments,
    signal: SIGNAL,
    payload: SignalPayload,
    env: string,
  ) {
    super(type, { process, args, signal, payload, env });
  }

  getProcess() {
    return this.getPayload().process;
  }

  getArgs() {
    return this.getPayload().args;
  }

  getSignal() {
    return this.getPayload().signal;
  }

  getSignalPayload() {
    return this.getPayload().payload;
  }

  getEnv() {
    return this.getPayload().env;
  }

  static getParams(
    process: AbstractProcess,
    args: Arguments,
    signal: SIGNAL,
    payload: SignalPayload,
    env: string,
  ) {
    return super.getParams(process, args, signal, payload, env);
  }
}

export class PreTerminateEvent extends AbstractTerminateEvent {
  constructor(
    process: AbstractProcess,
    args: Arguments,
    signal: SIGNAL,
    payload: SignalPayload,
    env: string,
  ) {
    super(PROCESS_EVENTS.PRE_TERMINATE, process, args, signal, payload, env);
  }
}

export class PostTerminateEvent extends AbstractTerminateEvent {
  constructor(
    process: AbstractProcess,
    args: Arguments,
    signal: SIGNAL,
    payload: SignalPayload,
    env: string,
  ) {
    super(PROCESS_EVENTS.POST_TERMINATE, process, args, signal, payload, env);
  }
}
