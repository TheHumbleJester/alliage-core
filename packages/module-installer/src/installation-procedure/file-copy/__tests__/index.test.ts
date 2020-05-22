import glob from 'glob';
import fse from 'fs-extra';
import path from 'path';

import { EventManager } from 'alliage-lifecycle/event-manager';

import { FileCopyInstallationProcedure, FileCopyManifest } from '..';
import { MODULE_TYPE, Manifest } from '../../../schemas/manifest';
import {
  FILE_COPY_EVENTS,
  FileCopyBeforeCopyAllEvent,
  FileCopyBeforeCopyFileEvent,
  FileCopyAfterCopyFileEvent,
  FileCopyAfterCopyAllEvent,
} from '../events';

describe('module-installer/installation-procedures/file-copy', () => {
  describe('FileCopyInstallationProcedure', () => {
    const eventManager = new EventManager();
    const procedure = new FileCopyInstallationProcedure(eventManager);

    describe('#getName', () => {
      it('should return the name of the procedure', () => {
        expect(procedure.getName()).toEqual('@module-installer/INSTALLATION_PROCEDURE/FILE_COPY');
      });
    });

    describe('#getSchema', () => {
      it("should return the JSON Schema of it's configuration in the manifest", () => {
        expect(procedure.getSchema()).toEqual({
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
        });
      });
    });

    describe('#proceed', () => {
      let globSpy: jest.SpyInstance;
      let copySpy: jest.SpyInstance;
      let existsSpy: jest.SpyInstance;

      const manifest: Manifest<FileCopyManifest> = {
        type: MODULE_TYPE.MODULE,
        dependencies: [],
        installationProcedures: {
          copyFiles: [
            ['path/to/file1*', 'destination1'],
            ['path/to/file2*', 'destination2'],
          ],
        },
      };

      const beforeCopyAllEventHandler = jest.fn();
      const afterCopyAllEventHandler = jest.fn();
      const beforeCopyFileEventHandler = jest.fn();
      const afterCopyFileEventHandler = jest.fn();

      eventManager.on(FILE_COPY_EVENTS.BEFORE_COPY_ALL, beforeCopyAllEventHandler);
      eventManager.on(FILE_COPY_EVENTS.AFTER_COPY_ALL, afterCopyAllEventHandler);
      eventManager.on(FILE_COPY_EVENTS.BEFORE_COPY_FILE, beforeCopyFileEventHandler);
      eventManager.on(FILE_COPY_EVENTS.AFTER_COPY_FILE, afterCopyFileEventHandler);

      beforeEach(() => {
        globSpy = jest
          .spyOn(glob, 'sync')
          .mockReturnValueOnce(['/path/to/module/path/to/file11', '/path/to/module/path/to/file12'])
          .mockReturnValueOnce([
            '/path/to/module/path/to/file21',
            '/path/to/module/path/to/file22',
          ]);
        copySpy = jest.spyOn(fse, 'copySync').mockImplementation(() => {});
        existsSpy = jest.spyOn(fse, 'existsSync').mockReturnValue(false);
      });

      afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
      });

      it('should proceed to file copy according to the manifest configuration and trigger all the events', () => {
        // Test events
        beforeCopyAllEventHandler.mockImplementationOnce((event: FileCopyBeforeCopyAllEvent) => {
          expect(event.getModulePath()).toEqual('/path/to/module');
          expect(event.getFilesToCopy()).toEqual([
            ['path/to/file1*', 'destination1'],
            ['path/to/file2*', 'destination2'],
          ]);

          event.setFilesToCopy([
            ['transformed/path/to/file1*', 'transformed/destination1'],
            ['transformed/path/to/file2*', 'transformed/destination2'],
          ]);
          event.setModulePath('/transformed/path/to/module');
        });
        beforeCopyFileEventHandler
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file11');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination1'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file11');
            event.setDestination('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file12');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination1'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file12');
            event.setDestination('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file21');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination2'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file21');
            event.setDestination('/re/transformed/destination2');
          })
          .mockImplementationOnce((event: FileCopyBeforeCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual('/path/to/module/path/to/file22');
            expect(event.getDestination()).toEqual(path.resolve('transformed/destination2'));

            event.setSourceFile('/re/transformed/path/to/module/transformed/path/to/file22');
            event.setDestination('/re/transformed/destination2');
          });
        afterCopyFileEventHandler
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file11',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file12',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination1');
          })
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file21',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination2');
          })
          .mockImplementationOnce((event: FileCopyAfterCopyFileEvent) => {
            expect(event.getModulePath()).toEqual('/transformed/path/to/module');
            expect(event.getSourceFile()).toEqual(
              '/re/transformed/path/to/module/transformed/path/to/file22',
            );
            expect(event.getDestination()).toEqual('/re/transformed/destination2');
          });
        afterCopyAllEventHandler.mockImplementationOnce((event: FileCopyAfterCopyAllEvent) => {
          expect(event.getModulePath()).toEqual('/transformed/path/to/module');
          expect(event.getCopiedFiles()).toEqual([
            [
              '/re/transformed/path/to/module/transformed/path/to/file11',
              '/re/transformed/destination1',
            ],
            [
              '/re/transformed/path/to/module/transformed/path/to/file12',
              '/re/transformed/destination1',
            ],
            [
              '/re/transformed/path/to/module/transformed/path/to/file21',
              '/re/transformed/destination2',
            ],
            [
              '/re/transformed/path/to/module/transformed/path/to/file22',
              '/re/transformed/destination2',
            ],
          ]);
        });

        // Runs procedure
        procedure.proceed(manifest, '/path/to/module');

        expect(globSpy).toHaveBeenNthCalledWith(
          1,
          '/transformed/path/to/module/transformed/path/to/file1*',
        );
        expect(globSpy).toHaveBeenNthCalledWith(
          2,
          '/transformed/path/to/module/transformed/path/to/file2*',
        );

        expect(copySpy).toHaveBeenNthCalledWith(
          1,
          '/re/transformed/path/to/module/transformed/path/to/file11',
          '/re/transformed/destination1',
        );
        expect(copySpy).toHaveBeenNthCalledWith(
          2,
          '/re/transformed/path/to/module/transformed/path/to/file12',
          '/re/transformed/destination1',
        );
        expect(copySpy).toHaveBeenNthCalledWith(
          3,
          '/re/transformed/path/to/module/transformed/path/to/file21',
          '/re/transformed/destination2',
        );
        expect(copySpy).toHaveBeenNthCalledWith(
          4,
          '/re/transformed/path/to/module/transformed/path/to/file22',
          '/re/transformed/destination2',
        );

        expect(beforeCopyAllEventHandler).toHaveBeenCalledTimes(1);
        expect(beforeCopyFileEventHandler).toHaveBeenCalledTimes(4);
        expect(afterCopyFileEventHandler).toHaveBeenCalledTimes(4);
        expect(afterCopyAllEventHandler).toHaveBeenCalledTimes(1);
      });

      it("should not do anything if there's no configuration for the procedure in the manifest", () => {
        procedure.proceed({ ...manifest, installationProcedures: {} }, '/path/to/module');

        expect(globSpy).not.toHaveBeenCalled();
        expect(existsSpy).not.toHaveBeenCalled();
        expect(copySpy).not.toHaveBeenCalled();
        expect(beforeCopyAllEventHandler).not.toHaveBeenCalled();
        expect(beforeCopyFileEventHandler).not.toHaveBeenCalled();
        expect(afterCopyFileEventHandler).not.toHaveBeenCalled();
        expect(afterCopyAllEventHandler).not.toHaveBeenCalled();
      });

      it('should not do the copy and trigger the related events if the destination already exits', () => {
        existsSpy
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);

        procedure.proceed(manifest, '/path/to/module');

        expect(globSpy).toHaveBeenCalledTimes(2);
        expect(globSpy).toHaveBeenNthCalledWith(1, '/path/to/module/path/to/file1*');
        expect(globSpy).toHaveBeenNthCalledWith(2, '/path/to/module/path/to/file2*');

        expect(existsSpy).toHaveBeenCalledTimes(4);

        expect(copySpy).toHaveBeenCalledTimes(2);
        expect(copySpy).toHaveBeenNthCalledWith(
          1,
          '/path/to/module/path/to/file12',
          path.resolve('destination1'),
        );
        expect(copySpy).toHaveBeenNthCalledWith(
          2,
          '/path/to/module/path/to/file22',
          path.resolve('destination2'),
        );

        expect(beforeCopyAllEventHandler).toHaveBeenCalledTimes(1);
        expect(beforeCopyFileEventHandler).toHaveBeenCalledTimes(2);
        expect(afterCopyFileEventHandler).toHaveBeenCalledTimes(2);
        expect(afterCopyAllEventHandler).toHaveBeenCalledTimes(1);
      });
    });
  });
});
