import { readIdGeneratorSnapshot, IdGeneratorSnapshot } from "../globalStateManager/IdGenerator";
/** Privileged planning DTO support. Never changes gameplay or the Save V2 codec. */
export const PLANNING_FORMAT = "turnarchist-planning-snapshot-v3";
export const PLANNING_CODEC = "tagged-planning-data-v1";
export const HEALTH_METRIC = "gross-health-decrease-v1";
export const PLANNING_CAPABILITIES = Object.freeze({
  snapshotSchemaVersion: 3, format: PLANNING_FORMAT, codec: PLANNING_CODEC, healthMetric: HEALTH_METRIC,
  reconstruction: "diagnostic-allocator-replay-v1",
  warningContinuation: "horizon-warning-graph-v1",
});
const MAX_TEXT = 24_000_000, MAX_INNER = 20_000_000, MAX_DEPTH = 128, MAX_NODES = 250_000;
type Wire = null | boolean | number | string | Wire[];
export const PLANNING_RECONSTRUCTION_FORMAT = "diagnostic-allocator-replay-v1";
export interface PlanningReconstruction {
  format: typeof PLANNING_RECONSTRUCTION_FORMAT;
  origin: IdGeneratorSnapshot;
  frontier: IdGeneratorSnapshot;
}
export interface PlanningEnvelope {
  format: typeof PLANNING_FORMAT;
  inner: { schemaVersion: number; source: string; createdAtStep: number; serialized: string };
  runtime: {
    seed: number; scenario: string; steps: number; maxSteps: number;
    vision: unknown; recentTransitions: unknown[];
    warningContinuation?: unknown; // Optional nested codec; existing v3 format is unchanged.
    interactionContinuation?: unknown;
    pathContinuation?: unknown;
    emptyLootContinuation?: unknown;
    attachedLootContinuation?: unknown;
    resourceContinuation?: unknown;
    allocatorContinuation?: unknown;
    contactContinuation?: unknown;
    spawnerContinuation?: unknown;
  };
  context: unknown;
  fingerprint: unknown;
  reconstruction: PlanningReconstruction | null;
}
export class PlanningDataError extends Error {
  readonly name = "PlanningDataError";
  constructor(readonly code: string, readonly path: string, message: string,
    readonly details: Record<string, unknown> = {}) {
    super(`${code} at ${path || "/"}: ${message}`);
  }
}
const own = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);
const pointer = (base: string, key: string | number): string => base + "/" + String(key).replace(/~/g, "~0").replace(/\//g, "~1");
function fail(path: string, message: string): never { throw new PlanningDataError("PLANNING_DATA_UNSUPPORTED", path, message); }
function plain(value: object): boolean {
  const proto = Object.getPrototypeOf(value);
  // Accept plain records from other same-origin realms, without invoking getters.
  return proto === null || (Object.getPrototypeOf(proto) === null &&
    Object.getOwnPropertyDescriptor(proto, "constructor")?.value?.name === "Object");
}
/**
 * Value-preserving diagnostic encoding, NOT JSON.stringify normalization.
 * Every container is tagged, so a user value shaped like a tag cannot collide.
 * Distinguishes missing keys, undefined, holes, null, +/-Infinity, NaN and -0.
 * Shared references are duplicated by value; object identity is not the DTO contract.
 * Rejects cycles, functions, symbols, accessors and non-plain objects without calling toJSON.
 */
export function planningEncode(value: unknown, rootPath = ""): Wire {
  const active = new Set<object>(); let nodes = 0;
  function visit(item: unknown, path: string, depth: number): Wire {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail(path, "Diagnostic data exceeds structural limits");
    if (item === null || typeof item === "string" || typeof item === "boolean") return item as Wire;
    if (item === undefined) return ["undefined"];
    if (typeof item === "number") {
      if (Number.isNaN(item)) return ["number", "NaN"];
      if (item === Infinity) return ["number", "+Infinity"];
      if (item === -Infinity) return ["number", "-Infinity"];
      if (Object.is(item, -0)) return ["number", "-0"];
      return item;
    }
    if (typeof item !== "object") fail(path, `Unsupported ${typeof item}`);
    const object = item as object;
    if (active.has(object)) fail(path, "Cyclic diagnostic data");
    if (Object.getOwnPropertySymbols(object).length) fail(path, "Symbol-keyed diagnostic data");
    if (!Array.isArray(object) && !plain(object)) fail(path, "Expected a plain data record");
    active.add(object);
    try {
      if (Array.isArray(object)) {
        if (object.length > MAX_NODES) fail(path, "Array exceeds structural limits");
        for (const key of Object.keys(object)) {
          if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= object.length) fail(pointer(path, key), "Named array properties are unsupported");
        }
        const values: Wire[] = [];
        for (let i = 0; i < object.length; i++) {
          if (!own(object, i)) { values.push(["hole"]); if (++nodes > MAX_NODES) fail(path, "Too many array holes"); continue; }
          const descriptor = Object.getOwnPropertyDescriptor(object, String(i))!;
          if (!("value" in descriptor)) fail(pointer(path, i), "Array accessor is unsupported");
          values.push(visit(descriptor.value, pointer(path, i), depth + 1));
        }
        return ["array", values];
      }
      const entries: Wire[] = [];
      for (const key of Object.keys(object).sort()) {
        const descriptor = Object.getOwnPropertyDescriptor(object, key)!;
        if (!("value" in descriptor)) fail(pointer(path, key), "Record accessor is unsupported");
        entries.push([key, visit(descriptor.value, pointer(path, key), depth + 1)]);
      }
      return ["object", entries];
    } finally { active.delete(object); }
  }
  return visit(value, rootPath, 0);
}
export function planningDecode(encoded: unknown): unknown {
  let nodes = 0;
  function visit(item: unknown, path: string, depth: number): unknown {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) fail(path, "Encoded data exceeds structural limits");
    if (item === null || typeof item === "string" || typeof item === "boolean") return item;
    if (typeof item === "number" && Number.isFinite(item) && !Object.is(item, -0)) return item;
    if (!Array.isArray(item)) fail(path, "Invalid encoded value");
    if (item.length === 1 && item[0] === "undefined") return undefined;
    if (item.length === 2 && item[0] === "number") {
      switch (item[1]) { case "NaN": return NaN; case "+Infinity": return Infinity; case "-Infinity": return -Infinity; case "-0": return -0; }
      fail(path, "Invalid numeric tag");
    }
    if (item.length !== 2 || !Array.isArray(item[1])) fail(path, "Invalid container tag");
    const payload = item[1];
    if (payload.length > MAX_NODES) fail(path, "Container exceeds structural limits");
    if (item[0] === "array") {
      const result = new Array(payload.length);
      for (let i = 0; i < payload.length; i++) {
        if (Array.isArray(payload[i]) && payload[i].length === 1 && payload[i][0] === "hole") {
          if (++nodes > MAX_NODES) fail(path, "Too many array holes");
        } else result[i] = visit(payload[i], pointer(path, i), depth + 1);
      }
      return result;
    }
    if (item[0] === "object") {
      const result: Record<string, unknown> = {}; let previous: string | null = null;
      for (const entry of payload) {
        if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" ||
          (previous !== null && previous >= entry[0])) fail(path, "Object keys must be unique and sorted");
        previous = entry[0];
        // defineProperty avoids the __proto__ setter, preserving it as ordinary data.
        Object.defineProperty(result, entry[0], { enumerable: true, configurable: true, writable: true,
          value: visit(entry[1], pointer(path, entry[0]), depth + 1) });
      }
      return result;
    }
    fail(path, "Unknown container tag");
  }
  return visit(encoded, "", 0);
}
export function planningJson(value: unknown): string { return JSON.stringify(planningEncode(value)); }
function describe(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "number") return Object.is(value, -0) ? "-0" : String(value);
  const text = planningJson(value); return text.length <= 180 ? text : text.slice(0, 177) + "...";
}
/** A bounded, field-addressable mismatch, not a dump of the whole privileged snapshot. */
export function assertPlanningEqual(expected: unknown, actual: unknown, code: string, rootPath: string): void {
  if (planningJson(expected) === planningJson(actual)) return;
  function mismatch(path: string, a: unknown, b: unknown, message = "Values differ"): never {
    throw new PlanningDataError(code, path, message, { expected: describe(a), actual: describe(b) });
  }
  function compare(a: unknown, b: unknown, path: string): void {
    if (Object.is(a, b)) return;
    if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) !== Array.isArray(b)) mismatch(path, a, b);
    const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
    if (Array.isArray(a) && Array.isArray(b) && a.length !== b.length) mismatch(pointer(path, "length"), a.length, b.length);
    for (const key of Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort()) {
      if (own(left, key) !== own(right, key)) mismatch(pointer(path, key), left[key], right[key], own(left, key) ? "Key missing after restore" : "Unexpected key after restore");
      compare(left[key], right[key], pointer(path, key));
    }
  }
  compare(expected, actual, rootPath);
  mismatch(rootPath, expected, actual);
}
function validateEnvelope(value: unknown): asserts value is PlanningEnvelope {
  const envelope = value as PlanningEnvelope, runtime = envelope?.runtime, inner = envelope?.inner;
  if (envelope?.format !== PLANNING_FORMAT || !runtime || !inner || inner.schemaVersion !== 1 ||
    inner.source !== "privileged-agent-snapshot" || typeof inner.serialized !== "string" ||
    !inner.serialized.length || inner.serialized.length > MAX_INNER ||
    !Number.isInteger(runtime.seed) || runtime.seed < 0 || runtime.seed > 0xffffffff ||
    typeof runtime.scenario !== "string" || !runtime.scenario ||
    !Number.isSafeInteger(runtime.steps) || runtime.steps < 0 ||
    !Number.isSafeInteger(runtime.maxSteps) || runtime.maxSteps < 1 || runtime.maxSteps > 100000 || runtime.steps > runtime.maxSteps ||
    !Number.isSafeInteger(inner.createdAtStep) || inner.createdAtStep !== runtime.steps ||
    !Array.isArray(runtime.recentTransitions) || runtime.recentTransitions.length > 8 ||
    !runtime.vision || typeof runtime.vision !== "object" || Array.isArray(runtime.vision) ||
    !envelope.context || typeof envelope.context !== "object" || Array.isArray(envelope.context) ||
    !envelope.fingerprint || typeof envelope.fingerprint !== "object" || Array.isArray(envelope.fingerprint)) {
    throw new PlanningDataError("PLANNING_ENVELOPE_INVALID", "/", "Invalid continuation metadata");
  }
  if (runtime.scenario === "standard") {
    if (envelope.reconstruction !== null) throw new PlanningDataError("PLANNING_RECONSTRUCTION_INVALID", "/reconstruction", "Standard Save V2 must not restore a diagnostic allocator origin");
    if (runtime.allocatorContinuation !== undefined)
      readIdGeneratorSnapshot(runtime.allocatorContinuation, "/runtime/allocatorContinuation");
  } else {
    const reconstruction = envelope.reconstruction;
    if (!reconstruction || reconstruction.format !== PLANNING_RECONSTRUCTION_FORMAT ||
      Object.keys(reconstruction).sort().join(",") !== "format,frontier,origin") {
      throw new PlanningDataError("PLANNING_RECONSTRUCTION_INVALID", "/reconstruction", "Diagnostic snapshots require origin and frontier allocator checkpoints; reset and recapture");
    }
    readIdGeneratorSnapshot(reconstruction.origin, "/reconstruction/origin");
    readIdGeneratorSnapshot(reconstruction.frontier, "/reconstruction/frontier");
    let replay: any;
    try { replay = JSON.parse(inner.serialized); } catch {}
    if (replay?.format !== "diagnostic-sandbox-replay-v1" || replay.seed !== runtime.seed ||
      replay.scenario !== runtime.scenario || replay.maxSteps !== runtime.maxSteps ||
      !Array.isArray(replay.actions) || replay.actions.length > runtime.steps) {
      throw new PlanningDataError("PLANNING_REPLAY_METADATA_INVALID", "/inner", "Diagnostic replay metadata and continuation metadata disagree");
    }
  }
  if (runtime.contactContinuation !== undefined) {
    const continuation = runtime.contactContinuation as any;
    if (!continuation || typeof continuation !== "object" || Array.isArray(continuation) ||
      Object.keys(continuation).sort().join(",") !== "entries,nextContactKey" ||
      !Number.isSafeInteger(continuation.nextContactKey) || continuation.nextContactKey < 0 ||
      !Array.isArray(continuation.entries) || continuation.entries.length > 10000) {
      throw new PlanningDataError("PLANNING_CONTACT_CONTINUATION_INVALID", "/runtime/contactContinuation", "Invalid perception contact continuation");
    }
    const keys = new Set<string>(), ids = new Set<string>();
    continuation.entries.forEach((entry: any, index: number) => {
      const path = `/runtime/contactContinuation/entries/${index}`;
      const key = entry?.[0], contact = entry?.[1], previous = contact?.previous;
      if (!Array.isArray(entry) || entry.length !== 2 || typeof key !== "string" || !key || keys.has(key) ||
        !contact || typeof contact !== "object" || Array.isArray(contact) ||
        !/^c[1-9][0-9]*$/.test(contact.id) || ids.has(contact.id) ||
        !Number.isSafeInteger(contact.step) || contact.step < 0 || contact.step > runtime.steps ||
        !Number.isSafeInteger(contact.x) || !Number.isSafeInteger(contact.y) ||
        (previous !== undefined && (!previous || typeof previous !== "object" || Array.isArray(previous) ||
          !Number.isSafeInteger(previous.step) || previous.step < 0 || previous.step > contact.step ||
          !Number.isSafeInteger(previous.x) || !Number.isSafeInteger(previous.y)))) {
        throw new PlanningDataError("PLANNING_CONTACT_CONTINUATION_INVALID", path, "Invalid perception contact entry");
      }
      keys.add(key); ids.add(contact.id);
    });
  }
}
export function serializePlanningEnvelope(value: PlanningEnvelope): string {
  validateEnvelope(value);
  const result = JSON.stringify({ format: PLANNING_FORMAT, codec: PLANNING_CODEC, data: planningEncode(value) });
  if (result.length > MAX_TEXT) throw new PlanningDataError("PLANNING_SNAPSHOT_SIZE", "/", "Snapshot exceeds 24,000,000 characters");
  return result;
}
export function parsePlanningEnvelope(serialized: string): PlanningEnvelope {
  if (typeof serialized !== "string" || !serialized.length || serialized.length > MAX_TEXT) {
    throw new PlanningDataError("PLANNING_SNAPSHOT_SIZE", "/", "Invalid planning snapshot size");
  }
  let wire: { format?: unknown; codec?: unknown; data?: unknown };
  try { wire = JSON.parse(serialized); }
  catch { throw new PlanningDataError("PLANNING_JSON_INVALID", "/", "Malformed snapshot JSON"); }
  if (wire?.format !== PLANNING_FORMAT || wire?.codec !== PLANNING_CODEC) {
    throw new PlanningDataError("PLANNING_SNAPSHOT_VERSION", "/", "Rebuild both game realms and recapture a v3 snapshot; older snapshots lack a verified reconstruction contract");
  }
  const value = planningDecode(wire.data); validateEnvelope(value); return value;
}
/** Count every downward HP assignment in the disposable simulator, not just net HP. */
export async function withGrossHealthLoss<T>(subject: { health: number }, operation: () => Promise<T>): Promise<{ result: T; healthLoss: number }> {
  const descriptor = Object.getOwnPropertyDescriptor(subject, "health");
  if (!descriptor || !("value" in descriptor) || descriptor.configurable !== true || descriptor.writable !== true ||
      typeof descriptor.value !== "number" || !Number.isFinite(descriptor.value)) {
    throw new Error("Planning requires an own, configurable, writable numeric health field");
  }
  let health = descriptor.value as number, loss = 0, invalid = false;
  const get = () => health;
  const set = (next: number) => {
    if (typeof next !== "number" || !Number.isFinite(next)) invalid = true;
    else if (Number.isFinite(health) && next < health) loss += health - next;
    health = next;
  };
  Object.defineProperty(subject, "health", { configurable: true, enumerable: descriptor.enumerable, get, set });
  try {
    const result = await operation();
    const current = Object.getOwnPropertyDescriptor(subject, "health");
    if (invalid || !Number.isFinite(loss) || current?.get !== get || current?.set !== set) {
      throw new Error("Health metric invalidated during planning action");
    }
    return { result, healthLoss: loss };
  } finally {
    const current = Object.getOwnPropertyDescriptor(subject, "health");
    const finalHealth = current?.get === get ? health : subject.health;
    Object.defineProperty(subject, "health", { ...descriptor, value: finalHealth });
  }
}
