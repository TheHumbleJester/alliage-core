import { service } from 'alliage-di/dependencies';

import { Service } from '../..';
import { extractServiceDefinition } from '..';

describe('service-loader/decorators/extractors', () => {
  describe('extractServiceDefinition', () => {
    it('should extract the service definition from a class', () => {
      @Service('dummy_service', [service('test_service')])
      class DummyClass {}

      expect(extractServiceDefinition(DummyClass)).toEqual({
        name: 'dummy_service',
        dependencies: [service('test_service')],
      });
    });
  });
});
