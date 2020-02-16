import { service, parameter, instanceOf, allInstancesOf, DEPENDENCY } from '../dependencies';

describe('dependency-injection/dependencies', () => {
  describe('#service', () => {
    it('should return a service dependency descriptor', () => {
      expect(service('test_name')).toEqual({
        type: DEPENDENCY.SERVICE,
        name: 'test_name',
      });
    });
  });

  describe('#parameter', () => {
    it('should return a parameter dependency descriptor from a string', () => {
      const dep = parameter('test_path');

      expect(dep).toEqual({
        type: DEPENDENCY.PARAMETER,
        getter: expect.any(Function),
      });

      expect(dep.getter.name).toEqual('test_path');
    });

    it('should return a parameter dependency descriptor from a function', () => {
      const func = () => {};

      expect(parameter(func)).toEqual({
        type: DEPENDENCY.PARAMETER,
        getter: func,
      });
    });
  });

  describe('#instanceOf', () => {
    it('should return a parameter dependency descriptor', () => {
      class Ctor {}

      expect(instanceOf(Ctor)).toEqual({
        type: DEPENDENCY.INSTANCE_OF,
        ctor: Ctor,
      });
    });
  });

  describe('#allInstancesOf', () => {
    it('should return a parameter dependency descriptor', () => {
      class Ctor {}

      expect(allInstancesOf(Ctor)).toEqual({
        type: DEPENDENCY.ALL_INSTANCES_OF,
        ctor: Ctor,
      });
    });
  });
});
