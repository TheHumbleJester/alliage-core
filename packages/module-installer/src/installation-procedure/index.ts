import { Manifest } from '../schemas/manifest';

export abstract class AbstractInstallationProcedure {
  abstract getName(): string;

  getSchema(): object {
    return {};
  }

  abstract proceed(manifest: Manifest, modulePath: string): void;
}
