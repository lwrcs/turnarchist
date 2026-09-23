/** Explicitly empty preselected loot is state, not permission to reroll on load. */
import { PlanningDataError, planningEncode, planningDecode } from "./agentPlanning";
interface RoomRef { globalId: string; entities: any[] }
const PATH = "/runtime/emptyLootContinuation";
function invalid(message: string): never { throw new PlanningDataError("PLANNING_EMPTY_LOOT_UNSUPPORTED", PATH, message); }
function validate(input: unknown): any {
  const v = planningDecode(planningEncode(input, PATH)) as any;
  if (!v || typeof v !== "object" || Object.keys(v).sort().join(",") !== "entities,format" ||
      v.format !== "horizon-empty-loot-v1" || !Array.isArray(v.entities) || v.entities.length > 20000) invalid("Invalid empty-loot continuation");
  const ids = new Set<string>();
  for (const e of v.entities) {
    if (!e || typeof e !== "object" || Object.keys(e).sort().join(",") !== "gid,kind,lootDropped,roomGid" ||
        typeof e.lootDropped !== "boolean") invalid("Invalid empty-loot entity");
    for (const k of ["gid", "kind", "roomGid"]) if (typeof e[k] !== "string" || !e[k].length || e[k].length > 512) invalid("Invalid loot owner identity");
    if (ids.has(e.gid)) invalid("Duplicate loot owner"); ids.add(e.gid);
  }
  return v;
}
export function capturePlanningEmptyLoot(rooms: readonly RoomRef[]) {
  const entities: any[] = [];
  for (const r of rooms) for (const e of r.entities) if (!e.dead && Array.isArray(e.drops) && e.drops.length === 0)
    entities.push({ gid: e.globalId, kind: e.constructor.name, roomGid: r.globalId, lootDropped: e.lootDropped });
  return validate({ format: "horizon-empty-loot-v1", entities });
}
export function restorePlanningEmptyLoot(input: unknown, rooms: readonly RoomRef[]) {
  const v = validate(input), targets = new Map<string, { e: any; room: string }>();
  for (const r of rooms) for (const e of r.entities) if (!e.dead) {
    if (targets.has(e.globalId)) invalid("Duplicate restored entity"); targets.set(e.globalId, { e, room: r.globalId });
  }
  const staged = v.entities.map((s: any) => {
    const t = targets.get(s.gid);
    if (!t || t.room !== s.roomGid || t.e.constructor.name !== s.kind) invalid("Missing or incompatible loot owner");
    for (const key of ["drops", "lootDropped"]) {
      const d = Object.getOwnPropertyDescriptor(t!.e, key);
      if (!d || !("value" in d) || !d.writable) invalid("Unsupported loot field layout");
    }
    return { e: t!.e, lootDropped: s.lootDropped };
  });
  // Restore the captured empty collection; the real dropLoot method still decides
  // whether to generate its ordinary fallback coin. No reward or RNG rule changes.
  for (const { e, lootDropped } of staged) { e.drops = []; e.lootDropped = lootDropped; }
}
