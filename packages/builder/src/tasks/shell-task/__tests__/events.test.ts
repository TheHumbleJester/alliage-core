import { ExecException } from 'child_process';

import {
  BUILDER_SHELL_TASK_EVENTS,
  ShellTaskBeforeRunEvent,
  ShellTaskSuccessEvent,
  ShellTaskErrorEvent,
} from '../events';
import { CommandError } from '..';

describe('builder/tasks/shell-tasks/events', () => {
  describe('ShellTaskBeforeRunEvent', () => {
    const event = new ShellTaskBeforeRunEvent('test_cmd');
    describe('#getType', () => {
      it('should return a BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN event type', () => {
        expect(event.getType()).toEqual(BUILDER_SHELL_TASK_EVENTS.BEFORE_RUN);
      });
    });

    describe('#getCommand', () => {
      it('should return the command', () => {
        expect(event.getCommand()).toEqual('test_cmd');
      });
    });

    describe('#setCommand', () => {
      it('should allow to update the command', () => {
        event.setCommand('updated_test_cmd');

        expect(event.getCommand()).toEqual('updated_test_cmd');
      });
    });
  });

  describe('ShellTaskSuccessEvent', () => {
    const event = new ShellTaskSuccessEvent('test_cmd', 'test_success_output', 'test_error_output');

    describe('#getType', () => {
      it('should return a BUILDER_SHELL_TASK_EVENTS.SUCCESS event type', () => {
        expect(event.getType()).toEqual(BUILDER_SHELL_TASK_EVENTS.SUCCESS);
      });
    });

    describe('#getCommand', () => {
      it('should return the command', () => {
        expect(event.getCommand()).toEqual('test_cmd');
      });
    });

    describe('#getSuccessOutput', () => {
      it('should return the success ouput', () => {
        expect(event.getSuccessOutput()).toEqual('test_success_output');
      });
    });

    describe('#getErrorOutput', () => {
      it('should return the error ouput', () => {
        expect(event.getErrorOutput()).toEqual('test_error_output');
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = ShellTaskSuccessEvent.getParams(
          'test_cmd',
          'test_success_output',
          'test_error_output',
        ) as [BUILDER_SHELL_TASK_EVENTS, ShellTaskSuccessEvent];

        expect(type).toEqual(BUILDER_SHELL_TASK_EVENTS.SUCCESS);
        expect(eventInstance).toBeInstanceOf(ShellTaskSuccessEvent);
        expect(eventInstance.getCommand()).toEqual('test_cmd');
        expect(eventInstance.getSuccessOutput()).toEqual('test_success_output');
        expect(eventInstance.getErrorOutput()).toEqual('test_error_output');
      });
    });
  });

  describe('ShellTaskErrorEvent', () => {
    const error = new CommandError(new Error() as ExecException, 'test_stdout', 'test_stderr');
    const event = new ShellTaskErrorEvent('test_cmd', error);

    describe('#getType', () => {
      it('should return a BUILDER_SHELL_TASK_EVENTS.ERROR event type', () => {
        expect(event.getType()).toEqual(BUILDER_SHELL_TASK_EVENTS.ERROR);
      });
    });

    describe('#getCommand', () => {
      it('should return the command', () => {
        expect(event.getCommand()).toEqual('test_cmd');
      });
    });

    describe('#getError', () => {
      it('should return the output', () => {
        expect(event.getError()).toBe(error);
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = ShellTaskErrorEvent.getParams(
          'test_cmd',
          error,
        ) as [BUILDER_SHELL_TASK_EVENTS, ShellTaskErrorEvent];

        expect(type).toEqual(BUILDER_SHELL_TASK_EVENTS.ERROR);
        expect(eventInstance).toBeInstanceOf(ShellTaskErrorEvent);
        expect(eventInstance.getCommand()).toEqual('test_cmd');
        expect(eventInstance.getError()).toBe(error);
      });
    });
  });
});
