/**
 * Small typed registry helper for save/load codecs.
 *
 * This is a runtime module (registries are populated at startup),
 * but it is type-safe and does not use `any`.
 */

export class Registry<K extends string, V> {
  private readonly map = new Map<K, V>();

  register(kind: K, value: V): void {
    this.map.set(kind, value);
  }

  get(kind: K): V | undefined {
    return this.map.get(kind);
  }

  has(kind: K): boolean {
    return this.map.has(kind);
  }

  /** Returns all registered kinds in insertion order. */
  kinds(): K[] {
    return Array.from(this.map.keys());
  }
}


