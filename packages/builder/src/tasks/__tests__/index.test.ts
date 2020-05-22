import { AbstractTask, TaskParamsValidationError, validateParams, UnknownTaskError } from '..';

describe('builder/tasks', () => {
  describe('AbstractTask', () => {
    class Task extends AbstractTask {
      getName() {
        return 'task';
      }

      run() {}
    }

    const task = new Task();

    describe('#getParamsSchema', () => {
      it('should return an empty schema by default', () => {
        expect(task.getParamsSchema()).toEqual({});
      });
    });
  });

  describe('TasksParamsValidationError', () => {
    const error = new TaskParamsValidationError('test_task', [{ error: 'test_error' }]);
    it('should have an error message including the task name', () => {
      expect(error).toHaveProperty('message', 'Invalid params for test_task build task');
    });

    it('should have an "taskName" property containing the task name passed in the constructor', () => {
      expect(error).toHaveProperty('taskName', 'test_task');
    });

    it('should have an "errors" caontaining the errors passed in the constructor', () => {
      expect(error).toHaveProperty('errors', [{ error: 'test_error' }]);
    });
  });

  describe('UnknownTaskError', () => {
    const error = new UnknownTaskError('unknown_task', ['task1', 'task2']);
    it('should have an error message with the wrong task name and the available tasks', () => {
      expect(error.message).toEqual(
        'Unknown build task "unknown_task". Available build tasks: ["task1", "task2"]',
      );
    });
  });

  describe('validateParams', () => {
    it('should not do any thing if the value format is valid', () => {
      expect(() => validateParams('test_task', { type: 'number' }, 42)).not.toThrow();
    });

    it('should consider the value as valid if the schema is empty', () => {
      expect(() => validateParams('test_task', {}, 42)).not.toThrow();
    });

    it('should throw an error if the value format is invalid', () => {
      let error = null;

      try {
        validateParams('test_task', { type: 'number' }, '42');
      } catch (e) {
        error = e as TaskParamsValidationError;
      }

      expect(error).toBeInstanceOf(TaskParamsValidationError);
      expect(error?.message).toEqual('Invalid params for test_task build task');
      expect(error?.taskName).toEqual('test_task');
      expect(error?.errors).toEqual([
        {
          dataPath: '',
          keyword: 'type',
          message: 'should be number',
          params: {
            type: 'number',
          },
          schemaPath: '#/type',
        },
      ]);
    });
  });
});
