import { PrimitiveContainer } from 'alliage/core/primitive-container';
import { Arguments } from 'alliage/core/utils/cli';
import { INITIALIZATION_CONTEXT } from 'alliage/core/kernel';

import LifecycleModule from '..';
import { EventManager } from '../event-manager';
import {
  INIT_EVENTS,
  INSTALL_EVENTS,
  BUILD_EVENTS,
  RUN_EVENTS,
  LifeCycleInitEvent,
  LifeCycleInstallEvent,
  LifeCycleBuildEvent,
  LifeCycleRunEvent,
} from '../events';

describe('lifecycle', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('LifecycleModule', () => {
    const pc = new PrimitiveContainer();
    const emitMock = jest.spyOn(EventManager.prototype, 'emit');
    const serviceContainerMock = {
      freeze: jest.fn(),
      addService: jest.fn(),
    };
    pc.set('service_container', serviceContainerMock);
    jest.spyOn(pc, 'get');

    const lifecycleModule = new LifecycleModule();

    describe('#getKernelEventHandlers', () => {
      it('should return the kernel event handlers', () => {
        expect(lifecycleModule.getKernelEventHandlers()).toEqual({
          init: lifecycleModule.onInit,
          install: lifecycleModule.onInstall,
          build: lifecycleModule.onBuild,
          run: lifecycleModule.onRun,
        });
      });
    });

    describe('#onInit', () => {
      it('should add the event manager in the service container', () => {
        lifecycleModule.onInit(Arguments.create(), 'test', pc);

        expect(pc.get).toHaveBeenCalledWith('service_container');
        expect(serviceContainerMock.addService).toHaveBeenCalledWith(
          'event_manager',
          expect.any(EventManager),
        );
      });
    });

    describe('#onInstall', () => {
      it('should trigger all the install lifecycle events', () => {
        const args = Arguments.create();
        lifecycleModule.onInstall(args, 'test');

        expect(emitMock.mock.calls).toEqual([
          [INIT_EVENTS.PRE_INIT, expect.any(LifeCycleInitEvent)],
          [INIT_EVENTS.INIT, expect.any(LifeCycleInitEvent)],
          [INIT_EVENTS.POST_INIT, expect.any(LifeCycleInitEvent)],
          [INSTALL_EVENTS.PRE_INSTALL, expect.any(LifeCycleInstallEvent)],
          [INSTALL_EVENTS.INSTALL, expect.any(LifeCycleInstallEvent)],
          [INSTALL_EVENTS.POST_INSTALL, expect.any(LifeCycleInstallEvent)],
        ]);

        const preInitEvent: LifeCycleInitEvent = emitMock.mock.calls[0][1];
        expect(preInitEvent.getType()).toEqual(INIT_EVENTS.PRE_INIT);
        expect(preInitEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.INSTALL);
        expect(preInitEvent.getArguments()).toBe(args);
        expect(preInitEvent.getEnv()).toEqual('test');
        expect(preInitEvent.getServiceContainer()).toBe(serviceContainerMock);

        const initEvent: LifeCycleInitEvent = emitMock.mock.calls[1][1];
        expect(initEvent.getType()).toEqual(INIT_EVENTS.INIT);
        expect(initEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.INSTALL);
        expect(initEvent.getArguments()).toBe(args);
        expect(initEvent.getEnv()).toEqual('test');
        expect(initEvent.getServiceContainer()).toBe(serviceContainerMock);

        const postInitEvent: LifeCycleInitEvent = emitMock.mock.calls[2][1];
        expect(postInitEvent.getType()).toEqual(INIT_EVENTS.POST_INIT);
        expect(postInitEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.INSTALL);
        expect(postInitEvent.getArguments()).toBe(args);
        expect(postInitEvent.getEnv()).toEqual('test');
        expect(postInitEvent.getServiceContainer()).toBe(serviceContainerMock);

        const preInstallEvent: LifeCycleInstallEvent = emitMock.mock.calls[3][1];
        expect(preInstallEvent.getType()).toEqual(INSTALL_EVENTS.PRE_INSTALL);
        expect(preInstallEvent.getArguments()).toBe(args);
        expect(preInstallEvent.getEnv()).toEqual('test');
        expect(preInstallEvent.getServiceContainer()).toBe(serviceContainerMock);

        const installEvent: LifeCycleInstallEvent = emitMock.mock.calls[4][1];
        expect(installEvent.getType()).toEqual(INSTALL_EVENTS.INSTALL);
        expect(installEvent.getArguments()).toBe(args);
        expect(installEvent.getEnv()).toEqual('test');
        expect(installEvent.getServiceContainer()).toBe(serviceContainerMock);

        const postInstallEvent: LifeCycleInstallEvent = emitMock.mock.calls[5][1];
        expect(postInstallEvent.getType()).toEqual(INSTALL_EVENTS.POST_INSTALL);
        expect(postInstallEvent.getArguments()).toBe(args);
        expect(postInstallEvent.getEnv()).toEqual('test');
        expect(postInstallEvent.getServiceContainer()).toBe(serviceContainerMock);

        // Checks that service container is frozen after init phase
        expect(serviceContainerMock.freeze).toHaveBeenCalledTimes(1);
        expect(serviceContainerMock.freeze.mock.invocationCallOrder[0]).toBeGreaterThan(
          emitMock.mock.invocationCallOrder[2],
        );
        expect(serviceContainerMock.freeze.mock.invocationCallOrder[0]).toBeLessThan(
          emitMock.mock.invocationCallOrder[3],
        );
      });
    });

    describe('#onBuild', () => {
      it('should trigger all the build lifecycle events', () => {
        const args = Arguments.create();
        lifecycleModule.onBuild(args, 'test');

        expect(emitMock.mock.calls).toEqual([
          [INIT_EVENTS.PRE_INIT, expect.any(LifeCycleInitEvent)],
          [INIT_EVENTS.INIT, expect.any(LifeCycleInitEvent)],
          [INIT_EVENTS.POST_INIT, expect.any(LifeCycleInitEvent)],
          [BUILD_EVENTS.PRE_BUILD, expect.any(LifeCycleBuildEvent)],
          [BUILD_EVENTS.BUILD, expect.any(LifeCycleBuildEvent)],
          [BUILD_EVENTS.POST_BUILD, expect.any(LifeCycleBuildEvent)],
        ]);

        const preInitEvent: LifeCycleInitEvent = emitMock.mock.calls[0][1];
        expect(preInitEvent.getType()).toEqual(INIT_EVENTS.PRE_INIT);
        expect(preInitEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.BUILD);
        expect(preInitEvent.getArguments()).toBe(args);
        expect(preInitEvent.getEnv()).toEqual('test');
        expect(preInitEvent.getServiceContainer()).toBe(serviceContainerMock);

        const initEvent: LifeCycleInitEvent = emitMock.mock.calls[1][1];
        expect(initEvent.getType()).toEqual(INIT_EVENTS.INIT);
        expect(initEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.BUILD);
        expect(initEvent.getArguments()).toBe(args);
        expect(initEvent.getEnv()).toEqual('test');
        expect(initEvent.getServiceContainer()).toBe(serviceContainerMock);

        const postInitEvent: LifeCycleInitEvent = emitMock.mock.calls[2][1];
        expect(postInitEvent.getType()).toEqual(INIT_EVENTS.POST_INIT);
        expect(postInitEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.BUILD);
        expect(postInitEvent.getArguments()).toBe(args);
        expect(postInitEvent.getEnv()).toEqual('test');
        expect(postInitEvent.getServiceContainer()).toBe(serviceContainerMock);

        const preBuildEvent: LifeCycleBuildEvent = emitMock.mock.calls[3][1];
        expect(preBuildEvent.getType()).toEqual(BUILD_EVENTS.PRE_BUILD);
        expect(preBuildEvent.getArguments()).toBe(args);
        expect(preBuildEvent.getEnv()).toEqual('test');
        expect(preBuildEvent.getServiceContainer()).toBe(serviceContainerMock);

        const buildEvent: LifeCycleBuildEvent = emitMock.mock.calls[4][1];
        expect(buildEvent.getType()).toEqual(BUILD_EVENTS.BUILD);
        expect(buildEvent.getArguments()).toBe(args);
        expect(buildEvent.getEnv()).toEqual('test');
        expect(buildEvent.getServiceContainer()).toBe(serviceContainerMock);

        const postBuildEvent: LifeCycleBuildEvent = emitMock.mock.calls[5][1];
        expect(postBuildEvent.getType()).toEqual(BUILD_EVENTS.POST_BUILD);
        expect(postBuildEvent.getArguments()).toBe(args);
        expect(postBuildEvent.getEnv()).toEqual('test');
        expect(postBuildEvent.getServiceContainer()).toBe(serviceContainerMock);

        // Checks that service container is frozen after init phase
        expect(serviceContainerMock.freeze).toHaveBeenCalledTimes(1);
        expect(serviceContainerMock.freeze.mock.invocationCallOrder[0]).toBeGreaterThan(
          emitMock.mock.invocationCallOrder[2],
        );
        expect(serviceContainerMock.freeze.mock.invocationCallOrder[0]).toBeLessThan(
          emitMock.mock.invocationCallOrder[3],
        );
      });
    });

    describe('#onRun', () => {
      it('should trigger all the run lifecycle events', () => {
        const args = Arguments.create();
        lifecycleModule.onRun(args, 'test');

        expect(emitMock.mock.calls).toEqual([
          [INIT_EVENTS.PRE_INIT, expect.any(LifeCycleInitEvent)],
          [INIT_EVENTS.INIT, expect.any(LifeCycleInitEvent)],
          [INIT_EVENTS.POST_INIT, expect.any(LifeCycleInitEvent)],
          [RUN_EVENTS.PRE_RUN, expect.any(LifeCycleRunEvent)],
          [RUN_EVENTS.RUN, expect.any(LifeCycleRunEvent)],
          [RUN_EVENTS.POST_RUN, expect.any(LifeCycleRunEvent)],
        ]);

        const preInitEvent: LifeCycleInitEvent = emitMock.mock.calls[0][1];
        expect(preInitEvent.getType()).toEqual(INIT_EVENTS.PRE_INIT);
        expect(preInitEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.RUN);
        expect(preInitEvent.getArguments()).toBe(args);
        expect(preInitEvent.getEnv()).toEqual('test');
        expect(preInitEvent.getServiceContainer()).toBe(serviceContainerMock);

        const initEvent: LifeCycleInitEvent = emitMock.mock.calls[1][1];
        expect(initEvent.getType()).toEqual(INIT_EVENTS.INIT);
        expect(initEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.RUN);
        expect(initEvent.getArguments()).toBe(args);
        expect(initEvent.getEnv()).toEqual('test');
        expect(initEvent.getServiceContainer()).toBe(serviceContainerMock);

        const postInitEvent: LifeCycleInitEvent = emitMock.mock.calls[2][1];
        expect(postInitEvent.getType()).toEqual(INIT_EVENTS.POST_INIT);
        expect(postInitEvent.getContext()).toEqual(INITIALIZATION_CONTEXT.RUN);
        expect(postInitEvent.getArguments()).toBe(args);
        expect(postInitEvent.getEnv()).toEqual('test');
        expect(postInitEvent.getServiceContainer()).toBe(serviceContainerMock);

        const preRunEvent: LifeCycleRunEvent = emitMock.mock.calls[3][1];
        expect(preRunEvent.getType()).toEqual(RUN_EVENTS.PRE_RUN);
        expect(preRunEvent.getArguments()).toBe(args);
        expect(preRunEvent.getEnv()).toEqual('test');
        expect(preRunEvent.getServiceContainer()).toBe(serviceContainerMock);

        const runEvent: LifeCycleRunEvent = emitMock.mock.calls[4][1];
        expect(runEvent.getType()).toEqual(RUN_EVENTS.RUN);
        expect(runEvent.getArguments()).toBe(args);
        expect(runEvent.getEnv()).toEqual('test');
        expect(runEvent.getServiceContainer()).toBe(serviceContainerMock);

        const postRunEvent: LifeCycleRunEvent = emitMock.mock.calls[5][1];
        expect(postRunEvent.getType()).toEqual(RUN_EVENTS.POST_RUN);
        expect(postRunEvent.getArguments()).toBe(args);
        expect(postRunEvent.getEnv()).toEqual('test');
        expect(postRunEvent.getServiceContainer()).toBe(serviceContainerMock);

        // Checks that service container is frozen after init phase
        expect(serviceContainerMock.freeze).toHaveBeenCalledTimes(1);
        expect(serviceContainerMock.freeze.mock.invocationCallOrder[0]).toBeGreaterThan(
          emitMock.mock.invocationCallOrder[2],
        );
        expect(serviceContainerMock.freeze.mock.invocationCallOrder[0]).toBeLessThan(
          emitMock.mock.invocationCallOrder[3],
        );
      });
    });
  });
});
