import { ServiceContainer } from 'alliage-di/service-container';
import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';
import { Arguments } from 'alliage/core/utils/cli';

export enum INIT_EVENTS {
  PRE_INIT = '@lifecycle/INIT_EVENTS/PRE_INIT',
  INIT = '@lifecycle/INIT_EVENTS/INIT',
  POST_INIT = '@lifecycle/INIT_EVENTS/POST_INIT',
}

export enum INSTALL_EVENTS {
  PRE_INSTALL = '@lifecycle/INSTALL_EVENTS/PRE_INSTALL',
  INSTALL = '@lifecycle/INSTALL_EVENTS/INSTALL',
  POST_INSTALL = '@lifecycle/INSTALL_EVENTS/POST_INSTALL',
}

export enum BUILD_EVENTS {
  PRE_BUILD = '@lifecycle/BUILD_EVENTS/PRE_BUILD',
  BUILD = '@lifecycle/BUILD_EVENTS/BUILD',
  POST_BUILD = '@lifecycle/BUILD_EVENTS/POST_BUILD',
}

export enum RUN_EVENTS {
  PRE_RUN = '@lifecycle/RUN_EVENTS/PRE_RUN',
  RUN = '@lifecycle/RUN_EVENTS/RUN',
  POST_RUN = '@lifecycle/RUN_EVENTS/POST_RUN',
}

export type LifeCycleEvent = INIT_EVENTS | INSTALL_EVENTS | BUILD_EVENTS | RUN_EVENTS;

export interface LifeCycleEventPayload {
  serviceContainer: ServiceContainer;
  args: Arguments;
  env: string;
}

export interface LifeCycleInitEventPayload extends LifeCycleEventPayload {
  context: INITIALIZATION_CONTEXT;
}

export class AbstractEvent<E, P extends object = object> {
  private type: E;

  private payload: P;

  constructor(type: E, payload: P) {
    this.type = type;
    this.payload = payload;
  }

  getType(): E {
    return this.type;
  }

  protected getPayload(): P {
    return Object.freeze(this.payload);
  }

  static getParams(...args: any[]): [string, AbstractEvent<any, any>] {
    const event = new (this as any)(...args);
    return [event.getType(), event];
  }
}

export abstract class AbstractWritableEvent<E, P extends object = object> extends AbstractEvent<
  E,
  P
> {
  private writablePayload: P;

  constructor(type: E, payload: P) {
    super(type, payload);
    this.writablePayload = { ...this.getPayload() };
  }

  protected getWritablePayload() {
    return this.writablePayload;
  }
}

export abstract class AbstractLifeCycleEvent<
  E,
  P extends LifeCycleEventPayload = LifeCycleEventPayload
> extends AbstractEvent<E, P> {
  getServiceContainer() {
    return this.getPayload().serviceContainer;
  }

  getArguments() {
    return this.getPayload().args;
  }

  getEnv() {
    return this.getPayload().env;
  }
}

export type LifeCycleEventParams = [
  LifeCycleEvent,
  AbstractLifeCycleEvent<LifeCycleEvent, LifeCycleEventPayload>,
];

export class LifeCycleInitEvent extends AbstractLifeCycleEvent<
  INIT_EVENTS,
  LifeCycleInitEventPayload
> {
  getContext() {
    return this.getPayload().context;
  }

  static getParamsCreator(payload: LifeCycleInitEventPayload) {
    return {
      createPreInit: (): LifeCycleEventParams => [
        INIT_EVENTS.PRE_INIT,
        new LifeCycleInitEvent(INIT_EVENTS.PRE_INIT, payload),
      ],
      createInit: (): LifeCycleEventParams => [
        INIT_EVENTS.INIT,
        new LifeCycleInitEvent(INIT_EVENTS.INIT, payload),
      ],
      createPostInit: (): LifeCycleEventParams => [
        INIT_EVENTS.POST_INIT,
        new LifeCycleInitEvent(INIT_EVENTS.POST_INIT, payload),
      ],
    };
  }
}

export class LifeCycleInstallEvent extends AbstractLifeCycleEvent<INSTALL_EVENTS> {
  static getParamsCreator(payload: LifeCycleEventPayload) {
    return {
      createPreInstall: (): LifeCycleEventParams => [
        INSTALL_EVENTS.PRE_INSTALL,
        new LifeCycleInstallEvent(INSTALL_EVENTS.PRE_INSTALL, payload),
      ],
      createInstall: (): LifeCycleEventParams => [
        INSTALL_EVENTS.INSTALL,
        new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, payload),
      ],
      createPostInstall: (): LifeCycleEventParams => [
        INSTALL_EVENTS.POST_INSTALL,
        new LifeCycleInstallEvent(INSTALL_EVENTS.POST_INSTALL, payload),
      ],
    };
  }
}

export class LifeCycleBuildEvent extends AbstractLifeCycleEvent<BUILD_EVENTS> {
  static getParamsCreator(payload: LifeCycleEventPayload) {
    return {
      createPreBuild: (): LifeCycleEventParams => [
        BUILD_EVENTS.PRE_BUILD,
        new LifeCycleBuildEvent(BUILD_EVENTS.PRE_BUILD, payload),
      ],
      createBuild: (): LifeCycleEventParams => [
        BUILD_EVENTS.BUILD,
        new LifeCycleBuildEvent(BUILD_EVENTS.BUILD, payload),
      ],
      createPostBuild: (): LifeCycleEventParams => [
        BUILD_EVENTS.POST_BUILD,
        new LifeCycleBuildEvent(BUILD_EVENTS.POST_BUILD, payload),
      ],
    };
  }
}

export class LifeCycleRunEvent extends AbstractLifeCycleEvent<RUN_EVENTS> {
  static getParamsCreator(payload: LifeCycleEventPayload) {
    return {
      createPreRun: (): LifeCycleEventParams => [
        RUN_EVENTS.PRE_RUN,
        new LifeCycleRunEvent(RUN_EVENTS.PRE_RUN, payload),
      ],
      createRun: (): LifeCycleEventParams => [
        RUN_EVENTS.RUN,
        new LifeCycleRunEvent(RUN_EVENTS.RUN, payload),
      ],
      createPostRun: (): LifeCycleEventParams => [
        RUN_EVENTS.POST_RUN,
        new LifeCycleRunEvent(RUN_EVENTS.POST_RUN, payload),
      ],
    };
  }
}
