import { injectEnvironment } from '../helpers';

describe('builder/helpers', () => {
  describe('injectEnvironment', () => {
    it('should replace all {ENV} occurences with the environement recursively', () => {
      expect(
        injectEnvironment('test', {
          test: 'test{ENV}test',
          test2: [
            {
              property1: 'value_{ENV}',
              property2: ['{{ENV}}', 42],
            },
          ],
        }),
      ).toEqual({
        test: 'testtesttest',
        test2: [
          {
            property1: 'value_test',
            property2: ['{test}', 42],
          },
        ],
      });
    });
  });
});
