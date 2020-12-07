import { EventManager } from '../event-manager';

const createDummyListener = (name: string, delay: number) => async (list: string[]) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  list.push(name);
};

describe('lifecycle/event-manager', () => {
  describe('EventManager', () => {
    describe('#on / #emit', () => {
      const eventManager = new EventManager();

      const listener1 = createDummyListener('listener1', 50);
      const listener2 = createDummyListener('listener2', 40);
      const listener3 = createDummyListener('listener3', 30);
      const listener4 = createDummyListener('listener4', 20);
      const listener5 = createDummyListener('listener5', 10);

      eventManager.on('event1', listener1);
      const unsub3 = eventManager.on('event1', listener3);
      eventManager.on('event1', listener5);

      eventManager.on('event2', listener2);
      eventManager.on('event2', listener4);

      it('should call the function attached to the event in the right order', async () => {
        const list1: string[] = [];
        await eventManager.emit('event1', list1);

        expect(list1).toEqual(['listener1', 'listener3', 'listener5']);

        const list2: string[] = [];
        await eventManager.emit('event2', list2);

        expect(list2).toEqual(['listener2', 'listener4']);
      });

      it('should allow to unsubscribe an event', async () => {
        unsub3();

        const list1: string[] = [];
        await eventManager.emit('event1', list1);

        expect(list1).toEqual(['listener1', 'listener5']);
      });
    });
  });
});
