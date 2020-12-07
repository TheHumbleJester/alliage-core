import path from 'path';
import { promises as fs } from 'fs';
import yaml from 'yaml';

import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { INIT_EVENTS, LifeCycleInitEvent } from 'alliage-lifecycle/events';
import { EventManager } from 'alliage-lifecycle/event-manager';

import {
  ConfigPreLoadEvent,
  ConfigLoadEvent,
  ConfigPreFileLoadEvent,
  ConfigPreFileParseEvent,
  ConfigPostFileParseEvent,
  ConfigPostEnvVariableInjectionEvent,
  ConfigPostFileLoadEvent,
  ConfigPostLoadEvent,
} from './events';
import { injectEnvVariables } from './helpers';

const CONFIG_PATH = './config';

export = class ConfigurationLoaderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [INIT_EVENTS.INIT]: this.handleInit,
    };
  }

  handleInit = async (event: LifeCycleInitEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const preloadEvent = new ConfigPreLoadEvent(path.resolve(CONFIG_PATH));
    await eventManager.emit(preloadEvent.getType(), preloadEvent);

    const loadEvent = new ConfigLoadEvent([...preloadEvent.getConfigs()]);
    await eventManager.emit(loadEvent.getType(), loadEvent);

    const configPath = preloadEvent.getConfigPath();
    const configs = loadEvent.getConfigs();

    await Promise.all(
      configs.map(async ({ fileName, validator }) => {
        const preFileLoadEvent = new ConfigPreFileLoadEvent(
          configPath,
          fileName,
          `${configPath}/${fileName}.yaml`,
        );
        await eventManager.emit(preFileLoadEvent.getType(), preFileLoadEvent);

        const configFilePath = preFileLoadEvent.getFilePath();
        try {
          await fs.stat(configFilePath);
        } catch (e) {
          throw new Error(`Can't find the following configuration file: ${configFilePath}`);
        }
        const preFileParseEvent = new ConfigPreFileParseEvent(
          fileName,
          configFilePath,
          await fs.readFile(configFilePath, { encoding: 'utf8' }),
        );
        await eventManager.emit(preFileParseEvent.getType(), preFileParseEvent);
        let config = yaml.parse(preFileParseEvent.getContent());

        const postFileParseEvent = new ConfigPostFileParseEvent(fileName, configFilePath, config);
        await eventManager.emit(postFileParseEvent.getType(), postFileParseEvent);

        config = injectEnvVariables(configFilePath, postFileParseEvent.getConfig());
        config = validator(configFilePath, config);

        const postEnvVariableInjectionEvent = new ConfigPostEnvVariableInjectionEvent(
          fileName,
          configFilePath,
          config,
        );
        await eventManager.emit(
          postEnvVariableInjectionEvent.getType(),
          postEnvVariableInjectionEvent,
        );

        serviceContainer.setParameter(fileName, postEnvVariableInjectionEvent.getConfig() as any);

        const postFileLoadEvent = new ConfigPostFileLoadEvent(fileName, configFilePath);
        await eventManager.emit(postFileLoadEvent.getType(), postFileLoadEvent);
      }),
    );

    const postLoadEvent = new ConfigPostLoadEvent(configs);
    await eventManager.emit(postLoadEvent.getType(), postLoadEvent);
  };
};
