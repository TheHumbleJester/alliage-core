import { CommandBuilder, Arguments } from 'alliage/core/utils/cli';
import { ServiceContainer } from 'alliage-di/service-container';

import { AbstractProcess, StopProcessHandler } from '../process';

describe('process-manager/process', () => {
  describe('AbstractProcess', () => {
    class Process extends AbstractProcess {
      getName() {
        return 'test-process';
      }

      configure(_config: CommandBuilder) {}

      async execute(_args: Arguments, _stopProcess: StopProcessHandler, _env: string) {
        return true;
      }
    }
    const process = new Process();

    describe('#registerService', () => {
      it('should initially not register any service', () => {
        const scMock = {
          addService: jest.fn(),
          registerService: jest.fn(),
        };
        process.registerServices((scMock as unknown) as ServiceContainer);

        expect(scMock.addService).not.toHaveBeenCalled();
        expect(scMock.registerService).not.toHaveBeenCalled();
      });
    });
  });
});
