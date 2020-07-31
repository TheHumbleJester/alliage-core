import { Arguments } from 'alliage/core/utils/cli';
import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';

import { INIT_EVENTS, LifeCycleInitEvent } from 'alliage-lifecycle/events';
import { ServiceContainer } from 'alliage-di/service-container';
import { EventManager } from 'alliage-lifecycle/event-manager';

import EventsListenerLoaderModule from '..';
import { AbstractEventsListener } from '../events-listener';

describe('events-listener-loader', () => {
  describe('EventsListenerLoaderModule', () => {
    const module = new EventsListenerLoaderModule();

    describe('#getEventHandlers', () => {
      it('should listen to the INIT_EVENTS.POST_INIT event', () => {
        expect(module.getEventHandlers()).toEqual({
          [INIT_EVENTS.POST_INIT]: module.handlePostInit,
        });
      });
    });

    describe('#handlePostInit', () => {
      const serviceContainer = new ServiceContainer();
      const eventManager = new EventManager();

      serviceContainer.addService('event_manager', eventManager);

      const onMock = jest.spyOn(eventManager, 'on');

      afterEach(() => {
        onMock.mockReset();
      });

      class EL1 extends AbstractEventsListener {
        getEventHandlers() {
          return {
            event1: this.event1Handler,
          };
        }

        event1Handler() {}
      }

      class EL2 extends AbstractEventsListener {
        getEventHandlers() {
          return {
            'event2-1': this.event21Handler,
            'event2-2': this.event22Handler,
          };
        }

        event21Handler() {}

        event22Handler() {}
      }

      class EL3 extends AbstractEventsListener {
        getEventHandlers() {
          return {
            [INIT_EVENTS.PRE_INIT]: this.event3Handler,
          };
        }

        event3Handler() {}
      }

      serviceContainer.registerService('el1', EL1);
      serviceContainer.registerService('el2', EL2);

      const event = new LifeCycleInitEvent(INIT_EVENTS.POST_INIT, {
        context: INITIALIZATION_CONTEXT.RUN,
        args: Arguments.create(),
        env: 'test',
        serviceContainer,
      });

      it('should listen to all events defined in events handlers', async () => {
        await module.handlePostInit(event);

        expect(onMock).toHaveBeenCalledTimes(3);
        expect(onMock).toHaveBeenCalledWith('event1', EL1.prototype.event1Handler);
        expect(onMock).toHaveBeenCalledWith('event2-1', EL2.prototype.event21Handler);
        expect(onMock).toHaveBeenCalledWith('event2-2', EL2.prototype.event22Handler);
      });

      it('should throw an error if events listener subscribe to INIT_EVENTS', async () => {
        serviceContainer.registerService('el3', EL3);
        let error;

        try {
          await module.handlePostInit(event);
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual(
          "Events listener can't listen to events happening during the initialization phase",
        );
      });
    });
  });
});
