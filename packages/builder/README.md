# Alliage Builder

[![alliage-builder](https://img.shields.io/npm/v/alliage-builder/latest?color=%2300CC00&label=alliage-builder%40latest)](https://www.npmjs.com/package/alliage-builder)

Provides a build pipeline system for an Alliage application

## Dependencies

- [alliage-lifecycle](../lifecycle)
- [alliage-config-loader](../configuration-loader)
- [alliage-module-installer](../module-installer)

## Installation

```bash
yarn add -D alliage-builder
```

With npm

```bash
npm install --dev alliage-builder
```

## Registration

If you have already installed [alliage-module-installer](../module-installer) you just have to run the following command:

```bash
$(npm bin)/alliage-scripts install alliage-builder
```

Otherwise, update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-builder": {
    "module": "alliage-builder",
    "deps": [
      "alliage-lifecycle",
      "alliage-config-loader",
      "alliage-module-installer"
    ],
    "envs": ["development"],
  }
}
```

## Usage

### Create a custom builder

The first thing to benefit from the builder module is to create a task.
A task is class extending `AbstractTask` and that is registered as a service.

```js
import { AbstractTask } from 'alliage-builder/tasks';

export class MyTask extends AbstractTask {
  getName() {
    return 'my_task';
  }

  getParamsSchema() {
    return {
      type: 'object',
      properties: {
        myTaskParam: {
          type: 'string',
        },
      },
    };
  }

  async run(params) {
    console.log(`Param received: ${params.myTaskParam}`);

    // Do building stuff...
  }
}
```

The task must implement the following method:

- `getName(): string`: Must return the name of the task which must be unique among other tasks
- `getParamsSchema(): object`: Must returns the schema of the parameters that can be sent to the task
- `run(params: object)`: Must contain the building logic of the task. It receives parameters that will correspond to the schema defined in the `getParamsSchema` method.

Once the custom task is created, we must register it as a service.
If the [alliage-service-loader](../service-loader) is installed, we just have to use the [Service decorator](../service-loader#define-a-service).
Otherwise, we must register it in an alliage module.

```js
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';

import { MyTask } from './MyTask';

export = class MyModule extends AbstractLifeCycleAwareModule {
  // ...

  registerServices(serviceContainer) {
    serviceContainer.registerService('my_task', MyTask, []);
  }
}
```

### Configuration

Once the task is created we must configure the builder to use our task.
Everything happens in the `config/builder.yaml` file that should have been created automatically when you installed the builder module.

```yaml
tasks:
  - name: my_task ## This is a name of the task to execute
    description: My task ## This is a description of the task (displayed in the terminal)
    ## These are the parameters sent to the task
    params:
      myTaskParam: foo
```

### Run the build

Once the tasks to run in the builder have been defined, we can run the build by running the following command:

```bash
$(npm bin)/alliage-scripts build
```

With the example above, we should get the following output:

```bash
Running task: My task...
Param received: foo
```

### Built-in tasks

#### ShellTask

The builder modules comes with one built-in which allows us to run shell commands. It can be used the following way:

```yaml
tasks:
  - name: shell
    description: Compile TypeScript code
    params:
      cmd: tsc -p tsconfig.json
  - name: shell
    description: Generate static documentation
    params:
      cmd: swagger-codegen generate -i api/specs -l html2 -o api/doc
```

## Events

### Builder events

```js
import { BUILDER_EVENTS } from 'alliage-builder/events';
```

| Type                              | Event object                                              | Description                    |
| --------------------------------- | --------------------------------------------------------- | ------------------------------ |
| `BUILDER_EVENTS.BEFORE_ALL_TASKS` | [BuilderBeforeAllTasksEvent](#builderbeforealltasksevent) | Before running all the tasks   |
| `BUILDER_EVENTS.BEFORE_TASK`      | [BuilderBeforeTaskEvent](#builderbeforetaskevent)         | Before running one task        |
| `BUILDER_EVENTS.AFTER_TASK`       | [BuilderAfterTaskEvent](#builderaftertaskevent)           | After having run one task      |
| `BUILDER_EVENTS.AFTER_ALL_TASKS`  | [BuilderAfterAllTasksEvent](#builderafteralltasksevent)   | After having run all the tasks |

#### BuilderBeforeAllTasksEvent

This is the instance of the event object received in any `BUILDER_EVENTS.BEFORE_ALL_TASKS` listener.

- `getConfig(): object`: Returns the configuration of the builder
- `getTasks(): { [name: string]: AbstractTask }`: Returns the available tasks
- `setConfig(config: object): BuilderBeforeAllTasksEvent`: Allows to re-define the builder configuration

#### BuilderBeforeTaskEvent

This is the instance of the event object received in any `BUILDER_EVENTS.BEFORE_TASK` listener.

- `getTask(): AbstractTask`: Returns the task about to be run
- `getParams(): object`: Returns the params that will be sent to the task about to be run
- `getDescription(): string`: Returns the description of the task about to be run
- `setParams(params: object): BuilderBeforeTaskEvent`: Allows to re-define the params that will be sent to the task about to be run
- `setDescription(description: string): BuilderBeforeTaskEvent`: Allows to re-define the description of the task about to be run

#### BuilderAfterTaskEvent

This is the instance of the event object received in any `BUILDER_EVENTS.AFTER_TASK` listener.

- `getTask(): AbstractTask`: Returns the task that has been run
- `getParams(): object`: Returns the params that will be sent to the task that has been run
- `getDescription(): string`: Returns the description of the task that has been run

#### BuilderAfterAllTasksEvent

This is the instance of the event object received in any `BUILDER_EVENTS.AFTER_ALL_TASKS` listener.

- `getConfig(): object`: Returns the configuration of the builder
- `getTasks(): { [name: string]: AbstractTask }`: Returns the available tasks

### Shell task events

```js
import { BUILDER_SHELL_TASK_EVENTS } from 'alliage-builder/tasks/shell-tasks/events';
```

| Type                                   | Event object                                        | Description                   |
| -------------------------------------- | --------------------------------------------------- | ----------------------------- |
| `BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN` | [ShellTaskBeforeRunEvent](#shelltaskbeforerunevent) | Before running the shell task |
| `BUILDER_SHELL_TASK_EVENTS.SUCCESS`    | [ShellTaskSuccessEvent](#shelltasksuccessevent)     | After a successful run        |
| `BUILDER_SHELL_TASK_EVENTS.ERROR`      | [ShellTaskErrorEvent](#shelltaskerrorevent)         | After a failed run            |

#### ShellTaskBeforeRunEvent

This is the instance of the event object received in any `BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN` listener.

- `getCommand(): string`: Returns the command about to be run
- `setCommand(command: string): ShellTaskBeforeRunEvent`: Allow to re-define the command about to be run

#### ShellTaskSuccessEvent

This is the instance of the event object received in any `BUILDER_SHELL_TASK_EVENTS.SUCCESS` listener.

- `getCommand(): string`: Returns the command that has been run
- `getSuccessOutput(): string`: Returns the standard output
- `getErrorOutput(): string`: Returns the error output

#### ShellTaskErrorEvent

This is the instance of the event object received in any `BUILDER_SHELL_TASK_EVENTS.ERROR` listener.

- `getCommand(): string`: Returns the command that has been run
- `getError(): CommandError`: Returns the error which has the following properties:
  - `stdout (string)`: The standard output
  - `stderr (string)`: The error output
  - `error: (ExecException)`: The native error


