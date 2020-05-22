import { AbstractWritableEvent } from 'alliage-lifecycle/events';

export enum FILE_COPY_EVENTS {
  BEFORE_COPY_ALL = '@module-installer/INSTALLATION_PROCEDURE/FILE_COPY/EVENTS/BEFORE_COPY_ALL',
  AFTER_COPY_ALL = '@module-installer/INSTALLATION_PROCEDURE/FILE_COPY/EVENTS/AFTER_COPY_ALL',

  BEFORE_COPY_FILE = '@module-installer/INSTALLATION_PROCEDURE/FILE_COPY/EVENTS/BEFORE_COPY_FILE',
  AFTER_COPY_FILE = '@module-installer/INSTALLATION_PROCEDURE/FILE_COPY/EVENTS/AFTER_COPY_FILE',
}

export class AbstractFileCopyEvent<P extends object> extends AbstractWritableEvent<
  FILE_COPY_EVENTS,
  P
> {}

export interface FileCopyBeforeCopyAllEventPayload {
  modulePath: string;
  filesToCopy: [string, string][];
}

export class FileCopyBeforeCopyAllEvent extends AbstractFileCopyEvent<
  FileCopyBeforeCopyAllEventPayload
> {
  constructor(modulePath: string, filesToCopy: [string, string][]) {
    super(FILE_COPY_EVENTS.BEFORE_COPY_ALL, { modulePath, filesToCopy });
  }

  getModulePath() {
    return this.getWritablePayload().modulePath;
  }

  getFilesToCopy() {
    return Object.freeze(this.getWritablePayload().filesToCopy);
  }

  setModulePath(modulePath: string) {
    this.getWritablePayload().modulePath = modulePath;
    return this;
  }

  setFilesToCopy(filesToCopy: [string, string][]) {
    this.getWritablePayload().filesToCopy = filesToCopy;
    return this;
  }
}

export interface FileCopyAfterCopyAllEventPayload {
  modulePath: string;
  copiedFiles: [string, string][];
}

export class FileCopyAfterCopyAllEvent extends AbstractFileCopyEvent<
  FileCopyAfterCopyAllEventPayload
> {
  constructor(modulePath: string, copiedFiles: [string, string][]) {
    super(FILE_COPY_EVENTS.AFTER_COPY_ALL, { modulePath, copiedFiles });
  }

  getModulePath() {
    return this.getPayload().modulePath;
  }

  getCopiedFiles() {
    return Object.freeze(this.getPayload().copiedFiles);
  }

  static getParams(modulePath: string, filesToCopy: string[][]) {
    return super.getParams(modulePath, filesToCopy);
  }
}

export interface FileCopyBeforeCopyFileEventPayload {
  modulePath: string;
  sourceFile: string;
  destination: string;
}

export class FileCopyBeforeCopyFileEvent extends AbstractFileCopyEvent<
  FileCopyBeforeCopyFileEventPayload
> {
  constructor(modulePath: string, sourceFile: string, destination: string) {
    super(FILE_COPY_EVENTS.BEFORE_COPY_FILE, { modulePath, sourceFile, destination });
  }

  getModulePath() {
    return this.getWritablePayload().modulePath;
  }

  getSourceFile() {
    return this.getWritablePayload().sourceFile;
  }

  getDestination() {
    return this.getWritablePayload().destination;
  }

  setSourceFile(sourceFile: string) {
    this.getWritablePayload().sourceFile = sourceFile;
  }

  setDestination(destination: string) {
    this.getWritablePayload().destination = destination;
    return this;
  }
}

export interface FileCopyAfterCopyFileEventPayload {
  modulePath: string;
  sourceFile: string;
  destination: string;
}

export class FileCopyAfterCopyFileEvent extends AbstractFileCopyEvent<
  FileCopyAfterCopyFileEventPayload
> {
  constructor(modulePath: string, sourceFile: string, destination: string) {
    super(FILE_COPY_EVENTS.AFTER_COPY_FILE, { modulePath, sourceFile, destination });
  }

  getModulePath() {
    return this.getWritablePayload().modulePath;
  }

  getSourceFile() {
    return this.getWritablePayload().sourceFile;
  }

  getDestination() {
    return this.getWritablePayload().destination;
  }

  static getParams(modulePath: string, sourceFile: string, destination: string) {
    return super.getParams(modulePath, sourceFile, destination);
  }
}
