import { Arguments } from 'alliage/core/utils/cli';
import { PrimitiveContainer } from 'alliage/core/primitive-container';

import DependencyInjetionModule from '..';
import { ServiceContainer } from '../service-container';

jest.mock('../service-container');

describe('dependency-injection', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DependencyInjectionModule', () => {
    const ServiceContainerMock = <jest.Mock>ServiceContainer;
    const addServiceMock = jest.fn();
    const setParameterMock = jest.fn();
    let serviceContainerMockInstance: any;
    ServiceContainerMock.mockImplementation(function ctorMock(this: any) {
      serviceContainerMockInstance = this;
      this.addService = addServiceMock;
      this.setParameter = setParameterMock;
      return this;
    });
    const dim = new DependencyInjetionModule();
    it('should listen to the init kernel event', () => {
      expect(dim.getKernelEventHandlers()).toEqual({
        init: dim.onInit,
      });
    });

    describe('#onInit', () => {
      it('should add service container in the primitive container', () => {
        const pcMock = {
          set: jest.fn(),
        };
        dim.onInit(Arguments.create(), 'test', (pcMock as unknown) as PrimitiveContainer);

        expect(ServiceContainerMock).toHaveBeenCalled();
        expect(addServiceMock).toHaveBeenCalledWith(
          'service_container',
          serviceContainerMockInstance,
        );
        expect(setParameterMock).toHaveBeenCalledWith('environment', 'test');
        expect(pcMock.set).toHaveBeenCalledWith('service_container', serviceContainerMockInstance);
      });
    });
  });
});
