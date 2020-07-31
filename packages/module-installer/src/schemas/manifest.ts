import Ajv from 'ajv';

import { ManifestValidationError } from '.';

export enum MODULE_TYPE {
  COMPOUND = 'compound',
  MODULE = 'module',
}

export const schema = {
  type: 'object',
  required: ['type', 'dependencies'],
  properties: {
    type: {
      type: 'string',
      enum: [MODULE_TYPE.MODULE, MODULE_TYPE.COMPOUND],
    },
    dependencies: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    environments: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

export type Manifest<T = { [key: string]: any }> = {
  dependencies: string[];
  environments?: string[];
  type: MODULE_TYPE;
  installationProcedures: T;
};

export function validate(
  moduleName: string,
  manifest: object,
  installationProceduresSchema: object = {},
) {
  const ajv = new Ajv({ allErrors: true, strictKeywords: true });
  const res = ajv.validate(
    {
      ...schema,
      properties: {
        ...schema.properties,
        installationProcedures: {
          type: 'object',
          additionalProperties: false,
          properties: installationProceduresSchema,
        },
      },
    },
    manifest,
  );
  if (!res) {
    throw new ManifestValidationError(moduleName, ajv.errors);
  }
}
