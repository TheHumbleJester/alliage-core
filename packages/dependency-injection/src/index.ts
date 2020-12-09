import { AbstractModule } from 'alliage/core/module';
import { PrimitiveContainer } from 'alliage/core/primitive-container';
import { Arguments } from 'alliage/core/utils/cli';

import { ServiceContainer } from './service-container';

export = class DependencyInjectionModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (_args: Arguments, env: string, container: PrimitiveContainer) => {
    const serviceContainer = new ServiceContainer();
    serviceContainer.addService('service_container', serviceContainer);
    serviceContainer.setParameter('environment', env);
    container.set('service_container', serviceContainer);
  };
};
