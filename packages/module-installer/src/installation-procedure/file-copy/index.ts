import path from 'path';
import glob from 'glob';
import fse from 'fs-extra';

import { EventManager } from 'alliage-lifecycle/event-manager';

import { AbstractInstallationProcedure } from '..';
import { Manifest } from '../../schemas/manifest';
import {
  FileCopyBeforeCopyAllEvent,
  FileCopyAfterCopyAllEvent,
  FileCopyBeforeCopyFileEvent,
  FileCopyAfterCopyFileEvent,
} from './events';

export const PROCEDURE_NAME = '@module-installer/INSTALLATION_PROCEDURE/FILE_COPY';

export type FileCopyManifest = {
  copyFiles?: [string, string][];
};

export class FileCopyInstallationProcedure extends AbstractInstallationProcedure {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    super();
    this.eventManager = eventManager;
  }

  getName() {
    return PROCEDURE_NAME;
  }

  getSchema() {
    return {
      copyFiles: {
        type: 'array',
        items: {
          type: 'array',
          items: [
            {
              type: 'string',
              description: 'Source',
            },
            {
              type: 'string',
              description: 'Destination',
            },
          ],
        },
      },
    };
  }

  async proceed(manifest: Manifest<FileCopyManifest>, modulePath: string) {
    const filesToCopy = manifest.installationProcedures.copyFiles;
    if (filesToCopy) {
      const copiedFiles: [string, string][] = [];
      const beforeCopyAllEvent = new FileCopyBeforeCopyAllEvent(modulePath, filesToCopy);
      await this.eventManager.emit(beforeCopyAllEvent.getType(), beforeCopyAllEvent);
      const computedModulePath = beforeCopyAllEvent.getModulePath();
      await Promise.all(
        beforeCopyAllEvent.getFilesToCopy().map(async ([source, destination]) => {
          const files: string[] = await new Promise((resolve, reject) => {
            glob(`${computedModulePath}/${source}`, (err, matches) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(matches);
            });
          });
          await Promise.all(
            files.map(async (sourceFile) => {
              const absoluteDestination = path.resolve(destination);
              if (!(await fse.pathExists(absoluteDestination))) {
                const beforeCopyFileEvent = new FileCopyBeforeCopyFileEvent(
                  computedModulePath,
                  sourceFile,
                  absoluteDestination,
                );
                await this.eventManager.emit(beforeCopyFileEvent.getType(), beforeCopyFileEvent);
                const computedSourceFile = beforeCopyFileEvent.getSourceFile();
                const computedDestination = beforeCopyFileEvent.getDestination();

                await fse.copy(computedSourceFile, computedDestination);

                process.stdout.write(`Copy ${sourceFile} -> ${destination}\n`);
                copiedFiles.push([computedSourceFile, computedDestination]);

                await this.eventManager.emit(
                  ...FileCopyAfterCopyFileEvent.getParams(
                    computedModulePath,
                    computedSourceFile,
                    computedDestination,
                  ),
                );
              }
            }),
          );
        }),
      );
      await this.eventManager.emit(
        ...FileCopyAfterCopyAllEvent.getParams(computedModulePath, copiedFiles),
      );
    }
  }
}
