import { PrimitiveContainer } from 'alliage/core/primitive-container';
import { ServiceContainer } from 'alliage-di/service-container';
import { AbstractProcess, SIGNAL } from 'alliage-process-manager/process';
import { INIT_EVENTS, RUN_EVENTS } from 'alliage-lifecycle/events';
import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';
import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';
import {
  PROCESS_EVENTS,
  PreRegisterServicesEvent,
  PostRegisterServicesEvent,
  PreConfigureEvent,
  PostConfigureEvent,
  PreExecuteEvent,
  PreTerminateEvent,
  PostTerminateEvent,
} from 'alliage-process-manager/events';

import ProcessManagerModule from '..';

describe('process-manager', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((_code: number | undefined) => ({} as never));
  });

  afterEach(() => {
    jest.resetAllMocks();
    ((process.exit as unknown) as jest.SpyInstance).mockRestore();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('ProcessManagerModule', () => {
    class TestProcess extends AbstractProcess {
      getName() {
        return 'test-process';
      }

      registerServices() {}

      configure() {}

      execute() {
        return Promise.resolve(true);
      }
    }

    const registerServicesMock = jest.spyOn(TestProcess.prototype, 'registerServices');
    const configureMock = jest.spyOn(TestProcess.prototype, 'configure');
    const executeMock = jest.spyOn(TestProcess.prototype, 'execute');
    const terminateMock = jest.spyOn(TestProcess.prototype, 'terminate');

    const pmm = new ProcessManagerModule();
    const pc = new PrimitiveContainer();
    const sc = new ServiceContainer();

    const eventManagerMock = {
      on: jest.fn(),
      emit: jest.fn(),
    };

    pc.set('service_container', sc);
    sc.addService('event_manager', eventManagerMock);
    sc.registerService('test_process', TestProcess);

    describe('#getKernelEventHandlers', () => {
      it('should return the kernel event handers', () => {
        expect(pmm.getKernelEventHandlers()).toEqual({
          init: pmm.onInit,
        });
      });
    });

    describe('#onInit', () => {
      describe('With an existing process name', () => {
        let initEventHandler: Function;
        let runEventHandler: Function;
        const processEventHandlers: { [event: string]: Function } = {};

        it('should listen to the INIT_EVENTS.INIT event', () => {
          pmm.onInit(
            Arguments.create({}, ['test-process']),
            'test',
            pc,
            INITIALIZATION_CONTEXT.RUN,
          );
          expect(eventManagerMock.on).toHaveBeenCalledTimes(1);
          expect(eventManagerMock.on).toHaveBeenCalledWith(INIT_EVENTS.INIT, expect.any(Function));

          // eslint-disable-next-line prefer-destructuring
          initEventHandler = eventManagerMock.on.mock.calls[0][1];
        });

        it('should load the process specified in the arguments and listen to the RUN_EVENT.RUN event', () => {
          initEventHandler();

          // Checks that process lifecycle events are emitted
          expect(eventManagerMock.emit.mock.calls).toEqual([
            [PROCESS_EVENTS.PRE_REGISTER_SERVICES, expect.any(PreRegisterServicesEvent)],
            [PROCESS_EVENTS.POST_REGISTER_SERVICES, expect.any(PostRegisterServicesEvent)],
          ]);

          // Checks that the process registerServices method is called between the "REGISTER_SERVICES" process lifecycle events
          expect(registerServicesMock).toHaveBeenCalledWith(sc);
          expect(registerServicesMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[0],
          );
          expect(registerServicesMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[1],
          );

          // Checks that the it has listened to RUN_EVENTS.RUN event
          expect(eventManagerMock.on).toHaveBeenCalledTimes(1);
          expect(eventManagerMock.on).toHaveBeenCalledWith(RUN_EVENTS.RUN, expect.any(Function));

          // eslint-disable-next-line prefer-destructuring
          runEventHandler = eventManagerMock.on.mock.calls[0][1];
        });

        it('should run the process, emit process lifcycle events, and listen to process events', async () => {
          executeMock.mockResolvedValue(true);
          jest.spyOn(process, 'on').mockImplementation(<any>((event: string, handler: Function) => {
            processEventHandlers[event] = handler;
          }));
          await runEventHandler();

          // Checks that process lifecycle events are emitted
          expect(eventManagerMock.emit.mock.calls).toEqual([
            [PROCESS_EVENTS.PRE_CONFIGURE, expect.any(PreConfigureEvent)],
            [PROCESS_EVENTS.POST_CONFIGURE, expect.any(PostConfigureEvent)],
            [PROCESS_EVENTS.PRE_EXECUTE, expect.any(PreExecuteEvent)],
            [PROCESS_EVENTS.PRE_TERMINATE, expect.any(PreTerminateEvent)],
            [PROCESS_EVENTS.POST_TERMINATE, expect.any(PostTerminateEvent)],
          ]);

          // Checks that the process configure method is called between the "CONFIGURE" process lifecycle events
          expect(configureMock).toHaveBeenCalledWith(expect.any(CommandBuilder));
          expect(configureMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[0],
          );
          expect(configureMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[1],
          );

          // Checks that the process execute method is called between the "EXECUTE" process lifecycle events
          expect(executeMock).toHaveBeenCalledWith(
            expect.any(Arguments),
            expect.any(Function),
            'test',
          );
          expect(executeMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[2],
          );
          expect(executeMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[3],
          );

          const preTerminateEvent: PreTerminateEvent = eventManagerMock.emit.mock.calls[3][1];
          expect(preTerminateEvent.getEnv()).toEqual('test');
          expect(preTerminateEvent.getSignal()).toEqual(SIGNAL.SUCCESS_SHUTDOWN);
          expect(preTerminateEvent.getSignalPayload()).toEqual({});

          const postTerminateEvent: PostTerminateEvent = eventManagerMock.emit.mock.calls[4][1];
          expect(postTerminateEvent.getEnv()).toEqual('test');
          expect(postTerminateEvent.getSignal()).toEqual(SIGNAL.SUCCESS_SHUTDOWN);
          expect(postTerminateEvent.getSignalPayload()).toEqual({});

          // Checks that the process terminate method is called between the "TERMINATE" process lifecycle events
          expect(terminateMock).toHaveBeenCalledTimes(1);
          expect(terminateMock).toHaveBeenCalledWith(
            expect.any(Arguments),
            'test',
            SIGNAL.SUCCESS_SHUTDOWN,
            {},
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[3],
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[4],
          );

          // Checks that it has listened to process events
          expect(processEventHandlers).toEqual({
            SIGINT: expect.any(Function),
            SIGTERM: expect.any(Function),
            uncaughtException: expect.any(Function),
            unhandledRejection: expect.any(Function),
          });
        });

        it('should call the terminate method and events with a SIGNAL.FAILURE_SHUTDOWN when the execute method returns false', async () => {
          executeMock.mockResolvedValue(false);
          jest.spyOn(process, 'on').mockImplementation(<any>((event: string, handler: Function) => {
            processEventHandlers[event] = handler;
          }));
          await runEventHandler();

          // Checks that process lifecycle events are emitted
          expect(eventManagerMock.emit.mock.calls).toEqual([
            [PROCESS_EVENTS.PRE_CONFIGURE, expect.any(PreConfigureEvent)],
            [PROCESS_EVENTS.POST_CONFIGURE, expect.any(PostConfigureEvent)],
            [PROCESS_EVENTS.PRE_EXECUTE, expect.any(PreExecuteEvent)],
            [PROCESS_EVENTS.PRE_TERMINATE, expect.any(PreTerminateEvent)],
            [PROCESS_EVENTS.POST_TERMINATE, expect.any(PostTerminateEvent)],
          ]);

          const preTerminateEvent: PreTerminateEvent = eventManagerMock.emit.mock.calls[3][1];
          expect(preTerminateEvent.getEnv()).toEqual('test');
          expect(preTerminateEvent.getSignal()).toEqual(SIGNAL.FAILURE_SHUTDOWN);
          expect(preTerminateEvent.getSignalPayload()).toEqual({});

          const postTerminateEvent: PostTerminateEvent = eventManagerMock.emit.mock.calls[4][1];
          expect(postTerminateEvent.getEnv()).toEqual('test');
          expect(postTerminateEvent.getSignal()).toEqual(SIGNAL.FAILURE_SHUTDOWN);
          expect(postTerminateEvent.getSignalPayload()).toEqual({});

          // Checks that the process terminate method is called between the "TERMINATE" process lifecycle events
          expect(terminateMock).toHaveBeenCalledTimes(1);
          expect(terminateMock).toHaveBeenCalledWith(
            expect.any(Arguments),
            'test',
            SIGNAL.FAILURE_SHUTDOWN,
            {},
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[3],
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[4],
          );
        });

        it('should call the terminate method in case of SIGINT signal and trigger process lifcycle events', async () => {
          await processEventHandlers.SIGINT();

          // Checks that process lifecycle events are emitted
          expect(eventManagerMock.emit.mock.calls).toEqual([
            [PROCESS_EVENTS.PRE_TERMINATE, expect.any(PreTerminateEvent)],
            [PROCESS_EVENTS.POST_TERMINATE, expect.any(PostTerminateEvent)],
          ]);

          const preTerminateEvent: PreTerminateEvent = eventManagerMock.emit.mock.calls[0][1];
          expect(preTerminateEvent.getEnv()).toEqual('test');
          expect(preTerminateEvent.getSignal()).toEqual(SIGNAL.SIGINT);
          expect(preTerminateEvent.getSignalPayload()).toEqual({});

          const postTerminateEvent: PostTerminateEvent = eventManagerMock.emit.mock.calls[1][1];
          expect(postTerminateEvent.getEnv()).toEqual('test');
          expect(postTerminateEvent.getSignal()).toEqual(SIGNAL.SIGINT);
          expect(postTerminateEvent.getSignalPayload()).toEqual({});

          // Checks that the process terminate method is called between the "TERMINATE" process lifecycle events
          expect(terminateMock).toHaveBeenCalledTimes(1);
          expect(terminateMock).toHaveBeenCalledWith(
            expect.any(Arguments),
            'test',
            SIGNAL.SIGINT,
            {},
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[0],
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[1],
          );
        });

        it('should call the terminate method in case of SIGTERM signal and trigger process lifcycle events', async () => {
          await processEventHandlers.SIGTERM();

          // Checks that process lifecycle events are emitted
          expect(eventManagerMock.emit.mock.calls).toEqual([
            [PROCESS_EVENTS.PRE_TERMINATE, expect.any(PreTerminateEvent)],
            [PROCESS_EVENTS.POST_TERMINATE, expect.any(PostTerminateEvent)],
          ]);

          const preTerminateEvent: PreTerminateEvent = eventManagerMock.emit.mock.calls[0][1];
          expect(preTerminateEvent.getEnv()).toEqual('test');
          expect(preTerminateEvent.getSignal()).toEqual(SIGNAL.SIGTERM);
          expect(preTerminateEvent.getSignalPayload()).toEqual({});

          const postTerminateEvent: PostTerminateEvent = eventManagerMock.emit.mock.calls[1][1];
          expect(postTerminateEvent.getEnv()).toEqual('test');
          expect(postTerminateEvent.getSignal()).toEqual(SIGNAL.SIGTERM);
          expect(postTerminateEvent.getSignalPayload()).toEqual({});

          // Checks that the process terminate method is called between the "TERMINATE" process lifecycle events
          expect(terminateMock).toHaveBeenCalledTimes(1);
          expect(terminateMock).toHaveBeenCalledWith(
            expect.any(Arguments),
            'test',
            SIGNAL.SIGTERM,
            {},
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[0],
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[1],
          );
        });

        it('should call the terminate method in case of uncaughtException signal and trigger process lifcycle events', async () => {
          const errorMock = new Error();
          await processEventHandlers.uncaughtException(errorMock);

          // Checks that process lifecycle events are emitted
          expect(eventManagerMock.emit.mock.calls).toEqual([
            [PROCESS_EVENTS.PRE_TERMINATE, expect.any(PreTerminateEvent)],
            [PROCESS_EVENTS.POST_TERMINATE, expect.any(PostTerminateEvent)],
          ]);

          const preTerminateEvent: PreTerminateEvent = eventManagerMock.emit.mock.calls[0][1];
          expect(preTerminateEvent.getEnv()).toEqual('test');
          expect(preTerminateEvent.getSignal()).toEqual(SIGNAL.UNCAUGHT_EXCEPTION);
          expect(preTerminateEvent.getSignalPayload()).toEqual({ error: errorMock });

          const postTerminateEvent: PostTerminateEvent = eventManagerMock.emit.mock.calls[1][1];
          expect(postTerminateEvent.getEnv()).toEqual('test');
          expect(postTerminateEvent.getSignal()).toEqual(SIGNAL.UNCAUGHT_EXCEPTION);
          expect(postTerminateEvent.getSignalPayload()).toEqual({ error: errorMock });

          // Checks that the process terminate method is called between the "TERMINATE" process lifecycle events
          expect(terminateMock).toHaveBeenCalledTimes(1);
          expect(terminateMock).toHaveBeenCalledWith(
            expect.any(Arguments),
            'test',
            SIGNAL.UNCAUGHT_EXCEPTION,
            { error: errorMock },
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[0],
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[1],
          );
        });

        it('should call the terminate method in case of unhandledRejection signal and trigger process lifcycle events', async () => {
          const errorMock = new Error();
          const promiseMock = Promise.reject(errorMock);
          await processEventHandlers.unhandledRejection(errorMock, promiseMock);

          // Checks that process lifecycle events are emitted
          expect(eventManagerMock.emit.mock.calls).toEqual([
            [PROCESS_EVENTS.PRE_TERMINATE, expect.any(PreTerminateEvent)],
            [PROCESS_EVENTS.POST_TERMINATE, expect.any(PostTerminateEvent)],
          ]);

          const preTerminateEvent: PreTerminateEvent = eventManagerMock.emit.mock.calls[0][1];
          expect(preTerminateEvent.getEnv()).toEqual('test');
          expect(preTerminateEvent.getSignal()).toEqual(SIGNAL.UNHANDLED_REJECTION);
          expect(preTerminateEvent.getSignalPayload()).toEqual({
            reason: errorMock,
            promise: promiseMock,
          });

          const postTerminateEvent: PostTerminateEvent = eventManagerMock.emit.mock.calls[1][1];
          expect(postTerminateEvent.getEnv()).toEqual('test');
          expect(postTerminateEvent.getSignal()).toEqual(SIGNAL.UNHANDLED_REJECTION);
          expect(postTerminateEvent.getSignalPayload()).toEqual({
            reason: errorMock,
            promise: promiseMock,
          });

          // Checks that the process terminate method is called between the "TERMINATE" process lifecycle events
          expect(terminateMock).toHaveBeenCalledTimes(1);
          expect(terminateMock).toHaveBeenCalledWith(
            expect.any(Arguments),
            'test',
            SIGNAL.UNHANDLED_REJECTION,
            { reason: errorMock, promise: promiseMock },
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeGreaterThan(
            eventManagerMock.emit.mock.invocationCallOrder[0],
          );
          expect(terminateMock.mock.invocationCallOrder[0]).toBeLessThan(
            eventManagerMock.emit.mock.invocationCallOrder[1],
          );
        });
      });

      describe('With a non existing process name', () => {
        it('should not run any process and stop the execution of the script', () => {
          jest.spyOn(process, 'exit').mockReturnValue(undefined as never);
          jest.spyOn(console, 'error').mockReturnValue(undefined);

          pmm.onInit(
            Arguments.create({}, ['unknown-process']),
            'test',
            pc,
            INITIALIZATION_CONTEXT.RUN,
          );

          const initEventHandler = eventManagerMock.on.mock.calls[0][1];
          eventManagerMock.on.mockClear();

          initEventHandler();

          expect(eventManagerMock.on).not.toHaveBeenCalled();
          expect(registerServicesMock).not.toHaveBeenCalled();
          expect(configureMock).not.toHaveBeenCalled();
          expect(executeMock).not.toHaveBeenCalled();

          expect(process.exit).toHaveBeenCalledWith(1);
          expect(console.error).toHaveBeenCalled();
        });
      });

      describe('Not in an "RUN" initialization context', () => {
        it('should not listen to INIT_EVENTS.INIT', () => {
          pmm.onInit(
            Arguments.create({}, ['test-process']),
            'test',
            pc,
            INITIALIZATION_CONTEXT.BUILD,
          );

          expect(eventManagerMock.on).not.toHaveBeenCalled();

          pmm.onInit(
            Arguments.create({}, ['test-process']),
            'test',
            pc,
            INITIALIZATION_CONTEXT.INSTALL,
          );

          expect(eventManagerMock.on).not.toHaveBeenCalled();
        });
      });
    });
  });
});
