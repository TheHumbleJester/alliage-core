import glob from 'glob';
import path from 'path';

import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';
import { Arguments } from 'alliage/core/utils/cli';

import { EventManager } from 'alliage-lifecycle/event-manager';
import { ServiceContainer } from 'alliage-di/service-container';
import { service } from 'alliage-di/dependencies';
import { validate } from 'alliage-config-loader/validators/json-schema';
import { loadConfig } from 'alliage-config-loader/helpers';
import { CONFIG_EVENTS } from 'alliage-config-loader/events';
import { INIT_EVENTS, LifeCycleInitEvent } from 'alliage-lifecycle/events';

import ServiceLoaderModule from '..';
import { schema, CONFIG_NAME, Config } from '../config';
import { Service } from '../decorators';
import {
  SERVICE_LOADER_EVENTS,
  ServiceLoaderBeforeAllEvent,
  ServiceLoaderBeforeOneEvent,
  ServiceLoaderAfterOneEvent,
  ServiceLoaderAfterAllEvent,
} from '../events';

jest.mock('alliage-config-loader/validators/json-schema');
jest.mock('alliage-config-loader/helpers');
jest.mock('glob', () => jest.fn());

describe('service-loader', () => {
  describe('ServiceLoaderModule', () => {
    const module = new ServiceLoaderModule();

    describe('#getEventHandlers', () => {
      it('should listen to CONFIG_EVENTS.LOAD and INIT_EVENTS.POST_INIT events', () => {
        const validateMockReturnValue = () => {};
        const loadConfigMockReturnValue = () => {};
        (validate as jest.Mock).mockReturnValueOnce(validateMockReturnValue);
        (loadConfig as jest.Mock).mockReturnValueOnce(loadConfigMockReturnValue);

        expect(module.getEventHandlers()).toEqual({
          [CONFIG_EVENTS.LOAD]: loadConfigMockReturnValue,
          [INIT_EVENTS.INIT]: module.handleInit,
        });

        expect(validate).toHaveBeenCalledWith(schema);
        expect(loadConfig).toHaveBeenCalledWith(CONFIG_NAME, validateMockReturnValue);
      });
    });

    describe('#handleInit', () => {
      const eventManager = new EventManager();
      const serviceContainer = new ServiceContainer();

      serviceContainer.addService('event_manager', eventManager);
      serviceContainer.setParameter(CONFIG_NAME, {
        basePath: 'src',
        paths: ['services/**'],
        exclude: ['**/__tests__/**'],
      });

      const globSpy = (glob as unknown) as jest.Mock;
      const registerServiceSpy = jest.spyOn(serviceContainer, 'registerService');

      const beforeAllHandler = jest.fn();
      const afterAllHandler = jest.fn();
      const beforeOneHandler = jest.fn();
      const afterOneHandler = jest.fn();

      eventManager.on(SERVICE_LOADER_EVENTS.BEFORE_ALL, beforeAllHandler);
      eventManager.on(SERVICE_LOADER_EVENTS.AFTER_ALL, afterAllHandler);
      eventManager.on(SERVICE_LOADER_EVENTS.BEFORE_ONE, beforeOneHandler);
      eventManager.on(SERVICE_LOADER_EVENTS.AFTER_ONE, afterOneHandler);

      afterEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
      });

      const initEvent = new LifeCycleInitEvent(INIT_EVENTS.INIT, {
        env: 'test',
        context: INITIALIZATION_CONTEXT.RUN,
        serviceContainer,
        args: Arguments.create(),
      });

      it('should load all the services according to the configuration', async () => {
        globSpy.mockImplementationOnce((_path: string, _options: any, callback: Function) => {
          callback(null, ['/path/to/src/services/dummy-service']);
        });

        @Service('dummy_service', [service('other_service')])
        class DummyService {}

        class OverridenDummyService {}

        jest.doMock('/path/to/src/services/dummy-service', () => DummyService, { virtual: true });

        beforeAllHandler.mockImplementationOnce((event: ServiceLoaderBeforeAllEvent) => {
          expect(event.getBasePath()).toEqual('src');
          expect(event.getPaths()).toEqual(['services/**']);
          expect(event.getExclude()).toEqual(['**/__tests__/**']);

          event.setPaths(['overriden/services/**']);
          event.setExclude(['overriden/**/__tests__/**']);
        });

        beforeOneHandler.mockImplementationOnce((event: ServiceLoaderBeforeOneEvent) => {
          expect(event.getConstructor()).toEqual(DummyService);
          expect(event.getName()).toEqual('dummy_service');
          expect(event.getModulePath()).toEqual('/path/to/src/services/dummy-service');
          expect(event.getDependencies()).toEqual([service('other_service')]);

          event.setConstructor(OverridenDummyService);
          event.setDependencies([service('overriden_other_service')]);
        });

        afterOneHandler.mockImplementationOnce((event: ServiceLoaderAfterOneEvent) => {
          expect(event.getConstructor()).toEqual(OverridenDummyService);
          expect(event.getName()).toEqual('dummy_service');
          expect(event.getModulePath()).toEqual('/path/to/src/services/dummy-service');
          expect(event.getDependencies()).toEqual([service('overriden_other_service')]);
        });

        afterAllHandler.mockImplementationOnce((event: ServiceLoaderAfterAllEvent) => {
          expect(event.getBasePath()).toEqual('src');
          expect(event.getPaths()).toEqual(['overriden/services/**']);
          expect(event.getExclude()).toEqual(['overriden/**/__tests__/**']);
        });

        await module.handleInit(initEvent);

        expect(registerServiceSpy).toHaveBeenCalledTimes(1);
        expect(registerServiceSpy).toHaveBeenCalledWith('dummy_service', OverridenDummyService, [
          service('overriden_other_service'),
        ]);

        expect(globSpy).toHaveBeenCalledTimes(1);
        expect(globSpy).toHaveBeenCalledWith(
          'overriden/services/**',
          {
            cwd: path.resolve('src'),
            absolute: true,
            nodir: true,
            ignore: ['overriden/**/__tests__/**'],
          },
          expect.any(Function),
        );

        expect(beforeAllHandler).toHaveBeenCalledTimes(1);
        expect(beforeOneHandler).toHaveBeenCalledTimes(1);
        expect(afterOneHandler).toHaveBeenCalledTimes(1);
        expect(afterAllHandler).toHaveBeenCalledTimes(1);
      });

      it('should throw an error if the glob fails', async () => {
        const error = new Error();
        globSpy.mockImplementationOnce((_path: string, _options: any, callback: Function) => {
          callback(error);
        });

        let thrownError: Error;
        try {
          await module.handleInit(initEvent);
        } catch (e) {
          thrownError = e;
        }

        expect(thrownError!).toBe(error);
      });

      it('should not load the service if it does not use the @Service decorator', async () => {
        globSpy.mockImplementationOnce((_path: string, _options: any, callback: Function) => {
          callback(null, ['/path/to/src/services/dummy-service']);
        });

        class DummyService {}

        jest.doMock('/path/to/src/services/dummy-service', () => DummyService, { virtual: true });

        await module.handleInit(initEvent);

        expect(registerServiceSpy).not.toHaveBeenCalled();

        expect(beforeAllHandler).toHaveBeenCalledTimes(1);
        expect(beforeOneHandler).not.toHaveBeenCalled();
        expect(afterOneHandler).not.toHaveBeenCalled();
        expect(afterAllHandler).toHaveBeenCalledTimes(1);
      });

      it('should not load the service if it does export a default module', async () => {
        globSpy.mockImplementationOnce((_path: string, _options: any, callback: Function) => {
          callback(null, ['/path/to/src/services/dummy-service']);
        });

        jest.doMock('/path/to/src/services/dummy-service', () => null, { virtual: true });

        await module.handleInit(initEvent);

        expect(registerServiceSpy).not.toHaveBeenCalled();

        expect(beforeAllHandler).toHaveBeenCalledTimes(1);
        expect(beforeOneHandler).not.toHaveBeenCalled();
        expect(afterOneHandler).not.toHaveBeenCalled();
        expect(afterAllHandler).toHaveBeenCalledTimes(1);
      });

      it('should use a empty array as default value for the "exclude" parameter', async () => {
        globSpy.mockImplementationOnce((_path: string, _options: any, callback: Function) => {
          callback(null, ['/path/to/src/services/dummy-service']);
        });
        serviceContainer.getParameter<Config>(CONFIG_NAME).exclude = undefined;

        @Service('other_dummy_service', [service('other_service')])
        class DummyService {}

        jest.doMock('/path/to/src/services/dummy-service', () => DummyService, { virtual: true });

        await module.handleInit(initEvent);

        expect(registerServiceSpy).toHaveBeenCalledTimes(1);
        expect(registerServiceSpy).toHaveBeenCalledWith('other_dummy_service', DummyService, [
          service('other_service'),
        ]);

        expect(globSpy).toHaveBeenCalledTimes(1);
        expect(globSpy).toHaveBeenCalledWith(
          'services/**',
          {
            cwd: path.resolve('src'),
            absolute: true,
            nodir: true,
            ignore: [],
          },
          expect.any(Function),
        );

        expect(beforeAllHandler).toHaveBeenCalledTimes(1);
        expect(beforeOneHandler).toHaveBeenCalledTimes(1);
        expect(afterOneHandler).toHaveBeenCalledTimes(1);
        expect(afterAllHandler).toHaveBeenCalledTimes(1);
      });
    });
  });
});
