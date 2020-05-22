import {
  Constructor,
  Dependency,
  service,
  DEPENDENCY,
  instanceOf,
  allInstancesOf,
  parameter,
  ParameterGetter,
} from './dependencies';

export enum SERVICE_STATE {
  NOT_LOADED = 'SERVICE_STATE/NOT_LOADED',
  LOADING = 'SERVICE_STATE/LOADING',
  LOADED = 'SERVICE_STATE/LOADED',
}

interface Service {
  instance: Object | null;
  ctor: Constructor;
  dependencies: Dependency[];
  state: SERVICE_STATE;
}

type Parameter = string | number | boolean | Parameter[] | { [key: string]: Parameter };

export class ParameterBag extends Map<string, Parameter> {}
export class ServiceBag extends Map<string, Service> {}

export class ServiceContainerError extends Error {}
export class AlreadyRegisteredError extends ServiceContainerError {}
export class AlreadyExistingParameterError extends ServiceContainerError {}
export class FrozenError extends ServiceContainerError {}
export class UnknownServiceError extends ServiceContainerError {}
export class UnknownParameterError extends ServiceContainerError {}
export class CircularReferenceError extends ServiceContainerError {}
export class InstanceNotFoundError extends ServiceContainerError {}
export class UnhandledDependencyType extends ServiceContainerError {}

export class ServiceContainer {
  private serviceBag: Map<string, Service>;

  private parameterBag: Map<string, Parameter>;

  private isFrozen: boolean;

  constructor() {
    this.serviceBag = new ServiceBag();
    this.parameterBag = new ParameterBag();
    this.isFrozen = false;
  }

  public freeze() {
    this.isFrozen = true;
    return this;
  }

  private throwIfFrozen() {
    if (this.isFrozen) {
      throw new FrozenError('The service container is frozen.');
    }
  }

  private throwIfAlreadyExists(name: string) {
    if (this.serviceBag.has(name)) {
      throw new AlreadyRegisteredError(`Service "${name}" has already been registered`);
    }
  }

  public registerService(name: string, ctor: Constructor, dependencies: Dependency[] = []) {
    this.throwIfFrozen();
    this.throwIfAlreadyExists(name);
    this.serviceBag.set(name, {
      instance: null,
      ctor,
      dependencies,
      state: SERVICE_STATE.NOT_LOADED,
    });
    return this;
  }

  public addService(name: string, instance: Object) {
    this.throwIfFrozen();
    this.throwIfAlreadyExists(name);
    this.serviceBag.set(name, {
      instance,
      ctor: instance.constructor as Constructor,
      dependencies: [],
      state: SERVICE_STATE.LOADED,
    });

    return this;
  }

  public setParameter(name: string, value: Parameter) {
    this.throwIfFrozen();
    if (this.parameterBag.has(name)) {
      throw new AlreadyExistingParameterError(`The parameter "${name}" already exists`);
    }
    this.parameterBag.set(name, value);

    return this;
  }

  public getService<T extends Object>(name: string) {
    return this.getDependency<T>(service(name));
  }

  public getInstanceOf<T>(ctor: Constructor) {
    return this.getDependency<T>(instanceOf(ctor));
  }

  public getAllInstancesOf<T>(ctor: Constructor) {
    return this.getDependency<T[]>(allInstancesOf(ctor));
  }

  public getParameter<T = Parameter>(path: string) {
    return this.getDependency<T>(parameter(path));
  }

  public getDependency<T = any>(dependency: Dependency): T {
    return <T>this.loadDependency(dependency);
  }

  private loadDependency(dependency: Dependency) {
    switch (dependency.type) {
      case DEPENDENCY.SERVICE:
        return this.loadService(dependency.name);
      case DEPENDENCY.PARAMETER:
        return this.loadParameter(dependency.getter);
      case DEPENDENCY.INSTANCE_OF:
        return this.loadInstanceOf(dependency.ctor);
      case DEPENDENCY.ALL_INSTANCES_OF:
        return this.loadAllInstancesOf(dependency.ctor);
      default:
        throw new UnhandledDependencyType(`Can't handle this dependency type`);
    }
  }

  private loadService(name: string) {
    const loadedService = this.serviceBag.get(name);
    if (!loadedService) {
      throw new UnknownServiceError(`The service "${name}" does not exist`);
    }
    if (loadedService.state === SERVICE_STATE.LOADING) {
      throw new CircularReferenceError(`Circular reference of the "${name}" service`);
    }
    if (loadedService.state === SERVICE_STATE.LOADED) {
      return loadedService.instance;
    }
    loadedService.state = SERVICE_STATE.LOADING;

    const deps: any[] = loadedService.dependencies.map((dep) => this.loadDependency(dep));
    const ServiceCtor = loadedService.ctor;
    loadedService.instance = new ServiceCtor(...deps);

    loadedService.state = SERVICE_STATE.LOADED;
    return loadedService.instance;
  }

  private loadParameter(getter: ParameterGetter) {
    let isUnknown = false;
    let res: any;
    try {
      res = getter(
        Array.from(this.parameterBag.entries()).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as { [key: string]: Parameter }),
      );
    } catch (e) {
      if (e instanceof TypeError) {
        isUnknown = true;
      } else {
        throw e;
      }
    }

    if (isUnknown || res === undefined) {
      throw new UnknownParameterError(`The parameter '${getter.name}' does not exist`);
    }

    return res;
  }

  private loadInstanceOf(ctor: Constructor) {
    const serviceName = this.getServiceNameByConstructor(ctor).next().value;
    if (!serviceName) {
      throw new InstanceNotFoundError(`Can't find any instance of ${ctor}`);
    }
    return this.loadService(serviceName);
  }

  private loadAllInstancesOf(ctor: Constructor) {
    const instances = [];
    for (const name of this.getServiceNameByConstructor(ctor)) {
      instances.push(this.loadService(name));
    }
    return instances;
  }

  private *getServiceNameByConstructor(ctor: Constructor) {
    for (const [name, serviceDetails] of this.serviceBag) {
      if (
        serviceDetails.ctor === ctor ||
        serviceDetails.ctor.prototype === ctor ||
        serviceDetails.ctor.prototype instanceof ctor
      ) {
        yield name;
      }
    }
  }
}
