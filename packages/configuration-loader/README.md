# Alliage Configuration Loader

[![alliage-config-loader](https://img.shields.io/npm/v/alliage-config-loader/latest?color=%2300CC00&label=alliage-config-loader%40latest)](https://www.npmjs.com/package/alliage-config-loader)

Module allowing to load YAML configuration files.

## Dependencies

- [alliage-lifecycle](../lifecycle)

## Installation

```bash
yarn add alliage-config-loader
```

With npm

```bash
npm install alliage-config-loader
```

## Registration

If you have already installed [alliage-module-installer](../module-installer) you just have to run the following command:

```bash
$(npm bin)/alliage-scripts install alliage-config-loader
```

Otherwise, update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-config-loader": {
    "module": "alliage-config-loader",
    "deps": [
      "alliage-lifecycle",
    ],
    "envs": [],
  }
}
```

## Usage

### Create a configuration file

The first thing to do here is to create a configuration file.
It can be named the way we want but must end with the `.yaml` extension and be located in the `config` folder of the project.

Here's an example of a valid configuration file:

```yaml
# config/webserver.yaml
host: 127.0.0.1
port: 8080
credentials:
  username: thehumblejester
  password: '411!463|20(|(5'
```

### Load the configuration file

Once the file created, we just have to load it. To do so, we'll need to listen to the `CONFIG_EVENTS.LOAD` event and to use the `loadConfig` helper.

```js
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { CONFIG_EVENTS } from 'alliage-config-loader/events';
import { loadConfig } from 'alliage-config-loader/helpers';
import { validate } from 'alliage-config-loader/validators/json-schema';

const schema = {
  // ...
}

export = class MyModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig('webserver', validate(schema)),
    };
  }
};
```

We see that the `loadConfig` function takes 2 parameters.
The first one is the name of your configuration file (without the `.yaml` at the end) and the second one is a validation function that you can easily create with the `validate` helper.

### Validate the configuration file

Validating the file allows to make sure the user don't input invalid parameters that could break our app.

There's two way to validate the file:

- Create our own validation function which will throw an error in case invalid configuration
- Use the `validate` helper

The `validate` helper helps you to generate a validation function from a [JSON Schema](https://json-schema.org/).

If we take our previous example, we could write the following schema for our config file:

```js
const schema = {
  type: 'object',
  required: ['host', 'port', 'credentials'],
  properties: {
    host: {
      type: 'string',
    },
    port: {
      type: 'number',
    },
    credentials: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
      },
    },
  },
};
```

### Inject environment variables

At some point, we might want our app to be configurable through environment variables.
This can be useful for several reasons:

- Avoid to expose sensitive data such as passwords or API keys
- Have a different configuration depending on where the app is executed (local, production, etc...)
- Etc...

In a configuration file, we have the possibility to inject env variables by using the `$(ENV_VARIABLE_NAME)` syntax.

```yaml
# config/webserver.yaml
host: 127.0.0.1
port: 8080
credentials:
  username: '$(WEBSERVER_USERNAME)'
  password: '$(WEBSERVER_PASSWORD)'
```

#### Type conversion

As env variables only contains string we also have the possibility to convert them in any type like so:

```yaml
# config/webserver.yaml
host: 127.0.0.1
port: '$(WEBSERVER_PORT:number)' # convert to number
use_https: '$(WEBSERVER_USE_HTTPS:boolean)' # convert to boolean
whitelisted_ips: '$(WEBSERVER_WHITELISTED_IPS:array)' # convert to array
credentials: '$(WEBSERVER_CREDENTIALS:json)' # parse as json
```

- `number`: Just converts the value to number using `parseFloat`
- `boolean`: If the value is equal to `undefined`, `"0"` or `"false"` it will be considered as `false`, otherwise it will be `true`.
- `array`: Will split the string into an array of strings by using `,` as separator
- `json`: Will just parse the value as JSON by using `JSON.parse`

#### Default value

If there's a chance that our env variables are not defined we can also define default values by using the `?` operator like so:

```yaml
# config/webserver.yaml
host: '$(WEBSERVER_HOST?127.0.0.1)'
port: '$(WEBSERVER_PORT:number?8080)'
use_https: '$(WEBSERVER_USE_HTTPS:boolean?true)'
whitelisted_ips: '$(WEBSERVER_WHITELISTED_IPS:array?192.168.0.12,192.168.0.25)'
credentials: '$(WEBSERVER_CREDENTIALS:json?{"username": "thehumblejester", "password": "411!463|20(|(5"})'
```

### Access the configuration parameters

Once loaded, the configuration file content will be injected in the [service container parameters](../dependency-injection#parameterpath-string--parameters-object--stringbooleannumberobjectarray) so you can just require them as dependency of any of your services as you can see below:

```js
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { INIT_EVENTS, RUN_EVENTS } from 'alliage-lifecycle/events';
import { parameter } from 'alliage-di/dependencies';

import { MyService } from './MyService';

export = class MyModule extends AbstractLifeCycleAwareModule {
  // ...

  registerServices(serviceContainer) {
    serviceContainer.registerService('my_service', MyService, [
      parameter('webserver.host'),
      parameter('webserver.port'),
      parameter('webserver.credentials.username'),
      parameter('webserver.credentials.password'),
    ]);
  }
}
```

As you can see the first part of the path is actually the name of you configuration file (without the `.yaml` extension) and the rest of the path just matches the tree structure of the config file.

## Events

### Config events

```js
import { CONFIG_EVENTS } from 'alliage-config-loader/events';
```

| Type                                         | Event object                                                                | Description                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `CONFIG_EVENTS.PRE_LOAD`                     | [ConfigPreLoadEvent](#configpreloadevent)                                   | Before loader all configuration files                              |
| `CONFIG_EVENTS.LOAD`                         | [ConfigLoadEvent](#configloadevent)                                         | Registration of configuration files and validators                 |
| `CONFIG_EVENTS.PRE_FILE_LOAD`                | [ConfigPreFileLoadEvent](#configprefileloadevent)                           | Before reading one configuration file                              |
| `CONFIG_EVENTS.PRE_FILE_PARSE`               | [ConfigPreFileParseEvent](#configprefileparseevent)                         | Before parsing YAML content of one configuration file              |
| `CONFIG_EVENTS.POST_FILE_PARSE`              | [ConfigPostFileParseEvent](#configpostfileparseevent)                       | After parsing YAML content of one configuration file               |
| `CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION` | [ConfigPostEnvVariableInjectionEvent](#configpostenvvariableinjectionevent) | After having injected env variables of one configuration file      |
| `CONFIG_EVENTS.POST_FILE_LOAD`               | [ConfigPostFileLoadEvent](#configpostfileloadevent)                         | After having loaded on configuration file in the service container |
| `CONFIG_EVENTS.POST_LOAD`                    | [ConfigPostLoadEvent](#configpostloadevent)                                 | After having loaded all configuration files                        |

#### ConfigPreLoadEvent

This is the instance of the event object received in any `CONFIG_EVENTS.PRE_LOAD` listener.

- `getConfigPath(): string`: Returns the path of the configuration files folder
- `getConfigs(): { fileName: string, validator: Function}[]`: Returns the list of configs (should be an empty array at this moment)
- `setConfigPath(path: string): ConfigPreLoadEvent`: Allows to re-define the config files folder's path
- `setConfigs(configs: { fileName: string, validator: Function}[]): ConfigPreLoadEvent`: Allows to re-define the configs list

#### ConfigLoadEvent

This is the instance of the event object received in any `CONFIG_EVENTS.LOAD` listener.

- `getConfigs(): { fileName: string, validator: Function}[]`: Returns the list of configs
- `setConfigs(configs: { fileName: string, validator: Function}[]): ConfigLoadEvent`: Allows to re-define the configs list
- `addConfig(configs: { fileName: string, validator: Function}): ConfigLoadEvent`: Allows to add a new config to the list

#### ConfigPreFileLoadEvent

This is the instance of the event object received in any `CONFIG_EVENTS.PRE_FILE_LOAD` listener.

- `getConfigPath(): string`: Returns the path of the configuration files folder
- `getFileName(): string`: Returns the name of the config about to be loaded
- `getFilePath(): string`: Returns the path of the config file about to be loaded
- `setFilePath(path: string): ConfigPreFileLoadEvent`: Allows to re-define the config's file path

#### ConfigPreFileParseEvent

This is the instance of the event object received in any `CONFIG_EVENTS.PRE_FILE_PARSE` listener.

- `getFileName(): string`: Returns the name of the config about to be parsed
- `getFilePath(): string`: Returns the path of the config file about to be parsed
- `getContent(): string`: Returns the raw content of the config file about to be parsed
- `setContent(content: string): ConfigPreFileParseEvent`: Allows to re-define the raw content of the config file about to be parsed

#### ConfigPostFileParseEvent

This is the instance of the event object received in any `CONFIG_EVENTS.POST_FILE_PARSE` listener.

- `getFileName(): string`: Returns the name of the parsed config
- `getFilePath(): string`: Returns the path of the parsed config file
- `getConfig(): object`: Returns the parsed content of the config
- `setConfig(config: object): ConfigPostFileParseEvent`: Allows to re-define the parsed content of the config

#### ConfigPostEnvVariableInjectionEvent

This is the instance of the event object received in any `CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION` listener.

- `getFileName(): string`: Returns the name of the config
- `getFilePath(): string`: Returns the path of the config file
- `getConfig(): object`: Returns the content of the config witch injected env variables
- `setConfig(config: object): ConfigPostEnvVariableInjectionEvent`: Allows to re-define the content of the config

#### ConfigPostFileLoadEvent

This is the instance of the event object received in any `CONFIG_EVENTS.POST_FILE_LOAD` listener.

- `getFileName(): string`: Returns the name of the config having been loaded
- `getFilePath(): string`: Returns the path of the config file having been loaded

#### ConfigPostLoadEvent

This is the instance of the event object received in any `CONFIG_EVENTS.POST_LOAD` listener.

- `getConfigs(): string`: Returns the name of the config having been loaded
