import { promises as fs } from 'fs';

import { EventManager } from 'alliage-lifecycle/event-manager';
import { INIT_EVENTS, LifeCycleInitEvent } from 'alliage-lifecycle/events';
import { ServiceContainer } from 'alliage-di/service-container';
import { Arguments } from 'alliage/core/utils/cli';

import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';
import ConfigurationLoaderModule from '..';
import {
  CONFIG_EVENTS,
  ConfigPreLoadEvent,
  ConfigLoadEvent,
  ConfigPostLoadEvent,
  ConfigPreFileLoadEvent,
  ConfigPreFileParseEvent,
  ConfigPostFileParseEvent,
  ConfigPostFileLoadEvent,
  ConfigPostEnvVariableInjectionEvent,
} from '../events';
import { loadConfig } from '../helpers';

const fakeConfigFile = `
configuration:
  property1: "$(DUMMY_INTEGER:number?42)"
  property2:
    list:
      - value1
      - value2
      - "$(DUMMY_STRING:string?test_string)"
  property3:
    foo: bar
    property4:
      property5: "$(DUMMY_ARRAY:array?one,two,three)"
`;

describe('configuration-loader', () => {
  describe('ConfigurationLoaderModule', () => {
    const module = new ConfigurationLoaderModule();
    const eventManager = new EventManager();
    const serviceContainer = new ServiceContainer();
    const initEvent = new LifeCycleInitEvent(INIT_EVENTS.INIT, {
      serviceContainer,
      context: INITIALIZATION_CONTEXT.RUN,
      args: Arguments.create(),
      env: 'test',
    });

    serviceContainer.addService('event_manager', eventManager);

    const fakeValidator = (_configPath: string, config: any) => config;
    eventManager.on(CONFIG_EVENTS.LOAD, loadConfig('fileName', fakeValidator));

    const emitMock = jest.spyOn(eventManager, 'emit');

    describe('#getEventHandlers', () => {
      it('should listen to INIT_EVENTS.INIT events', () => {
        expect(module.getEventHandlers()).toEqual({
          [INIT_EVENTS.INIT]: module.handleInit,
        });
      });
    });

    describe('#handleInit', () => {
      let statMock: jest.SpyInstance;

      beforeEach(() => {
        statMock = jest.spyOn(fs, 'stat');
        jest.spyOn(fs, 'readFile').mockResolvedValue(fakeConfigFile);
      });

      afterEach(() => {
        jest.restoreAllMocks();
      });

      it('should load the configuration files in the service container and trigger all the events', async () => {
        statMock.mockReturnValue(true);
        await module.handleInit(initEvent);

        // Checks events order
        expect(emitMock.mock.calls).toEqual([
          [CONFIG_EVENTS.PRE_LOAD, expect.any(ConfigPreLoadEvent)],
          [CONFIG_EVENTS.LOAD, expect.any(ConfigLoadEvent)],
          [CONFIG_EVENTS.PRE_FILE_LOAD, expect.any(ConfigPreFileLoadEvent)],
          [CONFIG_EVENTS.PRE_FILE_PARSE, expect.any(ConfigPreFileParseEvent)],
          [CONFIG_EVENTS.POST_FILE_PARSE, expect.any(ConfigPostFileParseEvent)],
          [
            CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION,
            expect.any(ConfigPostEnvVariableInjectionEvent),
          ],
          [CONFIG_EVENTS.POST_FILE_LOAD, expect.any(ConfigPostFileLoadEvent)],
          [CONFIG_EVENTS.POST_LOAD, expect.any(ConfigPostLoadEvent)],
        ]);

        const preLoadEvent: ConfigPreLoadEvent = emitMock.mock.calls[0][1];
        expect(preLoadEvent.getConfigPath()).toMatch(/\/config$/);
        expect(preLoadEvent.getConfigs()).toEqual([]);

        const loadEvent: ConfigLoadEvent = emitMock.mock.calls[1][1];
        expect(loadEvent.getConfigs()).toEqual([
          { fileName: 'fileName', validator: fakeValidator },
        ]);

        // Check events contents
        const preFileLoadEvent: ConfigPreFileLoadEvent = emitMock.mock.calls[2][1];
        expect(preFileLoadEvent.getFileName()).toEqual('fileName');
        expect(preFileLoadEvent.getFilePath()).toMatch(/\/config\/fileName\.yaml$/);
        expect(preFileLoadEvent.getConfigPath()).toMatch(/\/config$/);

        const preFileParseEvent: ConfigPreFileParseEvent = emitMock.mock.calls[3][1];
        expect(preFileParseEvent.getFileName()).toEqual('fileName');
        expect(preFileParseEvent.getFilePath()).toMatch(/\/config\/fileName\.yaml$/);
        expect(preFileParseEvent.getContent()).toEqual(fakeConfigFile);

        const postFileParseEvent: ConfigPostFileParseEvent = emitMock.mock.calls[4][1];
        expect(postFileParseEvent.getFileName()).toEqual('fileName');
        expect(postFileParseEvent.getFilePath()).toMatch(/\/config\/fileName\.yaml$/);
        expect(postFileParseEvent.getConfig()).toEqual({
          configuration: {
            property1: '$(DUMMY_INTEGER:number?42)',
            property2: {
              list: ['value1', 'value2', '$(DUMMY_STRING:string?test_string)'],
            },
            property3: {
              foo: 'bar',
              property4: {
                property5: '$(DUMMY_ARRAY:array?one,two,three)',
              },
            },
          },
        });

        const postEnvVariableInjectionEvent: ConfigPostEnvVariableInjectionEvent =
          emitMock.mock.calls[5][1];
        expect(postEnvVariableInjectionEvent.getFileName()).toEqual('fileName');
        expect(postEnvVariableInjectionEvent.getFilePath()).toMatch(/\/config\/fileName\.yaml$/);
        expect(postEnvVariableInjectionEvent.getConfig()).toEqual({
          configuration: {
            property1: 42,
            property2: {
              list: ['value1', 'value2', 'test_string'],
            },
            property3: {
              foo: 'bar',
              property4: {
                property5: ['one', 'two', 'three'],
              },
            },
          },
        });

        const postFileLoadEvent: ConfigPostFileLoadEvent = emitMock.mock.calls[6][1];
        expect(postFileLoadEvent.getFileName()).toEqual('fileName');
        expect(postFileLoadEvent.getFilePath()).toMatch(/\/config\/fileName\.yaml$/);

        const postLoadEvent: ConfigPostLoadEvent = emitMock.mock.calls[7][1];
        expect(postLoadEvent.getConfigs()).toEqual([
          { fileName: 'fileName', validator: fakeValidator },
        ]);

        // Checks that config are added to the service container
        expect(serviceContainer.getParameter('fileName')).toEqual({
          configuration: {
            property1: 42,
            property2: {
              list: ['value1', 'value2', 'test_string'],
            },
            property3: {
              foo: 'bar',
              property4: {
                property5: ['one', 'two', 'three'],
              },
            },
          },
        });
      });

      it('should throw an error if the configuration file does not exists', async () => {
        statMock.mockRejectedValue(new Error());

        let error: Error;
        try {
          await module.handleInit(initEvent);
        } catch (e) {
          error = e;
        }

        expect(error!).toBeInstanceOf(Error);
        expect(error!.message).toMatch(
          /^Can't find the following configuration file: (.*)fileName\.yaml$/,
        );
      });
    });
  });
});
