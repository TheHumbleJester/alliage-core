import { CommandBuilder, Arguments } from 'alliage/core/utils/cli';

import { AbstractProcess } from '../process';

describe('process-manager/process', () => {
  describe('AbstractProcess', () => {
    const executeMock = jest.fn();

    class Process extends AbstractProcess {
      getName() {
        return 'test-process';
      }

      async execute(_args: Arguments, _env: string) {
        const res = await this.waitToBeShutdown();
        executeMock();
        return res;
      }
    }
    const process = new Process();

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('#configure', () => {
      it('should have a default configure method that does nothing', () => {
        const builder = CommandBuilder.create();
        process.configure(builder);

        expect(builder.getDescription()).toEqual('');
        expect(builder.getArguments()).toEqual([]);
        expect(builder.getOptions()).toEqual({});
      });
    });

    describe('#waitToBeShutdown / #shutdown', () => {
      it('should not fail if the "shutdown" method has been called without calling "waitToBeShutdown" before', () => {
        expect(() => process.shutdown(true)).not.toThrow();
      });

      it('should hang the process until the shutdown method has been called', async () => {
        const executePromise = process.execute(Arguments.create(), 'test');

        expect(executeMock).not.toHaveBeenCalled();

        setTimeout(() => {
          process.shutdown(true);
        }, 100);

        const res = await executePromise;
        expect(executeMock).toHaveBeenCalledTimes(1);
        expect(res).toBe(true);
      });
    });
  });
});
