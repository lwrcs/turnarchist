type EventCallback<T = any> = (data: T) => void;

export class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  on<T>(event: string, listener: EventCallback<T>): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off<T>(event: string, listener: EventCallback<T>): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }

  emit<T>(event: string, data: T): void {
    if (!this.events[event]) return;
    this.events[event].forEach((listener) => listener(data));
  }

  // New method to remove all listeners for an event
  removeAllListeners(event: string): void {
    delete this.events[event];
  }
}
