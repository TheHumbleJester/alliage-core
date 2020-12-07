type EventListener = (...args: any[]) => void | Promise<void>;

export class EventManager {
  private events: Record<string, EventListener[] | undefined> = {};

  on(type: string, listener: EventListener) {
    const listeners = this.events[type] ?? [];
    this.events[type] = listeners;
    const index = listeners.push(listener) - 1;
    return () => {
      listeners.splice(index, 1);
    };
  }

  async emit(type: string, ...args: any[]) {
    const listeners = this.events[type];
    if (!listeners) {
      return;
    }
    for (const listener of listeners) {
      // eslint-disable-next-line no-await-in-loop
      await listener(...args);
    }
  }
}
