export class ConfigurationSchemaValidationError extends Error {
  public errors: object[] | null | undefined;

  public configPath: string;

  constructor(configPath: string, errors: object[] | null | undefined) {
    super(`The configuration schema is invalid in '${configPath}'`);
    this.errors = errors;
    this.configPath = configPath;
  }
}
