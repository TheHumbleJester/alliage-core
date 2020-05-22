import { service } from 'alliage-di/dependencies';

import { Service, SERVICE_DEFINITION_PROPERTY_NAME } from '..';

describe('service-loader/decorators', () => {
  describe('Service', () => {
    it('should add a new static property with the service definition', () => {
      @Service('dummy_service', [service('test_service')])
      class DummyClass {}

      expect((DummyClass as any)[SERVICE_DEFINITION_PROPERTY_NAME]).toEqual({
        name: 'dummy_service',
        dependencies: [service('test_service')],
      });
    });

    it('should set an empty array for dependencies by default', () => {
      @Service('dummy_service')
      class DummyClass {}

      expect((DummyClass as any)[SERVICE_DEFINITION_PROPERTY_NAME]).toEqual({
        name: 'dummy_service',
        dependencies: [],
      });
    });
  });
});
