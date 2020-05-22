import { validate } from 'alliage-config-loader/validators/json-schema';
import { loadConfig } from 'alliage-config-loader/helpers';
import { CONFIG_EVENTS } from 'alliage-config-loader/events';

import { schema, CONFIG_NAME } from '../config';
import ParametersLoaderModule from '..';

jest.mock('alliage-config-loader/validators/json-schema');
jest.mock('alliage-config-loader/helpers');

describe('parameters-loader', () => {
  describe('ParametersLoaderModule', () => {
    const module = new ParametersLoaderModule();

    describe('#getEventHandlers', () => {
      it('should listen to CONFIG_EVENTS.LOAD events', () => {
        const validateMockReturnValue = () => {};
        const loadConfigMockReturnValue = () => {};
        (validate as jest.Mock).mockReturnValueOnce(validateMockReturnValue);
        (loadConfig as jest.Mock).mockReturnValueOnce(loadConfigMockReturnValue);

        expect(module.getEventHandlers()).toEqual({
          [CONFIG_EVENTS.LOAD]: loadConfigMockReturnValue,
        });

        expect(validate).toHaveBeenCalledWith(schema);
        expect(loadConfig).toHaveBeenCalledWith(CONFIG_NAME, validateMockReturnValue);
      });
    });
  });
});
