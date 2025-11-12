export class OneTimeEventTracker {
  private done: Set<string> = new Set();

  has(key: string): boolean {
    return this.done.has(key);
  }

  mark(key: string): void {
    this.done.add(key);
  }

  clear(key: string): void {
    this.done.delete(key);
  }

  ensure(key: string, fn: () => void): void {
    if (this.done.has(key)) return;
    try {
      fn();
    } finally {
      this.done.add(key);
    }
  }
}
