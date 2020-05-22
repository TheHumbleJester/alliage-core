import {
  BUILDER_EVENTS,
  BuilderBeforeAllTasksEvent,
  BuilderAfterAllTasksEvent,
  BuilderBeforeTaskEvent,
  BuilderAfterTaskEvent,
} from '../event';
import { AbstractTask } from '../tasks';
import { Config } from '../config';

describe('builder/events', () => {
  class TestTask extends AbstractTask {
    getName() {
      return 'test_task';
    }

    run() {}
  }

  const testTask = new TestTask();
  describe('BuilderBeforeAllTasksEvent', () => {
    const event = new BuilderBeforeAllTasksEvent(
      { tasks: [{ name: 'test_task', description: 'test_description', params: { test: 42 } }] },
      {
        test_task: testTask,
      },
    );

    describe('#getType', () => {
      it('should return the BUILDER_EVENTS.BEFORE_ALL_TASKS event type', () => {
        expect(event.getType()).toEqual(BUILDER_EVENTS.BEFORE_ALL_TASKS);
      });
    });

    describe('#getConfig', () => {
      it('should return a frozen version of the config', () => {
        expect(event.getConfig()).toEqual({
          tasks: [{ name: 'test_task', description: 'test_description', params: { test: 42 } }],
        });
        expect(() => {
          (event.getConfig() as Config).tasks = [];
        }).toThrow();
      });
    });

    describe('#getTasks', () => {
      it('should return a frozen version of the tasks', () => {
        expect(event.getTasks()).toEqual({
          test_task: testTask,
        });
        expect(() => {
          (event.getTasks() as any).test = new TestTask();
        }).toThrow();
      });
    });

    describe('#setConfig', () => {
      it('should allow to update the config', () => {
        event.setConfig({
          tasks: [],
        });

        expect(event.getConfig()).toEqual({
          tasks: [],
        });
      });
    });
  });

  describe('BuilderAfterAllTasksEvent', () => {
    const event = new BuilderAfterAllTasksEvent(
      { tasks: [{ name: 'test_task', description: 'test_description', params: { test: 42 } }] },
      {
        test_task: testTask,
      },
    );

    describe('#getType', () => {
      it('should return the BUILDER_EVENTS.AFTER_ALL_TASKS event type', () => {
        expect(event.getType()).toEqual(BUILDER_EVENTS.AFTER_ALL_TASKS);
      });
    });

    describe('#getConfig', () => {
      it('should return a frozen version of the config', () => {
        expect(event.getConfig()).toEqual({
          tasks: [{ name: 'test_task', description: 'test_description', params: { test: 42 } }],
        });
        expect(() => {
          (event.getConfig() as Config).tasks = [];
        }).toThrow();
      });
    });

    describe('#getTasks', () => {
      it('should return a frozen version of the tasks', () => {
        expect(event.getTasks()).toEqual({
          test_task: testTask,
        });
        expect(() => {
          (event.getTasks() as any).test = new TestTask();
        }).toThrow();
      });
    });

    describe('static #getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = BuilderAfterAllTasksEvent.getParams(
          { tasks: [{ name: 'test_task', description: 'test_description', params: { test: 42 } }] },
          {
            test_task: testTask,
          },
        ) as [BUILDER_EVENTS, BuilderAfterAllTasksEvent];

        expect(type).toEqual(BUILDER_EVENTS.AFTER_ALL_TASKS);
        expect(eventInstance).toBeInstanceOf(BuilderAfterAllTasksEvent);
        expect(event.getConfig()).toEqual({
          tasks: [{ name: 'test_task', description: 'test_description', params: { test: 42 } }],
        });
        expect(event.getTasks()).toEqual({
          test_task: testTask,
        });
      });
    });
  });

  describe('BuilderBeforeTaskEvent', () => {
    const event = new BuilderBeforeTaskEvent(testTask, { test: 42 }, 'test_description');

    describe('#getType', () => {
      it('it should return the BUILDER_EVENTS.BEFORE_TASK event type', () => {
        expect(event.getType()).toEqual(BUILDER_EVENTS.BEFORE_TASK);
      });
    });

    describe('#getTask', () => {
      it('should return the task', () => {
        expect(event.getTask()).toBe(testTask);
      });
    });

    describe('#getParams', () => {
      it('should return a frozen version of the params', () => {
        expect(event.getParams()).toEqual({ test: 42 });

        expect(() => {
          event.getParams().test = 24;
        });
      });
    });

    describe('#getDescription', () => {
      it('should return the description', () => {
        expect(event.getDescription()).toEqual('test_description');
      });
    });

    describe('#setDescription', () => {
      it('should allow to update the description', () => {
        event.setDescription('updated_test_description');

        expect(event.getDescription()).toEqual('updated_test_description');
      });
    });

    describe('#setParams', () => {
      it('should allow to update the params', () => {
        event.setParams({ test: 21 });

        expect(event.getParams()).toEqual({ test: 21 });
      });
    });
  });

  describe('BuilderAfterTaskEvent', () => {
    const event = new BuilderAfterTaskEvent(testTask, { test: 42 }, 'test_description');

    describe('#getType', () => {
      it('it should return the BUILDER_EVENTS.AFTER_TASK event type', () => {
        expect(event.getType()).toEqual(BUILDER_EVENTS.AFTER_TASK);
      });
    });

    describe('#getTask', () => {
      it('should return the task', () => {
        expect(event.getTask()).toBe(testTask);
      });
    });

    describe('#getParams', () => {
      it('should return a frozen version of the params', () => {
        expect(event.getParams()).toEqual({ test: 42 });

        expect(() => {
          event.getParams().test = 24;
        });
      });
    });

    describe('#getDescription', () => {
      it('should return the description', () => {
        expect(event.getDescription()).toEqual('test_description');
      });
    });

    describe('static #getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = BuilderAfterTaskEvent.getParams(
          testTask,
          { test: 42 },
          'test_description',
        ) as [BUILDER_EVENTS, BuilderAfterTaskEvent];

        expect(type).toEqual(BUILDER_EVENTS.AFTER_TASK);
        expect(eventInstance).toBeInstanceOf(BuilderAfterTaskEvent);
        expect(eventInstance.getTask()).toEqual(testTask);
        expect(eventInstance.getParams()).toEqual({ test: 42 });
        expect(eventInstance.getDescription()).toEqual('test_description');
      });
    });
  });
});
