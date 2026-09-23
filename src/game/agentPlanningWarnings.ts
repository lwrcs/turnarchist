/** Planning-only continuation of warning identity/lifecycle omitted by ordinary Save V2.
 * Never serializes live objects, changes save codecs, or edits the visible world.
 */
import { PlanningDataError, planningEncode, planningDecode } from "./agentPlanning";
export const WARNING_CONTINUATION_FORMAT = "horizon-warning-graph-v1";
interface WarningRoom { globalId: string; entities: unknown[]; hitwarnings: unknown[] }
interface EntityRef { globalId: string; dead?: boolean; hitWarnings?: unknown[] }
export interface WarningState {
  x: number; y: number; eX: number | undefined; eY: number | undefined;
  isEnemy: boolean; dirOnly: boolean; dead: boolean; tickedForDeath: boolean;
  alpha: number; parentGid: string | null;
}
interface WarningRoomState {
  roomGid: string; warnings: WarningState[]; roomWarnings: number[];
  owners: { gid: string; warnings: number[] }[];
}
// An audited removed, dead enemy cannot tick or revive. Base HitWarning only reads
// these fields from it (isActive, pointer geometry, and observeWarnings). Preserve
// that terminal source, NOT a fabricated live enemy or an expected observation.
// No constructor, RNG allocation, registration, or insertion into gameplay pools.
type RetiredParentKind = "ZombieEnemy" | "CrabEnemy" | "SkullEnemy";
const RETIRED_PARENT_KINDS: readonly RetiredParentKind[] = ["ZombieEnemy", "CrabEnemy", "SkullEnemy"];
interface RetiredParent {
  globalId: string; kind: RetiredParentKind; dead: true; unconscious: boolean;
  x: number; y: number; z: number; w: number; h: number;
}
const retiredSources = new WeakMap<object, RetiredParent>();
export interface WarningContinuation { format: typeof WARNING_CONTINUATION_FORMAT; rooms: WarningRoomState[];
  retiredParents?: { format: "horizon-retired-warning-parents-v1"; sources: RetiredParent[] } }
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
function invalid(path: string, message: string): never {
  throw new PlanningDataError("PLANNING_WARNING_CONTINUATION_UNSUPPORTED", path, message);
}
const ROOT = "/runtime/warningContinuation";
function id(v: unknown, path: string): asserts v is string {
  if (typeof v !== "string" || !v.length || v.length > 512) invalid(path, "Expected a nonempty stable ID");
}
function data(o: object, key: string, path: string): unknown {
  const d = Object.getOwnPropertyDescriptor(o, key);
  if (!d || !("value" in d)) invalid(path, "Missing own data field " + key);
  return d.value;
}
function fields(o: any, keys: string[], path: string) {
  if (!o || typeof o !== "object" || Array.isArray(o) ||
      Object.keys(o).sort().join(",") !== keys.slice().sort().join(",")) invalid(path, "Unexpected record fields");
}
function topology(rooms: readonly WarningRoom[]) {
  const roomMap = new Map<string, WarningRoom>(), entities = new Map<string, EntityRef>();
  for (const r of rooms) {
    id(r.globalId, ROOT + "/roomGid");
    if (roomMap.has(r.globalId)) invalid(ROOT, "Duplicate room identity");
    roomMap.set(r.globalId, r);
    for (const raw of r.entities) {
      const e = raw as EntityRef;
      // Save V2's entity stream excludes dead entities. Never fabricate a missing parent.
      if (e.dead) continue;
      id(e.globalId, ROOT + "/entityGid");
      if (entities.has(e.globalId)) invalid(ROOT, "Duplicate entity identity");
      entities.set(e.globalId, e);
    }
  }
  return { roomMap, entities };
}
/** Capture order and aliasing as well as each base HitWarning's exact tick state. */
export function captureWarningContinuation(rooms: readonly WarningRoom[]): WarningContinuation {
  const { entities } = topology(rooms);
  const result: WarningContinuation = { format: WARNING_CONTINUATION_FORMAT, rooms: [] };
  const retired = new Map<string, { source: object; state: RetiredParent }>();
  const warningRooms = new Map<object, string>();
  for (const r of rooms) {
    const path = ROOT + "/rooms/" + result.rooms.length;
    const pool = new Map<object, number>(), warnings: WarningState[] = [];
    const add = (raw: unknown): number => {
      if (!raw || typeof raw !== "object") invalid(path, "Invalid warning object");
      const w = raw as any;
      if (pool.has(w)) return pool.get(w)!;
      if (warningRooms.has(w) && warningRooms.get(w) !== r.globalId)
        invalid(path, "A warning shared across room pools requires an explicit cross-room codec");
      warningRooms.set(w, r.globalId);
      // Subclasses can change tick semantics. They need an explicit codec, not a guessed base cast.
      if (w.constructor?.name !== "HitWarning" || w.skipSave !== false || typeof w.getSaveFields !== "function")
        invalid(path + "/warnings/" + warnings.length, "Unsupported warning class: " + String(w.constructor?.name));
      const parent = w.parent as EntityRef | null;
      if (parent !== null && (!parent || entities.get(parent.globalId) !== parent)) {
        const previous = parent && retiredSources.get(parent);
        if (parent && parent.dead === true && !entities.has(parent.globalId) &&
            !rooms.some(room => room.entities.includes(parent)) &&
            (previous || RETIRED_PARENT_KINDS.includes(String(parent.constructor?.name) as RetiredParentKind))) {
          const state = previous || {
            globalId: data(parent, "globalId", path), kind: parent.constructor.name, dead: data(parent, "dead", path),
            unconscious: data(parent, "unconscious", path), x: data(parent, "x", path), y: data(parent, "y", path),
            z: data(parent, "z", path), w: data(parent, "w", path), h: data(parent, "h", path),
          } as RetiredParent;
          const existing = retired.get(parent.globalId);
          if (existing && existing.source !== parent) invalid(path, "Conflicting retired parent identity");
          retired.set(parent.globalId, { source: parent, state });
        } else {
          throw new PlanningDataError("PLANNING_WARNING_CONTINUATION_UNSUPPORTED",
            path + "/warnings/" + warnings.length + "/parentGid", "Warning parent is absent from the saved live-entity set", {
              phase: "warning.capture", expected: "Saved live entity or audited retired warning source",
              actual: JSON.stringify({ roomGid: r.globalId, parentGid: parent?.globalId,
                parentKind: parent?.constructor?.name, parentDead: parent?.dead,
                parentInRooms: rooms.filter(room => room.entities.includes(parent)).map(room => room.globalId),
                warningDead: w.dead, warningTickedForDeath: w.tickedForDeath }),
            });
        }
      }
      const saved = w.getSaveFields();
      const state: WarningState = {
        x: data(w, "x", path) as number, y: data(w, "y", path) as number,
        eX: saved.eX, eY: saved.eY, isEnemy: saved.isEnemy, dirOnly: saved.dirOnly,
        dead: data(w, "dead", path) as boolean,
        tickedForDeath: data(w, "tickedForDeath", path) as boolean,
        alpha: data(w, "alpha", path) as number, parentGid: parent === null ? null : parent.globalId,
      };
      const index = warnings.length; pool.set(w, index); warnings.push(state); return index;
    };
    const roomWarnings = r.hitwarnings.map(add), owners: WarningRoomState["owners"] = [];
    for (const raw of r.entities) {
      const e = raw as EntityRef;
      if (e.dead || !Array.isArray(e.hitWarnings)) continue;
      owners.push({ gid: e.globalId, warnings: e.hitWarnings.map(add) });
    }
    result.rooms.push({ roomGid: r.globalId, warnings, roomWarnings, owners });
  }
  if (retired.size) result.retiredParents = { format: "horizon-retired-warning-parents-v1",
    sources: Array.from(retired.values(), entry => entry.state) };
  return readWarningContinuation(result);
}
/** Strict bounded data validation precedes factory calls and live-object mutation. */
export function readWarningContinuation(input: unknown): WarningContinuation {
  // The existing lossless codec rejects cycles, getters, functions and unbounded trees.
  const v = planningDecode(planningEncode(input, ROOT)) as WarningContinuation;
  fields(v, own(v, "retiredParents") ? ["format", "rooms", "retiredParents"] : ["format", "rooms"], ROOT);
  if (v.format !== WARNING_CONTINUATION_FORMAT || !Array.isArray(v.rooms) || v.rooms.length > 4096)
    invalid(ROOT, "Unsupported warning graph format or size");
  if (v.retiredParents !== undefined) {
    const p = ROOT + "/retiredParents", refs = v.retiredParents;
    fields(refs, ["format", "sources"], p);
    if (refs.format !== "horizon-retired-warning-parents-v1" || !Array.isArray(refs.sources) ||
        refs.sources.length > 20000) invalid(p, "Unsupported retired parent codec or size");
    const ids = new Set<string>();
    for (const s of refs.sources) {
      fields(s, ["globalId", "kind", "dead", "unconscious", "x", "y", "z", "w", "h"], p);
      id(s.globalId, p + "/globalId");
      if (ids.has(s.globalId) || !RETIRED_PARENT_KINDS.includes(s.kind) || s.dead !== true || typeof s.unconscious !== "boolean")
        invalid(p, "Invalid or duplicate retired parent");
      ids.add(s.globalId);
      for (const k of ["x", "y", "z", "w", "h"] as const)
        if (!Number.isFinite(s[k])) invalid(p + "/" + k, "Expected finite parent geometry");
      if (s.w <= 0 || s.h <= 0) invalid(p, "Invalid parent footprint");
    }
  }
  const roomIds = new Set<string>(), ownerIds = new Set<string>(); let count = 0;
  for (let n = 0; n < v.rooms.length; n++) {
    const r = v.rooms[n], p = ROOT + "/rooms/" + n;
    fields(r, ["roomGid", "warnings", "roomWarnings", "owners"], p); id(r.roomGid, p + "/roomGid");
    if (roomIds.has(r.roomGid)) invalid(p, "Duplicate room identity"); roomIds.add(r.roomGid);
    if (!Array.isArray(r.warnings) || !Array.isArray(r.owners) || (count += r.warnings.length) > 20000)
      invalid(p, "Invalid or oversized warning pool");
    const indices = (list: unknown, at: string) => {
      if (!Array.isArray(list) || list.length > 20000 || Object.keys(list).length !== list.length || list.some(i => !Number.isSafeInteger(i) || i < 0 || i >= r.warnings.length))
        invalid(at, "Invalid warning-pool reference");
    };
    indices(r.roomWarnings, p + "/roomWarnings");
    for (let i = 0; i < r.warnings.length; i++) {
      const w = r.warnings[i], q = p + "/warnings/" + i;
      fields(w, ["x", "y", "eX", "eY", "isEnemy", "dirOnly", "dead", "tickedForDeath", "alpha", "parentGid"], q);
      for (const k of ["x", "y", "alpha"] as const) if (!Number.isFinite(w[k])) invalid(q + "/" + k, "Expected finite number");
      for (const k of ["eX", "eY"] as const) if (w[k] !== undefined && !Number.isFinite(w[k])) invalid(q + "/" + k, "Expected optional finite number");
      for (const k of ["isEnemy", "dirOnly", "dead", "tickedForDeath"] as const)
        if (typeof w[k] !== "boolean") invalid(q + "/" + k, "Expected boolean");
      if (w.parentGid !== null) id(w.parentGid, q + "/parentGid");
    }
    for (const o of r.owners) {
      fields(o, ["gid", "warnings"], p + "/owners"); id(o.gid, p + "/owners/gid");
      if (ownerIds.has(o.gid)) invalid(p, "Duplicate warning owner"); ownerIds.add(o.gid);
      indices(o.warnings, p + "/owners/" + o.gid);
    }
  }
  return v;
}
/** Restore into the isolated, already-loaded game. Callers enforce simulator-only access. */
export function restoreWarningContinuation(input: unknown, rooms: readonly WarningRoom[],
  make: (state: WarningState, parent: unknown | null) => object): void {
  const value = readWarningContinuation(input), { roomMap, entities } = topology(rooms);
  const parents = new Map<string, EntityRef>(entities);
  for (const s of value.retiredParents?.sources || []) {
    if (parents.has(s.globalId)) invalid(ROOT + "/retiredParents", "Retired source collides with live entity");
    const source = Object.freeze({ ...s });
    retiredSources.set(source, source); parents.set(s.globalId, source);
  }
  if (value.rooms.length !== roomMap.size) invalid(ROOT + "/rooms", "Saved/restored room sets differ");
  // Validate every reference before constructing anything. Missing references fail closed.
  for (const r of value.rooms) {
    const room = roomMap.get(r.roomGid);
    if (!room) invalid(ROOT, "Saved room missing: " + r.roomGid);
    for (const w of r.warnings) if (w.parentGid !== null && !parents.has(w.parentGid))
      invalid(ROOT + "/parentGid", "Saved parent missing: " + w.parentGid);
    for (const o of r.owners) if (!entities.has(o.gid) || !room!.entities.includes(entities.get(o.gid)))
      invalid(ROOT + "/owners", "Saved owner missing from its room: " + o.gid);
  }
  const staged = value.rooms.map(r => {
    const pool = r.warnings.map(s => {
      const parent = s.parentGid === null ? null : parents.get(s.parentGid)!;
      const w = make(s, parent) as Record<string, unknown>;
      if (!w || w.constructor?.name !== "HitWarning") invalid(ROOT, "Factory must construct the base HitWarning");
      for (const k of ["x", "y", "eX", "eY", "isEnemy", "dirOnly", "dead", "tickedForDeath", "alpha"] as const) {
        const d = Object.getOwnPropertyDescriptor(w, k);
        if (!d || !("value" in d) || !d.writable) invalid(ROOT + "/" + k, "Unsupported warning field layout");
        w[k] = s[k];
      }
      w.parent = parent;
      return w;
    });
    return { room: roomMap.get(r.roomGid)!, list: r.roomWarnings.map(i => pool[i]),
      owners: r.owners.map(o => ({ owner: entities.get(o.gid)!, list: o.warnings.map(i => pool[i]) })) };
  });
  for (const s of staged) {
    s.room.hitwarnings = s.list;
    for (const o of s.owners) o.owner.hitWarnings = o.list;
  }
}
