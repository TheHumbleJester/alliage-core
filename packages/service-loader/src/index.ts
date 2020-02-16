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
      [INIT_EVENTS.POST_INIT]: this.handlePostInit,
    };
  }

  handlePostInit = (event: LifeCycleInitEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const config = serviceContainer.getParameter<Config>(CONFIG_NAME);
    const servicesConfig = config;

    const beforeAllEvent = new ServiceLoaderBeforeAllEvent(
      servicesConfig.basePath,
      servicesConfig.paths,
      servicesConfig.exclude || [],
    );
    eventManager.emit(beforeAllEvent.getType(), beforeAllEvent);

    const basePath = beforeAllEvent.getBasePath();
    const paths = beforeAllEvent.getPaths();
    const exclude = beforeAllEvent.getExclude();

    for (const pattern of paths) {
      const files = glob.sync(pattern, {
        cwd: path.resolve(basePath),
        absolute: true,
        nodir: true,
        ignore: exclude,
      });
      for (const file of files) {
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
            eventManager.emit(beforeOneEvent.getType(), beforeOneEvent);

            const name = beforeOneEvent.getName();
            const ctor = beforeOneEvent.getConstructor();
            const deps = beforeOneEvent.getDependencies();

            serviceContainer.registerService(name, ctor, deps as Dependency[]);

            eventManager.emit(...ServiceLoaderAfterOneEvent.getParams(file, name, ctor, deps));
          }
        }
      }
    }
    eventManager.emit(...ServiceLoaderAfterAllEvent.getParams(basePath, paths, exclude));
  };
};
