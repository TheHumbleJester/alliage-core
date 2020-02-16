import { ConfigLoadEvent } from './events';

const ENV_VARIABLE_REGEXP = /^\$\((.*)\)$/;
const ENV_VARIABLE_PARAMS_REGEXP = /^([A-Z0-9_]+)(:([a-z]+))?(\?(.*))?$/;

export class EnvVariableSyntaxError extends Error {}
export class WrongEnvVariableTypeError extends Error {}
export class UnprocessableEnvVariableError extends Error {}

const TYPE_PROCESSORS = {
  number: (value: string) => parseFloat(value),
  boolean: (value: string) =>
    value !== undefined && value !== '' && value !== 'false' && value !== '0',
  string: (value: string) => value,
  array: (value: string) => value.split(',').map((subValue: string) => subValue.trim()),
  json: (value: string) => JSON.parse(value),
};

type EnvVariableType = keyof typeof TYPE_PROCESSORS;

export function injectEnvVariables(configFilePath: string, config: any, path: string[] = []): any {
  if (typeof config === 'string' || config instanceof String) {
    const firstMatch = ENV_VARIABLE_REGEXP.exec(config as string);
    if (firstMatch) {
      const secondMatch = ENV_VARIABLE_PARAMS_REGEXP.exec(firstMatch[1]);
      if (!secondMatch) {
        throw new EnvVariableSyntaxError(
          `Failed to parse env variable at '${path.join('.')}' in '${configFilePath}'`,
        );
      }

      const envVariableName = secondMatch[1];
      const envVariableType = <EnvVariableType>(secondMatch[3] ?? 'string');
      const envVariableDefault = secondMatch[5];

      if (!Object.keys(TYPE_PROCESSORS).includes(envVariableType)) {
        throw new WrongEnvVariableTypeError(
          `Wrong '${envVariableType}' env variable type at '${path.join(
            '.',
          )}' in '${configFilePath}'`,
        );
      }

      try {
        return TYPE_PROCESSORS[envVariableType](process.env[envVariableName] ?? envVariableDefault);
      } catch (e) {
        throw new UnprocessableEnvVariableError(
          `Failed to process env variable at '${path.join('.')}' in '${configFilePath}':\n${
            e.message
          }`,
        );
      }
    }
  }
  if (Array.isArray(config)) {
    return config.map((value, index) =>
      injectEnvVariables(configFilePath, value, [...path, `[${index}]`]),
    );
  }
  if (typeof config === 'object' && !!config) {
    const configCopy = { ...config };
    Object.entries(configCopy).forEach(([key, value]) => {
      configCopy[key] = injectEnvVariables(configFilePath, value, [...path, key]);
    });
    return configCopy;
  }

  return config;
}

export function loadConfig(fileName: string, validator: Function) {
  return (loadEvent: ConfigLoadEvent) => {
    loadEvent.addConfig({ fileName, validator });
  };
}
