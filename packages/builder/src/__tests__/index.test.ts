import { Arguments } from 'alliage/core/utils/cli';
import { ServiceContainer } from 'alliage-di/service-container';
import { service } from 'alliage-di/dependencies';
import { BUILD_EVENTS, LifeCycleBuildEvent } from 'alliage-lifecycle/events';
import { EventManager } from 'alliage-lifecycle/event-manager';
import { validate } from 'alliage-config-loader/validators/json-schema';
import { loadConfig } from 'alliage-config-loader/helpers';
import { CONFIG_EVENTS } from 'alliage-config-loader/events';

import { CONFIG_NAME, schema } from '../config';
import { TASK_NAME, ShellTask } from '../tasks/shell-task';
import { AbstractTask, TaskParamsValidationError, UnknownTaskError } from '../tasks';
import {
  BUILDER_EVENTS,
  BuilderBeforeAllTasksEvent,
  BuilderBeforeTaskEvent,
  BuilderAfterTaskEvent,
  BuilderAfterAllTasksEvent,
} from '../event';
import BuilderModule from '..';

jest.mock('alliage-config-loader/validators/json-schema');
jest.mock('alliage-config-loader/helpers');

describe('builder', () => {
  describe('BuilderModule', () => {
    const module = new BuilderModule();

    describe('#getEventHandlers', () => {
      it('should listen to CONFIG_EVENTS.LOAD and BUILD_EVENTS.BUILD events', () => {
        const validateMockReturnValue = () => {};
        const loadConfigMockReturnValue = () => {};
        (validate as jest.Mock).mockReturnValueOnce(validateMockReturnValue);
        (loadConfig as jest.Mock).mockReturnValueOnce(loadConfigMockReturnValue);

        expect(module.getEventHandlers()).toEqual({
          [CONFIG_EVENTS.LOAD]: loadConfigMockReturnValue,
          [BUILD_EVENTS.BUILD]: module.handleBuild,
        });

        expect(validate).toHaveBeenCalledWith(schema);
        expect(loadConfig).toHaveBeenCalledWith(CONFIG_NAME, validateMockReturnValue);
      });
    });

    describe('#registerServices', () => {
      const serviceContainer = new ServiceContainer();
      const registerServiceSpy = jest.spyOn(serviceContainer, 'registerService');

      module.registerServices(serviceContainer);

      expect(registerServiceSpy).toHaveBeenCalledWith(TASK_NAME, ShellTask, [
        service('event_manager'),
      ]);
    });

    describe('#handlerBuild', () => {
      class DummyTask extends AbstractTask {
        getName() {
          return 'dummy_task';
        }

        getParamsSchema() {
          return {
            type: 'object',
            properties: {
              test: {
                type: 'string',
              },
            },
          };
        }

        run() {}
      }

      const eventManager = new EventManager();
      const serviceContainer = new ServiceContainer();
      serviceContainer.addService('event_manager', eventManager);
      serviceContainer.registerService('dummy_task', DummyTask);
      serviceContainer.setParameter(CONFIG_NAME, {
        tasks: [
          {
            name: 'dummy_task',
            description: 'dummy_description',
            params: {
              test: 'test_{ENV}',
            },
          },
        ],
      });

      const dummyTaskRunSpy = jest.spyOn(DummyTask.prototype, 'run');

      const beforeAllTasksHandler = jest.fn();
      const afterAllTasksHandler = jest.fn();
      const beforeTaskHandler = jest.fn();
      const afterTaskHandler = jest.fn();

      eventManager.on(BUILDER_EVENTS.BEFORE_ALL_TASKS, beforeAllTasksHandler);
      eventManager.on(BUILDER_EVENTS.AFTER_ALL_TASKS, afterAllTasksHandler);
      eventManager.on(BUILDER_EVENTS.BEFORE_TASK, beforeTaskHandler);
      eventManager.on(BUILDER_EVENTS.AFTER_TASK, afterTaskHandler);

      const buildEvent = new LifeCycleBuildEvent(BUILD_EVENTS.BUILD, {
        serviceContainer,
        args: Arguments.create(),
        env: 'test',
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should run all the tasks specified in the configuration', async () => {
        beforeAllTasksHandler.mockImplementationOnce((event: BuilderBeforeAllTasksEvent) => {
          expect(event.getConfig()).toEqual({
            tasks: [
              {
                name: 'dummy_task',
                description: 'dummy_description',
                params: {
                  test: 'test_{ENV}',
                },
              },
            ],
          });
          expect(event.getTasks()).toEqual({
            dummy_task: expect.any(DummyTask),
          });

          event.setConfig({
            tasks: [
              {
                name: 'dummy_task',
                description: 'dummy_description',
                params: {
                  test: 'test_{ENV}',
                },
              },
              {
                name: 'dummy_task',
                description: 'dummy_description2',
                params: {
                  test: 'test2_{ENV}',
                },
              },
            ],
          });
        });
        beforeTaskHandler
          .mockImplementationOnce((event: BuilderBeforeTaskEvent) => {
            expect(event.getTask()).toBeInstanceOf(DummyTask);
            expect(event.getDescription()).toEqual('dummy_description');
            expect(event.getParams()).toEqual({
              test: 'test_test',
            });

            event.setDescription('transformed_dummy_description');
          })
          .mockImplementationOnce((event: BuilderBeforeTaskEvent) => {
            expect(event.getTask()).toBeInstanceOf(DummyTask);
            expect(event.getDescription()).toEqual('dummy_description2');
            expect(event.getParams()).toEqual({
              test: 'test2_test',
            });

            event.setParams({
              test: 'transformed_test2_test',
            });
          });
        afterTaskHandler
          .mockImplementationOnce((event: BuilderAfterTaskEvent) => {
            expect(event.getTask()).toBeInstanceOf(DummyTask);
            expect(event.getDescription()).toEqual('transformed_dummy_description');
            expect(event.getParams()).toEqual({
              test: 'test_test',
            });
          })
          .mockImplementationOnce((event: BuilderAfterTaskEvent) => {
            expect(event.getTask()).toBeInstanceOf(DummyTask);
            expect(event.getDescription()).toEqual('dummy_description2');
            expect(event.getParams()).toEqual({
              test: 'transformed_test2_test',
            });
          });
        afterAllTasksHandler.mockImplementationOnce((event: BuilderAfterAllTasksEvent) => {
          expect(event.getConfig()).toEqual({
            tasks: [
              {
                name: 'dummy_task',
                description: 'dummy_description',
                params: {
                  test: 'test_{ENV}',
                },
              },
              {
                name: 'dummy_task',
                description: 'dummy_description2',
                params: {
                  test: 'test2_{ENV}',
                },
              },
            ],
          });
          expect(event.getTasks()).toEqual({
            dummy_task: expect.any(DummyTask),
          });
        });

        await module.handleBuild(buildEvent);

        expect(beforeAllTasksHandler).toHaveBeenCalledTimes(1);
        expect(beforeTaskHandler).toHaveBeenCalledTimes(2);
        expect(afterTaskHandler).toHaveBeenCalledTimes(2);
        expect(afterAllTasksHandler).toHaveBeenCalledTimes(1);

        expect(dummyTaskRunSpy).toHaveBeenCalledTimes(2);
        expect(dummyTaskRunSpy).toHaveBeenNthCalledWith(1, { test: 'test_test' });
        expect(dummyTaskRunSpy).toHaveBeenNthCalledWith(2, { test: 'transformed_test2_test' });
      });

      it('should raise an error if the params schema is invalid', async () => {
        const getParamsSchemaSpy = jest
          .spyOn(DummyTask.prototype, 'getParamsSchema')
          .mockReturnValueOnce({
            type: 'object',
            properties: {
              test: {
                type: 'number',
              },
            },
          });

        let error = null;
        try {
          await module.handleBuild(buildEvent);
        } catch (e) {
          error = e as TaskParamsValidationError;
        }

        expect(error).toBeInstanceOf(TaskParamsValidationError);
        expect(error?.message).toEqual('Invalid params for dummy_task build task');
        expect(error?.taskName).toEqual('dummy_task');
        expect(error?.errors).toEqual([
          {
            dataPath: '.test',
            keyword: 'type',
            message: 'should be number',
            params: { type: 'number' },
            schemaPath: '#/properties/test/type',
          },
        ]);

        expect(beforeAllTasksHandler).toHaveBeenCalledTimes(1);
        expect(beforeTaskHandler).not.toHaveBeenCalled();
        expect(afterTaskHandler).not.toHaveBeenCalled();
        expect(afterAllTasksHandler).not.toHaveBeenCalled();
        expect(dummyTaskRunSpy).not.toHaveBeenCalled();

        getParamsSchemaSpy.mockRestore();
      });

      it('should throw an error is a task specified in the config does not exist', async () => {
        const serviceContainerWithoutTask = new ServiceContainer();
        serviceContainerWithoutTask.addService('event_manager', eventManager);
        serviceContainerWithoutTask.setParameter(CONFIG_NAME, {
          tasks: [
            {
              name: 'dummy_task',
              description: 'dummy_description',
              params: {},
            },
          ],
        });

        let error = null;
        try {
          await module.handleBuild(
            new LifeCycleBuildEvent(BUILD_EVENTS.BUILD, {
              serviceContainer: serviceContainerWithoutTask,
              args: Arguments.create(),
              env: 'test',
            }),
          );
        } catch (e) {
          error = e as UnknownTaskError;
        }

        expect(error).toBeInstanceOf(UnknownTaskError);
        expect(error?.message).toEqual(
          'Unknown build task "dummy_task". Available build tasks: [""]',
        );

        expect(beforeAllTasksHandler).toHaveBeenCalledTimes(1);
        expect(beforeTaskHandler).not.toHaveBeenCalled();
        expect(afterTaskHandler).not.toHaveBeenCalled();
        expect(afterAllTasksHandler).not.toHaveBeenCalled();
      });
    });
  });
});
