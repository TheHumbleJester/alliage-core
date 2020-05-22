const ENV_PLACEHOLDER_PATTERN = /\{ENV\}/g;

export function injectEnvironment(env: string, params: any): any {
  if (typeof params === 'string' || params instanceof String) {
    return params.replace(ENV_PLACEHOLDER_PATTERN, env);
  }
  if (Array.isArray(params)) {
    return params.map((value) => injectEnvironment(env, value));
  }
  if (typeof params === 'object' && !!params) {
    const paramsCopy = { ...params };
    Object.entries(paramsCopy).forEach(([key, value]) => {
      paramsCopy[key] = injectEnvironment(env, value);
    });
    return paramsCopy;
  }
  return params;
}
