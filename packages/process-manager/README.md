# Alliage Process Manager

[![alliage-process-manager](https://img.shields.io/npm/v/alliage-process-manager/latest?color=%2300CC00&label=alliage-process-manager%40latest)](https://www.npmjs.com/package/alliage-process-manager)

This modules allows to define processes that can be executed through the alliage's run script.

## Dependencies

- [alliage-di](../dependency-injection)
- [alliage-lifecycle](../lifecycle)
- [alliage-service-loader](../service-loader)
- [alliage-config-loader](../configuration-loader)

## Installation

```bash
yarn add alliage-process-manager
```

With npm

```bash
npm install alliage-process-manager
```

## Registration

If you have already installed [alliage-module-installer](../module-installer) you just have to run the following command:

```bash
$(npm bin)/alliage-scripts install alliage-process-manager
```

Otherwise, update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-process-manager": {
    "module": "alliage-process-manager",
    "deps": [
      "alliage-di",
      "alliage-lifecycle",
      "alliage-service-loader",
      "alliage-config-loader"
    ],
    "envs": [],
  }
}
```

## Usage

### Define a process

Processes are the entry points of the application.
They will usually hold (directly or not) the business logic of our project.

To define a process, it's pretty simple, we'll just have to implement a class extending the `AbstractProcess` class and to register it as a service.

```js
import { AbstractProcess } from 'alliage-process-manager/process';
import { Service } from 'alliage-service-loader/decorators';

class MyProcess extends AbstractProcess {
  getName() {
    return 'my-process';
  }

  async execute(args, env) {
    process.stdout.write(`Hello world !`);

    // Returning "true" means that the process ran successfully
    // Returning "false" means that process didn't run successfully
    return true;
  }
}

export default Service('my_process')(MyProcess);
```

A process class must implement the following method:

- `getName()`: Returns the process name. Must be unique among all processes.
- `execute(args: Arguments, env: string): boolean | Promise<boolean>`: Contains the business logic of the process. It take the following parameters:
  - `args`: The [arguments](https://github.com/TheHumbleJester/alliage#the-argument-class) passed to the alliage's run script
  - `env`: The execution environment

### Run a process

Once our process is created we can run it simply by running the following command:

```bash
$(npm bin)/alliage-scripts run my-process
```

In this example, `my-process` is actually the name of the process as defined in the `getName` method.

And then, we should have the following output:

```bash
Hello world !
```

### Configure the arguments

If we want our process to depend on user input we can make it accept specific arguments.
To do so, we have to implement the `configure` method as in the following example.

```js
import { AbstractProcess } from 'alliage-process-manager/process';
import { Service } from 'alliage-service-loader/decorators';

class MyProcess extends AbstractProcess {
  getName() {
    return 'my-process';
  }

  configure(builder) {
    // We expect one argument called "name"
    builder.addArgument('name', {
      type: 'string',
      describe: 'Your name',
    });
  }

  async execute(args, env) {
    // We use the "name" argument in the output
    process.stdout.write(`Hello ${args.get('name')} !`);

    return true;
  }
}

export default Service('my_process')(MyProcess);
```

The `configure` method will receive an instance of [`CommandBuilder`](https://github.com/TheHumbleJester/alliage#configure-the-command) allowing us to define what arguments or options we expect.

Now we can run this process like this:

```bash
$(npm bin)/alliage-scripts run my-process Bruce
```

And we should get the following output:

```bash
Hello Bruce !
```

### Handle process termination

A process can stop for many reasons. The first and most obvious one is when it has finished the job it was made for.
That's the most optimistic scenario.

But it can also stop when we don't necessarily want it to for many other reasons such as:

- The system or the user killing the process
- Unhandled errors at a deeper level of the call stack
- And so on...

Hopefully, this module takes care of these edge cases and will let us do stuff right before the process shuts down.

All we need to do is to implement the `terminate(args: Arguments, env: string, signal: SIGNAL, payload: SignalPayload): void | Promise<void>` method.

This method will be called whether the process stopped naturally or not and receive the following parameters:

- `args`: The [arguments](https://github.com/TheHumbleJester/alliage#the-argument-class) passed to the alliage's run script
- `env`: The execution environment
- `signal`: The reason why the process stops
- `payload`: Additional information bringing more context to the reason of the shutdown.

#### Signal

The signal sent to the `terminate` method can have the following values:

```js
import { SIGNAL } from 'alliage-process-manager/process';

// When the process received a SIGTERM signal
SIGNAL.SIGTERM;

// When the process received a SIGINT signal
SIGNAL.SIGINT;

// In case of uncaught exception
SIGNAL.UNCAUGHT_EXCEPTION;

// In case of unhandled rejection
SIGNAL.UNHANDLED_REJECTION;

// When the process stops naturally with a success return code
SIGNAL.SUCCESS_SHUTDOWN;

// When the process stops naturally with a failure return code
SIGNAL.FAILURE_SHUTDOWN;
```

#### Signal payload

According to the signal, the signal payload will contain different information.

In case of `UNCAUGHT_EXCEPTION` it will have the following shape:

```js
{
  error: Error; // The thrown exception
}
```

In case of `UNHANDLED_REJECTION` it will have the following shape:

```js
{
  reason: {} | null, // The rejection's value
  promise: Promise<any> // The rejected promise
}
```

And for any other signal, the payload will be empty.

#### Use case

Usually, the terminate method will be used to close resources that we could have opened at the beginning of the execution. Like in the following example:

```js
import { AbstractProcess } from 'alliage-process-manager/process';
import { Service } from 'alliage-service-loader/decorators';
import { service } from 'alliage-di/dependencies';

class MyProcess extends AbstractProcess {
  construct(database) {
    this.database = database;
  }

  getName() {
    return 'my-process';
  }

  async execute(args, env) {
    // We open a connection to the DB
    await this.database.connect();

    // Do stuff...

    return true;
  }

  async terminate() {
    // When the process stops, we close the connection
    await this.database.disconnect();
  }
}

export default Service('my_process', [
  // Dummy service representing an abstraction layer of the DB
  service('database'),
])(MyProcess);
```

### Hang a process

To avoid us having to deal with the weirdness of the NodeJS event loop a process will systematically stops once the `execute` function code has done being processed.

But this can be problematic in some cases when we execute code that does things in the background like, for example, running an express server.

For this specific use case, we can use the `waitToBeShutdown` method. This method will allow the process to hang until it gets shutdown naturally (with the help of the `shutdown` method) or not.

Example just below:

```js
import express from 'express';

import { AbstractProcess } from 'alliage-process-manager/process';
import { Service } from 'alliage-service-loader/decorators';

class MyProcess extends AbstractProcess {
  construct(database) {
    this.database = database;
  }

  getName() {
    return 'my-process';
  }

  async execute(args, env) {
    const app = express();

    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    // This endpoint will allow us to stop the server
    app.get('/shutdown', (req, res) => {
      // This stops the process
      this.shutdown();
    });

    app.listen(8080);

    // This allows the process to hang until it gets shut down
    return await this.waitToBeShutdown();
  }
}

export default Service('my_process')(MyProcess);
```

## Events

### Process events

```js
import { PROCESS_EVENTS } from 'alliage-process-manager/events';
```

| Type                            | Event object                              | Description                                             |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| `PROCESS_EVENTS.PRE_CONFIGURE`  | [PreConfigureEvent](#preconfigureevent)   | Before calling the `configure` method of a process      |
| `PROCESS_EVENTS.POST_CONFIGURE` | [PostConfigureEvent](#postconfigureevent) | After having called the `configure` method of a process |
| `PROCESS_EVENTS.PRE_EXECUTE`    | [PreExecuteEvent](#preexecuteevent)       | Before executing a process                              |
| `PROCESS_EVENTS.PRE_TERMINATE`  | [PreTerminateEvent](#preterminateevent)   | Before shutting down a process                          |
| `PROCESS_EVENTS.POST_TERMINATE` | [PostTerminateEvent](#postterminateevent) | After having shut down a process                        |

#### PreConfigureEvent

This is the instance of the event object received in any `PROCESS_EVENTS.PRE_CONFIGURE` listener.

- `getProcess(): AbstractProcess`: Returns the process about to be configured
- `getConfig(): CommandBuilder`: Returns the command builder about to be sent to the process
- `getEnv(): string`: Returns the execution environment

#### PostConfigureEvent

This is the instance of the event object received in any `PROCESS_EVENTS.POST_CONFIGURE` listener.

- `getProcess(): AbstractProcess`: Returns the process about that has been configured
- `getConfig(): CommandBuilder`: Returns the command builder that has been sent to the process
- `getEnv(): string`: Returns the execution environment

#### PreExecuteEvent

This is the instance of the event object received in any `PROCESS_EVENTS.PRE_EXECUTE` listener.

- `getProcess(): AbstractProcess`: Returns the process about that has been configured
- `getArgs(): Arguments`: Returns the arguments about to be sent to the process
- `getEnv(): string`: Returns the execution environment
- `setProcess(process: AbstractProcess): PreExecuteEvent`: Allows to re-define the process about to be executed

#### PreTerminateEvent

This is the instance of the event object received in any `PROCESS_EVENTS.PRE_TERMINATE` listener.

- `getProcess(): AbstractProcess`: Returns the process about that has been configured
- `getArgs(): Arguments`: Returns the arguments about to be sent to the process
- `getSignal(): Signal`: Returns [signal](#signal) sent to the process
- `getSignalPayload(): SignalPayload`: Returns [signal payload](#signal-payload) sent to the process
- `getEnv(): string`: Returns the execution environment

#### PostTerminateEvent

This is the instance of the event object received in any `PROCESS_EVENTS.POST_TERMINATE` listener.

- `getProcess(): AbstractProcess`: Returns the process about that has been configured
- `getArgs(): Arguments`: Returns the arguments about to be sent to the process
- `getSignal(): Signal`: Returns [signal](#signal) sent to the process
- `getSignalPayload(): SignalPayload`: Returns [signal payload](#signal-payload) sent to the process
- `getEnv(): string`: Returns the execution environment
