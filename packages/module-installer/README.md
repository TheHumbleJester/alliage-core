# Alliage Module Installer

[![alliage-module-installer](https://img.shields.io/npm/v/alliage-module-installer/latest?color=%2300CC00&label=alliage-module-installer%40latest)](https://www.npmjs.com/package/alliage-module-installer)

The module installer automatize some repetitive actions a user must make to install an alliage module such as:

- Registering the module in the `alliage-modules.json` file
- Installing module's depedencies if they aren't already
- Creating/copying files
- Etc...

## Dependencies

- [alliage-lifecycle](../lifecycle)

## Installation

```bash
yarn add -D alliage-module-installer
```

With npm

```bash
npm install --dev alliage-module-installer
```

## Registration

Update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-module-installer": {
    "module": "alliage-module-installer",
    "deps": [
      "alliage-lifecycle",
    ],
    "envs": ["development"],
  }
}
```

## Usage

Once you've installed an alliage module package with NPM, you'll be able to install it in alliage by running the following command:

```bash
$(npm bin)/alliage-script install [package name]
```

### Manifest

In order to be recognized as an alliage module and, thus, to be installable, the `package.json` of the module must contain a manifest available under the `alliageManifest` property.

The manifest will contain metadata necessary to install the module automatically as you can see in the example below:

```js
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    "type": "module",
    "dependencies": [
      "other-alliage-module",
      "another-alliage-module",
    ],
    "environments": ["development"],
    "installationProcedures": {
      // ...
    }
  }
}
```

#### Properties

- **type** (`string`): Can take the following values
  - `"module"`: A regular alliage module.
  - `"compound"`: Not an actual module but rather an aggregation of several modules. It won't be registered in the `alliage-modules.json` file.
- **dependencies** (`string[]`): All the modules on which this module depends.
- **environments** (`string[]`): Environments in which the module will be loaded. Can be left empty if the module must be loaded on all environments.
- **installationProcedures** (`object`): Procedures to run at the installation (see [here](#procedures-phase)).

### Installation flow

During the installation of a module, the install script will go through several phases described just below between which it will reload the kernel to take changes in account.

#### Dependencies phase

The dependency phase consists in running the install script for each dependency of the module defined in the manifest. This is obviously necessary to make sure that the module will work correctly once installed.

#### Procedures phase

The procedures phase will run installation procedures as described in the manifest.
A procedure can been anything that your module needs to work like, for example, [copying or creating files in the project](#file-copy-procedure).

#### Registration phase

The registration phase, which will usually be the last phase of the installation process, will simply automatically register the module in the `alliage-modules.json` file.

### Installation Procedures

Installation procedures are any action that might be required to make your module directly usable.
It can be for example:

- Calling a remote server
- Running a shell command
- [Copying files](#file-copy-procedure)

In short, everything that is not especially related to the alliage internal functioning.

The procedures that must be executed for a given module must be defined in the `installationProcedures` of the manifest:

```js
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    //
    "installationProcedures": {
      "[procedure name]": {
        // [procedures parameters]
      }
    }
  }
}
```

This module comes with one [built-in procedure](#file-copy-procedure) but also provides all the tool to create its own installation procedure.

### Run specific phases

When installing a module you can decide to run specific phases instead of running all of them, like so:

```bash
$(npm bin)/alliage-script install [package name] --phases=procedures
```

This will only run the "procedures" phase of the installation process.

You can also decide to run several of them in a specific order like so:

```bash
$(npm bin)/alliage-script install [package name] --phases=procedures,registration
```

This will only run the "procedures" phase, then the "registration" phase of the installation process.

#### AbstractInstallationProcedure

This module provides a way to create your own installation procedures. All you have to do is to implement the `AbstractInstallationProcedure`.

A installation procedure must have the following methods:

- `getName(): string`: Must return the name of the procedure (which must be unique)
- `getSchema(): object`: Must return the [schema](https://json-schema.org/) of the installation procedure parameters in the manifest. This will allow to validate the installation procedures parameters.
- `proceed(manifest: object, modulePath: string): void | Promise<void>`: Contain the logic of the procedure (what it does). It receive the following parameters:
  - **manifest**: The manifest of the module
  - **modulePath**: Path of the module

Let's imagine we wan't to create a procedure allowing to run a shell command, we could have the following implementation:

```js
import { execSync } from 'child_process';

import { AbstractInstallationProcedure } from 'alliage-module-installer/installation-procedure';

export class ShellProcedure extends AbstractInstallationProcedure {
  getName() {
    return 'shell_procedure';
  }

  getSchema() {
    // We expect a "commands" property in
    // "alliageManifest.installationProcedures"
    // whose value is an array of string
    return {
      commands: {
        type: 'array',
        items: {
          type: string,
        },
      },
    };
  }

  proceed(manifest, _modulePath) {
    const commands = manifest.installationProcedures.commands;
    if (commands) {
      // We iterate over the list of command and execute them
      commands.forEach(() => {
        execSync(commands);
      });
    }
  }
}
```

Once the installation procedure is created, you just have to register it as a service in your module:

```js
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { INIT_EVENTS, RUN_EVENTS } from 'alliage-lifecycle/events';

import { ShellProcedure } from './shell-procedure';

export = class MyModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    // ...
  }

  // Here we register services
  registerServices(serviceContainer) {
    serviceContainer.registerService('shell_procedure', ShellProcedure, []);
  }
}
```

Then, other modules will be able to use this new installation procedures in their manifest like so:

```js
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    // ...
    "installationProcedures": {
      "commands": [
        "tsc --init",
        "cp tsconfig.json tsconfig.prod.json",
        "cp tsconfig.json tsconfig.test.json",
      ]
    }
  }
}
```

And these 3 commands will be executed during the module installation.

#### File copy procedure

The module installer comes with one built-in procedure allowing you to copy a file coming from your module to your project.

To do so, you just have to use the `copyFiles` installation procedures like so in your modules's manifest:

```js
{
  "name": "my-alliage-module",
  "version": "0.1.0",
  // ...
  "alliageManifest": {
    // ...
    "installationProcedures": {
      "copyFiles": [
        // source (relative to module's path) - destination (relative to project's path)
        ["base-files/config.yaml", "config/my-module.yaml"],
      ]
    }
  }
}
```

This configuration will copy the `base-file/config.yaml` from the module's folder to the `config/my-module.yaml` file of the project.

The source path also supports wildcards and globbing.

## Events

### Installation events

```js
import { INSTALLATION_EVENTS } from 'alliage-module-installer/events';
```

| Type                                    | Event object                                                            | Description                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `INSTALLATION_EVENTS.PHASES_INIT`       | [InstallationPhasesInitEvent](#installationphasesinitevent)             | At the beginning of the installation process, allow to define available and default phases |
| `INSTALLATION_EVENTS.SCHEMA_VALIDATION` | [InstallationSchemaValidationEvent](#installationschemavalidationevent) | Before the validation of the manifest                                                      |
| `INSTALLATION_EVENTS.PHASE_START`       | [InstallationPhaseStartEvent](#installationphasestartevent)             | Before an installation phase                                                               |
| `INSTALLATION_EVENTS.PHASE_END`         | [InstallationPhaseEndEvent](#installationphaseendevent)                 | After an installation phase                                                                |

#### InstallationPhasesInitEvent

This is the instance of the event object received in any `INSTALLATION_EVENTS.PHASES_INIT` listener.

- `getAvailablePhases(): string[]`: Returns the available installation phases
- `getDefaultPhases(): string[]`: Returns the default phases (used when not explicitely defined in the install script arguments)
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)
- `setAvailablePhases(phases: string[]): InstallationPhasesInitEvent`: Allows to re-define the available phases
- `setDefaultPhases(phases: string[]): InstallationPhasesInitEvent`: Allows to re-define the default phases

#### InstallationSchemaValidationEvent

This is the instance of the event object received in any `INSTALLATION_EVENTS.SCHEMA_VALIDATION` listener.

- `getModuleName(): string`: Returns the name of the module being installed
- `getCurrentPhase(): string`: Returns the installation phase about to be executed
- `getNextPhases(): string[]`: Returns the list of the next phases to execute afterwards
- `getManifest(): object`: Returns the content of the manifest of the module being installed
- `getExtendedPropertiesSchemas(): object`: Get the `installationProcedures` property validation schema
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)
- `setExtendedPropertiesSchemas(schema: object): InstallationSchemaValidationEvent`: Allows to re-define the `installationProcedures` property validation schema

#### InstallationPhaseStartEvent

This is the instance of the event object received in any `INSTALLATION_EVENTS.PHASE_START` listener.

- `getModuleName(): string`: Returns the name of the module being installed
- `getModulePath(): string`: Returns the path of the module being installed
- `getPackageInfo(): object`: Returns the content of the `package.json` file of the module being installed
- `getManifest(): object`: Returns the content of the manifest of the module being installed
- `getCurrentPhase(): string`: Returns the installation phase about to be executed
- `getNextPhases(): string[]`: Returns the list of the next phases to execute afterwards
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)
- `setManifest(phases: object): InstallationPhaseStartEvent`: Allows to re-define the module's manifest
- `setCurrentPhase(phase: string): InstallationPhaseStartEvent`: Allows to re-define the installation about to be executed
- `setNextPhases(phases: string[]): InstallationPhaseStartEvent`: Allows to re-define the next phases to execute afterwards

#### InstallationPhaseEndEvent

This is the instance of the event object received in any `INSTALLATION_EVENTS.PHASE_END` listener.

- `getModuleName(): string`: Returns the name of the module being installed
- `getModulePath(): string`: Returns the path of the module being installed
- `getPackageInfo(): object`: Returns the content of the `package.json` file of the module being installed
- `getManifest(): object`: Returns the content of the manifest of the module being installed
- `getCurrentPhase(): string`: Returns the installation phase that has been executed
- `getNextPhases(): string[]`: Returns the list of the next phases to execute afterwards
- `getEnv(): string`: Returns the current [environment](https://github.com/TheHumbleJester/alliage#environment)


### File copy events

```js
import { FILE_COPY_EVENTS } from 'alliage-module-installer/installation-procedure/file-copy/events';
```

| Type                                | Event object                                                | Description                           |
| ----------------------------------- | ----------------------------------------------------------- | ------------------------------------- |
| `FILE_COPY_EVENTS.BEFORE_COPY_ALL`  | [FileCopyBeforeCopyAllEvent](#filecopybeforecopyallevent)   | Before the execution of the procedure |
| `FILE_COPY_EVENTS.AFTER_COPY_ALL`   | [FileCopyAfterCopyAllEvent](#installationphasestartevent)   | After the execution of the procedure  |
| `FILE_COPY_EVENTS.BEFORE_COPY_FILE` | [FileCopyBeforeCopyFileEvent](#filecopybeforecopyfileevent) | Before a file copy                    |
| `FILE_COPY_EVENTS.AFTER_COPY_FILE`  | [FileCopyAfterCopyFileEvent](#filecopyaftercopyfileevent)   | After a file copy                     |

#### FileCopyBeforeCopyAllEvent

This is the instance of the event object received in any `FILE_COPY_EVENTS.BEFORE_COPY_ALL` listener.

- `getModulePath(): string`: Returns the path of the module being installed
- `getFilesToCopy(): [string, string][]`: Returns the list of files to copy
- `setModulePath(path: string): FileCopyBeforeCopyAllEvent`: Allows to re-define the module path
- `setFilesToCopy(filesToCopy: [string, string][]): FileCopyBeforeCopyAllEvent`: Allows to re-defined the list of files to copy

#### FileCopyAfterCopyAllEvent

This is the instance of the event object received in any `FILE_COPY_EVENTS.AFTER_COPY_ALL` listener.

- `getModulePath(): string`: Returns the path of the module being installed
- `getCopiedFiles(): [string, string][]`: Returns the list of files that has been copied

#### FileCopyBeforeCopyFileEvent

This is the instance of the event object received in any `FILE_COPY_EVENTS.BEFORE_COPY_FILE` listener.

- `getModulePath(): string`: Returns the path of the module being installed
- `getSourceFile(): string`: Returns the absolute path of the source file
- `getDestination(): string`: Returns the absolute path of the destination
- `setSourceFile(path: string): FileCopyBeforeCopyFileEvent`: Allows to re-define the path of the source file
- `setDestination(path: string): FileCopyBeforeCopyFileEvent`: Allows to re-defined the path of the destination

#### FileCopyAfterCopyFileEvent

This is the instance of the event object received in any `FILE_COPY_EVENTS.AFTER_COPY_FILE` listener.

- `getModulePath(): string`: Returns the path of the module being installed
- `getSourceFile(): string`: Returns the absolute path of the source file
- `getDestination(): string`: Returns the absolute path of the destination
