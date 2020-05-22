import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';
import { AbstractProcess, SIGNAL } from '../process';
import {
  PROCESS_EVENTS,
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

    execute(_args: Arguments, _env: string) {
      return Promise.resolve(true);
    }
  }

  const dummyProcess = new DummyProcess();

  describe('PreConfigureEvent', () => {
    const cb = CommandBuilder.create();
    const event = new PreConfigureEvent(dummyProcess, cb, 'test');

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

    describe('#getEnv', () => {
      it('should return the env passed in the constructor', () => {
        expect(event.getEnv()).toEqual('test');
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PreConfigureEvent.getParams(dummyProcess, cb, 'test');

        expect(params[0]).toEqual(PROCESS_EVENTS.PRE_CONFIGURE);

        const paramsEvent = params[1] as PreConfigureEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.PRE_CONFIGURE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
        expect(paramsEvent.getConfig()).toEqual(cb);
        expect(paramsEvent.getEnv()).toEqual('test');
      });
    });
  });

  describe('PostConfigureEvent', () => {
    const cb = CommandBuilder.create();
    const event = new PostConfigureEvent(dummyProcess, cb, 'test');

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

    describe('#getEnv', () => {
      it('should return the env passed in the constructor', () => {
        expect(event.getEnv()).toEqual('test');
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PostConfigureEvent.getParams(dummyProcess, cb, 'test');

        expect(params[0]).toEqual(PROCESS_EVENTS.POST_CONFIGURE);

        const paramsEvent = params[1] as PostConfigureEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.POST_CONFIGURE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
        expect(paramsEvent.getConfig()).toEqual(cb);
        expect(paramsEvent.getEnv()).toEqual('test');
      });
    });
  });

  describe('PreExecuteEvent', () => {
    const args = Arguments.create();
    const event = new PreExecuteEvent(dummyProcess, args, 'test');

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

    describe('#getEnv', () => {
      it('should return the env passed in the constructor', () => {
        expect(event.getEnv()).toBe('test');
      });
    });

    describe('#setProcess', () => {
      it('should allow to update the process', () => {
        const otherDummyProcess = new DummyProcess();
        event.setProcess(otherDummyProcess);

        expect(event.getProcess()).toBe(otherDummyProcess);
      });
    });

    describe('#getParams', () => {
      it('should return the params accepted by the "EventManager.emit" method', () => {
        const params = PreExecuteEvent.getParams(dummyProcess, args, 'test');

        expect(params[0]).toEqual(PROCESS_EVENTS.PRE_EXECUTE);

        const paramsEvent = params[1] as PreExecuteEvent;

        expect(paramsEvent.getType()).toEqual(PROCESS_EVENTS.PRE_EXECUTE);
        expect(paramsEvent.getProcess()).toEqual(dummyProcess);
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
