import { AbstractModule } from 'alliage/core/module';
import { PrimitiveContainer } from 'alliage/core/primitive-container';
import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';
import { Arguments, ArgumentsParser, CommandBuilder } from 'alliage/core/utils/cli';
import { INIT_EVENTS, RUN_EVENTS } from 'alliage-lifecycle/events';
import { ServiceContainer } from 'alliage-di/service-container';
import { Constructor } from 'alliage-di/dependencies';
import { EventManager } from 'alliage-lifecycle/event-manager';

import {
  AbstractProcess,
  SIGNAL,
  SignalPayload,
  StopProcessHandler,
  SUCCESSFUL_SIGNALS,
} from './process';
import {
  PreRegisterServicesEvent,
  PostRegisterServicesEvent,
  PreConfigureEvent,
  PostConfigureEvent,
  PreExecuteEvent,
  PreTerminateEvent,
  PostTerminateEvent,
} from './events';

export = class ProcessManagerModule extends AbstractModule {
  onInit = async (
    args: Arguments,
    env: string,
    container: PrimitiveContainer,
    context: INITIALIZATION_CONTEXT,
  ) => {
    if (context === INITIALIZATION_CONTEXT.RUN) {
      const serviceContainer = container.get<ServiceContainer>('service_container');
      const eventManager = serviceContainer.getService<EventManager>('event_manager');

      eventManager.on(INIT_EVENTS.INIT, () => {
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
          args,
        );

        const processName = parsedArgs.get('process');

        const currentProcess = <AbstractProcess>processes.get(processName);
        if (!currentProcess) {
          return;
        }
        eventManager.emit(...PreRegisterServicesEvent.getParams(currentProcess));
        currentProcess.registerServices(serviceContainer);
        eventManager.emit(...PostRegisterServicesEvent.getParams(currentProcess));

        eventManager.on(RUN_EVENTS.RUN, async () => {
          const config = CommandBuilder.create();
          eventManager.emit(...PreConfigureEvent.getParams(currentProcess, config));
          currentProcess.configure(config);
          eventManager.emit(...PostConfigureEvent.getParams(currentProcess, config));

          const processArgs = ArgumentsParser.parse(config, parsedArgs);
          const handleStop = async (signal: SIGNAL, payload: SignalPayload) => {
            eventManager.emit(
              ...PreTerminateEvent.getParams(currentProcess, processArgs, signal, payload, env),
            );
            await currentProcess.terminate(processArgs, env, signal, payload);
            eventManager.emit(
              ...PostTerminateEvent.getParams(currentProcess, processArgs, signal, payload, env),
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
          const stopHandler: StopProcessHandler = (success: boolean) =>
            handleStop(success ? SIGNAL.SUCCESS_SHUTDOWN : SIGNAL.FAILURE_SHUTDOWN, {});

          eventManager.emit(
            ...PreExecuteEvent.getParams(currentProcess, processArgs, stopHandler, env),
          );
          stopHandler(await currentProcess.execute(processArgs, stopHandler, env));
        });
      });
    }
  };

  public getKernelEventHandlers() {
    return {
      init: this.onInit,
    };
  }
};
