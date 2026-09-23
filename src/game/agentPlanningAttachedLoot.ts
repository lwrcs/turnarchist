/** Privileged continuation for preselected items still attached to living entities. */
import { PlanningDataError, planningEncode, planningDecode } from "./agentPlanning";

interface RoomRef { globalId: string; entities: any[]; items: any[] }
const PATH = "/runtime/attachedLootContinuation";
function invalid(message: string): never {
  throw new PlanningDataError("PLANNING_ATTACHED_LOOT_UNSUPPORTED", PATH, message);
}
function validate(input: unknown): any {
  const v = planningDecode(planningEncode(input, PATH)) as any;
  if (!v || typeof v !== "object" || Object.keys(v).sort().join(",") !== "entities,format" ||
      v.format !== "horizon-attached-loot-v1" || !Array.isArray(v.entities) || v.entities.length > 20000)
    invalid("Invalid attached-loot continuation");
  const owners = new Set<string>(), items = new Set<string>();
  for (const e of v.entities) {
    if (!e || typeof e !== "object" || Object.keys(e).sort().join(",") !== "drops,gid,kind,lootDropped,roomGid" ||
        typeof e.lootDropped !== "boolean" || !Array.isArray(e.drops) || e.drops.length > 1000)
      invalid("Invalid attached-loot entity");
    for (const key of ["gid", "kind", "roomGid"])
      if (typeof e[key] !== "string" || !e[key].length || e[key].length > 512) invalid("Invalid loot owner identity");
    if (owners.has(e.gid)) invalid("Duplicate loot owner");
    owners.add(e.gid);
    for (const drop of e.drops) {
      if (!drop || typeof drop !== "object" || typeof drop.kind !== "string" || !drop.kind.length ||
          typeof drop.gid !== "string" || !drop.gid.length) invalid("Invalid attached item");
      if (items.has(drop.gid)) invalid("Duplicate attached item");
      items.add(drop.gid);
    }
  }
  return v;
}

export function capturePlanningAttachedLoot(rooms: readonly RoomRef[], saveItem: (item: any) => unknown) {
  const entities: any[] = [];
  for (const room of rooms) for (const entity of room.entities) {
    if (entity.dead || !Array.isArray(entity.drops) || entity.drops.length === 0) continue;
    // Save V2 already owns drops which have been released into room.items and
    // restores their owner references (notably opened chests). This privileged
    // continuation is only for preselected loot still attached to its owner.
    // Recreating world drops here would replace the owner's restored references
    // with detached copies that pickup code cannot find in room.items.
    const drops = entity.drops.filter((item: any) => !room.items.includes(item))
      .map((item: any) => saveItem(item));
    // Keep the owner even when every drop is currently represented by Save V2.
    // A picked-up chest item can remain in room.items during its visual flight,
    // while Save V2 intentionally omits picked-up items.  The empty attached list
    // still carries lootDropped so a restored chest cannot reroll on destruction.
    entities.push({ gid: entity.globalId, kind: entity.constructor.name, roomGid: room.globalId,
      lootDropped: entity.lootDropped, drops });
  }
  return validate({ format: "horizon-attached-loot-v1", entities });
}

export function restorePlanningAttachedLoot(input: unknown, rooms: readonly RoomRef[],
  spawnItem: (saved: any, room: RoomRef) => any) {
  const v = validate(input), targets = new Map<string, { entity: any; room: RoomRef }>();
  for (const room of rooms) for (const entity of room.entities) if (!entity.dead) {
    if (targets.has(entity.globalId)) invalid("Duplicate restored entity");
    targets.set(entity.globalId, { entity, room });
  }
  const staged = v.entities.map((saved: any) => {
    const target = targets.get(saved.gid);
    if (!target || target.room.globalId !== saved.roomGid || target.entity.constructor.name !== saved.kind)
      invalid("Missing or incompatible loot owner");
    for (const key of ["drops", "lootDropped"]) {
      const descriptor = Object.getOwnPropertyDescriptor(target.entity, key);
      if (!descriptor || !("value" in descriptor) || !descriptor.writable) invalid("Unsupported loot field layout");
    }
    const drops = saved.drops.map((drop: any) => spawnItem(drop, target.room));
    if (drops.some((drop: any) => !drop || typeof drop !== "object")) invalid("Attached item reconstruction failed");
    return { entity: target.entity, room: target.room, drops, lootDropped: saved.lootDropped };
  });
  for (const entry of staged) {
    // Preserve references restored by Save V2 for already-released world loot;
    // append only the still-attached items reconstructed above.
    const worldDrops = entry.entity.drops.filter((item: any) => entry.room.items.includes(item));
    entry.entity.drops = [...worldDrops, ...entry.drops];
    entry.entity.lootDropped = entry.lootDropped;
  }
}
