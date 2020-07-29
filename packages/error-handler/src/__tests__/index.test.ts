import ErrorHandlerModule from '..';

describe('error-handler', () => {
  describe('ErrorHandlerModule', () => {
    const module = new ErrorHandlerModule();

    describe('#getKernelEventHandlers', () => {
      it('should listen to the init event', () => {
        expect(module.getKernelEventHandlers()).toEqual({
          init: module.handleInit,
        });
      });
    });

    describe('#handleInit', () => {
      class DummyError extends Error {
        public additionalProperty1 = 42;

        public additionalProperty2 = { foo: 'bar' };
      }

      let consoleErrorMock: jest.SpyInstance;

      beforeAll(async () => {
        await module.handleInit();
      });

      beforeEach(() => {
        consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleErrorMock.mockRestore();
      });

      it('should display an error gracefully in case of unhandled exception', () => {
        process.emit('uncaughtException', new DummyError('A dummy error occured'));

        expect(consoleErrorMock).toBeCalledTimes(7);
        expect(consoleErrorMock).toHaveBeenNthCalledWith(1, '[37m[41m[4m[1mDummyError[22m[24m: A dummy error occured[49m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(2, '[34m[4madditionalProperty1:[24m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(3, 42, '\n');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(4, '[34m[4madditionalProperty2:[24m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          5,
          {
            foo: 'bar',
          },
          '\n',
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(6, '[34m[4mstack trace:[24m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(7, expect.anything());
      });

      it('should display an error gracefully in case of unhandled rejection', () => {
        process.emit(
          'unhandledRejection',
          new DummyError('A dummy error occured'),
          Promise.resolve(),
        );

        expect(consoleErrorMock).toBeCalledTimes(7);
        expect(consoleErrorMock).toHaveBeenNthCalledWith(1, '[37m[41m[4m[1mDummyError[22m[24m: A dummy error occured[49m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(2, '[34m[4madditionalProperty1:[24m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(3, 42, '\n');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(4, '[34m[4madditionalProperty2:[24m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(
          5,
          {
            foo: 'bar',
          },
          '\n',
        );
        expect(consoleErrorMock).toHaveBeenNthCalledWith(6, '[34m[4mstack trace:[24m[39m');
        expect(consoleErrorMock).toHaveBeenNthCalledWith(7, expect.anything());
      });

      it('should not display anything if the error is not an instance of "Error"', () => {
        process.emit('uncaughtException', ('error' as unknown) as Error);

        expect(consoleErrorMock).not.toHaveBeenCalled();
      });

      it('should display a generic name if the Error has no constructor', () => {
        const UnknownError = function(this: any, message: string) {
          return Error.call(this, message);
        };

        const error = new (UnknownError as any)('this error has no name');
        error.constructor = undefined;

        process.emit('uncaughtException', error);

        expect(consoleErrorMock).toHaveBeenNthCalledWith(1, '[37m[41m[4m[1mError[22m[24m: this error has no name[49m[39m');
      });

      it('should display a generic name if the Error has no name', () => {
        const UnknownError = function(this: any, message: string) {
          return Error.call(this, message);
        };

        const error = new (UnknownError as any)('this error has no name');

        process.emit('uncaughtException', error);

        expect(consoleErrorMock).toHaveBeenNthCalledWith(1, '[37m[41m[4m[1mError[22m[24m: this error has no name[49m[39m');
      });

      it('should display a generic message if the Error has no message', () => {
        process.emit('uncaughtException', new Error(''));

        expect(consoleErrorMock).toHaveBeenNthCalledWith(1, '[37m[41m[4m[1mError[22m[24m: An unknown error occured[49m[39m');
      });
    });
  });
});
