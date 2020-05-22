import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';
import { AbstractProcess, SIGNAL, SignalPayload } from 'alliage-process-manager/process';
import { Service } from 'alliage-service-loader/decorators';
import { parameter } from 'alliage-di/dependencies';

@Service('dummy_process', [parameter('parameters.welcomeMessage')])
class DummyProcess extends AbstractProcess {
  private welcomeMessage: string;

  constructor(welcomeMessage: string) {
    super();
    this.welcomeMessage = welcomeMessage;
  }

  getName() {
    return 'dummy-process';
  }

  configure(builder: CommandBuilder) {
    builder
      .addArgument('argument', {
        type: 'string',
        describe: "command's argument",
      })
      .setDescription('Runs a dummy process');
  }

  execute(args: Arguments, env: string) {
    process.stdout.write(`${this.welcomeMessage} - ${args.get('argument')} - ${env}\n`);
    setTimeout(() => {
      process.stdout.write('about to shut down...\n');
      this.shutdown(true);
    }, 1000);
    return this.waitToBeShutdown();
  }

  async terminate(_args: Arguments, _env: string, signal: SIGNAL, _payload: SignalPayload) {
    process.stdout.write(`shutting down with signal: ${signal}\n`);
  }
}

export default DummyProcess;
