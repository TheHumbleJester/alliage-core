import { EventEmitter } from 'events';

import { EventManager } from '../event-manager';

describe('lifecycle/event-manager', () => {
  describe('EventManager', () => {
    it('should be an instance of EventEmitter', () => {
      const em = new EventManager();

      expect(em).toBeInstanceOf(EventEmitter);
    });
  });
});
