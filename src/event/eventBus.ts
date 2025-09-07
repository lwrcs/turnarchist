import { EventEmitter } from "./eventEmitter";

class EventBus {
  private static instance: EventBus;
  private eventEmitter: EventEmitter;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public emit<T>(event: string, data: T): void {
    this.eventEmitter.emit(event, data);
  }

  public on<T>(event: string, callback: (data: T) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public off<T>(event: string, callback: (data: T) => void): void {
    this.eventEmitter.off(event, callback);
  }
}

export const globalEventBus = EventBus.getInstance();
