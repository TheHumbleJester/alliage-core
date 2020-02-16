import { AbstractWritableEvent } from 'alliage-lifecycle/events';

export enum CONFIG_EVENTS {
  PRE_LOAD = '@configuration-loader/CONFIG_EVENTS/PRE_LOAD',
  LOAD = '@configuration-loader/CONFIG_EVENTS/LOAD',
  POST_LOAD = '@configuration-loader/CONFIG_EVENTS/POST_LOAD',

  PRE_FILE_LOAD = '@configuration-loader/CONFIG_EVENTS/PRE_FILE_LOAD',
  POST_FILE_LOAD = '@configuration-loader/CONFIG_EVENTS/POST_FILE_LOAD',

  PRE_FILE_PARSE = '@configuration-loader/CONFIG_EVENTS/PRE_FILE_PARSE',
  POST_FILE_PARSE = '@configuration-loader/CONFIG_EVENTS/POST_FILE_PARSE',

  POST_ENV_VARIABLES_INJECTION = '@configuration-loader/CONFIG_EVENTS/POST_ENV_VARIABLE_INJECTION',
}

export abstract class AbstractConfigEvent<P extends object = object> extends AbstractWritableEvent<
  CONFIG_EVENTS,
  P
> {}

export type Config = { fileName: string; validator: Function };

export interface ConfigPreLoadEventPayload {
  configPath: string;
  configs: Config[];
}

export class ConfigPreLoadEvent extends AbstractConfigEvent<ConfigPreLoadEventPayload> {
  constructor(configPath: string, configs: Config[] = []) {
    super(CONFIG_EVENTS.PRE_LOAD, { configPath, configs });
  }

  getConfigPath() {
    return this.getWritablePayload().configPath;
  }

  getConfigs() {
    return Object.freeze(this.getWritablePayload().configs);
  }

  setConfigPath(configPath: string) {
    this.getWritablePayload().configPath = configPath;
    return this;
  }

  setConfigs(configs: Config[]) {
    this.getWritablePayload().configs = configs;
    return this;
  }
}

export interface ConfigLoadEventPayload {
  configs: Config[];
}

export class ConfigLoadEvent extends AbstractConfigEvent<ConfigLoadEventPayload> {
  constructor(configs: Config[] = []) {
    super(CONFIG_EVENTS.LOAD, { configs });
  }

  getConfigs() {
    return Object.freeze(this.getWritablePayload().configs);
  }

  setConfigs(configs: Config[]) {
    this.getWritablePayload().configs = configs;
    return this;
  }

  addConfig(config: Config) {
    return this.setConfigs([...this.getConfigs(), config]);
  }
}

export interface ConfigPreFileLoadEventPayload {
  configPath: string;
  filePath: string;
  fileName: string;
}

export class ConfigPreFileLoadEvent extends AbstractConfigEvent<ConfigPreFileLoadEventPayload> {
  constructor(configPath: string, fileName: string, filePath: string) {
    super(CONFIG_EVENTS.PRE_FILE_LOAD, { configPath, fileName, filePath });
  }

  getConfigPath() {
    return this.getPayload().configPath;
  }

  getFileName() {
    return this.getPayload().fileName;
  }

  getFilePath() {
    return this.getWritablePayload().filePath;
  }

  setFilePath(filePath: string) {
    this.getWritablePayload().filePath = filePath;
    return this;
  }
}

export interface ConfigPreFileParseEventPayload {
  fileName: string;
  filePath: string;
  content: string;
}

export class ConfigPreFileParseEvent extends AbstractConfigEvent<ConfigPreFileParseEventPayload> {
  constructor(fileName: string, filePath: string, content: string) {
    super(CONFIG_EVENTS.PRE_FILE_PARSE, { fileName, filePath, content });
  }

  getFileName() {
    return this.getPayload().fileName;
  }

  getFilePath() {
    return this.getPayload().filePath;
  }

  getContent() {
    return this.getWritablePayload().content;
  }

  setContent(content: string) {
    this.getWritablePayload().content = content;
    return this;
  }
}

export interface ConfigPostFileParseEventPayload {
  fileName: string;
  filePath: string;
  config: object;
}

export abstract class AbstractConfigPostFileParseEvent extends AbstractConfigEvent<
  ConfigPostFileParseEventPayload
> {
  getFileName() {
    return this.getPayload().fileName;
  }

  getFilePath() {
    return this.getPayload().filePath;
  }

  getConfig() {
    return this.getWritablePayload().config;
  }

  setConfig(config: object) {
    this.getWritablePayload().config = config;
    return this;
  }
}

export class ConfigPostFileParseEvent extends AbstractConfigPostFileParseEvent {
  constructor(fileName: string, filePath: string, config: object) {
    super(CONFIG_EVENTS.POST_FILE_PARSE, { fileName, filePath, config });
  }
}

export class ConfigPostEnvVariableInjectionEvent extends AbstractConfigPostFileParseEvent {
  constructor(fileName: string, filePath: string, config: object) {
    super(CONFIG_EVENTS.POST_ENV_VARIABLES_INJECTION, { fileName, filePath, config });
  }
}

export interface ConfigPostFileLoadEventPayload {
  fileName: string;
  filePath: string;
}

export class ConfigPostFileLoadEvent extends AbstractConfigEvent<ConfigPostFileLoadEventPayload> {
  constructor(fileName: string, filePath: string) {
    super(CONFIG_EVENTS.POST_FILE_LOAD, { fileName, filePath });
  }

  getFileName() {
    return this.getPayload().fileName;
  }

  getFilePath() {
    return this.getPayload().filePath;
  }
}

export interface ConfigPostLoadEventPayload {
  configs: readonly Config[];
}

export class ConfigPostLoadEvent extends AbstractConfigEvent<ConfigPostLoadEventPayload> {
  constructor(configs: readonly Config[]) {
    super(CONFIG_EVENTS.POST_LOAD, { configs });
  }

  getConfigs() {
    return Object.freeze(this.getPayload().configs);
  }
}
