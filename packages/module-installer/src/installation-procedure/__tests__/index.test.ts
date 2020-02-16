import { AbstractInstallationProcedure } from '..';

describe('module-installer/installation-procedure', () => {
  describe('AbstractInstallationProcedure', () => {
    class InstallationProcedure extends AbstractInstallationProcedure {
      getName() {
        return 'test';
      }

      proceed() {}
    }

    const procedure = new InstallationProcedure();
    describe('#getSchema', () => {
      it('should return an empty object when not overriden', () => {
        expect(procedure.getSchema()).toEqual({});
      });
    });
  });
});
