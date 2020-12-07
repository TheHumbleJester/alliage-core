import path from 'path';
import glob from 'glob';

import { Dependency } from 'alliage-di/dependencies';
import { LifeCycleInitEvent, INIT_EVENTS } from 'alliage-lifecycle/events';
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { EventManager } from 'alliage-lifecycle/event-manager';
import { CONFIG_EVENTS } from 'alliage-config-loader/events';
import { loadConfig } from 'alliage-config-loader/helpers';
import { validate } from 'alliage-config-loader/validators/json-schema';

import { CONFIG_NAME, schema, Config } from './config';
import { extractServiceDefinition } from './decorators/extractors';
import {
  ServiceLoaderBeforeAllEvent,
  ServiceLoaderAfterAllEvent,
  ServiceLoaderBeforeOneEvent,
  ServiceLoaderAfterOneEvent,
} from './events';

export = class ServiceLoaderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validate(schema)),
      [INIT_EVENTS.INIT]: this.handleInit,
    };
  }

  handleInit = async (event: LifeCycleInitEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const config = serviceContainer.getParameter<Config>(CONFIG_NAME);
    const servicesConfig = config;

    const beforeAllEvent = new ServiceLoaderBeforeAllEvent(
      servicesConfig.basePath,
      servicesConfig.paths,
      servicesConfig.exclude || [],
    );
    await eventManager.emit(beforeAllEvent.getType(), beforeAllEvent);

    const basePath = beforeAllEvent.getBasePath();
    const paths = beforeAllEvent.getPaths();
    const exclude = beforeAllEvent.getExclude();

    await Promise.all(
      paths.map(async (pattern) => {
        const files: string[] = await new Promise((resolve, reject) =>
          glob(
            pattern,
            {
              cwd: path.resolve(basePath),
              absolute: true,
              nodir: true,
              ignore: exclude,
            },
            (err, matches) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(matches);
            },
          ),
        );
        await Promise.all(
          files.map(async (file) => {
            // eslint-disable-next-line import/no-dynamic-require, global-require
            const module = require(file);
            const service = (module && module.default) || module;
            if (service) {
              const definition = extractServiceDefinition(service);
              if (definition) {
                const beforeOneEvent = new ServiceLoaderBeforeOneEvent(
                  file,
                  definition.name,
                  service,
                  definition.dependencies,
                );
                await eventManager.emit(beforeOneEvent.getType(), beforeOneEvent);

                const name = beforeOneEvent.getName();
                const ctor = beforeOneEvent.getConstructor();
                const deps = beforeOneEvent.getDependencies();

                serviceContainer.registerService(name, ctor, deps as Dependency[]);

                await eventManager.emit(
                  ...ServiceLoaderAfterOneEvent.getParams(file, name, ctor, deps),
                );
              }
            }
          }),
        );
      }),
    );

    await eventManager.emit(...ServiceLoaderAfterAllEvent.getParams(basePath, paths, exclude));
  };
};
