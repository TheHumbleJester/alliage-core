import { promisify } from 'util';

import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';

import { ServiceContainer } from 'alliage-di/service-container';
import { AbstractProcess, SignalPayload, SIGNAL } from 'alliage-process-manager/process';
import { RUN_EVENTS, LifeCycleRunEvent } from 'alliage-lifecycle/events';
import { EventManager } from 'alliage-lifecycle/event-manager';

import ProcessManagerModule from '..';
import {
  PROCESS_EVENTS,
  PreConfigureEvent,
  PostConfigureEvent,
  PreExecuteEvent,
  PreTerminateEvent,
} from '../events';

const waitForNextTick = promisify(process.nextTick);

describe('process-manager', () => {
  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((_code: number | undefined) => ({} as never));
  });

  afterEach(() => {
    jest.clearAllMocks();
    ((process.exit as unknown) as jest.SpyInstance).mockRestore();
    process.removeAllListeners();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('ProcessManagerModule', () => {
    class TestProcess extends AbstractProcess {
      getName() {
        return 'test-process';
      }

      configure(cb: CommandBuilder) {
        cb.addArgument('testArgument', {
          type: 'string',
          describe: 'Test argument',
        });
      }

      execute(_args: Arguments, _env: string) {
        return Promise.resolve(true);
      }
    }

    const module = new ProcessManagerModule();
    const serviceContainer = new ServiceContainer();
    const eventManager = new EventManager();
    const testProcess = new TestProcess();

    const configureSpy = jest.spyOn(TestProcess.prototype, 'configure');
    const executeSpy = jest.spyOn(TestProcess.prototype, 'execute');
    const terminateSpy = jest.spyOn(TestProcess.prototype, 'terminate');

    const preConfigureHandler = jest.fn();
    const postConfigureHandler = jest.fn();
    const preExecuteHandler = jest.fn();
    const preTerminateHandler = jest.fn();
    const postTerminateHandler = jest.fn();

    eventManager.on(PROCESS_EVENTS.PRE_CONFIGURE, preConfigureHandler);
    eventManager.on(PROCESS_EVENTS.POST_CONFIGURE, postConfigureHandler);
    eventManager.on(PROCESS_EVENTS.PRE_EXECUTE, preExecuteHandler);
    eventManager.on(PROCESS_EVENTS.PRE_TERMINATE, preTerminateHandler);
    eventManager.on(PROCESS_EVENTS.POST_TERMINATE, postTerminateHandler);

    serviceContainer.addService('test-process', testProcess);
    serviceContainer.addService('event_manager', eventManager);

    describe('#getEventHandlers', () => {
      it('should listen to the install event', () => {
        expect(module.getEventHandlers()).toEqual({
          [RUN_EVENTS.RUN]: module.handleRun,
        });
      });
    });

    describe('#handleRun', () => {
      it('should run the process corresponding to provided name in the arguments and exit successfully', async () => {
        const args = Arguments.create({}, [
          'test-process',
          'test-argument-value',
          '--pre-configure-option=test1',
          '--post-configure-option=test2',
        ]);
        const event = new LifeCycleRunEvent(RUN_EVENTS.RUN, {
          serviceContainer,
          args,
          env: 'test',
        });
        const otherTestProcess = new TestProcess();

        preConfigureHandler.mockImplementationOnce((event: PreConfigureEvent) => {
          expect(event.getEnv()).toEqual('test');
          expect(event.getProcess()).toBe(testProcess);
          expect(event.getConfig()).toBeInstanceOf(CommandBuilder);

          event.getConfig().addOption('pre-configure-option', {
            type: 'string',
            describe: 'Pre configure option',
          });
        });

        postConfigureHandler.mockImplementationOnce((event: PostConfigureEvent) => {
          expect(event.getEnv()).toEqual('test');
          expect(event.getProcess()).toBe(testProcess);
          expect(event.getConfig()).toBeInstanceOf(CommandBuilder);

          event.getConfig().addOption('post-configure-option', {
            type: 'string',
            describe: 'Post configure option',
          });
        });

        preExecuteHandler.mockImplementationOnce((event: PreExecuteEvent) => {
          expect(event.getEnv()).toEqual('test');
          expect(event.getProcess()).toBe(testProcess);
          expect(event.getArgs()).toBeInstanceOf(Arguments);
          expect(
            event
              .getArgs()
              .getParent()
              ?.getParent(),
          ).toBe(args);
          expect(event.getArgs().get('testArgument')).toEqual('test-argument-value');
          expect(event.getArgs().get('pre-configure-option')).toEqual('test1');
          expect(event.getArgs().get('post-configure-option')).toEqual('test2');

          event.setProcess(otherTestProcess);
        });

        executeSpy.mockImplementationOnce(async (processArgs: Arguments, env: string) => {
          expect(processArgs.getParent()?.getParent()).toBe(args);
          expect(processArgs.get('testArgument')).toEqual('test-argument-value');
          expect(processArgs.get('pre-configure-option')).toEqual('test1');
          expect(processArgs.get('post-configure-option')).toEqual('test2');
          expect(env).toEqual('test');
          return true;
        });

        preTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getEnv()).toEqual('test');
          expect(event.getProcess()).toBe(otherTestProcess);
          expect(event.getSignal()).toEqual(SIGNAL.SUCCESS_SHUTDOWN);
          expect(event.getSignalPayload()).toEqual({});
          expect(event.getArgs()).toBeInstanceOf(Arguments);
          expect(
            event
              .getArgs()
              .getParent()
              ?.getParent(),
          ).toBe(args);
          expect(event.getArgs().get('testArgument')).toEqual('test-argument-value');
          expect(event.getArgs().get('pre-configure-option')).toEqual('test1');
          expect(event.getArgs().get('post-configure-option')).toEqual('test2');
        });

        terminateSpy.mockImplementationOnce(
          async (processArgs: Arguments, env: string, signal: SIGNAL, payload: SignalPayload) => {
            expect(processArgs.getParent()?.getParent()).toBe(args);
            expect(processArgs.get('testArgument')).toEqual('test-argument-value');
            expect(processArgs.get('pre-configure-option')).toEqual('test1');
            expect(processArgs.get('post-configure-option')).toEqual('test2');
            expect(env).toEqual('test');
            expect(signal).toEqual(SIGNAL.SUCCESS_SHUTDOWN);
            expect(payload).toEqual({});
          },
        );

        postTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getEnv()).toEqual('test');
          expect(event.getProcess()).toBe(otherTestProcess);
          expect(event.getSignal()).toEqual(SIGNAL.SUCCESS_SHUTDOWN);
          expect(event.getSignalPayload()).toEqual({});
          expect(event.getArgs()).toBeInstanceOf(Arguments);
          expect(
            event
              .getArgs()
              .getParent()
              ?.getParent(),
          ).toBe(args);
          expect(event.getArgs().get('testArgument')).toEqual('test-argument-value');
          expect(event.getArgs().get('pre-configure-option')).toEqual('test1');
          expect(event.getArgs().get('post-configure-option')).toEqual('test2');
        });

        await module.handleRun(event);

        expect(configureSpy).toHaveBeenCalledTimes(1);
        expect(executeSpy).toHaveBeenCalledTimes(1);
        expect(terminateSpy).toHaveBeenCalledTimes(1);

        expect(preConfigureHandler).toHaveBeenCalledTimes(1);
        expect(postConfigureHandler).toHaveBeenCalledTimes(1);
        expect(preExecuteHandler).toHaveBeenCalledTimes(1);
        expect(preTerminateHandler).toHaveBeenCalledTimes(1);
        expect(postTerminateHandler).toHaveBeenCalledTimes(1);

        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should run the process corresponding to provided name in the arguments and exit with error if the "execute" method returns false', async () => {
        const args = Arguments.create({}, ['test-process', 'test-argument-value']);
        const event = new LifeCycleRunEvent(RUN_EVENTS.RUN, {
          serviceContainer,
          args,
          env: 'test',
        });

        executeSpy.mockResolvedValueOnce(false);

        preTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.FAILURE_SHUTDOWN);
          expect(event.getSignalPayload()).toEqual({});
        });

        postTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.FAILURE_SHUTDOWN);
          expect(event.getSignalPayload()).toEqual({});
        });

        await module.handleRun(event);

        expect(configureSpy).toHaveBeenCalledTimes(1);
        expect(executeSpy).toHaveBeenCalledTimes(1);
        expect(terminateSpy).toHaveBeenCalledTimes(1);

        expect(preConfigureHandler).toHaveBeenCalledTimes(1);
        expect(postConfigureHandler).toHaveBeenCalledTimes(1);
        expect(preExecuteHandler).toHaveBeenCalledTimes(1);
        expect(preTerminateHandler).toHaveBeenCalledTimes(1);
        expect(postTerminateHandler).toHaveBeenCalledTimes(1);

        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it("should not do anything if there's no process corresponding to the name in the arguments", async () => {
        const args = Arguments.create({}, ['unknown-process', 'test-argument-value']);
        const event = new LifeCycleRunEvent(RUN_EVENTS.RUN, {
          serviceContainer,
          args,
          env: 'test',
        });

        await module.handleRun(event);

        expect(configureSpy).not.toHaveBeenCalled();
        expect(executeSpy).not.toHaveBeenCalled();
        expect(terminateSpy).not.toHaveBeenCalled();
        expect(terminateSpy).not.toHaveBeenCalled();

        expect(preConfigureHandler).not.toHaveBeenCalled();
        expect(postConfigureHandler).not.toHaveBeenCalled();
        expect(preExecuteHandler).not.toHaveBeenCalled();
        expect(preTerminateHandler).not.toHaveBeenCalled();
        expect(postTerminateHandler).not.toHaveBeenCalled();

        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('should terminate the process in case of SIGINT', async () => {
        const args = Arguments.create({}, ['test-process', 'test-argument-value']);
        const event = new LifeCycleRunEvent(RUN_EVENTS.RUN, {
          serviceContainer,
          args,
          env: 'test',
        });

        await module.handleRun(event);

        expect(preConfigureHandler).toHaveBeenCalledTimes(1);
        expect(postConfigureHandler).toHaveBeenCalledTimes(1);
        expect(preExecuteHandler).toHaveBeenCalledTimes(1);

        jest.clearAllMocks();

        preTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.SIGINT);
          expect(event.getSignalPayload()).toEqual({});
        });

        postTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.SIGINT);
          expect(event.getSignalPayload()).toEqual({});
        });

        process.emit('SIGINT', 'SIGINT');
        await waitForNextTick();

        expect(preTerminateHandler).toHaveBeenCalledTimes(1);
        expect(postTerminateHandler).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should terminate the process in case of SIGTERM', async () => {
        const args = Arguments.create({}, ['test-process', 'test-argument-value']);
        const event = new LifeCycleRunEvent(RUN_EVENTS.RUN, {
          serviceContainer,
          args,
          env: 'test',
        });

        await module.handleRun(event);

        expect(preConfigureHandler).toHaveBeenCalledTimes(1);
        expect(postConfigureHandler).toHaveBeenCalledTimes(1);
        expect(preExecuteHandler).toHaveBeenCalledTimes(1);

        jest.clearAllMocks();

        preTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.SIGTERM);
          expect(event.getSignalPayload()).toEqual({});
        });

        postTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.SIGTERM);
          expect(event.getSignalPayload()).toEqual({});
        });

        process.emit('SIGTERM', 'SIGTERM');
        await waitForNextTick();

        expect(preTerminateHandler).toHaveBeenCalledTimes(1);
        expect(postTerminateHandler).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should terminate the process in case of uncaughtException', async () => {
        const args = Arguments.create({}, ['test-process', 'test-argument-value']);
        const event = new LifeCycleRunEvent(RUN_EVENTS.RUN, {
          serviceContainer,
          args,
          env: 'test',
        });

        await module.handleRun(event);

        expect(preConfigureHandler).toHaveBeenCalledTimes(1);
        expect(postConfigureHandler).toHaveBeenCalledTimes(1);
        expect(preExecuteHandler).toHaveBeenCalledTimes(1);

        jest.clearAllMocks();

        const error = new Error();

        preTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.UNCAUGHT_EXCEPTION);
          expect(event.getSignalPayload()).toEqual({ error });
        });

        postTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.UNCAUGHT_EXCEPTION);
          expect(event.getSignalPayload()).toEqual({ error });
        });

        process.emit('uncaughtException', error);
        await waitForNextTick();

        expect(preTerminateHandler).toHaveBeenCalledTimes(1);
        expect(postTerminateHandler).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('should terminate the process in case of unhandledRejection', async () => {
        const args = Arguments.create({}, ['test-process', 'test-argument-value']);
        const event = new LifeCycleRunEvent(RUN_EVENTS.RUN, {
          serviceContainer,
          args,
          env: 'test',
        });

        await module.handleRun(event);

        expect(preConfigureHandler).toHaveBeenCalledTimes(1);
        expect(postConfigureHandler).toHaveBeenCalledTimes(1);
        expect(preExecuteHandler).toHaveBeenCalledTimes(1);

        jest.clearAllMocks();

        const error = new Error();
        const promise = Promise.reject(error);

        preTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.UNHANDLED_REJECTION);
          expect(event.getSignalPayload()).toEqual({ reason: error, promise });
        });

        postTerminateHandler.mockImplementationOnce((event: PreTerminateEvent) => {
          expect(event.getSignal()).toEqual(SIGNAL.UNHANDLED_REJECTION);
          expect(event.getSignalPayload()).toEqual({ reason: error, promise });
        });

        process.emit('unhandledRejection', error, promise);
        await waitForNextTick();

        expect(preTerminateHandler).toHaveBeenCalledTimes(1);
        expect(postTerminateHandler).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledTimes(1);
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });
  });
});
