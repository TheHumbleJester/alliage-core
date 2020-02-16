import {
  ServiceContainer,
  InstanceNotFoundError,
  AlreadyExistingParameterError,
  UnknownParameterError,
  UnknownServiceError,
  FrozenError,
  CircularReferenceError,
  AlreadyRegisteredError,
  UnhandledDependencyType,
} from '../service-container';
import { service, instanceOf, allInstancesOf, parameter, Dependency } from '../dependencies';

describe('dependency-injection/service-container', () => {
  describe('ServiceContainer', () => {
    const dummyServiceConstructorMock1 = jest.fn();
    const dummyServiceConstructorMock2 = jest.fn();
    const dummyServiceConstructorMock3 = jest.fn();
    class DummyService1 {
      constructor(ds2: DummyService2, ds3: DummyService3) {
        dummyServiceConstructorMock1(ds2, ds3);
      }
    }
    class DummyService2 {
      constructor(ds3: DummyService3) {
        dummyServiceConstructorMock2(ds3);
      }
    }
    class DummyService3 {
      constructor() {
        dummyServiceConstructorMock3();
      }
    }
    class DummyServiceChild extends DummyService3 {}
    class DummyServiceChildChild extends DummyServiceChild {}

    describe('#registerService / #getService', () => {
      const sc = new ServiceContainer();

      sc.registerService('dummy_service_1', DummyService1, [
        service('dummy_service_2'),
        service('dummy_service_3'),
      ]);
      sc.registerService('dummy_service_2', DummyService2, [service('dummy_service_3')]);
      sc.registerService('dummy_service_3', DummyService3);
      sc.registerService('circular_ref', DummyService2, [service('circular_ref')]);

      it("should instanciate and return the registered service with all it's dependencies", () => {
        const ds1 = sc.getService('dummy_service_1');

        // Checks that the dependency injection has worked
        expect(ds1).toBeInstanceOf(DummyService1);
        expect(dummyServiceConstructorMock1).toHaveBeenCalledWith(
          expect.any(DummyService2),
          expect.any(DummyService3),
        );
        expect(dummyServiceConstructorMock2).toHaveBeenCalledWith(expect.any(DummyService3));
        expect(dummyServiceConstructorMock3).toHaveBeenCalledWith();

        const ds2 = sc.getService('dummy_service_2');
        const ds3 = sc.getService('dummy_service_3');

        // Checks references
        expect(dummyServiceConstructorMock1).toHaveBeenCalledWith(ds2, ds3);
        expect(dummyServiceConstructorMock2).toHaveBeenCalledWith(ds3);
      });

      it('should throw an error if the service does not exist', () => {
        expect(() => sc.getService('unknown_service')).toThrow(UnknownServiceError);
      });

      it('should throw an error in case of circular dependency', () => {
        expect(() => sc.getService('circular_ref')).toThrow(CircularReferenceError);
      });

      it('should throw an error is the service is already registered', () => {
        expect(() => sc.registerService('dummy_service_3', DummyService3)).toThrow(
          AlreadyRegisteredError,
        );
      });
    });

    describe('#addService / #getService', () => {
      const ds3 = new DummyService3();
      const sc = new ServiceContainer();

      sc.addService('dummy_service_3', ds3);

      it('should add an already instanciated service', () => {
        expect(sc.getService('dummy_service_3')).toBe(ds3);
      });

      it('should throw an error is the service is already registered', () => {
        expect(() => sc.addService('dummy_service_3', new DummyService3())).toThrow(
          AlreadyRegisteredError,
        );
      });
    });

    describe('#getInstanceOf', () => {
      const sc = new ServiceContainer();
      const dscc = new DummyServiceChildChild();

      sc.addService('dummy_service_cc', dscc);

      it('should return the first service which is a instance of a given constructor', () => {
        expect(sc.getInstanceOf(DummyServiceChildChild)).toBe(dscc);
        expect(sc.getInstanceOf(DummyServiceChild)).toBe(dscc);
        expect(sc.getInstanceOf(DummyService3)).toBe(dscc);
      });

      it('should throw an error if the instance does not exist', () => {
        expect(() => sc.getInstanceOf(DummyService1)).toThrow(InstanceNotFoundError);
      });
    });

    describe('#getAllInstancesOf', () => {
      const sc = new ServiceContainer();

      const ds3 = new DummyService3();
      const dsc = new DummyServiceChild();
      const dscc = new DummyServiceChildChild();

      sc.addService('dummy_service_3', ds3);
      sc.addService('dummy_service_c', dsc);
      sc.addService('dummy_service_cc', dscc);
      sc.addService('dummy_service_2', new DummyService2(null as any));

      it('should return all the instances of a given constructor', () => {
        expect(sc.getAllInstancesOf(DummyService3)).toEqual([ds3, dsc, dscc]);
      });
    });

    describe('#setParameter / #getParameter', () => {
      const sc = new ServiceContainer();

      sc.setParameter('name', 'test');
      it('should store and return a parameter', () => {
        expect(sc.getParameter('name')).toEqual('test');
      });

      it('should throw an error id the parameter does not exist', () => {
        expect(() => sc.getParameter('unknown.foo')).toThrow(UnknownParameterError);
      });

      it('should throw an error if the parameter already exists', () => {
        expect(() => sc.setParameter('name', 'test2')).toThrow(AlreadyExistingParameterError);
      });
    });

    describe('#getDependency', () => {
      const sc = new ServiceContainer();

      const ds3 = new DummyService3();

      sc.addService('dummy_service_3', ds3);
      sc.setParameter('name', 'test');

      it('should return a dependency', () => {
        expect(sc.getDependency(service('dummy_service_3'))).toBe(ds3);
        expect(sc.getDependency(instanceOf(DummyService3))).toBe(ds3);
        expect(sc.getDependency(allInstancesOf(DummyService3))).toEqual([ds3]);
        expect(sc.getDependency(parameter('name'))).toBe('test');
      });

      it('should throw an error or return nothing if the dependency does not exist', () => {
        expect(() => sc.getDependency(service('dummy_service_2'))).toThrow(UnknownServiceError);
        expect(() => sc.getDependency(instanceOf(DummyService2))).toThrow(InstanceNotFoundError);
        expect(sc.getDependency(allInstancesOf(DummyService2))).toEqual([]);
        expect(() => sc.getDependency(parameter('unknown'))).toThrow(UnknownParameterError);
      });

      it("should not catch the exception returned by a parameter's getter if it's not a TypeError", () => {
        expect(() =>
          sc.getDependency(
            parameter(() => {
              throw Error('test error');
            }),
          ),
        ).toThrow('test error');
      });

      it('should throw an error if an unhandled dependency is provided', () => {
        expect(() =>
          sc.getDependency(({ type: 'unhandled_dep' } as unknown) as Dependency),
        ).toThrow(UnhandledDependencyType);
      });
    });

    describe('#freeze', () => {
      const sc = new ServiceContainer();

      sc.freeze();

      it('should prevent from registering a service or a parameter', () => {
        expect(() => sc.registerService('dummy_service_3', DummyService3)).toThrow(FrozenError);
        expect(() => sc.addService('dummy_service_3', new DummyService3())).toThrow(FrozenError);
        expect(() => sc.setParameter('name', 'test')).toThrow(FrozenError);
      });
    });
  });
});
