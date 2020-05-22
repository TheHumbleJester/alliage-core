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

  proceed(manifest: Manifest<FileCopyManifest>, modulePath: string) {
    const filesToCopy = manifest.installationProcedures.copyFiles;
    if (filesToCopy) {
      const copiedFiles: [string, string][] = [];
      const beforeCopyAllEvent = new FileCopyBeforeCopyAllEvent(modulePath, filesToCopy);
      this.eventManager.emit(beforeCopyAllEvent.getType(), beforeCopyAllEvent);
      const computedModulePath = beforeCopyAllEvent.getModulePath();
      beforeCopyAllEvent.getFilesToCopy().forEach(([source, destination]) => {
        glob.sync(`${computedModulePath}/${source}`).forEach((sourceFile) => {
          const absoluteDestination = path.resolve(destination);
          if (!fse.existsSync(absoluteDestination)) {
            const beforeCopyFileEvent = new FileCopyBeforeCopyFileEvent(
              computedModulePath,
              sourceFile,
              absoluteDestination,
            );
            this.eventManager.emit(beforeCopyFileEvent.getType(), beforeCopyFileEvent);
            const computedSourceFile = beforeCopyFileEvent.getSourceFile();
            const computedDestination = beforeCopyFileEvent.getDestination();

            fse.copySync(computedSourceFile, computedDestination);

            console.log(`Copy ${sourceFile} -> ${destination}`);
            copiedFiles.push([computedSourceFile, computedDestination]);

            this.eventManager.emit(
              ...FileCopyAfterCopyFileEvent.getParams(
                computedModulePath,
                computedSourceFile,
                computedDestination,
              ),
            );
          }
        });
      });
      this.eventManager.emit(
        ...FileCopyAfterCopyAllEvent.getParams(computedModulePath, copiedFiles),
      );
    }
  }
}
