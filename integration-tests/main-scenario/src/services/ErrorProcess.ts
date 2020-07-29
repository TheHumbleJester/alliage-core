import { AbstractProcess } from 'alliage-process-manager/process';
import { Service } from 'alliage-service-loader/decorators';

class DummyError extends Error {
  public prop1: string;

  public prop2: string[];

  constructor(prop1: string, prop2: string[]) {
    super('A dummy error occured');
    this.prop1 = prop1;
    this.prop2 = prop2;
  }
}

@Service('error_process')
class ErrorProcess extends AbstractProcess {
  getName() {
    return 'error-process';
  }

  execute() {
    throw new DummyError('test_prop1', ['test_prop2-1', 'test_prop2-2']);
    // eslint-disable-next-line no-unreachable
    return this.waitToBeShutdown();
  }
}

export default ErrorProcess;
