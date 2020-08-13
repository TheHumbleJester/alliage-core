# Alliage Error Handler
[![alliage-error-handler](https://img.shields.io/npm/v/alliage-error-handler/latest?color=%2300CC00&label=alliage-error-handler%40latest)](https://www.npmjs.com/package/alliage-error-handler)

Module allowing to display exceptions gracefully.

## Installation

```bash
yarn add alliage-error-handler
```

With npm

```bash
npm install alliage-error-handler
```

## Registration

If you have already installed [alliage-module-installer](../module-installer) you just have to run the following command:

```bash
$(npm bin)/alliage-scripts install alliage-error-handler
```

Otherwise, update your `alliage-modules.json` file to add this at the bottom:

```js
{
  // ... other modules
  "alliage-error-handler": {
    "module": "alliage-error-handler",
    "deps": [],
    "envs": [],
  }
}
```

## Usage

Once installed and registered, the module will work right away without having to do anything specific to do.

The goal of this module is to display as much details as possible about uncaught exceptions or unhandled rejections.<br />
Basically, it will display:
- The name of the error (class name)
- The message
- The stacktrace
- Any public property that is not part of the Error prototype.

So, if you write your own alliage module, don't hesitate to create your custom Error classes and to add as much context as possible in it to let the developers using your module debut their application easily !

Example:

```js
class HttpError extends Error {
  constructor(status, body) {
    super('An HTTP error occured !');

    // These two additional properties will
    // be displayed if the error is incaught
    this.status = status;
    this.body = body;
  }
}

// Later...

throw new HttpError(404, 'Not found');
```
