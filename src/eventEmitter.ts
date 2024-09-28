type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, listener: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: EventCallback) {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;

    this.events[event].forEach((listener) => listener(...args));
  }
}
