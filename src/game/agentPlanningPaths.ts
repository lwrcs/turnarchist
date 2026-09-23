/** Planning-only cached AI route continuation. Ordinary saves intentionally omit it. */
import { PlanningDataError, planningEncode, planningDecode } from "./agentPlanning";
interface RoomRef { globalId: string; entities: any[] }
type CacheCheck = (entity: any) => boolean;
const PATH = "/runtime/pathContinuation";
function invalid(message: string): never { throw new PlanningDataError("PLANNING_PATH_CONTINUATION_UNSUPPORTED", PATH, message); }
function fields(value: any, keys: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== keys.sort().join(",")) invalid("Invalid path record fields");
}
function validate(value: unknown): any {
  const v = planningDecode(planningEncode(value, PATH)) as any;
  fields(v, ["format", "entities"]);
  if (v.format !== "horizon-enemy-path-cache-v1" || !Array.isArray(v.entities) || v.entities.length > 20000) invalid("Invalid path format or size");
  const ids = new Set<string>(); let total = 0;
  for (const e of v.entities) {
    fields(e, ["gid", "roomGid", "kind", "cache"]);
    for (const k of ["gid", "roomGid", "kind"]) if (typeof e[k] !== "string" || !e[k].length || e[k].length > 512) invalid("Invalid path entity identity");
    if (ids.has(e.gid)) invalid("Duplicate path entity"); ids.add(e.gid);
    if (e.cache === null) continue;
    fields(e.cache, ["moves", "targetX", "targetY", "fromX", "fromY"]);
    for (const k of ["targetX", "targetY", "fromX", "fromY"]) if (!Number.isFinite(e.cache[k])) invalid("Invalid cache coordinate");
    if (!Array.isArray(e.cache.moves) || (total += e.cache.moves.length) > 20000) invalid("Invalid cache moves or size");
    for (const m of e.cache.moves) {
      fields(m, ["pos"]); fields(m.pos, ["x", "y"]);
      if (!Number.isFinite(m.pos.x) || !Number.isFinite(m.pos.y)) invalid("Invalid move coordinate");
    }
  }
  return v;
}
export function capturePlanningPaths(rooms: readonly RoomRef[], supported: CacheCheck) {
  const entities: any[] = [];
  for (const r of rooms) for (const e of r.entities) {
    if (e.dead || !Object.prototype.hasOwnProperty.call(e, "_pathCache")) continue;
    if (!supported(e)) invalid("Unknown cached-path implementation");
    const c = e._pathCache;
    // The cache and every audited consumer read only moves[].pos. AStar nodes
    // also hold temporary search scores/parent links and live Tile.org references;
    // none are consumed after search. Do not serialize those cyclic world graphs.
    entities.push({ gid: e.globalId, roomGid: r.globalId, kind: e.constructor.name,
      cache: c === null ? null : { targetX: c.targetX, targetY: c.targetY, fromX: c.fromX, fromY: c.fromY,
        moves: c.moves.map((m: any) => ({ pos: { x: m.pos.x, y: m.pos.y } })) } });
  }
  return validate({ format: "horizon-enemy-path-cache-v1", entities });
}
export function restorePlanningPaths(input: unknown, rooms: readonly RoomRef[], supported: CacheCheck) {
  const v = validate(input), targets = new Map<string, { e: any; room: string }>();
  for (const r of rooms) for (const e of r.entities) if (!e.dead && Object.prototype.hasOwnProperty.call(e, "_pathCache")) {
    if (targets.has(e.globalId) || !supported(e)) invalid("Duplicate or unsupported restored path entity");
    targets.set(e.globalId, { e, room: r.globalId });
  }
  if (v.entities.length !== targets.size) invalid("Saved/restored path entity sets differ");
  const staged = v.entities.map((s: any) => {
    const t = targets.get(s.gid), d = t && Object.getOwnPropertyDescriptor(t.e, "_pathCache");
    if (!t || t.room !== s.roomGid || t.e.constructor.name !== s.kind || !d || !("value" in d) || !d.writable)
      invalid("Missing or incompatible cached-path entity");
    return { entity: t!.e, cache: s.cache };
  });
  for (const s of staged) s.entity._pathCache = s.cache;
}
