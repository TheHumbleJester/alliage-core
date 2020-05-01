export const CONFIG_NAME = 'services';
export const schema = {
  type: 'object',
  required: ['basePath', 'paths'],
  properties: {
    basePath: {
      type: 'string',
    },
    paths: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    exclude: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
};

export interface Config {
  basePath: 'string';
  paths: string[];
  exclude?: string[];
}
