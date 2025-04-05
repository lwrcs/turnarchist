type ShadeCanvas = HTMLCanvasElement;

interface ShadeEntry {
  canvas: ShadeCanvas;
  lastUsed: number; // Updated every frame/tick
}

export class ShadeCanvasCache {
  private cache: Map<string, ShadeEntry> = new Map();
  private maxSize: number;
  private frameCounter: number = 0;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): ShadeCanvas | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.lastUsed = this.frameCounter;
      return entry.canvas;
    }
    return undefined;
  }

  set(key: string, canvas: ShadeCanvas): void {
    this.cache.set(key, {
      canvas,
      lastUsed: this.frameCounter,
    });
    this.evictIfNeeded();
  }

  markFrame(): void {
    this.frameCounter++;
  }

  clearAll(): void {
    this.cache.clear();
  }

  evictIfNeeded(): void {
    if (this.cache.size <= this.maxSize) return;

    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed); // Least recently used first

    const numToRemove = this.cache.size - this.maxSize;
    for (let i = 0; i < numToRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  evictUnusedOlderThan(maxAge: number): void {
    const cutoff = this.frameCounter - maxAge;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUsed < cutoff) {
        this.cache.delete(key);
      }
    }
  }
}
