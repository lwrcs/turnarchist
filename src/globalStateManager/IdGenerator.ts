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
export const ID_GENERATOR_SNAPSHOT_FORMAT = "id-generator-state-v1";
/** Immutable, JSON-safe allocator memento. Reservation order has no semantics. */
export interface IdGeneratorSnapshot {
  format: typeof ID_GENERATOR_SNAPSHOT_FORMAT;
  next: string;
  reserved: readonly string[];
}
export class IdGeneratorSnapshotError extends Error {
  readonly name = "IdGeneratorSnapshotError";
  readonly code = "PLANNING_ID_STATE_INVALID";
  constructor(readonly path: string, message: string) { super(`${"PLANNING_ID_STATE_INVALID"} at ${path}: ${message}`); }
}
/** Validate completely and detach before any allocator mutation. Never converts via Number. */
export function readIdGeneratorSnapshot(value: unknown, path = "/allocator"): IdGeneratorSnapshot {
  const invalid = (suffix: string, message: string): never => { throw new IdGeneratorSnapshotError(path + suffix, message); };
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid("", "Expected allocator record");
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join(",") !== "format,next,reserved") invalid("", "Unexpected allocator fields");
  for (const key of keys) if (!("value" in Object.getOwnPropertyDescriptor(record, key)!)) invalid("/" + key, "Accessors are not data");
  if (record.format !== ID_GENERATOR_SNAPSHOT_FORMAT) invalid("/format", "Unsupported allocator version");
  if (typeof record.next !== "string" || !/^[1-9][0-9]{0,79}$/.test(record.next)) invalid("/next", "Expected a positive canonical decimal integer");
  const input = record.reserved;
  if (!Array.isArray(input) || input.length > 200000) invalid("/reserved", "Expected at most 200000 reservations");
  const list = input as unknown[], reserved: string[] = [];
  if (Object.keys(list).length !== list.length) invalid("/reserved", "Sparse or named array data is unsupported");
  let previous: string | null = null;
  for (let i = 0; i < list.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(list, String(i));
    if (!descriptor || !("value" in descriptor)) invalid("/reserved/" + i, "Missing or accessor reservation");
    const id: unknown = descriptor!.value;
    if (typeof id !== "string" || !id.length || id.length > 512) invalid("/reserved/" + i, "Expected a nonempty ID, at most 512 characters");
    const text = id as string;
    if (previous !== null && previous >= text) invalid("/reserved/" + i, "Reservations must be sorted and unique");
    previous = text; reserved.push(text);
  }
  return Object.freeze({ format: ID_GENERATOR_SNAPSHOT_FORMAT, next: record.next as string, reserved: Object.freeze(reserved) });
}

export class IdGenerator {
  /** Next numeric value to assign (BigInt for 64-bit range). */
  private static _next = BigInt(1);

  /** Registry of every ID produced or reserved this session. */
  private static _registry = new Set<string>();

  /** One immutable memento per allocator revision. Never caches gameplay/fingerprint state. */
  private static _simulationSnapshot: IdGeneratorSnapshot | null = null;

  /**
   * Generate a fresh globally-unique ID.
   * @param prefix Optional type prefix, e.g. "IT" for Item.
   */
  public static generate(prefix: string = ""): string {
    let id: string;
    this._simulationSnapshot = null;

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
    this._simulationSnapshot = null;
    this._registry.add(existingId);
  }

  /** Quick check: has the ID been claimed already? */
  public static isReserved(id: string): boolean {
    return this._registry.has(id);
  }

  /** Read-only: captures both the counter and collision reservations, not just the next ID. */
  public static captureSimulationState(): IdGeneratorSnapshot {
    if (!this._simulationSnapshot) {
      this._simulationSnapshot = readIdGeneratorSnapshot({ format: ID_GENERATOR_SNAPSHOT_FORMAT,
        next: this._next.toString(10), reserved: Array.from(this._registry).sort() });
    }
    return this._simulationSnapshot;
  }

  /**
   * Caller must be replacing a discarded world in an isolated simulation realm.
   * Never invoke this to renumber an existing world or on the visible live agent.
   * All validation and allocation finish before either static field changes.
   */
  public static restoreSimulationState(value: unknown): void {
    const snapshot = readIdGeneratorSnapshot(value);
    const next = BigInt(snapshot.next), registry = new Set(snapshot.reserved);
    this._next = next;
    this._registry = registry;
    this._simulationSnapshot = snapshot;
  }

  /**
   * Reset generator and registry—intended only for automated tests.
   */
  public static resetForTest(): void {
    this._next = BigInt(1);
    this._registry.clear();
    this._simulationSnapshot = null;
  }

  /**
   * Clear only the in-memory registry, without touching the monotonic counter.
   *
   * This is useful when we intentionally discard an entire world (e.g. loading a save)
   * and need to re-reserve IDs from the save without colliding with IDs that were
   * reserved by the previously-running world in this same session.
   */
  public static clearRegistryForLoad(): void {
    this._registry.clear();
    this._simulationSnapshot = null;
  }
}
