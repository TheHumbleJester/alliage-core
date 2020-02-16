import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { CONFIG_EVENTS } from 'alliage-config-loader/events';
import { loadConfig } from 'alliage-config-loader/helpers';
import { validate } from 'alliage-config-loader/validators/json-schema';

import { CONFIG_NAME, schema } from './config';

export = class ParametersLoaderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validate(schema)),
    };
  }
};
