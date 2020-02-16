import { AbstractEvent } from 'alliage-lifecycle/events';
import { CommandBuilder, Arguments } from 'alliage/core/utils/cli';
import { AbstractProcess, StopProcessHandler, SIGNAL, SignalPayload } from './process';

export enum PROCESS_EVENTS {
  PRE_REGISTER_SERVICES = '@process-manager/PROCESS_EVENT/PRE_REGISTER_SERVICES',
  POST_REGISTER_SERVICES = '@process-manager/PROCESS_EVENT/POST_REGISTER_SERVICES',

  PRE_CONFIGURE = '@process-manager/PROCESS_EVENT/PRE_CONFIGURE',
  POST_CONFIGURE = '@process-manager/PROCESS_EVENT/POST_CONFIGURE',

  PRE_EXECUTE = '@process-manager/PROCESS_EVENT/PRE_EXECUTE',

  PRE_TERMINATE = '@process-manager/PROCESS_EVENT/PRE_TERMINATE',
  POST_TERMINATE = '@process-manager/PROCESS_EVENT/POST_TERMINATE',
}

export interface RegisterServicesEventPayload {
  process: AbstractProcess;
}

export abstract class AbstractRegisterServicesEvent extends AbstractEvent<
  PROCESS_EVENTS,
  RegisterServicesEventPayload
> {
  constructor(type: PROCESS_EVENTS, process: AbstractProcess) {
    super(type, { process });
  }

  getProcess() {
    return this.getPayload().process;
  }

  static getParams(process: AbstractProcess) {
    return super.getParams(process);
  }
}

export class PreRegisterServicesEvent extends AbstractRegisterServicesEvent {
  constructor(process: AbstractProcess) {
    super(PROCESS_EVENTS.PRE_REGISTER_SERVICES, process);
  }
}

export class PostRegisterServicesEvent extends AbstractRegisterServicesEvent {
  constructor(process: AbstractProcess) {
    super(PROCESS_EVENTS.POST_REGISTER_SERVICES, process);
  }
}

export interface ConfigureEventPayload {
  process: AbstractProcess;
  config: CommandBuilder;
}

export abstract class AbstractConfigureEvent extends AbstractEvent<
  PROCESS_EVENTS,
  ConfigureEventPayload
> {
  constructor(type: PROCESS_EVENTS, process: AbstractProcess, config: CommandBuilder) {
    super(type, { process, config });
  }

  getProcess() {
    return this.getPayload().process;
  }

  getConfig() {
    return this.getPayload().config;
  }

  static getParams(process: AbstractProcess, config: CommandBuilder) {
    return super.getParams(process, config);
  }
}

export class PreConfigureEvent extends AbstractConfigureEvent {
  constructor(process: AbstractProcess, config: CommandBuilder) {
    super(PROCESS_EVENTS.PRE_CONFIGURE, process, config);
  }
}

export class PostConfigureEvent extends AbstractConfigureEvent {
  constructor(process: AbstractProcess, config: CommandBuilder) {
    super(PROCESS_EVENTS.POST_CONFIGURE, process, config);
  }
}

export interface ExecuteEventPayload {
  process: AbstractProcess;
  args: Arguments;
  stopHandler: StopProcessHandler;
  env: string;
}

export abstract class AbstractExecuteEvent extends AbstractEvent<
  PROCESS_EVENTS,
  ExecuteEventPayload
> {
  constructor(
    type: PROCESS_EVENTS,
    process: AbstractProcess,
    args: Arguments,
    stopHandler: StopProcessHandler,
    env: string,
  ) {
    super(type, { process, args, stopHandler, env });
  }

  getProcess() {
    return this.getPayload().process;
  }

  getArgs() {
    return this.getPayload().args;
  }

  getStopHandler() {
    return this.getPayload().stopHandler;
  }

  getEnv() {
    return this.getPayload().env;
  }

  static getParams(
    process: AbstractProcess,
    args: Arguments,
    stopHandler: StopProcessHandler,
    env: string,
  ) {
    return super.getParams(process, args, stopHandler, env);
  }
}

export class PreExecuteEvent extends AbstractExecuteEvent {
  constructor(
    process: AbstractProcess,
    args: Arguments,
    stopHandler: StopProcessHandler,
    env: string,
  ) {
    super(PROCESS_EVENTS.PRE_EXECUTE, process, args, stopHandler, env);
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
