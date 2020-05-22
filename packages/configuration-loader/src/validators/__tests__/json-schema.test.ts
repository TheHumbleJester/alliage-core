import { validate } from '../json-schema';
import { ConfigurationSchemaValidationError } from '..';

describe('configuration-loader/validators/json-schema', () => {
  const schema = {
    type: 'object',
    properties: {
      dummyString: {
        type: 'string',
      },
      dummyArray: {
        type: 'array',
        items: {
          type: 'number',
        },
      },
      dummyBoolean: {
        type: 'boolean',
      },
    },
  };
  const validator = validate(schema);

  it("should return a new version of the configuration if it's valid", () => {
    expect(
      validator('/conf/file/path', {
        dummyString: 'dummy string',
        dummyArray: [1, 2, 3],
        dummyBoolean: true,
      }),
    ).toEqual({
      dummyString: 'dummy string',
      dummyArray: [1, 2, 3],
      dummyBoolean: true,
    });
  });

  it("should raise an error if it's invalid", () => {
    let error;
    try {
      validator('/conf/file/path', {
        dummyString: 42,
        dummyArray: [1, '2', 3],
        dummyBoolean: 'true',
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ConfigurationSchemaValidationError);
    expect(error.message).toEqual("The configuration schema is invalid in '/conf/file/path'");
    expect(error.errors).toEqual([
      {
        dataPath: '.dummyString',
        keyword: 'type',
        message: 'should be string',
        params: { type: 'string' },
        schemaPath: '#/properties/dummyString/type',
      },
      {
        dataPath: '.dummyArray[1]',
        keyword: 'type',
        message: 'should be number',
        params: {
          type: 'number',
        },
        schemaPath: '#/properties/dummyArray/items/type',
      },
      {
        dataPath: '.dummyBoolean',
        keyword: 'type',
        message: 'should be boolean',
        params: {
          type: 'boolean',
        },
        schemaPath: '#/properties/dummyBoolean/type',
      },
    ]);
  });
});
