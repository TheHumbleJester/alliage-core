import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';
import { AbstractProcess, StopProcessHandler, SIGNAL } from '../process';
import {
  PreRegisterServicesEvent,
  PROCESS_EVENTS,
  PostRegisterServicesEvent,
  PreConfigureEvent,
  PostConfigureEvent,
  PreExecuteEvent,
  PreTerminateEvent,
  PostTerminateEvent,
} from '../events';

describe('process-manager/events', () => {
  class DummyProcess extends AbstractProcess {
    getName() {
      return 'dummy_process';
    }

    execute(_args: Arguments, _stopProcess: StopProcessHandler, _env: string) {
      return Promise.resolve(true);
    }

    configure(_config: CommandBuilder) {}
  }

  const dummyProcess = new DummyProcess();

  describe('PreRegisterServicesEvent', () => {
    const event = new PreRegisterServicesEvent(dummyProcess);

    describe('#getType', () => {
      it('should return a PROCESS_EVENTS.PRE_REGISTER_SERVICES', () => {
        expect(event.getType()).toEqual(PROCESS_EVENTS.PRE_REGISTER_SERVICES);
      });
    });

    describe('#getProcess', () => {
      it('should return the process passed in the constructor', () => {
        expect(event.getProcess()).toBe(dummyProcess);
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PreRegisterServicesEvent.getParams(dummyProcess);

        expect(params[0]).toEqual(PROCESS_EVENTS.PRE_REGISTER_SERVICES);

        const paramsEvent = params[1] as PreRegisterServicesEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.PRE_REGISTER_SERVICES);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
      });
    });
  });

  describe('PostRegisterServicesEvent', () => {
    const event = new PostRegisterServicesEvent(dummyProcess);

    describe('#getType', () => {
      it('should return a PROCESS_EVENTS.POST_REGISTER_SERVICES', () => {
        expect(event.getType()).toEqual(PROCESS_EVENTS.POST_REGISTER_SERVICES);
      });
    });

    describe('#getProcess', () => {
      it('should return the process passed in the constructor', () => {
        expect(event.getProcess()).toBe(dummyProcess);
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PostRegisterServicesEvent.getParams(dummyProcess);

        expect(params[0]).toEqual(PROCESS_EVENTS.POST_REGISTER_SERVICES);

        const paramsEvent = params[1] as PostRegisterServicesEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.POST_REGISTER_SERVICES);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
      });
    });
  });

  describe('PreConfigureEvent', () => {
    const cb = CommandBuilder.create();
    const event = new PreConfigureEvent(dummyProcess, cb);

    describe('#getType', () => {
      it('should return a PROCESS_EVENTS.PRE_CONFIGURE', () => {
        expect(event.getType()).toEqual(PROCESS_EVENTS.PRE_CONFIGURE);
      });
    });

    describe('#getProcess', () => {
      it('should return the process passed in the constructor', () => {
        expect(event.getProcess()).toBe(dummyProcess);
      });
    });

    describe('#getConfig', () => {
      it('should return the command builder passed in the constructor', () => {
        expect(event.getConfig()).toBe(cb);
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PreConfigureEvent.getParams(dummyProcess, cb);

        expect(params[0]).toEqual(PROCESS_EVENTS.PRE_CONFIGURE);

        const paramsEvent = params[1] as PreConfigureEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.PRE_CONFIGURE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
        expect(paramsEvent.getConfig()).toEqual(cb);
      });
    });
  });

  describe('PostConfigureEvent', () => {
    const cb = CommandBuilder.create();
    const event = new PostConfigureEvent(dummyProcess, cb);

    describe('#getType', () => {
      it('should return a PROCESS_EVENTS.POST_CONFIGURE', () => {
        expect(event.getType()).toEqual(PROCESS_EVENTS.POST_CONFIGURE);
      });
    });

    describe('#getProcess', () => {
      it('should return the process passed in the constructor', () => {
        expect(event.getProcess()).toBe(dummyProcess);
      });
    });

    describe('#getConfig', () => {
      it('should return the command builder passed in the constructor', () => {
        expect(event.getConfig()).toBe(cb);
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PostConfigureEvent.getParams(dummyProcess, cb);

        expect(params[0]).toEqual(PROCESS_EVENTS.POST_CONFIGURE);

        const paramsEvent = params[1] as PostConfigureEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.POST_CONFIGURE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
        expect(paramsEvent.getConfig()).toEqual(cb);
      });
    });
  });

  describe('PreExecuteEvent', () => {
    const args = Arguments.create();
    const stopHandler = ((() => {}) as unknown) as StopProcessHandler;
    const event = new PreExecuteEvent(dummyProcess, args, stopHandler, 'test');

    describe('#getType', () => {
      it('should return a PROCESS_EVENTS.PRE_EXECUTE', () => {
        expect(event.getType()).toEqual(PROCESS_EVENTS.PRE_EXECUTE);
      });
    });

    describe('#getProcess', () => {
      it('should return the process passed in the constructor', () => {
        expect(event.getProcess()).toBe(dummyProcess);
      });
    });

    describe('#getArgs', () => {
      it('should return the arguments passed in the constructor', () => {
        expect(event.getArgs()).toBe(args);
      });
    });

    describe('#getStopHandler', () => {
      it('should return the stop handler passed in the constructor', () => {
        expect(event.getStopHandler()).toBe(stopHandler);
      });
    });

    describe('#getEnv', () => {
      it('should return the env passed in the constructor', () => {
        expect(event.getEnv()).toBe('test');
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PreExecuteEvent.getParams(dummyProcess, args, stopHandler, 'test');

        expect(params[0]).toEqual(PROCESS_EVENTS.PRE_EXECUTE);

        const paramsEvent = params[1] as PreExecuteEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.PRE_EXECUTE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
        expect(paramsEvent.getArgs()).toEqual(args);
        expect(paramsEvent.getArgs()).toBe(args);
        expect(paramsEvent.getEnv()).toBe('test');
      });
    });
  });

  describe('PreTerminateEvent', () => {
    const args = Arguments.create();
    const signalPayload = {};
    const event = new PreTerminateEvent(
      dummyProcess,
      args,
      SIGNAL.SUCCESS_SHUTDOWN,
      signalPayload,
      'test',
    );

    describe('#getType', () => {
      it('should return a PROCESS_EVENTS.PRE_EXECUTE', () => {
        expect(event.getType()).toEqual(PROCESS_EVENTS.PRE_TERMINATE);
      });
    });

    describe('#getProcess', () => {
      it('should return the process passed in the constructor', () => {
        expect(event.getProcess()).toBe(dummyProcess);
      });
    });

    describe('#getArgs', () => {
      it('should return the arguments passed in the constructor', () => {
        expect(event.getArgs()).toBe(args);
      });
    });

    describe('#getSignal', () => {
      it('should return the signal passed in the constructor', () => {
        expect(event.getSignal()).toBe(SIGNAL.SUCCESS_SHUTDOWN);
      });
    });

    describe('#getSignalPayload', () => {
      it('should return the signal passed in the constructor', () => {
        expect(event.getSignalPayload()).toBe(signalPayload);
      });
    });

    describe('#getEnv', () => {
      it('should return the env passed in the constructor', () => {
        expect(event.getEnv()).toBe('test');
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PreTerminateEvent.getParams(
          dummyProcess,
          args,
          SIGNAL.SUCCESS_SHUTDOWN,
          signalPayload,
          'test',
        );

        expect(params[0]).toEqual(PROCESS_EVENTS.PRE_TERMINATE);

        const paramsEvent = params[1] as PreTerminateEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.PRE_TERMINATE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
        expect(paramsEvent.getArgs()).toEqual(args);
        expect(event.getSignal()).toBe(SIGNAL.SUCCESS_SHUTDOWN);
        expect(event.getSignalPayload()).toBe(signalPayload);
        expect(event.getEnv()).toBe('test');
      });
    });
  });

  describe('PostTerminateEvent', () => {
    const args = Arguments.create();
    const signalPayload = {};
    const event = new PostTerminateEvent(
      dummyProcess,
      args,
      SIGNAL.SUCCESS_SHUTDOWN,
      signalPayload,
      'test',
    );

    describe('#getType', () => {
      it('should return a PROCESS_EVENTS.PRE_EXECUTE', () => {
        expect(event.getType()).toEqual(PROCESS_EVENTS.POST_TERMINATE);
      });
    });

    describe('#getProcess', () => {
      it('should return the process passed in the constructor', () => {
        expect(event.getProcess()).toBe(dummyProcess);
      });
    });

    describe('#getArgs', () => {
      it('should return the arguments passed in the constructor', () => {
        expect(event.getArgs()).toBe(args);
      });
    });

    describe('#getSignal', () => {
      it('should return the signal passed in the constructor', () => {
        expect(event.getSignal()).toBe(SIGNAL.SUCCESS_SHUTDOWN);
      });
    });

    describe('#getSignalPayload', () => {
      it('should return the signal passed in the constructor', () => {
        expect(event.getSignalPayload()).toBe(signalPayload);
      });
    });

    describe('#getEnv', () => {
      it('should return the env passed in the constructor', () => {
        expect(event.getEnv()).toBe('test');
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PostTerminateEvent.getParams(
          dummyProcess,
          args,
          SIGNAL.SUCCESS_SHUTDOWN,
          signalPayload,
          'test',
        );

        expect(params[0]).toEqual(PROCESS_EVENTS.POST_TERMINATE);

        const paramsEvent = params[1] as PostTerminateEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.POST_TERMINATE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
        expect(paramsEvent.getArgs()).toEqual(args);
        expect(event.getSignal()).toBe(SIGNAL.SUCCESS_SHUTDOWN);
        expect(event.getSignalPayload()).toBe(signalPayload);
        expect(event.getEnv()).toBe('test');
      });
    });
  });
});
