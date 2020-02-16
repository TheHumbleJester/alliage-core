import {
  SERVICE_LOADER_EVENTS,
  ServiceLoaderBeforeAllEvent,
  ServiceLoaderAfterAllEvent,
  ServiceLoaderBeforeOneEvent,
  ServiceLoaderAfterOneEvent,
} from '../events';
import { service, instanceOf } from '../../../dependency-injection/src/dependencies';

describe('service-loader/events', () => {
  describe('ServiceLoaderBeforeAllEvent', () => {
    const event = new ServiceLoaderBeforeAllEvent(
      'test_base_path',
      ['test_path'],
      ['test_exclude'],
    );
    describe('#getType', () => {
      it('should return a SERVICE_LOADER_EVENTS.BEFORE_ALL event type', () => {
        expect(event.getType()).toEqual(SERVICE_LOADER_EVENTS.BEFORE_ALL);
      });
    });

    describe('#getBasePath', () => {
      it('should return the base path', () => {
        expect(event.getBasePath()).toEqual('test_base_path');
      });
    });

    describe('#getPaths', () => {
      it('should return a frozen version of the paths', () => {
        const paths = event.getPaths();

        expect(paths).toEqual(['test_path']);
        expect(() => {
          (paths as any).push('test');
        }).toThrow();
      });
    });

    describe('#getExclude', () => {
      it('should return a frozen version of the exclude', () => {
        const exclude = event.getExclude();

        expect(exclude).toEqual(['test_exclude']);
        expect(() => {
          (exclude as any).push('test');
        }).toThrow();
      });
    });

    describe('#setPaths', () => {
      it('should allow to update the paths', () => {
        event.setPaths(['test_path1', 'test_path2']);

        expect(event.getPaths()).toEqual(['test_path1', 'test_path2']);
      });
    });

    describe('#setExclude', () => {
      it('should allow to update the exclude', () => {
        event.setExclude(['test_exclude1', 'test_exclude2']);

        expect(event.getExclude()).toEqual(['test_exclude1', 'test_exclude2']);
      });
    });
  });

  describe('ServiceLoaderAfterAllEvent', () => {
    const event = new ServiceLoaderAfterAllEvent('test_base_path', ['test_path'], ['test_exclude']);
    describe('#getType', () => {
      it('should return a SERVICE_LOADER_EVENTS.AFTER_ALL event type', () => {
        expect(event.getType()).toEqual(SERVICE_LOADER_EVENTS.AFTER_ALL);
      });
    });

    describe('#getBasePath', () => {
      it('should return the base path', () => {
        expect(event.getBasePath()).toEqual('test_base_path');
      });
    });

    describe('#getPaths', () => {
      it('should return a frozen version of the paths', () => {
        const paths = event.getPaths();

        expect(paths).toEqual(['test_path']);
        expect(() => {
          (paths as any).push('test');
        }).toThrow();
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = ServiceLoaderAfterAllEvent.getParams(
          'test_base_path',
          ['test_path'],
          ['test_exclude'],
        ) as [SERVICE_LOADER_EVENTS, ServiceLoaderAfterAllEvent];

        expect(type).toEqual(SERVICE_LOADER_EVENTS.AFTER_ALL);
        expect(eventInstance).toBeInstanceOf(ServiceLoaderAfterAllEvent);
        expect(eventInstance.getBasePath()).toEqual('test_base_path');
        expect(eventInstance.getPaths()).toEqual(['test_path']);
        expect(eventInstance.getExclude()).toEqual(['test_exclude']);
      });
    });
  });

  describe('ServiceLoaderBeforeOneEvent', () => {
    class DummyConstructor {}
    const event = new ServiceLoaderBeforeOneEvent(
      'test_module_path',
      'test_service_name',
      DummyConstructor,
      [service('other_service')],
    );

    describe('#getType', () => {
      it('should return a SERVICE_LOADER_EVENTS.BEFORE_ONE event type', () => {
        expect(event.getType()).toEqual(SERVICE_LOADER_EVENTS.BEFORE_ONE);
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('test_module_path');
      });
    });

    describe('#getName', () => {
      it('should return the name', () => {
        expect(event.getName()).toEqual('test_service_name');
      });
    });

    describe('#getConstructor', () => {
      it('should return the constructor', () => {
        expect(event.getConstructor()).toBe(DummyConstructor);
      });
    });

    describe('#getDependencies', () => {
      it('should return the list of the dependencies', () => {
        expect(event.getDependencies()).toEqual([service('other_service')]);
      });
    });

    describe('#setConstructor', () => {
      it('should allow to update the constructor', () => {
        class AnotherDummyConstructor {}

        event.setConstructor(AnotherDummyConstructor);

        expect(event.getConstructor()).toBe(AnotherDummyConstructor);
      });
    });

    describe('#setDependencies', () => {
      it('should allow to update the dependencies', () => {
        event.setDependencies([service('service1'), instanceOf(DummyConstructor)]);

        expect(event.getDependencies()).toEqual([
          service('service1'),
          instanceOf(DummyConstructor),
        ]);
      });
    });
  });

  describe('ServiceLoaderAfterOneEvent', () => {
    class DummyConstructor {}
    const event = new ServiceLoaderAfterOneEvent(
      'test_module_path',
      'test_service_name',
      DummyConstructor,
      [service('other_service')],
    );

    describe('#getType', () => {
      it('should return a SERVICE_LOADER_EVENTS.AFTER_ONE event type', () => {
        expect(event.getType()).toEqual(SERVICE_LOADER_EVENTS.AFTER_ONE);
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('test_module_path');
      });
    });

    describe('#getName', () => {
      it('should return the name', () => {
        expect(event.getName()).toEqual('test_service_name');
      });
    });

    describe('#getConstructor', () => {
      it('should return the constructor', () => {
        expect(event.getConstructor()).toBe(DummyConstructor);
      });
    });

    describe('#getDependencies', () => {
      it('should return the list of the dependencies', () => {
        expect(event.getDependencies()).toEqual([service('other_service')]);
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [type, eventInstance] = ServiceLoaderAfterOneEvent.getParams(
          'test_module_path',
          'test_service_name',
          DummyConstructor,
          [service('other_service')],
        ) as [SERVICE_LOADER_EVENTS, ServiceLoaderAfterOneEvent];

        expect(type).toEqual(SERVICE_LOADER_EVENTS.AFTER_ONE);
        expect(eventInstance).toBeInstanceOf(ServiceLoaderAfterOneEvent);
        expect(event.getModulePath()).toEqual('test_module_path');
        expect(event.getName()).toEqual('test_service_name');
        expect(event.getConstructor()).toBe(DummyConstructor);
        expect(event.getDependencies()).toEqual([service('other_service')]);
      });
    });
  });
});
