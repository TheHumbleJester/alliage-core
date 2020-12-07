import { AbstractLifeCycleAwareModule } from 'alliage-lifecycle/module';
import { BUILD_EVENTS, LifeCycleBuildEvent } from 'alliage-lifecycle/events';
import { EventManager } from 'alliage-lifecycle/event-manager';
import { CONFIG_EVENTS } from 'alliage-config-loader/events';
import { loadConfig } from 'alliage-config-loader/helpers';
import { validate } from 'alliage-config-loader/validators/json-schema';
import { Constructor, service } from 'alliage-di/dependencies';
import { ServiceContainer } from 'alliage-di/service-container';

import { CONFIG_NAME, schema, Config } from './config';
import { AbstractTask, validateParams, UnknownTaskError } from './tasks';
import { injectEnvironment } from './helpers';
import {
  BuilderBeforeAllTasksEvent,
  BuilderAfterAllTasksEvent,
  BuilderBeforeTaskEvent,
  BuilderAfterTaskEvent,
} from './event';
import { TASK_NAME, ShellTask } from './tasks/shell-task';

export = class BuilderModule extends AbstractLifeCycleAwareModule {
  getEventHandlers() {
    return {
      [CONFIG_EVENTS.LOAD]: loadConfig(CONFIG_NAME, validate(schema)),
      [BUILD_EVENTS.BUILD]: this.handleBuild,
    };
  }

  registerServices(serviceContainer: ServiceContainer) {
    serviceContainer.registerService(TASK_NAME, ShellTask, [service('event_manager')]);
  }

  handleBuild = async (event: LifeCycleBuildEvent) => {
    const serviceContainer = event.getServiceContainer();
    const eventManager = serviceContainer.getService<EventManager>('event_manager');

    const beforeAllTasksEvent = new BuilderBeforeAllTasksEvent(
      serviceContainer.getParameter<Config>(CONFIG_NAME),
      serviceContainer.getAllInstancesOf<AbstractTask>(AbstractTask as Constructor).reduce(
        (tasksMap: { [key: string]: AbstractTask }, task) => ({
          ...tasksMap,
          [task.getName()]: task,
        }),
        {},
      ),
    );
    await eventManager.emit(beforeAllTasksEvent.getType(), beforeAllTasksEvent);
    const config = beforeAllTasksEvent.getConfig();
    const tasks = beforeAllTasksEvent.getTasks();

    for (const taskData of beforeAllTasksEvent.getConfig().tasks) {
      const task = tasks[taskData.name];
      if (!task) {
        throw new UnknownTaskError(taskData.name, Object.keys(tasks));
      }

      validateParams(task.getName(), task.getParamsSchema(), taskData.params);

      const beforeTask = new BuilderBeforeTaskEvent(
        task,
        injectEnvironment(event.getEnv(), taskData.params),
        taskData.description,
      );
      // eslint-disable-next-line no-await-in-loop
      await eventManager.emit(beforeTask.getType(), beforeTask);
      const params = beforeTask.getParams();
      const description = beforeTask.getDescription();

      process.stdout.write(`Running task: ${description}...\n`);

      // eslint-disable-next-line no-await-in-loop
      await task.run(params);

      // eslint-disable-next-line no-await-in-loop
      await eventManager.emit(...BuilderAfterTaskEvent.getParams(task, params, description));
    }
    await eventManager.emit(...BuilderAfterAllTasksEvent.getParams(config, tasks));
  };
};
