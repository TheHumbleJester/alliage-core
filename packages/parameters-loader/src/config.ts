export const CONFIG_NAME = 'parameters';
export const schema = {
  type: 'object',
  additionalProperties: true,
};
export interface Config {
  [key: string]: any;
}
