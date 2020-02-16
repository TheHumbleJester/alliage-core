import {
  FILE_COPY_EVENTS,
  FileCopyBeforeCopyAllEvent,
  FileCopyAfterCopyAllEvent,
  FileCopyBeforeCopyFileEvent,
  FileCopyAfterCopyFileEvent,
} from '../events';

describe('module-installer/installation-procedures/file-copy/events', () => {
  describe('FileCopyBeforeCopyAllEvent', () => {
    const event = new FileCopyBeforeCopyAllEvent('/path/to/test-module', [
      ['config.yml', 'config/test-module.yml'],
    ]);

    describe('#getType', () => {
      it('should return the FILE_COPY_EVENTS.BEFORE_COPY_ALL event type', () => {
        expect(event.getType()).toEqual(FILE_COPY_EVENTS.BEFORE_COPY_ALL);
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('/path/to/test-module');
      });
    });

    describe('#getFilesToCopy', () => {
      it('should return frozen version of the files to copy', () => {
        expect(event.getFilesToCopy()).toEqual([['config.yml', 'config/test-module.yml']]);
        expect(() => {
          (event.getFilesToCopy() as [string, string][]).push([
            'other-file.txt',
            'path/to/other-file.txt',
          ]);
        }).toThrow();
      });
    });

    describe('#setModulePath', () => {
      it('should allow to update the module path', () => {
        event.setModulePath('/new/path/to/test-module');

        expect(event.getModulePath()).toEqual('/new/path/to/test-module');
      });
    });

    describe('#setFilesToCopy', () => {
      it('should allow to update the files to copy', () => {
        event.setFilesToCopy([['file.txt', 'other-file.txt']]);

        expect(event.getFilesToCopy()).toEqual([['file.txt', 'other-file.txt']]);
      });
    });
  });

  describe('FileCopyAfterCopyAllEvent', () => {
    const event = new FileCopyAfterCopyAllEvent('/path/to/test-module', [
      ['config.yml', 'config/test-module.yml'],
    ]);

    describe('#getType', () => {
      it('should return the FILE_COPY_EVENTS.AFTER_COPY_ALL event type', () => {
        expect(event.getType()).toEqual(FILE_COPY_EVENTS.AFTER_COPY_ALL);
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('/path/to/test-module');
      });
    });

    describe('#getCopiedFiles', () => {
      it('should return frozen version of the files to copy', () => {
        expect(event.getCopiedFiles()).toEqual([['config.yml', 'config/test-module.yml']]);
        expect(() => {
          (event.getCopiedFiles() as [string, string][]).push([
            'other-file.txt',
            'path/to/other-file.txt',
          ]);
        }).toThrow();
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [
          eventType,
          eventInstance,
        ] = FileCopyAfterCopyAllEvent.getParams('/path/to/test-module', [
          ['config.yml', 'config/test-module.yml'],
        ]) as [FILE_COPY_EVENTS, FileCopyAfterCopyAllEvent];

        expect(eventType).toEqual(FILE_COPY_EVENTS.AFTER_COPY_ALL);
        expect(eventInstance).toBeInstanceOf(FileCopyAfterCopyAllEvent);
        expect(event.getModulePath()).toEqual('/path/to/test-module');
        expect(event.getCopiedFiles()).toEqual([['config.yml', 'config/test-module.yml']]);
      });
    });
  });

  describe('FileCopyBeforeCopyFileEvent', () => {
    const event = new FileCopyBeforeCopyFileEvent(
      '/path/to/test-module',
      'path/to/source-file',
      'path/to/destination',
    );

    describe('#getType', () => {
      it('should return the FILE_COPY_EVENTS.BEFORE_COPY_FILE event type', () => {
        expect(event.getType()).toEqual(FILE_COPY_EVENTS.BEFORE_COPY_FILE);
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('/path/to/test-module');
      });
    });

    describe('#getSourceFile', () => {
      it('should return the source file', () => {
        expect(event.getSourceFile()).toEqual('path/to/source-file');
      });
    });

    describe('#getDestination', () => {
      it('should return the destination', () => {
        expect(event.getDestination()).toEqual('path/to/destination');
      });
    });

    describe('#setSourceFile', () => {
      it('should allow to update the source', () => {
        event.setSourceFile('/new/path/to/source-file');

        expect(event.getSourceFile()).toEqual('/new/path/to/source-file');
      });
    });

    describe('#setDestination', () => {
      it('should allow to update the destination', () => {
        event.setDestination('/new/path/to/destination');

        expect(event.getDestination()).toEqual('/new/path/to/destination');
      });
    });
  });

  describe('FileCopyAfterCopyFileEvent', () => {
    const event = new FileCopyAfterCopyFileEvent(
      '/path/to/test-module',
      'path/to/source-file',
      'path/to/destination',
    );

    describe('#getType', () => {
      it('should return the FILE_COPY_EVENTS.AFTER_COPY_FILE event type', () => {
        expect(event.getType()).toEqual(FILE_COPY_EVENTS.AFTER_COPY_FILE);
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('/path/to/test-module');
      });
    });

    describe('#getSourceFile', () => {
      it('should return the source file', () => {
        expect(event.getSourceFile()).toEqual('path/to/source-file');
      });
    });

    describe('#getDestination', () => {
      it('should return the destination', () => {
        expect(event.getDestination()).toEqual('path/to/destination');
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [eventType, eventInstance] = FileCopyAfterCopyFileEvent.getParams(
          '/path/to/test-module',
          'path/to/source-file',
          'path/to/destination',
        ) as [FILE_COPY_EVENTS, FileCopyAfterCopyFileEvent];

        expect(eventType).toEqual(FILE_COPY_EVENTS.AFTER_COPY_FILE);
        expect(eventInstance.getModulePath()).toEqual('/path/to/test-module');
        expect(eventInstance.getSourceFile()).toEqual('path/to/source-file');
        expect(eventInstance.getDestination()).toEqual('path/to/destination');
      });
    });
  });
});
