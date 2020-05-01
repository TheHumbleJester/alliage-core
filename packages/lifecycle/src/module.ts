import { AbstractModule } from 'alliage/core/module';
import { PrimitiveContainer } from 'alliage/core/primitive-container';
import { ServiceContainer } from 'alliage-di/service-container';

import { Arguments } from 'alliage/core/utils/cli';
import { INIT_EVENTS, LifeCycleInitEvent } from './events';
import { EventManager } from './event-manager';

export type LifeCycleEventHandlers = {
  [event: string]: (...args: any[]) => void;
};

export abstract class AbstractLifeCycleAwareModule extends AbstractModule {
  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }

  onInit = async (_args: Arguments, _env: string, container: PrimitiveContainer) => {
    const serviceContainer = container.get<ServiceContainer>('service_container');
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    eventManager.on(INIT_EVENTS.PRE_INIT, (event: LifeCycleInitEvent) => {
      this.registerServices(event.getServiceContainer());
    });

    const eventHandlers = this.getEventHandlers();
    Object.entries(eventHandlers).forEach(([eventName, eventHandler]) => {
      if (eventHandler) {
        eventManager.on(eventName, eventHandler);
      }
    });
  };

  registerServices(_serviceContainer: ServiceContainer) {}

  getEventHandlers(): LifeCycleEventHandlers {
    return {};
  }
}
