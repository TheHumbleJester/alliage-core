import {
  InstallationPhasesInitEvent,
  INSTALLATION_EVENTS,
  InstallationPhaseStartEvent,
  InstallationPhaseEndEvent,
  InstallationSchemaValidationEvent,
} from '../events';
import { MODULE_TYPE, Manifest } from '../schemas/manifest';

describe('module-installer/events', () => {
  describe('InstallationPhasesInitEvent', () => {
    const event = new InstallationPhasesInitEvent(
      ['registration', 'procedures', 'dependencies'],
      ['dependencies', 'procedures', 'registration'],
      'test',
    );

    describe('#getType', () => {
      it('should return a INSTALLATION_EVENTS.PHASES_INIT event type', () => {
        expect(event.getType()).toEqual(INSTALLATION_EVENTS.PHASES_INIT);
      });
    });

    describe('#getAvailablePhases', () => {
      it('should return a frozen list of available phases', () => {
        expect(event.getAvailablePhases()).toEqual(['registration', 'procedures', 'dependencies']);
        expect(() => (event.getAvailablePhases() as string[]).push('test')).toThrow();
      });
    });

    describe('#getDefaultPhases', () => {
      it('should return a frozen list of default phases', () => {
        expect(event.getDefaultPhases()).toEqual(['dependencies', 'procedures', 'registration']);
        expect(() => (event.getDefaultPhases() as string[]).push('test')).toThrow();
      });
    });

    describe('#getEnv', () => {
      it('should return the env', () => {
        expect(event.getEnv()).toEqual('test');
      });
    });

    describe('#setAvailablePhases', () => {
      it('should allow to update the available phases', () => {
        event.setAvailablePhases(['phase1', 'phase2', 'phase3']);

        expect(event.getAvailablePhases()).toEqual(['phase1', 'phase2', 'phase3']);
      });
    });

    describe('#setDefaultPhases', () => {
      it('should allow to update the default phases', () => {
        event.setDefaultPhases(['phase1', 'phase2', 'phase3']);

        expect(event.getDefaultPhases()).toEqual(['phase1', 'phase2', 'phase3']);
      });
    });
  });

  describe('InstallationPhaseStartEvent', () => {
    const event = new InstallationPhaseStartEvent(
      'test-module',
      'path/to/test-module',
      { name: 'test-module', version: '0.0.1' },
      { type: MODULE_TYPE.MODULE, dependencies: ['other-module'], installationProcedures: {} },
      'dependencies',
      ['procedures', 'registration'],
      'test',
    );

    describe('#getType', () => {
      it('should return a INSTALLATION_EVENTS.PHASE_START event type', () => {
        expect(event.getType()).toEqual(INSTALLATION_EVENTS.PHASE_START);
      });
    });

    describe('#getModuleName', () => {
      it('should return the module name', () => {
        expect(event.getModuleName()).toEqual('test-module');
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('path/to/test-module');
      });
    });

    describe('#getPackageInfo', () => {
      it('should return a frozen version of the package info', () => {
        expect(event.getPackageInfo()).toEqual({ name: 'test-module', version: '0.0.1' });
        expect(() => {
          (event.getPackageInfo() as any).name = 'foo';
        }).toThrow();
      });
    });

    describe('#getManifest', () => {
      it('should return a frozen version of the manifest', () => {
        expect(event.getManifest()).toEqual({
          type: MODULE_TYPE.MODULE,
          dependencies: ['other-module'],
          installationProcedures: {},
        });
        expect(() => {
          (event.getManifest() as Manifest).type = MODULE_TYPE.COMPOUND;
        }).toThrow();
      });
    });

    describe('#getCurrentPhase', () => {
      it('should return the current phase', () => {
        expect(event.getCurrentPhase()).toEqual('dependencies');
      });
    });

    describe('#getNextPhases', () => {
      it('should return a frozen version of the next phases', () => {
        expect(event.getNextPhases()).toEqual(['procedures', 'registration']);
        expect(() => (event.getNextPhases() as string[]).push('test')).toThrow();
      });
    });

    describe('#getEnv', () => {
      it('should return the env', () => {
        expect(event.getEnv()).toEqual('test');
      });
    });

    describe('#setManifest', () => {
      it('should allow to update the manifest', () => {
        event.setManifest({
          type: MODULE_TYPE.MODULE,
          dependencies: ['other-module'],
          installationProcedures: {
            copyFiles: [['config.yml', 'config/test.yml']],
          },
        });

        expect(event.getManifest()).toEqual({
          type: MODULE_TYPE.MODULE,
          dependencies: ['other-module'],
          installationProcedures: {
            copyFiles: [['config.yml', 'config/test.yml']],
          },
        });
      });
    });

    describe('#setCurrentPhase', () => {
      it('should allow to update the current phase', () => {
        event.setCurrentPhase('test-current-phase');

        expect(event.getCurrentPhase()).toEqual('test-current-phase');
      });
    });

    describe('#setNextPhases', () => {
      it('should allow to update the next phases', () => {
        event.setNextPhases(['phase1', 'phase2', 'phase3']);

        expect(event.getNextPhases()).toEqual(['phase1', 'phase2', 'phase3']);
      });
    });
  });

  describe('InstallationPhaseEndEvent', () => {
    const event = new InstallationPhaseEndEvent(
      'test-module',
      'path/to/test-module',
      { name: 'test-module', version: '0.0.1' },
      { type: MODULE_TYPE.MODULE, dependencies: ['other-module'], installationProcedures: {} },
      'dependencies',
      ['procedures', 'registration'],
      'test',
    );

    describe('#getType', () => {
      it('should return a INSTALLATION_EVENTS.PHASE_END event type', () => {
        expect(event.getType()).toEqual(INSTALLATION_EVENTS.PHASE_END);
      });
    });

    describe('#getModuleName', () => {
      it('should return the module name', () => {
        expect(event.getModuleName()).toEqual('test-module');
      });
    });

    describe('#getModulePath', () => {
      it('should return the module path', () => {
        expect(event.getModulePath()).toEqual('path/to/test-module');
      });
    });

    describe('#getPackageInfo', () => {
      it('should return a frozen version of the package info', () => {
        expect(event.getPackageInfo()).toEqual({ name: 'test-module', version: '0.0.1' });
        expect(() => {
          (event.getPackageInfo() as any).name = 'foo';
        }).toThrow();
      });
    });

    describe('#getManifest', () => {
      it('should return a frozen version of the manifest', () => {
        expect(event.getManifest()).toEqual({
          type: MODULE_TYPE.MODULE,
          dependencies: ['other-module'],
          installationProcedures: {},
        });
        expect(() => {
          (event.getManifest() as Manifest).type = MODULE_TYPE.COMPOUND;
        }).toThrow();
      });
    });

    describe('#getCurrentPhase', () => {
      it('should return the current phase', () => {
        expect(event.getCurrentPhase()).toEqual('dependencies');
      });
    });

    describe('#getNextPhases', () => {
      it('should return a frozen version of the next phases', () => {
        expect(event.getNextPhases()).toEqual(['procedures', 'registration']);
        expect(() => (event.getNextPhases() as string[]).push('test')).toThrow();
      });
    });

    describe('#getEnv', () => {
      it('should return the env', () => {
        expect(event.getEnv()).toEqual('test');
      });
    });

    describe('#getParams', () => {
      it('should return the parameters ready to be sent to the emit method of the EventManager', () => {
        const [eventType, eventInstance] = InstallationPhaseEndEvent.getParams(
          'test-module',
          'path/to/test-module',
          { name: 'test-module', version: '0.0.1' },
          { type: MODULE_TYPE.MODULE, dependencies: ['other-module'], installationProcedures: {} },
          'dependencies',
          ['procedures', 'registration'],
          'test',
        ) as [INSTALLATION_EVENTS, InstallationPhaseEndEvent];

        expect(eventType).toEqual(INSTALLATION_EVENTS.PHASE_END);
        expect(eventInstance).toBeInstanceOf(InstallationPhaseEndEvent);
        expect(eventInstance.getModuleName()).toEqual('test-module');
        expect(eventInstance.getModulePath()).toEqual('path/to/test-module');
        expect(eventInstance.getPackageInfo()).toEqual({ name: 'test-module', version: '0.0.1' });
        expect(eventInstance.getManifest()).toEqual({
          type: MODULE_TYPE.MODULE,
          dependencies: ['other-module'],
          installationProcedures: {},
        });
        expect(eventInstance.getCurrentPhase()).toEqual('dependencies');
        expect(eventInstance.getNextPhases()).toEqual(['procedures', 'registration']);
        expect(eventInstance.getEnv()).toEqual('test');
      });
    });
  });

  describe('InstallationSchemaValidationEvent', () => {
    const event = new InstallationSchemaValidationEvent(
      'test-module',
      'dependencies',
      ['procedures', 'registration'],
      {
        type: MODULE_TYPE.MODULE,
        dependencies: ['other-module'],
        installationProcedures: {},
      },
      { procedureSchema1: { type: 'object' } },
      'test',
    );

    describe('#getType', () => {
      it('should return a INSTALLATION_EVENTS.SCHEMA_VALIDATION event type', () => {
        expect(event.getType()).toEqual(INSTALLATION_EVENTS.SCHEMA_VALIDATION);
      });
    });

    describe('#getModuleName', () => {
      it('should return the module name', () => {
        expect(event.getModuleName()).toEqual('test-module');
      });
    });

    describe('#getCurrentPhase', () => {
      it('should return the current phase', () => {
        expect(event.getCurrentPhase()).toEqual('dependencies');
      });
    });

    describe('#getNextPhases', () => {
      it('should return a frozen version of the next phases', () => {
        expect(event.getNextPhases()).toEqual(['procedures', 'registration']);
        expect(() => (event.getNextPhases() as string[]).push('test')).toThrow();
      });
    });

    describe('#getManifest', () => {
      it('should return a frozen version of the manifest', () => {
        expect(event.getManifest()).toEqual({
          type: MODULE_TYPE.MODULE,
          dependencies: ['other-module'],
          installationProcedures: {},
        });
        expect(() => {
          (event.getManifest() as Manifest).type = MODULE_TYPE.COMPOUND;
        }).toThrow();
      });
    });

    describe('#getExtendedPropertiesSchemas', () => {
      it('should return a frozen version of the extended properties schemas', () => {
        expect(event.getExtendedPropertiesSchemas()).toEqual({
          procedureSchema1: { type: 'object' },
        });
        expect(() => {
          (event.getExtendedPropertiesSchemas() as any).procedureSchema1 = { type: 'array' };
        }).toThrow();
      });
    });

    describe('#getEnv', () => {
      it('should return the env', () => {
        expect(event.getEnv()).toEqual('test');
      });
    });

    describe('#setExtendedPropertiesSchemas', () => {
      it('should allow to update the extended properties schemas', () => {
        event.setExtendedPropertiesSchema({
          procedureSchema2: { type: 'array' },
        });

        expect(event.getExtendedPropertiesSchemas()).toEqual({
          procedureSchema2: { type: 'array' },
        });
      });
    });
  });
});
