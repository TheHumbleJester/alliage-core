import {
  ConfigPreLoadEvent,
  CONFIG_EVENTS,
  Config,
  ConfigLoadEvent,
  ConfigPreFileLoadEvent,
  ConfigPreFileParseEvent,
  ConfigPostFileParseEvent,
  ConfigPostEnvVariableInjectionEvent,
  ConfigPostFileLoadEvent,
  ConfigPostLoadEvent,
} from '../events';

describe('configuration-loader/events', () => {
  describe('ConfigPreloadEvent', () => {
    const configs = [{ fileName: 'dummyFile', validator: () => {} }];
    const event = new ConfigPreLoadEvent('/config/path', configs);

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.PRE_LOAD event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.PRE_LOAD);
      });
    });

    describe('#getConfigPath', () => {
      it('should return the config path', () => {
        expect(event.getConfigPath()).toEqual('/config/path');
      });
    });

    describe('#getConfigs', () => {
      it('should return a frozen version of the configs', () => {
        expect(event.getConfigs()).toEqual(configs);
        expect(() =>
          (event.getConfigs() as Config[]).push({ fileName: 'newDummyFile', validator: () => {} }),
        ).toThrow();
      });

      it('should return an empty list if no configs were provided', () => {
        const eventWithoutConfig = new ConfigPreLoadEvent('/config/path');

        expect(eventWithoutConfig.getConfigs()).toEqual([]);
      });
    });

    describe('#setConfigPath', () => {
      it('should allow to update the config path', () => {
        event.setConfigPath('/config/new/path');

        expect(event.getConfigPath()).toEqual('/config/new/path');
      });
    });

    describe('#setConfigs', () => {
      it('should allow to update the configs', () => {
        const newConfigs = [{ fileName: 'newDummyFile', validator: () => {} }];
        event.setConfigs(newConfigs);

        expect(event.getConfigs()).toEqual(newConfigs);
      });
    });
  });

  describe('ConfigLoadEvent', () => {
    const configs = [{ fileName: 'dummyFile', validator: () => {} }];
    const event = new ConfigLoadEvent(configs);

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.LOAD event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.LOAD);
      });
    });

    describe('#getConfigs', () => {
      it('should return a frozen version of the configs', () => {
        expect(event.getConfigs()).toEqual(configs);
        expect(() =>
          (event.getConfigs() as Config[]).push({ fileName: 'newDummyFile', validator: () => {} }),
        ).toThrow();
      });

      it('should return an empty list if no configs were provided', () => {
        const eventWithoutConfig = new ConfigLoadEvent();

        expect(eventWithoutConfig.getConfigs()).toEqual([]);
      });
    });

    describe('#setConfigs', () => {
      it('should allow to update the configs', () => {
        const newConfigs = [{ fileName: 'newDummyFile', validator: () => {} }];
        event.setConfigs(newConfigs);

        expect(event.getConfigs()).toEqual(newConfigs);
      });
    });

    describe('#addConfig', () => {
      it('should allow to add a config', () => {
        const currentConfigs = event.getConfigs();
        const newConfig = { fileName: 'addedDummyFile', validator: () => {} };
        event.addConfig(newConfig);

        expect(event.getConfigs()).toEqual([...currentConfigs, newConfig]);
      });
    });
  });

  describe('ConfigPreFileLoadEvent', () => {
    const event = new ConfigPreFileLoadEvent(
      '/config/path',
      'dummyFile',
      '/config/path/dummyFile.yml',
    );

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.PRE_FILE_LOAD event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.PRE_FILE_LOAD);
      });
    });

    describe('#getConfigPath', () => {
      it('should return the config path', () => {
        expect(event.getConfigPath()).toEqual('/config/path');
      });
    });

    describe('#getFileName', () => {
      it('should return the file name', () => {
        expect(event.getFileName()).toEqual('dummyFile');
      });
    });

    describe('#getFilePath', () => {
      it('should return the file path', () => {
        expect(event.getFilePath()).toEqual('/config/path/dummyFile.yml');
      });
    });

    describe('#setFilePath', () => {
      it('should allow to update the file path', () => {
        event.setFilePath('/config/new/path/dummyFile.yml');

        expect(event.getFilePath()).toEqual('/config/new/path/dummyFile.yml');
      });
    });
  });

  describe('ConfigPreFileParseEvent', () => {
    const event = new ConfigPreFileParseEvent(
      'dummyFile',
      '/config/path/dummyFile.yml',
      'content:\n  foo: bar\n',
    );

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.PRE_FILE_PARSE event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.PRE_FILE_PARSE);
      });
    });

    describe('#getFileName', () => {
      it('should return the file name', () => {
        expect(event.getFileName()).toEqual('dummyFile');
      });
    });

    describe('#getFilePath', () => {
      it('should return the file name', () => {
        expect(event.getFilePath()).toEqual('/config/path/dummyFile.yml');
      });
    });

    describe('#getContent', () => {
      it('should return the content', () => {
        expect(event.getContent()).toEqual('content:\n  foo: bar\n');
      });
    });

    describe('#setContent', () => {
      it('should allow to update the content', () => {
        event.setContent('content:\n  foo: updated content\n');

        expect(event.getContent()).toEqual('content:\n  foo: updated content\n');
      });
    });
  });

  describe('ConfigPostFileParseEvent', () => {
    const event = new ConfigPostFileParseEvent('dummyFile', '/config/path/dummyFile.yml', {
      content: { foo: 'bar' },
    });

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.POST_FILE_PARSE event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.POST_FILE_PARSE);
      });
    });

    describe('#getFileName', () => {
      it('should return the file name', () => {
        expect(event.getFileName()).toEqual('dummyFile');
      });
    });

    describe('#getFilePath', () => {
      it('should return the file path', () => {
        expect(event.getFilePath()).toEqual('/config/path/dummyFile.yml');
      });
    });

    describe('#getConfig', () => {
      it('should return the config', () => {
        expect(event.getConfig()).toEqual({
          content: { foo: 'bar' },
        });
      });
    });

    describe('#setConfig', () => {
      it('should allow to update the config', () => {
        event.setConfig({
          content: { foo: 'new content' },
        });

        expect(event.getConfig()).toEqual({
          content: { foo: 'new content' },
        });
      });
    });
  });

  describe('ConfigPostEnvVariableInjectionEvent', () => {
    const event = new ConfigPostEnvVariableInjectionEvent(
      'dummyFile',
      '/config/path/dummyFile.yml',
      {
        content: { foo: '$(FOO:string?bar)' },
      },
    );

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION);
      });
    });

    describe('#getFileName', () => {
      it('should return the file name', () => {
        expect(event.getFileName()).toEqual('dummyFile');
      });
    });

    describe('#getFilePath', () => {
      it('should return the file path', () => {
        expect(event.getFilePath()).toEqual('/config/path/dummyFile.yml');
      });
    });

    describe('#getConfig', () => {
      it('should return the config', () => {
        expect(event.getConfig()).toEqual({
          content: { foo: '$(FOO:string?bar)' },
        });
      });
    });

    describe('#setConfig', () => {
      it('should allow to update the config', () => {
        event.setConfig({
          content: { foo: 'bar' },
        });

        expect(event.getConfig()).toEqual({
          content: { foo: 'bar' },
        });
      });
    });
  });

  describe('ConfigPostFileLoadEvent', () => {
    const event = new ConfigPostFileLoadEvent('dummyFile', '/config/path/dummyFile.yml');

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.POST_FILE_LOAD event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.POST_FILE_LOAD);
      });
    });

    describe('#getFilename', () => {
      it('should return the file name', () => {
        expect(event.getFileName()).toEqual('dummyFile');
      });
    });

    describe('#getFilePath', () => {
      it('should return the file path', () => {
        expect(event.getFilePath()).toEqual('/config/path/dummyFile.yml');
      });
    });
  });

  describe('ConfigPostLoadEvent', () => {
    const configs = [{ fileName: 'dummyFile', validator: () => {} }];
    const event = new ConfigPostLoadEvent(configs);

    describe('#getType', () => {
      it('should return a CONFIG_EVENTS.POST_LOAD event type', () => {
        expect(event.getType()).toEqual(CONFIG_EVENTS.POST_LOAD);
      });
    });

    describe('#getConfigs', () => {
      it('should return a frozen version of the configs', () => {
        expect(event.getConfigs()).toEqual(configs);
        expect(() =>
          (event.getConfigs() as Config[]).push({ fileName: 'newDummyFile', validator: () => {} }),
        ).toThrow();
      });
    });
  });
});
