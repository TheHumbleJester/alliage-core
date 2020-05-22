import { MODULE_TYPE, validate } from '../manifest';
import { ManifestValidationError } from '..';

describe('module-installer/schemas/manifest', () => {
  describe('#validate', () => {
    it('should return the object if the format is correct', () => {
      expect(() =>
        validate('test-module', {
          type: MODULE_TYPE.MODULE,
          dependencies: ['other-module'],
        }),
      ).not.toThrow();
    });

    it('should throw an error if the format is incorrect', () => {
      let error;
      try {
        validate(
          'test-module',
          {
            type: 'wrong-value',
            dependencies: ['other-module'],
            installationProcedures: {
              test: 'wrong-value',
            },
          },
          {
            test: {
              type: 'number',
            },
          },
        );
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(ManifestValidationError);
      expect(error.message).toEqual("Invalid manifest in: 'test-module'");
      expect(error.moduleName).toEqual('test-module');
      expect(error.errors).toEqual([
        {
          dataPath: '.type',
          keyword: 'enum',
          message: 'should be equal to one of the allowed values',
          params: { allowedValues: ['module', 'compound'] },
          schemaPath: '#/properties/type/enum',
        },
        {
          dataPath: '.installationProcedures.test',
          keyword: 'type',
          message: 'should be number',
          params: {
            type: 'number',
          },
          schemaPath: '#/properties/installationProcedures/properties/test/type',
        },
      ]);
    });
  });
});
