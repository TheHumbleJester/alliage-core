export class ManifestValidationError extends Error {
  public errors: object[] | null | undefined;

  public moduleName: string;

  constructor(moduleName: string, errors: object[] | null | undefined) {
    super(`Invalid manifest in: '${moduleName}'`);
    this.errors = errors;
    this.moduleName = moduleName;
  }
}
