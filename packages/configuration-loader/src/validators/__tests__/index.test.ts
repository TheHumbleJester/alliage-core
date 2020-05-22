import { ConfigurationSchemaValidationError } from '..';

describe('configuration-loader/validators', () => {
  describe('ConfigurationSchemaValidationError', () => {
    const error = new ConfigurationSchemaValidationError('/conf/file/path', [
      { property: 'foo', message: 'bar' },
    ]);

    it('should have a message property saying that there was an validation error in the file located at the path passed in the constructor', () => {
      expect(error.message).toEqual("The configuration schema is invalid in '/conf/file/path'");
    });

    it('should have a configPath property containing the config path passed in the constructor', () => {
      expect(error.configPath).toEqual('/conf/file/path');
    });

    it('should have an error property containing all the errors passed in the constructor', () => {
      expect(error.errors).toEqual([{ property: 'foo', message: 'bar' }]);
    });
  });
});
