import {
  injectEnvVariables,
  WrongEnvVariableTypeError,
  EnvVariableSyntaxError,
  UnprocessableEnvVariableError,
  loadConfig,
} from '../helpers';
import { ConfigLoadEvent } from '../events';

describe('configuration-loader/helpers', () => {
  describe('#injectEnvVariables', () => {
    beforeAll(() => {
      Object.assign(process.env, {
        DUMMY_NUMBER: '42.42',
        DUMMY_ARRAY: 'one, two,three, four ',
        DUMMY_STRING: 'this is a string',
        DUMMY_JSON: '{"foo": ["bar", 42, true]}',
        DUMMY_BOOL_1: 'true',
        DUMMY_BOOL_2: 'something',
        DUMMY_BOOL_3: '1',
        DUMMY_BOOL_4: '0',
        DUMMY_BOOL_5: '',
      });
    });

    it('should inject environment variables of any type in the object', () => {
      expect(
        injectEnvVariables('/conf/file/path', {
          level1: {
            dummyInteger: '$(DUMMY_NUMBER:number)',
            number: 42,
            level2: {
              dummyArray: ['$(DUMMY_ARRAY:array)', 42, 'test'],
              array: [1, 2, 3],
              level3: {
                dummyString: '$(DUMMY_STRING:string)',
                level3: {
                  dummyJson: '$(DUMMY_JSON:json)',
                  level4: {
                    dummyBool1: '$(DUMMY_BOOL_1:boolean)',
                    dummyBool2: '$(DUMMY_BOOL_2:boolean)',
                    dummyBool3: '$(DUMMY_BOOL_3:boolean)',
                    dummyBool4: '$(DUMMY_BOOL_4:boolean)',
                    dummyBool5: '$(DUMMY_BOOL_5:boolean)',
                    dummyBool6: '$(DUMMY_BOOL_6:boolean)',
                  },
                },
              },
            },
          },
        }),
      ).toEqual({
        level1: {
          dummyInteger: 42.42,
          number: 42,
          level2: {
            dummyArray: [['one', 'two', 'three', 'four'], 42, 'test'],
            array: [1, 2, 3],
            level3: {
              dummyString: 'this is a string',
              level3: {
                dummyJson: { foo: ['bar', 42, true] },
                level4: {
                  dummyBool1: true,
                  dummyBool2: true,
                  dummyBool3: true,
                  dummyBool4: false,
                  dummyBool5: false,
                  dummyBool6: false,
                },
              },
            },
          },
        },
      });
    });

    it('should handle default values', () => {
      expect(
        injectEnvVariables('/conf/file/path', {
          unknownNumber: '$(UNKNOWN_NUMBER:number?3.14)',
          unknownArray: '$(UNKNOWN_ARRAY:array?"test",%A%, ? ?? )',
          unknownString: '$(UNKNOWN_STRING:string? this % might ;? be a ** string ?!)',
          unknownJson: '$(UNKNOWN_JSON:json?{"foo": ["%?", "?%"]})',
        }),
      ).toEqual({
        unknownNumber: 3.14,
        unknownArray: ['"test"', '%A%', '? ??'],
        unknownString: ' this % might ;? be a ** string ?!',
        unknownJson: { foo: ['%?', '?%'] },
      });
    });

    it('should consider an env variable a string if not type is provided', () => {
      expect(
        injectEnvVariables('/conf/file/path', {
          unknownNumber: '$(UNKNOWN_NUMBER?3.14)',
          unknownArray: '$(UNKNOWN_ARRAY?"test",%A%, ? ?? )',
          unknownString: '$(UNKNOWN_STRING? this % might ;? be a ** string ?!)',
          unknownJson: '$(UNKNOWN_JSON?{"foo": ["%?", "?%"]})',
        }),
      ).toEqual({
        unknownNumber: '3.14',
        unknownArray: '"test",%A%, ? ?? ',
        unknownString: ' this % might ;? be a ** string ?!',
        unknownJson: '{"foo": ["%?", "?%"]}',
      });
    });

    it('should raise an error if an env variable is malformatted', () => {
      let error;

      try {
        injectEnvVariables('/conf/file/path', {
          level1: { level2: { level3: { dummyNumber: '$(987SDF9à!èç!)' } } },
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(EnvVariableSyntaxError);
      expect(error.message).toEqual(
        "Failed to parse env variable at 'level1.level2.level3.dummyNumber' in '/conf/file/path'",
      );
    });

    it('should raise an error if the value type is not handled', () => {
      let error;

      try {
        injectEnvVariables('/conf/file/path', {
          level1: { level2: { level3: { dummyNumber: '$(DUMMY_NUMBER:unknowntype?42.42)' } } },
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(WrongEnvVariableTypeError);
      expect(error.message).toEqual(
        "Wrong 'unknowntype' env variable type at 'level1.level2.level3.dummyNumber' in '/conf/file/path'",
      );
    });

    it('should raise an error if the type processor fails', () => {
      let error;

      try {
        injectEnvVariables('/conf/file/path', {
          level1: { level2: { level3: { dummyNumber: '$(UNKNOWN_JSON:json?...)' } } },
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(UnprocessableEnvVariableError);
      expect(error.message).toEqual(
        "Failed to process env variable at 'level1.level2.level3.dummyNumber' in '/conf/file/path':\nUnexpected token . in JSON at position 0",
      );
    });
  });

  describe('#loadConfig', () => {
    it('should create a CONFIG_EVENTS.LOAD event handler adding a new configuration', () => {
      const dummyValidator = () => {};
      const eventHandler = loadConfig('dummyFileName', dummyValidator);
      const event = new ConfigLoadEvent();

      eventHandler(event);

      expect(event.getConfigs()).toEqual([
        { fileName: 'dummyFileName', validator: dummyValidator },
      ]);
    });
  });
});
