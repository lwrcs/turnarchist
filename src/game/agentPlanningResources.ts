/** Planning-only mutable resource state omitted by ordinary Save V2. */
import { PlanningDataError, planningEncode, planningDecode } from "./agentPlanning";
interface RoomRef { globalId: string; entities: any[] }
type Supported = (entity: any) => boolean;
const PATH = "/runtime/resourceContinuation";
function invalid(message: string): never {
  throw new PlanningDataError("PLANNING_RESOURCE_CONTINUATION_UNSUPPORTED", PATH, message);
}
function validate(input: unknown): any {
  const v = planningDecode(planningEncode(input, PATH)) as any;
  if (!v || typeof v !== "object" || Object.keys(v).sort().join(",") !== "entities,format" ||
      v.format !== "horizon-resource-state-v1" || !Array.isArray(v.entities) || v.entities.length > 20000)
    invalid("Invalid resource continuation");
  const ids = new Set<string>();
  for (const e of v.entities) {
    if (!e || typeof e !== "object" ||
        Object.keys(e).sort().join(",") !== "active,fishCount,gid,kind,roomGid,startFrame" ||
        e.kind !== "FishingSpot" || typeof e.active !== "boolean" ||
        !Number.isSafeInteger(e.fishCount) || e.fishCount < 0 ||
        !Number.isFinite(e.startFrame)) invalid("Invalid fishing resource state");
    for (const k of ["gid", "roomGid"]) if (typeof e[k] !== "string" || !e[k].length || e[k].length > 512)
      invalid("Invalid resource identity");
    if (ids.has(e.gid)) invalid("Duplicate resource identity"); ids.add(e.gid);
  }
  return v;
}
export function capturePlanningResources(rooms: readonly RoomRef[], supported: Supported) {
  const entities: any[] = [];
  for (const r of rooms) for (const e of r.entities) if (!e.dead && supported(e))
    entities.push({ gid: e.globalId, roomGid: r.globalId, kind: "FishingSpot",
      fishCount: e.fishCount, active: e.active, startFrame: e.startFrame });
  return validate({ format: "horizon-resource-state-v1", entities });
}
export function restorePlanningResources(input: unknown, rooms: readonly RoomRef[], supported: Supported) {
  const v = validate(input), targets = new Map<string, { e: any; room: string }>();
  for (const r of rooms) for (const e of r.entities) if (!e.dead && supported(e)) {
    if (targets.has(e.globalId)) invalid("Duplicate restored resource");
    targets.set(e.globalId, { e, room: r.globalId });
  }
  if (v.entities.length !== targets.size) invalid("Saved/restored resource sets differ");
  const staged = v.entities.map((s: any) => {
    const t = targets.get(s.gid);
    if (!t || t.room !== s.roomGid || t.e.constructor.name !== s.kind) invalid("Missing or incompatible resource");
    for (const key of ["fishCount", "active", "startFrame"]) {
      const d = Object.getOwnPropertyDescriptor(t.e, key);
      if (!d || !("value" in d) || !d.writable) invalid("Unsupported resource field layout");
    }
    return { e: t.e, state: s };
  });
  for (const { e, state } of staged) {
    e.fishCount = state.fishCount; e.active = state.active; e.startFrame = state.startFrame;
  }
}
