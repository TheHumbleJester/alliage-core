import { exec } from 'child_process';

import { EventManager } from 'alliage-lifecycle/event-manager';

import { ShellTask, CommandError } from '..';
import {
  ShellTaskBeforeRunEvent,
  ShellTaskSuccessEvent,
  ShellTaskErrorEvent,
  BUILDER_SHELL_TASK_EVENTS,
} from '../events';

jest.mock('child_process', () => {
  return {
    ...jest.requireActual('child_process'),
    exec: jest.fn(),
  };
});

describe('builder/tasks/shell-task', () => {
  describe('ShellTask', () => {
    const eventManager = new EventManager();
    const task = new ShellTask(eventManager);

    describe('#getName', () => {
      it('should return the "shell"', () => {
        expect(task.getName()).toEqual('shell');
      });
    });

    describe('#getParamsSchema', () => {
      it('should return a schema expecting a an object with a string "cmd" property', () => {
        expect(task.getParamsSchema()).toEqual({
          type: 'object',
          properties: {
            cmd: {
              type: 'string',
            },
          },
        });
      });
    });

    describe('#run', () => {
      const execMock = (exec as unknown) as jest.Mock;
      const beforeRunHandler = jest.fn();
      const successHandler = jest.fn();
      const errorHandler = jest.fn();

      eventManager.on(BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN, beforeRunHandler);
      eventManager.on(BUILDER_SHELL_TASK_EVENTS.SUCCESS, successHandler);
      eventManager.on(BUILDER_SHELL_TASK_EVENTS.ERROR, errorHandler);

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should exec the command and trigger events', async () => {
        execMock.mockImplementationOnce((_cmd: string, callback: Function) => {
          callback(null, 'test_stdout', 'test_stderr');
        });

        beforeRunHandler.mockImplementationOnce((event: ShellTaskBeforeRunEvent) => {
          expect(event.getCommand()).toEqual('test_cmd');

          event.setCommand('updated_test_cmd');
        });

        successHandler.mockImplementationOnce((event: ShellTaskSuccessEvent) => {
          expect(event.getCommand()).toEqual('updated_test_cmd');
          expect(event.getSuccessOutput()).toEqual('test_stdout');
          expect(event.getErrorOutput()).toEqual('test_stderr');
        });

        await task.run({ cmd: 'test_cmd' });

        expect(execMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledWith('updated_test_cmd', expect.any(Function));
        expect(beforeRunHandler).toHaveBeenCalledTimes(1);
        expect(successHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler).not.toHaveBeenCalled();
      });

      it('should throw an error in case of command failure and trigger events', async () => {
        const execError = new Error('test_error_message');
        execMock.mockImplementationOnce((_cmd: string, callback: Function) => {
          callback(execError, 'test_stdout', 'test_stderr');
        });

        errorHandler.mockImplementationOnce((event: ShellTaskErrorEvent) => {
          expect(event.getCommand()).toEqual('test_cmd');
          expect(event.getError()).toBeInstanceOf(CommandError);
          expect(event.getError().message).toBe('test_error_message');
          expect(event.getError().error).toBe(execError);
          expect(event.getError().stdout).toEqual('test_stdout');
          expect(event.getError().stderr).toEqual('test_stderr');
        });

        let error = null;
        try {
          await task.run({ cmd: 'test_cmd' });
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(CommandError);
        expect(error.message).toBe('test_error_message');
        expect(error.error).toBe(execError);
        expect(error.stdout).toEqual('test_stdout');
        expect(error.stderr).toEqual('test_stderr');

        expect(execMock).toHaveBeenCalledTimes(1);
        expect(execMock).toHaveBeenCalledWith('test_cmd', expect.any(Function));
        expect(beforeRunHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(successHandler).not.toHaveBeenCalled();
      });
    });
  });
});
