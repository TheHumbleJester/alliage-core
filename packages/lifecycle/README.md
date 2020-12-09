# Alliage Lifecycle

[![alliage-lifecycle](https://img.shields.io/npm/v/alliage-lifecycle/latest?color=%2300CC00&label=alliage-lifecycle%40latest)](https://www.npmjs.com/package/alliage-lifecycle)

This module brings more granularity in the initial alliage events easing the definition of priority in the events execution order other than just playing with modules dependencies.

It also allows to trigger events in your own modules to make them extendable with other modules.

## Dependencies

- [alliage-di](../dependency-injection)

## Installation

```bash
yarn add alliage-lifecycle
```

With npm

```bash
npm install alliage-lifecycle
```

## Registration

Update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-lifecycle": {
    "module": "alliage-lifecycle",
    "deps": ["alliage-di"],
    "envs": [],
  }
}
```

## Usage

### EventManager

The event manager is a service automatically injected in the [service container](../dependency-injection#service-container).

You can get it directly in your own alliage module like so:

```js
import { AbstractModule } from 'alliage/core/module';

export = class MyFirstModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (args, env, container) => {
    const serviceContainer = container.get('service_container');

    // Here's how we get the EventManager
    const eventManager = serviceContainer.get('event_manager');
  };
};
```

Or get it injected in any of your services, as below:

```js
import { service } from 'alliage-di/dependencies';

class MyService {
  constructor(eventManager) {
    this.eventManager = eventManager;
  }

  // ...
}

// ...

serviceContainer.registerService('my_service', MyService, [service('event_manager')]);
```

The event manager has an API close to `EventEmitter` allowing to emit and listen to events. The particularity is that listeners can be `async` and will then be executed sequentially.

It has the following methods:

- `on(eventType: string, listener: (...args: any[]) => void | Promise<void>)`: Listen to the `eventType` event and calls `listener` when the event is emitted. It returns a function allowing to unsubscribe from the event.
- `emit(eventType: string, ...args: any[])`: Emit the `eventType` event and pass `...args` to any of the event's listeners.

#### AbstractEvent

Even if you can potentially send anything you want to an event listener when emitting an event, it's highly encouraged to send an instance of `AbstractEvent`.

`AbstractEvent` is an abstract class helping you to build your own events' payloads.

Here's an example:

```js
import { AbstractEvent } from 'alliage-lifecycle/events';

// We create an event type
const LOGIN_EVENTS = {
  USER_LOGGED_IN: 'LOGIN_EVENTS/USER_LOGGED_IN',
};

// We create our own event class
class LoginUserLoggedEvent extends AbstractEvent {
  // The constructor takes the parameters needed to
  // build the payload
  constructor(userId) {
    super(
      LOGIN_EVENTS.USER_LOGGED_IN, // The event type
      { userId }, // The payload
    );
  }

  // We provide a method to ease access to
  // payload's property
  getUserId() {
    // AbstractEvent provides a method to
    // get the payload
    return this.getPayload().userId;
  }
}

// ...

const userLoggedEvent = new LoginUserLoggedEvent(42);

console.log(userLoggedEvent.getType()); // "LOGIN_EVENTS/USER_LOGGED_IN"
console.log(userLoggedEvent.getUserId()); // "42"

// This event can then be emitted using the EventManager
eventManager.emit(userLoggedEvent.getType(), userLoggedEvent);
```

#### AbstractWritableEvent

By convention, the payload of the `AbstractEvent` is read only. But at some point, you might want to let event listeners re-write some part of your payload.

To do so, you can use `AbstractWritableEvent` instead of `AbstractEvent`.

This class will just create a writable copy of your original payload that you'll be able to expose through getters and setters.

```js
import { AbstractWritableEvent } from 'alliage-lifecycle/events';

const CHECKOUT_EVENTS = {
  COMPUTE_FINAL_PRICE: 'CHECKOUT_EVENTS/COMPUTE_FINAL_PRICE',
};

// We make our event class extends AbstraxtWritableEvent this time.
class CheckoutComputeFinalPriceEvent extends AbstractWritableEvent {
  constructor(price, vatNumber, countryCode) {
    super(
      CHECKOUT_EVENTS.COMPUTE_FINAL_PRICE, // The event type
      { price, vatNumber, countryCode }, // The payload
    );
  }

  // VATNumber and Country code are not writable so we
  // make them use `getPayload`
  getVatNumber() {
    return this.getPayload().vatNumber;
  }

  getCountryCode() {
    return this.getPayload().countryCode;
  }

  // As price is writable, we make its getter method
  // use "getWritablePayload" instead of "getPayload"
  getPrice() {
    return this.getWritablePayload().price;
  }

  // We create a setter method allowing to
  // update the price
  // This method will be usually used by events listeners
  setPrice(price) {
    this.getWritablePayload().price = price;
    return this;
  }
}

// ...

const computeFinalPriceEvent = new CheckoutComputeFinalPriceEvent(42, 'FR01000000158', 'FR');

console.log(computeFinalPriceEvent.getPrice()); // 42
computeFinalPriceEvent.setPrice(38);
console.log(computeFinalPriceEvent.getPrice()); // 38
```

### Events

This module comes with its own set of events triggered at the different phases of an [alliage script lifecycle](https://github.com/TheHumbleJester/alliage#how-does-it-work-).

Everything related to events is available in the `alliage-lifecycle/events` module.

#### Types

##### Init

Init events are triggered before any other event.

```js
import { INIT_EVENTS } from 'alliage-lifecycle/events';

// ...

eventManager.on(INIT_EVENTS.PRE_INIT, (event) => console.log('Pre init event', event));
eventManager.on(INIT_EVENTS.INIT, (event) => console.log('Init event', event));
eventManager.on(INIT_EVENTS.POST_INIT, (event) => console.log('Post init event', event));
```

| Type                    | Event object                              | Description               |
| ----------------------- | ----------------------------------------- | ------------------------- |
| `INIT_EVENTS.PRE_INIT`  | [LifeCycleInitEvent](#lifecycleinitevent) | Before the initialization |
| `INIT_EVENTS.INIT`      | [LifeCycleInitEvent](#lifecycleinitevent) | Initialization            |
| `INIT_EVENTS.POST_INIT` | [LifeCycleInitEvent](#lifecycleinitevent) | After initialization      |

##### Install

Install events are triggered during the install script.

```js
import { INSTALL_EVENTS } from 'alliage-lifecycle/events';

// ...

eventManager.on(INSTALL_EVENTS.PRE_INSTALL, (event) => console.log('Pre install event', event));
eventManager.on(INSTALL_EVENTS.INSTALL, (event) => console.log('Install event', event));
eventManager.on(INSTALL_EVENTS.POST_INSTALL, (event) => console.log('Post install event', event));
```

| Type                          | Event object                                    | Description               |
| ----------------------------- | ----------------------------------------------- | ------------------------- |
| `INSTALL_EVENTS.PRE_INSTALL`  | [LifeCycleInstallEvent](#lifecycleinstallevent) | Before the install script |
| `INSTALL_EVENTS.INSTALL`      | [LifeCycleInstallEvent](#lifecycleinstallevent) | During install script     |
| `INSTALL_EVENTS.POST_INSTALL` | [LifeCycleInstallEvent](#lifecycleinstallevent) | After the install script  |

##### Build

Build events are triggered during the build script.

```js
import { BUILD_EVENTS } from 'alliage-lifecycle/events';

// ...

eventManager.on(BUILD_EVENTS.PRE_BUILD, (event) => console.log('Pre build event', event));
eventManager.on(BUILD_EVENTS.BUILD, (event) => console.log('Build event', event));
eventManager.on(BUILD_EVENTS.POST_BUILD, (event) => console.log('Post build event', event));
```

| Type                      | Event object                                | Description         |
| ------------------------- | ------------------------------------------- | ------------------- |
| `BUILD_EVENTS.PRE_BUILD`  | [LifeCycleBuildEvent](#lifecyclebuildevent) | Before build script |
| `BUILD_EVENTS.BUILD`      | [LifeCycleBuildEvent](#lifecyclebuildevent) | During build script |
| `BUILD_EVENTS.POST_BUILD` | [LifeCycleBuildEvent](#lifecyclebuildevent) | After build script  |

##### Run

Run events are triggered during the run script.

```js
import { RUN_EVENTS } from 'alliage-lifecycle/events';

// ...

eventManager.on(RUN_EVENTS.PRE_RUN, (event) => console.log('Pre run event', event));
eventManager.on(RUN_EVENTS.RUN, (event) => console.log('Run event', event));
eventManager.on(RUN_EVENTS.POST_RUN, (event) => console.log('Post run event', event));
```

| Type                  | Event object                            | Description       |
| --------------------- | --------------------------------------- | ----------------- |
| `RUN_EVENTS.PRE_RUN`  | [LifeCycleRunEvent](#lifecyclerunevent) | Before run script |
| `RUN_EVENTS.RUN`      | [LifeCycleRunEvent](#lifecyclerunevent) | During run script |
| `RUN_EVENTS.POST_RUN` | [LifeCycleRunEvent](#lifecyclerunevent) | After run script  |

#### Classes

##### LifeCycleInitEvent

This is the instance of the event object received in any `INIT_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/TheHumbleJester/alliage#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)

##### LifeCycleInstallEvent

This is the instance of the event object received in any `INSTALL_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/TheHumbleJester/alliage#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)
- `getContext(): INITIALIZATION_CONTEXT`: Returns the initialization context (`INITIALIZATION_CONTEXT.INSTALL`, `INITIALIZATION_CONTEXT.BUILD` or `INITIALIZATION_CONTEXT.RUN`)

##### LifeCycleBuildEvent

This is the instance of the event object received in any `BUILD_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/TheHumbleJester/alliage#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)

##### LifeCycleRunEvent

This is the instance of the event object received in any `RUN_EVENTS` listener.

- `getServiceContainer(): ServiceContainer`: Returns the [service container](../dependency-injection#service-container)
- `getArguments(): Arguments`: Returns the [arguments](https://github.com/TheHumbleJester/alliage#the-argument-class) of the current script
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)

### AbstractLifecycleAwareModule

The `AbstractLifecycleAwareModule` is a layer on top of `AbstractModule` easing the listening of lifecycle events and the registration of services.

You can use it instead of `AbstractModule` to create your modules.
All you need is to implement the following methods:

- `getEventHandlers()`: Returns the list of events you want your module to listen to and their corresponding listener.
- `registerServices(serviceContainer: ServiceContainer)` _(optional)_: Allows your module to register service or set parameters in the service container.

```js
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { INIT_EVENTS, RUN_EVENTS } from 'alliage-lifecycle/events';

import { MyService } from './MyService';

export = class MyModule extends AbstractLifeCycleAwareModule {
  // Here we subscribe to the INIT_EVENTS.INIT and RUN_EVENTS.RUN events
  getEventHandlers() {
    return {
      [INIT_EVENTS.INIT]: this.handleInit,
      [RUN_EVENTS.RUN]: this.handleRun,
    }
  }

  // Here we register services
  registerServices(serviceContainer) {
    serviceContainer.registerService('my_service', MyService, []);
  }

  handleInit = (event) => {
    // ...
  }

  handleRun = (event) => {
    // ...
  }
}
```
