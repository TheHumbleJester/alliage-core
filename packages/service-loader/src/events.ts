import { Dependency } from 'alliage-di/dependencies';
import { AbstractWritableEvent, AbstractEvent } from 'alliage-lifecycle/events';

export enum SERVICE_LOADER_EVENTS {
  BEFORE_ALL = '@service-loader/SERVICE_LOADER_EVENTS/BEFORE_ALL',
  AFTER_ALL = '@service-loader/SERVICE_LOADER_EVENTS/AFTER_ALL',
  BEFORE_ONE = '@service-loader/SERVICE_LOADER_EVENTS/BEFORE_ONE',
  AFTER_ONE = '@service-loader/SERVICE_LOADER_EVENTS/AFTER_ONE',
}

export interface ServiceLoaderAllEventPayload {
  basePath: string;
  paths: string[];
  exclude: string[];
}

export class ServiceLoaderBeforeAllEvent extends AbstractWritableEvent<
  SERVICE_LOADER_EVENTS,
  ServiceLoaderAllEventPayload
> {
  constructor(basePath: string, paths: string[], exclude: string[]) {
    super(SERVICE_LOADER_EVENTS.BEFORE_ALL, { basePath, paths, exclude });
  }

  getBasePath() {
    return this.getPayload().basePath;
  }

  getPaths() {
    return Object.freeze(this.getWritablePayload().paths);
  }

  getExclude() {
    return Object.freeze(this.getWritablePayload().exclude);
  }

  setPaths(paths: string[]) {
    this.getWritablePayload().paths = paths;
    return this;
  }

  setExclude(exclude: string[]) {
    this.getWritablePayload().exclude = exclude;
    return this;
  }
}

export class ServiceLoaderAfterAllEvent extends AbstractEvent<
  SERVICE_LOADER_EVENTS,
  ServiceLoaderAllEventPayload
> {
  constructor(basePath: string, paths: string[], exclude: string[]) {
    super(SERVICE_LOADER_EVENTS.AFTER_ALL, { basePath, paths, exclude });
  }

  getBasePath() {
    return this.getPayload().basePath;
  }

  getPaths() {
    return Object.freeze(this.getPayload().paths);
  }

  getExclude() {
    return Object.freeze(this.getPayload().exclude);
  }

  static getParams(basePath: string, paths: readonly string[], exclude: readonly string[]) {
    return super.getParams(basePath, paths, exclude);
  }
}

export interface ServiceLoaderOneEventPayload {
  modulePath: string;
  name: string;
  constructor: any;
  dependencies: Dependency[];
}

export class ServiceLoaderBeforeOneEvent extends AbstractWritableEvent<
  SERVICE_LOADER_EVENTS,
  ServiceLoaderOneEventPayload
> {
  constructor(modulePath: string, name: string, constructor: any, dependencies: Dependency[]) {
    super(SERVICE_LOADER_EVENTS.BEFORE_ONE, { modulePath, name, constructor, dependencies });
  }

  getModulePath() {
    return this.getPayload().modulePath;
  }

  getName() {
    return this.getPayload().name;
  }

  getConstructor() {
    return this.getWritablePayload().constructor;
  }

  getDependencies() {
    return Object.freeze(this.getWritablePayload().dependencies);
  }

  setConstructor(constructor: any) {
    this.getWritablePayload().constructor = constructor;
    return this;
  }

  setDependencies(dependencies: Dependency[]) {
    this.getWritablePayload().dependencies = dependencies;
    return this;
  }
}

export class ServiceLoaderAfterOneEvent extends AbstractEvent<
  SERVICE_LOADER_EVENTS,
  ServiceLoaderOneEventPayload
> {
  constructor(modulePath: string, name: string, constructor: any, dependencies: Dependency[]) {
    super(SERVICE_LOADER_EVENTS.AFTER_ONE, { modulePath, name, constructor, dependencies });
  }

  getModulePath() {
    return this.getPayload().modulePath;
  }

  getName() {
    return this.getPayload().name;
  }

  getConstructor() {
    return this.getPayload().constructor;
  }

  getDependencies() {
    return Object.freeze(this.getPayload().dependencies);
  }

  static getParams(
    modulePath: string,
    name: string,
    constructor: any,
    dependencies: readonly Dependency[],
  ) {
    return super.getParams(modulePath, name, constructor, dependencies);
  }
}
