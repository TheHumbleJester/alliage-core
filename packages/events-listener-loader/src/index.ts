import { EventManager } from 'alliage-lifecycle/event-manager';
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { INIT_EVENTS, LifeCycleInitEvent } from 'alliage-lifecycle/events';
import { Constructor } from 'alliage-di/dependencies';

import { AbstractEventsListener } from './events-listener';

const UNAVAILABLE_EVENTS: string[] = [
  INIT_EVENTS.PRE_INIT,
  INIT_EVENTS.INIT,
  INIT_EVENTS.POST_INIT,
];

export = class EventsListernerLoaderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [INIT_EVENTS.POST_INIT]: this.handlePostInit,
    };
  }

  handlePostInit = (event: LifeCycleInitEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const eventsListener = serviceContainer.getAllInstancesOf<AbstractEventsListener>(
      AbstractEventsListener as Constructor,
    );

    eventsListener.forEach((listener) => {
      Object.entries(listener.getEventHandlers()).forEach(([eventType, handler]) => {
        if (UNAVAILABLE_EVENTS.includes(eventType)) {
          throw new Error(
            `Events listener can't listen to events happening during the initialization phase`,
          );
        }
        eventManager.on(eventType, handler);
      });
    });
  };
};
