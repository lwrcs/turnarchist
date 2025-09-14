/**
 * Global, monotonic ID generator.
 * ------------------------------------------------------------------
 * • Uses a 64-bit counter encoded in base-36 for compact, url-safe IDs.
 * • Optional prefix lets you create type hints: "IT-abc" for items,
 *   "EN-def" for entities, etc.  All prefixes still share one namespace.
 * • Keeps an in-memory registry so any accidental duplication throws
 *   immediately—very useful during integration and debugging.
 * ------------------------------------------------------------------
 */
export class IdGenerator {
  /** Next numeric value to assign (BigInt for 64-bit range). */
  private static _next = BigInt(1);

  /** Registry of every ID produced or reserved this session. */
  private static _registry = new Set<string>();

  /**
   * Generate a fresh globally-unique ID.
   * @param prefix Optional type prefix, e.g. "IT" for Item.
   */
  public static generate(prefix: string = ""): string {
    let id: string;

    // Loop is almost always single-pass; guarantees collision-free result.
    do {
      const raw = (this._next++).toString(36); // base-36 for brevity
      id = prefix ? `${prefix}-${raw}` : raw;
    } while (this._registry.has(id));

    this._registry.add(id);
    return id;
  }

  /**
   * Reserve an existing ID during deserialization.
   * Throws if that ID is already in use for this session.
   */
  public static reserve(existingId: string): void {
    if (this._registry.has(existingId)) {
      throw new Error(`Duplicate ID detected while reserving: ${existingId}`);
    }
    this._registry.add(existingId);
  }

  /** Quick check: has the ID been claimed already? */
  public static isReserved(id: string): boolean {
    return this._registry.has(id);
  }

  /**
   * Reset generator and registry—intended only for automated tests.
   */
  public static resetForTest(): void {
    this._next = BigInt(1);
    this._registry.clear();
  }
}
