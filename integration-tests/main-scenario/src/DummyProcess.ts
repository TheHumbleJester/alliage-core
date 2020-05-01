import { Arguments, CommandBuilder } from 'alliage/core/utils/cli';
import { AbstractProcess, StopProcessHandler } from 'alliage-process-manager/process';
import { Service } from 'alliage-service-loader/decorators';
import { parameter } from 'alliage-di/dependencies';

@Service('dummy_process', [parameter('parameters.welcomeMessage')])
export default class DummyProcess extends AbstractProcess {
  private welcomeMessage: string;

  constructor(welcomeMessage: string) {
    super();
    this.welcomeMessage = welcomeMessage;
  }

  getName() {
    return 'dummy-process';
  }

  configure(builder: CommandBuilder) {
    builder.addArgument('argument', {
      type: 'string',
      describe: "command's argument",
    });
  }

  async execute(args: Arguments, _stopHandler: StopProcessHandler, env: string) {
    console.log(`${this.welcomeMessage} - ${args.get('argument')} - ${env}`);
    return true;
  }
}
