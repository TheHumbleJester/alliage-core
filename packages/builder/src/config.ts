export const CONFIG_NAME = 'builder';
export const schema = {
  type: 'object',
  properties: {
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'params'],
        properties: {
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          params: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
  },
};

export interface Config {
  tasks: {
    name: string;
    description: string;
    params: any;
  }[];
}
