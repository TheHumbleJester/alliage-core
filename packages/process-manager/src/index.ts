import { ArgumentsParser, CommandBuilder } from 'alliage/core/utils/cli';

import { RUN_EVENTS, LifeCycleRunEvent } from 'alliage-lifecycle/events';
import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { Constructor } from 'alliage-di/dependencies';
import { EventManager } from 'alliage-lifecycle/event-manager';

import { AbstractProcess, SIGNAL, SignalPayload, SUCCESSFUL_SIGNALS } from './process';
import {
  PreConfigureEvent,
  PostConfigureEvent,
  PreExecuteEvent,
  PreTerminateEvent,
  PostTerminateEvent,
} from './events';

export = class ProcessManagerModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [RUN_EVENTS.RUN]: this.handleRun,
    };
  }

  handleRun = async (event: LifeCycleRunEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const processes = serviceContainer
      .getAllInstancesOf<AbstractProcess>(AbstractProcess as Constructor)
      .reduce(
        (acc, process) => acc.set(process.getName(), process),
        new Map<string, AbstractProcess>(),
      );

    const parsedArgs = ArgumentsParser.parse(
      CommandBuilder.create()
        .setDescription('Runs a process')
        .addArgument('process', {
          describe: 'The process to run',
          type: 'string',
          choices: [...processes.keys()],
        }),
      event.getArguments(),
    );

    const processName = parsedArgs.get('process');

    const currentProcess = <AbstractProcess>processes.get(processName);
    if (!currentProcess) {
      return;
    }

    const config = CommandBuilder.create();
    await eventManager.emit(...PreConfigureEvent.getParams(currentProcess, config, event.getEnv()));
    currentProcess.configure(config);
    await eventManager.emit(
      ...PostConfigureEvent.getParams(currentProcess, config, event.getEnv()),
    );

    const processArgs = ArgumentsParser.parse(config, parsedArgs);

    const preExecuteEvent = new PreExecuteEvent(currentProcess, processArgs, event.getEnv());
    await eventManager.emit(preExecuteEvent.getType(), preExecuteEvent);
    const computedProcess = preExecuteEvent.getProcess();

    const handleStop = async (signal: SIGNAL, payload: SignalPayload) => {
      await eventManager.emit(
        ...PreTerminateEvent.getParams(
          computedProcess,
          processArgs,
          signal,
          payload,
          event.getEnv(),
        ),
      );
      await computedProcess.terminate(processArgs, event.getEnv(), signal, payload);
      await eventManager.emit(
        ...PostTerminateEvent.getParams(
          computedProcess,
          processArgs,
          signal,
          payload,
          event.getEnv(),
        ),
      );
      process.exit(SUCCESSFUL_SIGNALS.includes(signal) ? 0 : 1);
    };
    process.on('SIGINT', () => handleStop(SIGNAL.SIGINT, {}));
    process.on('SIGTERM', () => handleStop(SIGNAL.SIGTERM, {}));
    process.on('uncaughtException', (error: Error) =>
      handleStop(SIGNAL.UNCAUGHT_EXCEPTION, { error }),
    );
    process.on('unhandledRejection', (reason, promise: Promise<any>) =>
      handleStop(SIGNAL.UNHANDLED_REJECTION, { reason, promise }),
    );

    const result = await computedProcess.execute(processArgs, event.getEnv());
    await handleStop(result ? SIGNAL.SUCCESS_SHUTDOWN : SIGNAL.FAILURE_SHUTDOWN, {});
  };
};
