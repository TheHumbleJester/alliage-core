import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';
import { Arguments } from 'alliage/core/utils/cli';
import { ServiceContainer } from 'alliage-di/service-container';

import {
  AbstractEvent,
  AbstractWritableEvent,
  LifeCycleInitEvent,
  INIT_EVENTS,
  LifeCycleInstallEvent,
  INSTALL_EVENTS,
  LifeCycleBuildEvent,
  BUILD_EVENTS,
  LifeCycleRunEvent,
  RUN_EVENTS,
} from '../events';

enum DUMMY_EVENTS {
  EVENT_1 = 'EVENT_1',
  EVENT_2 = 'EVENT_2',
}

type DummyEventPayload = {
  foo: string;
};

describe('lifecycle/events', () => {
  describe('AbstractEvent', () => {
    class DummyEvent extends AbstractEvent<DUMMY_EVENTS, DummyEventPayload> {
      getDummyEventPayload() {
        return this.getPayload();
      }
    }
    const dummyEvent = new DummyEvent(DUMMY_EVENTS.EVENT_1, { foo: 'bar' });

    describe('#getType', () => {
      it('should return the event type passed in the constructor', () => {
        expect(dummyEvent.getType()).toEqual(DUMMY_EVENTS.EVENT_1);
      });
    });

    describe('#getPayload', () => {
      it('should return the payload passed in the constructor', () => {
        expect(dummyEvent.getDummyEventPayload()).toEqual({ foo: 'bar' });
      });

      it('should return a frozen version of the payload', () => {
        expect(() => {
          dummyEvent.getDummyEventPayload().foo = 'test';
        }).toThrow();
      });
    });

    describe('#getParams', () => {
      it('should return the list of params accepted by the "EventManager.emit()" method', () => {
        const params = DummyEvent.getParams(DUMMY_EVENTS.EVENT_2, { foo: 'test' });

        expect(params[0]).toEqual(DUMMY_EVENTS.EVENT_2);

        const event = params[1] as DummyEvent;

        expect(event).toBeInstanceOf(DummyEvent);
        expect(event.getType()).toEqual(DUMMY_EVENTS.EVENT_2);
        expect(event.getDummyEventPayload()).toEqual({ foo: 'test' });
      });
    });
  });

  describe('AbstractWritableEvent', () => {
    class DummyWritableEvent extends AbstractWritableEvent<DUMMY_EVENTS, DummyEventPayload> {
      getDummyEventPayload() {
        return this.getPayload();
      }

      getDummyWritableEventPayload() {
        return this.getWritablePayload();
      }
    }
    const initialPayload = { foo: 'bar' };
    const dummyEvent = new DummyWritableEvent(DUMMY_EVENTS.EVENT_1, initialPayload);

    describe('#getWritableEventPayload', () => {
      it('should return a copy of the payload passed in the constructor', () => {
        expect(dummyEvent.getDummyWritableEventPayload()).toEqual(initialPayload);
        expect(dummyEvent.getDummyWritableEventPayload()).not.toBe(initialPayload);
      });

      it('should return a writable version of the payload', () => {
        expect(() => {
          dummyEvent.getDummyWritableEventPayload().foo = 'test';
        }).not.toThrow();
      });

      it('should not affect the initial payload', () => {
        expect(dummyEvent.getDummyEventPayload()).toEqual(initialPayload);
      });
    });
  });

  describe('LifeCycleInitEvent', () => {
    describe('#getParamsCreator', () => {
      const serviceContainer = new ServiceContainer();
      const args = Arguments.create();

      const payload = {
        context: INITIALIZATION_CONTEXT.RUN,
        serviceContainer,
        args,
        env: 'test',
      };
      const paramsCreator = LifeCycleInitEvent.getParamsCreator(payload);

      describe('#createPreInit', () => {
        it('should return the parameters for a PRE_INIT event', () => {
          const params = paramsCreator.createPreInit();

          expect(params[0]).toEqual(INIT_EVENTS.PRE_INIT);

          const event = params[1] as LifeCycleInitEvent;

          expect(event).toBeInstanceOf(LifeCycleInitEvent);
          expect(event.getType()).toEqual(INIT_EVENTS.PRE_INIT);
          expect(event.getContext()).toEqual(INITIALIZATION_CONTEXT.RUN);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createInit', () => {
        it('should return the parameters for a INIT event', () => {
          const params = paramsCreator.createInit();

          expect(params[0]).toEqual(INIT_EVENTS.INIT);

          const event = params[1] as LifeCycleInitEvent;

          expect(event).toBeInstanceOf(LifeCycleInitEvent);
          expect(event.getType()).toEqual(INIT_EVENTS.INIT);
          expect(event.getContext()).toEqual(INITIALIZATION_CONTEXT.RUN);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createPostInit', () => {
        it('should return the parameters for a POST_INIT event', () => {
          const params = paramsCreator.createPostInit();

          expect(params[0]).toEqual(INIT_EVENTS.POST_INIT);

          const event = params[1] as LifeCycleInitEvent;

          expect(event).toBeInstanceOf(LifeCycleInitEvent);
          expect(event.getType()).toEqual(INIT_EVENTS.POST_INIT);
          expect(event.getContext()).toEqual(INITIALIZATION_CONTEXT.RUN);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });
    });
  });

  describe('LifeCycleInstallEvent', () => {
    describe('#getParamsCreator', () => {
      const serviceContainer = new ServiceContainer();
      const args = Arguments.create();

      const payload = {
        serviceContainer,
        args,
        env: 'test',
      };
      const paramsCreator = LifeCycleInstallEvent.getParamsCreator(payload);

      describe('#createPreInstall', () => {
        it('should return the parameters for a PRE_INSTALL event', () => {
          const params = paramsCreator.createPreInstall();

          expect(params[0]).toEqual(INSTALL_EVENTS.PRE_INSTALL);

          const event = params[1] as LifeCycleInstallEvent;

          expect(event).toBeInstanceOf(LifeCycleInstallEvent);
          expect(event.getType()).toEqual(INSTALL_EVENTS.PRE_INSTALL);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createInstall', () => {
        it('should return the parameters for a INSTALL event', () => {
          const params = paramsCreator.createInstall();

          expect(params[0]).toEqual(INSTALL_EVENTS.INSTALL);

          const event = params[1] as LifeCycleInstallEvent;

          expect(event).toBeInstanceOf(LifeCycleInstallEvent);
          expect(event.getType()).toEqual(INSTALL_EVENTS.INSTALL);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createPostInstall', () => {
        it('should return the parameters for a POST_INSTALL event', () => {
          const params = paramsCreator.createPostInstall();

          expect(params[0]).toEqual(INSTALL_EVENTS.POST_INSTALL);

          const event = params[1] as LifeCycleInstallEvent;

          expect(event).toBeInstanceOf(LifeCycleInstallEvent);
          expect(event.getType()).toEqual(INSTALL_EVENTS.POST_INSTALL);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });
    });
  });

  describe('LifeCycleBuildEvent', () => {
    describe('#getParamsCreator', () => {
      const serviceContainer = new ServiceContainer();
      const args = Arguments.create();

      const payload = {
        serviceContainer,
        args,
        env: 'test',
      };
      const paramsCreator = LifeCycleBuildEvent.getParamsCreator(payload);

      describe('#createPreBuild', () => {
        it('should return the parameters for a PRE_BUILD event', () => {
          const params = paramsCreator.createPreBuild();

          expect(params[0]).toEqual(BUILD_EVENTS.PRE_BUILD);

          const event = params[1] as LifeCycleBuildEvent;

          expect(event).toBeInstanceOf(LifeCycleBuildEvent);
          expect(event.getType()).toEqual(BUILD_EVENTS.PRE_BUILD);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createBuild', () => {
        it('should return the parameters for a BUILD event', () => {
          const params = paramsCreator.createBuild();

          expect(params[0]).toEqual(BUILD_EVENTS.BUILD);

          const event = params[1] as LifeCycleBuildEvent;

          expect(event).toBeInstanceOf(LifeCycleBuildEvent);
          expect(event.getType()).toEqual(BUILD_EVENTS.BUILD);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createPostBuild', () => {
        it('should return the parameters for a POST_BUILD event', () => {
          const params = paramsCreator.createPostBuild();

          expect(params[0]).toEqual(BUILD_EVENTS.POST_BUILD);

          const event = params[1] as LifeCycleBuildEvent;

          expect(event).toBeInstanceOf(LifeCycleBuildEvent);
          expect(event.getType()).toEqual(BUILD_EVENTS.POST_BUILD);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });
    });
  });

  describe('LifeCycleRunEvent', () => {
    describe('#getParamsCreator', () => {
      const serviceContainer = new ServiceContainer();
      const args = Arguments.create();

      const payload = {
        serviceContainer,
        args,
        env: 'test',
      };
      const paramsCreator = LifeCycleRunEvent.getParamsCreator(payload);

      describe('#createPreRun', () => {
        it('should return the parameters for a PRE_RUN event', () => {
          const params = paramsCreator.createPreRun();

          expect(params[0]).toEqual(RUN_EVENTS.PRE_RUN);

          const event = params[1] as LifeCycleRunEvent;

          expect(event).toBeInstanceOf(LifeCycleRunEvent);
          expect(event.getType()).toEqual(RUN_EVENTS.PRE_RUN);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createRun', () => {
        it('should return the parameters for a RUN event', () => {
          const params = paramsCreator.createRun();

          expect(params[0]).toEqual(RUN_EVENTS.RUN);

          const event = params[1] as LifeCycleRunEvent;

          expect(event).toBeInstanceOf(LifeCycleRunEvent);
          expect(event.getType()).toEqual(RUN_EVENTS.RUN);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });

      describe('#createPostRun', () => {
        it('should return the parameters for a POST_RUN event', () => {
          const params = paramsCreator.createPostRun();

          expect(params[0]).toEqual(RUN_EVENTS.POST_RUN);

          const event = params[1] as LifeCycleRunEvent;

          expect(event).toBeInstanceOf(LifeCycleRunEvent);
          expect(event.getType()).toEqual(RUN_EVENTS.POST_RUN);
          expect(event.getServiceContainer()).toBe(serviceContainer);
          expect(event.getArguments()).toBe(args);
          expect(event.getEnv()).toEqual('test');
        });
      });
    });
  });
});
