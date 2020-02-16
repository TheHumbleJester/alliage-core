import { ExecException } from 'child_process';
import {
  BUILDER_SHELL_TASK_EVENTS,
  ShellTaskBeforeRunEvent,
  ShellTaskSuccessEvent,
  ShellTaskErrorEvent,
} from '../events';

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
    const event = new ShellTaskSuccessEvent('test_cmd', 'test_output');

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

    describe('#getOutput', () => {
      it('should return the ouput', () => {
        expect(event.getOutput()).toEqual('test_output');
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = ShellTaskSuccessEvent.getParams(
          'test_cmd',
          'test_output',
        ) as [BUILDER_SHELL_TASK_EVENTS, ShellTaskSuccessEvent];

        expect(type).toEqual(BUILDER_SHELL_TASK_EVENTS.SUCCESS);
        expect(eventInstance).toBeInstanceOf(ShellTaskSuccessEvent);
        expect(eventInstance.getCommand()).toEqual('test_cmd');
        expect(eventInstance.getOutput()).toEqual('test_output');
      });
    });
  });

  describe('ShellTaskErrorEvent', () => {
    const error = new Error() as ExecException;
    const event = new ShellTaskErrorEvent('test_cmd', 'test_output', error);

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

    describe('#getOutput', () => {
      it('should return the output', () => {
        expect(event.getOutput()).toEqual('test_output');
      });
    });

    describe('#getException', () => {
      it('should return the exception', () => {
        expect(event.getException()).toBe(error);
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = ShellTaskErrorEvent.getParams(
          'test_cmd',
          'test_output',
          error,
        ) as [BUILDER_SHELL_TASK_EVENTS, ShellTaskErrorEvent];

        expect(type).toEqual(BUILDER_SHELL_TASK_EVENTS.ERROR);
        expect(eventInstance).toBeInstanceOf(ShellTaskErrorEvent);
        expect(eventInstance.getCommand()).toEqual('test_cmd');
        expect(eventInstance.getOutput()).toEqual('test_output');
        expect(eventInstance.getException()).toBe(error);
      });
    });
  });
});
