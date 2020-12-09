# Alliage Dependency Injection

[![alliage-di](https://img.shields.io/npm/v/alliage-di/latest?color=%2300CC00&label=alliage-di%40latest)](https://www.npmjs.com/package/alliage-di)

Module providing dependency injection feature in an Alliage application.

## Installation

```bash
yarn add alliage-di
```

With npm

```bash
npm install alliage-di
```

## Registration

Update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-di": {
    "module": "alliage-di",
    "deps": [],
    "envs": [],
  }
}
```

## Usage

Once installed and registered this module will automatically inject a `service_container` object in the `PrimitiveContainer` received as third argument in any event handlers _(only if your module has a dependency on `alliage-di` of course)_:

```js
import { AbstractModule } from 'alliage/core/module';

export = class MyFirstModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args, env, container) => {
    // Here's how we get the ServiceContainer
    const serviceContainer = container.get('service_container');
  };
};
```

### Service container

The service container is an object allowing you to register and get services. It takes care of instanciating services and providing them their dependencies automatically.

Here is the documentation of the exposed methods:

#### `registerService(name: string, constructor: Constructor, dependencies: Dependency[])`

This methods allow you to register a service to use it later in your code.

It takes the following parameters:

- **name (`string`)**: The name of your service. Must be unique.
- **constructor (`Constructor`)**: The constructor of your service (a class).
- **dependencies (`Dependency[]`)**: Everything your service needs to work correctly. Each dependency will be injected as arguments of the contructor during the instanciation.

```js
import { service } from 'alliage-di/dependencies';

class MyService {
  constructor(otherService) {
    this.otherService = otherService;
  }

  // ...
}

// ...

serviceContainer.registerService(
  'my_service', // name
  MyService, // constructor
  [service('other_service')], // dependencies
);
```

For more information about the other kind of dependency, have a look [here](#dependencies).

#### `addService(name: string, service: object)`

This method serves the same purpose than the previous one except that it works for already instanciated services.

It takes the following parameters:

- **name (`string`)**: The name of your service. Must be unique.
- **service (`object`)**: A service's instance.

```js
import { MyService } from './MyService';

// ...

const myService = new MyService();

serviceContainer.addService(
  'my_service', // name
  myService, // service
);
```

#### `setParameter(name: string, value: string|boolean|number|object|array)`

This method allows to set a parameter. Parameters are a specific kind of dependency totally separated from the service concept.
They are just static values such as strings, numbers, booleans, plain objects or arrays.

It takes the following parameters:

- **name (`string`)**: The name of your parameter. Must be unique.
- **value (`string|boolean|number|object|array`)**: The value of your parameter.

```js
// ...

serviceContainer.setParameter('foo', 'bar');
serviceContainer.setParameter('answer', 42);
serviceContainer.setParameter('colors', ['red', 'green', 'blue']);
serviceContainer.setParameter('credentials', { username: 'Neo', password: 'Nebuchadnezzar' });
```

#### `getService(name: string)`

Gets a service by its name.

It takes the following parameters:

- **name (`string`)**: Name of the service to return.

```js
// ...

const myService = serviceContainer.getService('my_service');
```

#### `getInstanceOf(ctor: Constructor)`

Gets a service being an instance of the given constructor or of a constructor derivated from the given one.

It takes the following parameters:

- **ctor (`Constructor`)**: Instanciable constructor (a class).

```js
import { MyService } from './MyService';

// ...

const myService = serviceContainer.getInstanceOf(MyService);
```

#### `getAllInstancesOf(ctor: Constructor)`

Same as above except that it returns a list of all services using this constructor.

It takes the following parameters:

- **ctor (`Constructor`)**: Instanciable constructor (a class).

```js
import { MyService } from './MyService';

// ...

const myServices = serviceContainer.getAllInstancesOf(MyService);
```

#### `getParameter(path: string)`

Gets a parameter's value by its path.

- **path (`string`)**: Path to the parameter's value.

```js
// ...

const bar = serviceContainer.getParameter('parameters.foo[0].bar');
```

#### `getDependency(dependency: Dependency)`

Gets a dependency. To know more about dependencies, it's right [there](#dependencies).

It takes the following parameters:

- **dependency (`Dependency`)**: The kind of dependency we want to get.

```js
import { service } from 'alliage-di/dependencies';

// ...

const myService = serviceContainer.getDependency(service('my_service'));
```

#### `freeze()`

Freezes the service container. Once frozen, any attempt to call `registerService`, `addService` or `setParameter` will fail and raise an error.
The goal this method is to avoid any mutation of the service container while in use. It must be called once you're done registering services and setting parameters.

```js
// ...

serviceContainer.freeze();
```

### Dependencies

Dependencies are available from the `alliage-di/dependencies` module and allows you to define what should be injected in your service during its instanciation or to find one or more services matching specific criteria.

They can be used at the registration of the service, like so:

```js
import { service, instanceOf, allInstancesOf, parameter } from 'alliage-di/dependencies';

// ...

serviceContainer.registerService(
  'my_service', // name
  MyService, // constructor
  // dependencies
  [
    service('other_service'),
    instanceOf(AbstractServiceOne),
    allInstancesOf(AbstractServiceTwo),
    parameter('parameters.foo[0].bar'),
  ],
);
```

Or to fetch a specific dependency, like so:

```js
import { service, instanceOf, allInstancesOf, parameter } from 'alliage-di/dependencies';

// ...

const otherService = serviceContainer.getDependency(service('other_service'));
const serviceOne = serviceContainer.getDependency(instanceOf(AbstractServiceOne));
const serviceTwos = serviceContainer.getDependency(allInstancesOf(AbstractServiceTwo));
const bar = serviceContainer.getDependency(parameter('parameters.foo[0].bar'));
```

#### `service(name: string)`

Creates a dependency to a service by its name.

#### `instanceOf(constructor: Constructor)`

Creates a dependency to a service by its constructor. It can match with a service instanciated from the given constructor or with any service instanciated from one derived directly or not from the given constructor.

This will inject only one service so, if several of them matche this dependency, only the first one will be injected.

#### `allInstancesOf(constructor: Constructor)`

Same as the previous one except that instead of injecting only one service it will inject all of those matching.

#### `parameter(path: string | (parameters: object) => string|boolean|number|object|array)`

Creates a dependency to a parameter by its path.

The path can be both a string or a function.

- When it's a string, it must be the path to the wanted parameter. Ex: `'myParameter.arrayOfValues[0].property'`.
- When it's a function, this one will receive an object containing all the parameters and must return the wanted portion of this object.

### Default dependencies

The service container instanciated in the Alliage app will contain 2 depdendencies by default:

- `service('service_container')`: The service container itself.
- `parameter('environment')`: The execution environment as defined in the `--env` argument of the `alliage-scripts`.
