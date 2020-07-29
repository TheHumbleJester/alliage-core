import { AbstractEventsListener } from '..';

describe('events-listener-loader/events-listener', () => {
  describe('AbstractEventListenerLoader', () => {
    class EventsListener extends AbstractEventsListener {}

    const eventsListener = new EventsListener();

    describe('#getEventHandlers', () => {
      it('should not listen to any events by default', () => {
        expect(eventsListener.getEventHandlers()).toEqual({});
      });
    });
  });
});
