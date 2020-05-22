import path from 'path';
import fs from 'fs';

import { Arguments } from 'alliage/core/utils/cli';
import { InstallScript } from 'alliage/scripts/install';
import { ServiceContainer } from 'alliage-di/service-container';
import { service } from 'alliage-di/dependencies';
import { INSTALL_EVENTS, LifeCycleInstallEvent } from 'alliage-lifecycle/events';
import { EventManager } from 'alliage-lifecycle/event-manager';

import ModuleInstallerModule from '..';
import { PROCEDURE_NAME, FileCopyInstallationProcedure } from '../installation-procedure/file-copy';
import {
  InstallationPhasesInitEvent,
  INSTALLATION_EVENTS,
  InstallationPhaseStartEvent,
  InstallationSchemaValidationEvent,
  InstallationPhaseEndEvent,
} from '../events';
import { MODULE_TYPE } from '../schemas/manifest';
import { AbstractInstallationProcedure } from '../installation-procedure';

jest.mock('alliage/scripts/install', () => ({
  InstallScript: class InstallScriptMock {
    execute() {}
  },
}));

describe('module-installer', () => {
  describe('ModuleInstallerModule', () => {
    const module = new ModuleInstallerModule();

    describe('#getEventHandlers', () => {
      it('should listen to the install event', () => {
        expect(module.getEventHandlers()).toEqual({
          [INSTALL_EVENTS.INSTALL]: module.handleInstall,
        });
      });
    });

    describe('#registerService', () => {
      it('should register the file copy installation procedure', () => {
        const sc = new ServiceContainer();
        jest.spyOn(sc, 'registerService');

        module.registerServices(sc);

        expect(sc.registerService).toHaveBeenCalledTimes(1);
        expect(sc.registerService).toHaveBeenCalledWith(
          PROCEDURE_NAME,
          FileCopyInstallationProcedure,
          [service('event_manager')],
        );
      });
    });

    describe('#handleInstall', () => {
      jest.doMock(
        path.resolve('./alliage-modules.json'),
        () => ({
          'already-installed-module': {
            module: 'already-installed-module',
            deps: [],
            hash: '25e64aa754c310d45c1e084d574c1bb0',
          },
        }),
        { virtual: true },
      );

      const eventManager = new EventManager();
      const serviceContainer = new ServiceContainer();

      serviceContainer.addService('event_manager', eventManager);

      const phasesInitHandler = jest.fn();
      const phaseStartHandler = jest.fn();
      const schemaValidationHandler = jest.fn();
      const phaseEndHandler = jest.fn();
      let installScriptExecuteMock: jest.SpyInstance;

      eventManager.on(INSTALLATION_EVENTS.PHASES_INIT, phasesInitHandler);
      eventManager.on(INSTALLATION_EVENTS.PHASE_START, phaseStartHandler);
      eventManager.on(INSTALLATION_EVENTS.SCHEMA_VALIDATION, schemaValidationHandler);
      eventManager.on(INSTALLATION_EVENTS.PHASE_END, phaseEndHandler);

      beforeEach(() => {
        installScriptExecuteMock = jest.spyOn(InstallScript.prototype, 'execute');
      });

      afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
        jest.resetModules();
      });

      it('should start with the dependencies phases if no phases are specified', async () => {
        jest.doMock(
          '/path/to/test-module/package.json',
          () => ({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
              installationProcedures: {
                foo: 'bar',
              },
            },
          }),
          { virtual: true },
        );

        phasesInitHandler.mockImplementationOnce((event: InstallationPhasesInitEvent) => {
          expect(event.getEnv()).toEqual('test');
          expect(event.getDefaultPhases()).toEqual(['dependencies', 'procedures', 'registration']);
          expect(event.getAvailablePhases()).toEqual([
            'dependencies',
            'procedures',
            'registration',
          ]);

          event.setDefaultPhases([
            'dependencies',
            'procedures',
            'registration',
            'test-phase1',
            'test-phase2',
          ]);
          event.setAvailablePhases([
            'dependencies',
            'procedures',
            'registration',
            'test-phase2',
            'test-phase1',
          ]);
        });

        phaseStartHandler.mockImplementationOnce((event: InstallationPhaseStartEvent) => {
          expect(event.getModuleName()).toEqual('test-module');
          expect(event.getModulePath()).toEqual('/path/to/test-module');
          expect(event.getPackageInfo()).toEqual({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
              installationProcedures: {
                foo: 'bar',
              },
            },
          });
          expect(event.getManifest()).toEqual({
            type: 'module',
            dependencies: ['module1', 'module2'],
            installationProcedures: {
              foo: 'bar',
            },
          });
          expect(event.getCurrentPhase()).toEqual('dependencies');
          expect(event.getNextPhases()).toEqual([
            'procedures',
            'registration',
            'test-phase1',
            'test-phase2',
          ]);
          expect(event.getEnv()).toEqual('test');

          event.setManifest({
            type: MODULE_TYPE.MODULE,
            dependencies: ['module1', 'module2'],
            installationProcedures: {
              foo: 'bar',
              test: 42,
            },
          });
          event.setNextPhases(['procedures', 'registration']);
        });

        schemaValidationHandler.mockImplementationOnce(
          (event: InstallationSchemaValidationEvent) => {
            expect(event.getModuleName()).toEqual('test-module');
            expect(event.getManifest()).toEqual({
              type: MODULE_TYPE.MODULE,
              dependencies: ['module1', 'module2'],
              installationProcedures: {
                foo: 'bar',
                test: 42,
              },
            });
            expect(event.getExtendedPropertiesSchemas()).toEqual({});
            expect(event.getCurrentPhase()).toEqual('dependencies');
            expect(event.getNextPhases()).toEqual(['procedures', 'registration']);
            expect(event.getEnv()).toEqual('test');

            event.setExtendedPropertiesSchema({
              foo: {
                type: 'string',
              },
              test: {
                type: 'number',
              },
            });
          },
        );

        phaseEndHandler.mockImplementationOnce((event: InstallationPhaseEndEvent) => {
          expect(event.getModuleName()).toEqual('test-module');
          expect(event.getModulePath()).toEqual('/path/to/test-module');
          expect(event.getPackageInfo()).toEqual({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
              installationProcedures: {
                foo: 'bar',
              },
            },
          });
          expect(event.getManifest()).toEqual({
            type: 'module',
            dependencies: ['module1', 'module2'],
            installationProcedures: {
              foo: 'bar',
              test: 42,
            },
          });
          expect(event.getCurrentPhase()).toEqual('dependencies');
          expect(event.getNextPhases()).toEqual(['procedures', 'registration']);
          expect(event.getEnv()).toEqual('test');
        });

        installScriptExecuteMock
          .mockImplementationOnce((args: Arguments, env) => {
            expect(args.getRemainingArgs()).toEqual(['module1']);
            expect(env).toEqual('test');
          })
          .mockImplementationOnce((args: Arguments, env) => {
            expect(args.getRemainingArgs()).toEqual(['module2']);
            expect(env).toEqual('test');
          })
          .mockImplementationOnce((args: Arguments, env) => {
            expect(args.getRemainingArgs()).toEqual(['test-module', 'procedures,registration']);
            expect(env).toEqual('test');
          });

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: 'test-module' }),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).toHaveBeenCalledTimes(1);
        expect(schemaValidationHandler).toHaveBeenCalledTimes(1);
        expect(phaseEndHandler).toHaveBeenCalledTimes(1);
        expect(installScriptExecuteMock).toHaveBeenCalledTimes(3);
      });

      it('should then run the procedures phase', async () => {
        jest.doMock(
          '/path/to/test-module/package.json',
          () => ({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
              installationProcedures: {
                dummy: true,
              },
            },
          }),
          { virtual: true },
        );

        class DummyInstallationProcedure extends AbstractInstallationProcedure {
          getName() {
            return 'dummy_procedure';
          }

          getSchema() {
            return {
              dummy: {
                type: 'boolean',
              },
            };
          }

          proceed() {}
        }
        const dummyProcedureSpy = jest.spyOn(DummyInstallationProcedure.prototype, 'proceed');

        const scWithProcedure = new ServiceContainer();
        scWithProcedure.registerService('dummy_procedure', DummyInstallationProcedure);
        scWithProcedure.addService('event_manager', eventManager);

        phaseStartHandler.mockImplementationOnce((event: InstallationPhaseStartEvent) => {
          expect(event.getCurrentPhase()).toEqual('procedures');
          expect(event.getNextPhases()).toEqual(['registration']);
        });

        schemaValidationHandler.mockImplementationOnce(
          (event: InstallationSchemaValidationEvent) => {
            expect(event.getCurrentPhase()).toEqual('procedures');
            expect(event.getNextPhases()).toEqual(['registration']);
          },
        );

        phaseEndHandler.mockImplementationOnce((event: InstallationPhaseEndEvent) => {
          expect(event.getCurrentPhase()).toEqual('procedures');
          expect(event.getNextPhases()).toEqual(['registration']);
        });

        installScriptExecuteMock.mockImplementationOnce((args: Arguments, env) => {
          expect(args.getRemainingArgs()).toEqual(['test-module', 'registration']);
          expect(env).toEqual('test');
        });

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer: scWithProcedure,
          args: Arguments.create({ moduleName: 'test-module' }, ['procedures,registration']),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(dummyProcedureSpy).toHaveBeenCalledTimes(1);
        expect(dummyProcedureSpy).toHaveBeenCalledWith(
          {
            type: 'module',
            dependencies: ['module1', 'module2'],
            installationProcedures: {
              dummy: true,
            },
          },
          '/path/to/test-module',
        );

        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).toHaveBeenCalledTimes(1);
        expect(schemaValidationHandler).toHaveBeenCalledTimes(1);
        expect(phaseEndHandler).toHaveBeenCalledTimes(1);
        expect(installScriptExecuteMock).toHaveBeenCalledTimes(1);
      });

      it("should not run any procedure if there's no installation procedures in the manifest", async () => {
        jest.doMock(
          '/path/to/test-module/package.json',
          () => ({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
            },
          }),
          { virtual: true },
        );

        class DummyInstallationProcedure extends AbstractInstallationProcedure {
          getName() {
            return 'dummy_procedure';
          }

          getSchema() {
            return {
              dummy: {
                type: 'boolean',
              },
            };
          }

          proceed() {}
        }
        const dummyProcedureSpy = jest.spyOn(DummyInstallationProcedure.prototype, 'proceed');

        const scWithProcedure = new ServiceContainer();
        scWithProcedure.registerService('dummy_procedure', DummyInstallationProcedure);
        scWithProcedure.addService('event_manager', eventManager);

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer: scWithProcedure,
          args: Arguments.create({ moduleName: 'test-module' }, ['procedures,registration']),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(dummyProcedureSpy).not.toHaveBeenCalled();
        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).toHaveBeenCalledTimes(1);
        expect(schemaValidationHandler).toHaveBeenCalledTimes(1);
        expect(phaseEndHandler).toHaveBeenCalledTimes(1);
        expect(installScriptExecuteMock).toHaveBeenCalledTimes(1);
      });

      it('should finally run the registration phase', async () => {
        const writeSpy = jest.spyOn(fs, 'writeFileSync').mockReturnValue();
        jest.doMock(
          '/path/to/test-module/package.json',
          () => ({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
            },
          }),
          { virtual: true },
        );

        phaseStartHandler.mockImplementationOnce((event: InstallationPhaseStartEvent) => {
          expect(event.getCurrentPhase()).toEqual('registration');
          expect(event.getNextPhases()).toEqual([]);
        });

        schemaValidationHandler.mockImplementationOnce(
          (event: InstallationSchemaValidationEvent) => {
            expect(event.getCurrentPhase()).toEqual('registration');
            expect(event.getNextPhases()).toEqual([]);
          },
        );

        phaseEndHandler.mockImplementationOnce((event: InstallationPhaseEndEvent) => {
          expect(event.getCurrentPhase()).toEqual('registration');
          expect(event.getNextPhases()).toEqual([]);
        });

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: 'test-module' }, ['registration']),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).toHaveBeenCalledTimes(1);
        expect(schemaValidationHandler).toHaveBeenCalledTimes(1);
        expect(phaseEndHandler).toHaveBeenCalledTimes(1);
        expect(installScriptExecuteMock).not.toHaveBeenCalled();

        expect(writeSpy).toHaveBeenCalledWith(
          './alliage-modules.json',
          JSON.stringify(
            {
              'already-installed-module': {
                module: 'already-installed-module',
                deps: [],
                hash: '25e64aa754c310d45c1e084d574c1bb0',
              },
              'test-module': {
                module: 'test-module',
                deps: ['module1', 'module2'],
                hash: '25e64aa754c310d45c1e084d574c1bb0',
              },
            },
            null,
            2,
          ),
        );
      });

      it('should not register compounds', async () => {
        const writeSpy = jest.spyOn(fs, 'writeFileSync').mockReturnValue();
        jest.doMock(
          '/path/to/test-module/package.json',
          () => ({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'compound',
              dependencies: ['module1', 'module2'],
            },
          }),
          { virtual: true },
        );

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: 'test-module' }, ['registration']),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).toHaveBeenCalledTimes(1);
        expect(schemaValidationHandler).toHaveBeenCalledTimes(1);
        expect(phaseEndHandler).toHaveBeenCalledTimes(1);
        expect(installScriptExecuteMock).not.toHaveBeenCalled();
        expect(writeSpy).not.toHaveBeenCalled();
      });

      it('should not run anything if the module does not have an alliage manifest', async () => {
        jest.doMock(
          '/path/to/test-module/package.json',
          () => ({
            name: 'test-module',
            version: '0.0.1',
          }),
          { virtual: true },
        );

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: 'test-module' }),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).not.toHaveBeenCalled();
        expect(schemaValidationHandler).not.toHaveBeenCalled();
        expect(phaseEndHandler).not.toHaveBeenCalled();
        expect(installScriptExecuteMock).not.toHaveBeenCalled();
      });

      it('should throw an error if the specified phase does not exist', async () => {
        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: 'test-module' }, ['unknown-phase']),
          env: 'test',
        });

        let error: Error | null = null;
        try {
          await module.handleInstall(installEvent);
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error?.message).toEqual(
          'Unknown installation phase: "unknown-phase". Available phases: dependencies, procedures, registration',
        );

        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).not.toHaveBeenCalled();
        expect(schemaValidationHandler).not.toHaveBeenCalled();
        expect(phaseEndHandler).not.toHaveBeenCalled();
        expect(installScriptExecuteMock).not.toHaveBeenCalled();
      });

      it('should enable to override the current phase through INSTALLATION_EVENTS.PHASE_START the event', async () => {
        jest.doMock(
          '/path/to/test-module/package.json',
          () => ({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
            },
          }),
          { virtual: true },
        );

        phaseStartHandler.mockImplementationOnce((event: InstallationPhaseStartEvent) => {
          expect(event.getCurrentPhase()).toEqual('registration');

          event.setCurrentPhase('dependencies');
        });

        phaseEndHandler.mockImplementationOnce((event: InstallationPhaseEndEvent) => {
          expect(event.getCurrentPhase()).toEqual('dependencies');
        });
        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: 'test-module' }, ['registration']),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(phaseStartHandler).toHaveBeenCalledTimes(1);
        expect(phaseEndHandler).toHaveBeenCalledTimes(1);
        expect(installScriptExecuteMock).toHaveBeenCalledTimes(2);
      });

      it('should be able to handle local modules', async () => {
        jest.doMock(
          path.resolve('./test-module/package.json'),
          () => ({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
            },
          }),
          { virtual: true },
        );

        phaseStartHandler.mockImplementationOnce((event: InstallationPhaseStartEvent) => {
          expect(event.getModuleName()).toEqual('./test-module');
          expect(event.getModulePath()).toEqual(path.resolve('./test-module'));
          expect(event.getPackageInfo()).toEqual({
            name: 'test-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: ['module1', 'module2'],
            },
          });
        });

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: './test-module' }, ['dependencies']),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(phaseStartHandler).toHaveBeenCalledTimes(1);
      });

      it('should not install already installed modules', async () => {
        jest.doMock(
          path.resolve('/path/to/already-installed-module/package.json'),
          () => ({
            name: 'already-installed-module',
            version: '0.0.1',
            alliageManifest: {
              type: 'module',
              dependencies: [],
            },
          }),
          { virtual: true },
        );

        const installEvent = new LifeCycleInstallEvent(INSTALL_EVENTS.INSTALL, {
          serviceContainer,
          args: Arguments.create({ moduleName: 'already-installed-module' }),
          env: 'test',
        });

        await module.handleInstall(installEvent);

        expect(phasesInitHandler).toHaveBeenCalledTimes(1);
        expect(phaseStartHandler).not.toHaveBeenCalled();
        expect(schemaValidationHandler).not.toHaveBeenCalled();
        expect(phaseEndHandler).not.toHaveBeenCalled();
      });
    });
  });
});
