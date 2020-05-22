import Ajv from 'ajv';

import { ConfigurationSchemaValidationError } from '.';

export function validate(schema: string | boolean | object) {
  const ajv = new Ajv({ allErrors: true, strictKeywords: true });
  return function validator(configPath: string, config: any) {
    const configCopy = JSON.parse(JSON.stringify(config));
    const valid = ajv.validate(schema, configCopy);
    if (!valid) {
      throw new ConfigurationSchemaValidationError(configPath, ajv.errors);
    }
    return configCopy;
  };
}
