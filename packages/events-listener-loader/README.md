# Alliage Events Listener Loader
[![alliage-events-listener-loader](https://img.shields.io/npm/v/alliage-events-listener-loader/latest?color=%2300CC00&label=alliage-events-listener-loader%40latest)](https://www.npmjs.com/package/alliage-events-listener-loader)

Provides a way to create events listener in an Alliage application without having to create a module

## Dependencies

- [alliage-di](../dependency-injection)
- [alliage-lifecycle](../lifecycle)

## Installation

```bash
yarn add alliage-events-listener-loader
```

With npm

```bash
npm install alliage-events-listener-loader
```

## Registration

If you have already installed [alliage-module-installer](../module-installer) you just have to run the following command:

```bash
$(npm bin)/alliage-scripts install alliage-events-listener-manager
```

Otherwise, update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-events-listener-loader": {
    "module": "alliage-events-listener-loader",
    "deps": [
      "alliage-di",
      "alliage-lifecycle",
      "alliage-service-loader"
    ],
    "envs": [],
  }
}
```

## Usage

All we need to do to create an events listener is to create class extending the `AbstractEventsListener` and to register it as a service as we can see below:

```js
import { AbstractEventsListener } from 'alliage-events-listener-loader/events-listener';
import { RUN_EVENTS } from 'alliage-lifecycle/events';
import { Service } from 'alliage-service-loader/decorators';

class MyEventsListener extends AbstractEventsListener {
  getEventHandlers() {
    return {
      [RUN_EVENTS.PRE_RUN]: this.handlePreRun,
      [RUN_EVENTS.POST_RUN]: this.handlePostRun,
    };
  }

  handlePreRun() {
    process.stdout.write('Test pre run\n');
  }

  handlePostRun() {
    process.stdout.write('Test post run\n');
  }
}

export default Service('my_events_listener')(MyEventsListener);
```

As we can see in the previous example, all we need to implement the `getEventHandlers` method which must return an object whose key are the events we want to handle and the value are the functions called when an event occurs.

### Restrictions

As the load of the events listeners happens during the initialization phase it's not possible to listen to any event happening duting the initialization phase.