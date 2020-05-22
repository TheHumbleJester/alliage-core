import fs from 'fs';
import { Sandbox } from 'alliage-sandbox';

describe('Main scenario', () => {
  const sandbox = new Sandbox({
    scenarioPath: __dirname,
  });

  beforeAll(async () => {
    await sandbox.init();
  });

  afterAll(async () => {
    await sandbox.clear();
  });

  it('should install correctly all the modules by updating the alliage-modules.json and copying the configuration files', async () => {
    const { waitCompletion } = await sandbox.install(['alliage-core']);

    await waitCompletion();

    const builderConfigFile = `${sandbox.getPath()}/config/builder.yaml`;
    expect(fs.existsSync(builderConfigFile)).toBe(true);
    expect(fs.readFileSync(builderConfigFile).toString()).toMatchSnapshot();

    const servicesConfigFile = `${sandbox.getPath()}/config/services.yaml`;
    expect(fs.existsSync(servicesConfigFile)).toBe(true);
    expect(fs.readFileSync(servicesConfigFile).toString()).toMatchSnapshot();

    expect(
      JSON.parse(fs.readFileSync(`${sandbox.getPath()}/alliage-modules.json`).toString()),
    ).toEqual({
      'alliage-builder': {
        deps: ['alliage-lifecycle', 'alliage-config-loader', 'alliage-module-installer'],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-builder',
      },
      'alliage-config-loader': {
        deps: ['alliage-lifecycle'],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-config-loader',
      },
      'alliage-di': {
        deps: [],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-di',
      },
      'alliage-lifecycle': {
        deps: ['alliage-di'],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-lifecycle',
      },
      'alliage-module-installer': {
        deps: ['alliage-lifecycle'],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-module-installer',
      },
      'alliage-parameters-loader': {
        deps: ['alliage-lifecycle', 'alliage-di', 'alliage-module-installer'],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-parameters-loader',
      },
      'alliage-process-manager': {
        deps: [
          'alliage-di',
          'alliage-lifecycle',
          'alliage-service-loader',
          'alliage-config-loader',
        ],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-process-manager',
      },
      'alliage-service-loader': {
        deps: [
          'alliage-lifecycle',
          'alliage-di',
          'alliage-module-installer',
          'alliage-config-loader',
        ],
        hash: '25e64aa754c310d45c1e084d574c1bb0',
        module: 'alliage-service-loader',
      },
    });
  });

  it('should execute the DummyProcess', async () => {
    const { waitCompletion, process: childProcess } = sandbox.run(['dummy-process', 'test']);

    let output = '';
    // eslint-disable-next-line no-unused-expressions
    childProcess.stdout?.on('data', (chunk) => {
      output += chunk;
    });
    await waitCompletion();
    expect(output).toEqual(
      'Hello Alliage Core ! - test - production\nabout to shut down...\nshutting down with signal: @process-manager/SIGNAL/SUCCESS_SHUTDOWN\n',
    );
  });

  it('should execute the shell builder according to the configutation', async () => {
    fs.writeFileSync(
      `${sandbox.getPath()}/config/builder.yaml`,
      `
tasks:
  -
    name: shell
    description: Test builder
    params:
      cmd: 'echo "This is a test" > test-builder.txt'
`,
    );

    const { waitCompletion, process: childProcess } = sandbox.build([]);

    let output = '';
    // eslint-disable-next-line no-unused-expressions
    childProcess.stdout?.on('data', (chunk) => {
      output += chunk;
    });
    await waitCompletion();
    expect(output).toEqual('Running task: Test builder...\n');

    const testBuilderFile = `${sandbox.getPath()}/test-builder.txt`;
    expect(fs.existsSync(testBuilderFile)).toBe(true);
    expect(fs.readFileSync(testBuilderFile).toString()).toEqual('This is a test\n');
  });
});
