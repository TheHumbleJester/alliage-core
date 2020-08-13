# Alliage Parameters Loader
[![alliage-parameters-loader](https://img.shields.io/npm/v/alliage-parameters-loader/latest?color=%2300CC00&label=alliage-parameters-loader%40latest)](https://www.npmjs.com/package/alliage-parameters-loader)

Provides a generic configuration file to store any parameters we could need to configure our application.

## Dependencies

- [alliage-di](../dependency-injection)
- [alliage-lifecycle](../lifecycle)
- [alliage-module-installer](../module-installer)
- [alliage-config-loader](../configuration-loader)

## Installation

```bash
yarn add alliage-parameters-loader
```

With npm

```bash
npm install alliage-parameters-loader
```

## Registration

If you have already installed [alliage-module-installer](../module-installer) you just have to run the following command:

```bash
$(npm bin)/alliage-scripts install alliage-parameters-loader
```

Otherwise, update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-parameters-loader": {
    "module": "alliage-parameters-loader",
    "deps": [
      "alliage-lifecycle",
      "alliage-di",
      "alliage-module-installer",
      "alliage-config-loader"
    ],
    "envs": [],
  }
}
```

## Usage

Once installed, a new file located in `config/parameters.yaml` should be available.
The format of this file is totally free.

For example we could have something like that:

```yaml
# config/parameters.yaml
webserver:
  host: 127.0.0.1
  port: 8080
  credentials:
    username: thehumblejester
    password: '411!463|20(|(5'
```

Then, everything would be available as a dependency of any service as in the following example:

```js
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { INIT_EVENTS, RUN_EVENTS } from 'alliage-lifecycle/events';
import { parameter } from 'alliage-di/dependencies';

import { MyService } from './MyService';

export = class MyModule extends AbstractLifeCycleAwareModule {
  // ...

  registerServices(serviceContainer) {
    serviceContainer.registerService('my_service', MyService, [
      parameter('parameters.webserver.host'),
      parameter('parameters.webserver.port'),
      parameter('parameters.webserver.credentials'),
    ]);
  }
}
```