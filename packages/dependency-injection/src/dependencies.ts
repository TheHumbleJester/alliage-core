export enum DEPENDENCY {
  SERVICE = 'DEPENDENCY/SERVICE',
  PARAMETER = 'DEPENDENCY/PARAMETER',
  INSTANCE_OF = 'DEPENDENCY/INSTANCE_OF',
  ALL_INSTANCES_OF = 'DEPENDENCY/ALL_INSTANCES_OF',
}

export type Constructor = {
  new (...args: any): any;
};

export interface ServiceDependency {
  type: DEPENDENCY.SERVICE;
  name: string;
}

export interface ParameterDependency {
  type: DEPENDENCY.PARAMETER;
  getter: (parameters: object) => any;
}

export interface InstanceOfDependency {
  type: DEPENDENCY.INSTANCE_OF;
  ctor: Constructor;
}

export interface AllInstancesOfDependency {
  type: DEPENDENCY.ALL_INSTANCES_OF;
  ctor: Constructor;
}

export type Dependency =
  | ServiceDependency
  | ParameterDependency
  | InstanceOfDependency
  | AllInstancesOfDependency;

export function service(name: string): ServiceDependency {
  return {
    type: DEPENDENCY.SERVICE,
    name,
  };
}

export type ParameterGetter = (parameters: object) => any;

export function parameter(path: string | ParameterGetter): ParameterDependency {
  let getter: ParameterGetter;
  if (typeof path === 'string') {
    getter = <ParameterGetter>new Function('parameters', `return parameters.${path}`); // eslint-disable-line no-new-func
    Object.defineProperty(getter, 'name', { value: path });
  } else {
    getter = path;
  }
  return {
    type: DEPENDENCY.PARAMETER,
    getter,
  };
}

export function instanceOf(ctor: Constructor): InstanceOfDependency {
  return {
    type: DEPENDENCY.INSTANCE_OF,
    ctor,
  };
}

export function allInstancesOf(ctor: Constructor): AllInstancesOfDependency {
  return {
    type: DEPENDENCY.ALL_INSTANCES_OF,
    ctor,
  };
}
