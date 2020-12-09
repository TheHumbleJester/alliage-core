import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';
import { Arguments } from 'alliage/core/utils/cli';

import { PrimitiveContainer } from 'alliage/core/primitive-container';
import { ServiceContainer } from 'alliage-di/service-container';

import { AbstractLifeCycleAwareModule } from '../module';
import {
  INIT_EVENTS,
  INSTALL_EVENTS,
  BUILD_EVENTS,
  RUN_EVENTS,
  LifeCycleInitEvent,
} from '../events';

describe('lifecycle/module', () => {
  describe('AbstractLifeCycleAwareModule', () => {
    const fakeEventHandler = () => {};
    const registerServicesMock = jest.spyOn(
      AbstractLifeCycleAwareModule.prototype,
      'registerServices',
    );

    class LifeCycleAwareModule extends AbstractLifeCycleAwareModule {
      getEventHandlers() {
        return {
          [INIT_EVENTS.INIT]: fakeEventHandler,
          [INSTALL_EVENTS.INSTALL]: fakeEventHandler,
          [BUILD_EVENTS.BUILD]: fakeEventHandler,
          [RUN_EVENTS.RUN]: fakeEventHandler,
          [RUN_EVENTS.POST_RUN]: undefined,
        } as any;
      }
    }

    const lcaModule = new LifeCycleAwareModule();
    const pc = new PrimitiveContainer();
    const sc = new ServiceContainer();
    const eventManagerMock = {
      on: jest.fn(),
    };

    pc.set('service_container', sc);
    sc.addService('event_manager', eventManagerMock);

    describe('#getKernelEventHandlers', () => {
      it('should return the list of kernel event handlers', () => {
        expect(lcaModule.getKernelEventHandlers()).toEqual({
          init: lcaModule.onInit,
        });
      });
    });

    describe('#onInit', () => {
      it('should listen to PRE_INIT to register services and listen to events returned by #getEventHandlers', () => {
        lcaModule.onInit(Arguments.create(), 'test', pc);
        expect(eventManagerMock.on.mock.calls).toEqual([
          [INIT_EVENTS.PRE_INIT, expect.anything()],
          [INIT_EVENTS.INIT, fakeEventHandler],
          [INSTALL_EVENTS.INSTALL, fakeEventHandler],
          [BUILD_EVENTS.BUILD, fakeEventHandler],
          [RUN_EVENTS.RUN, fakeEventHandler],
        ]);

        const preInitEvent = new LifeCycleInitEvent(INIT_EVENTS.PRE_INIT, {
          context: INITIALIZATION_CONTEXT.RUN,
          env: 'test',
          serviceContainer: sc,
          args: Arguments.create(),
        });

        eventManagerMock.on.mock.calls[0][1](preInitEvent);
        expect(registerServicesMock).toHaveBeenCalledTimes(1);
        expect(registerServicesMock).toHaveBeenCalledWith(sc, 'test');
      });
    });

    describe('#getEventHandlers', () => {
      it('should initially return a empty list of events', () => {
        class BasicModule extends AbstractLifeCycleAwareModule {}
        const bm = new BasicModule();

        expect(bm.getEventHandlers()).toEqual({});
      });
    });
  });
});
