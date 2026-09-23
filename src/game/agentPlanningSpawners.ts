/** Planning-only Spawner state omitted by ordinary Save V2. */
import { PlanningDataError, planningDecode, planningEncode } from "./agentPlanning";
interface RoomRef { globalId: string; entities: any[] }
type Supported = (entity: any) => boolean;
const PATH = "/runtime/spawnerContinuation";
function invalid(message: string): never {
  throw new PlanningDataError("PLANNING_SPAWNER_CONTINUATION_UNSUPPORTED", PATH, message);
}
function validEffect(v: any, countKey: "hitCount" | "tickCount"): boolean {
  return !!v && typeof v === "object" &&
    Object.keys(v).sort().join(",") === ["active", "effectTick", countKey, "startTick"].sort().join(",") &&
    typeof v.active === "boolean" && [v[countKey], v.startTick, v.effectTick].every(Number.isFinite);
}
function validate(input: unknown): any {
  const v = planningDecode(planningEncode(input, PATH)) as any;
  if (!v || typeof v !== "object" || Object.keys(v).sort().join(",") !== "entities,format" ||
      v.format !== "horizon-spawner-state-v1" || !Array.isArray(v.entities) || v.entities.length > 1000)
    invalid("Invalid spawner continuation");
  const ids = new Set<string>();
  for (const e of v.entities) {
    if (!e || typeof e !== "object" ||
        Object.keys(e).sort().join(",") !== "aggro,bleed,buffed,enemySpawnType,enemyTable,gid,heardPlayer,isBossEnemy,kind,nextSpawnTick,poison,roomGid,seenPlayer,skipNextTurns,spawnFrequency,spawnOffset,ticks" ||
        e.kind !== "Spawner" || ![e.seenPlayer,e.heardPlayer,e.aggro,e.isBossEnemy].every(v => typeof v === "boolean") ||
        !(e.buffed === undefined || typeof e.buffed === "boolean") ||
        !Array.isArray(e.enemyTable) || e.enemyTable.length > 128 ||
        !e.enemyTable.every((n: unknown) => Number.isSafeInteger(n) && (n as number) >= 0) ||
        ![e.enemySpawnType,e.ticks,e.spawnFrequency,e.spawnOffset,e.nextSpawnTick,e.skipNextTurns]
          .every(n => Number.isSafeInteger(n) && n >= 0) ||
        !validEffect(e.poison,"hitCount") || !validEffect(e.bleed,"hitCount")) invalid("Invalid spawner state");
    for (const key of ["gid", "roomGid"]) if (typeof e[key] !== "string" || !e[key].length || e[key].length > 512)
      invalid("Invalid spawner identity");
    if (ids.has(e.gid)) invalid("Duplicate spawner identity"); ids.add(e.gid);
  }
  return v;
}
export function capturePlanningSpawners(rooms: readonly RoomRef[], supported: Supported) {
  const entities: any[] = [];
  for (const room of rooms) for (const e of room.entities) if (!e.dead && supported(e))
    entities.push({ gid:e.globalId, roomGid:room.globalId, kind:"Spawner",
      enemyTable:[...e.enemyTable], enemySpawnType:e.enemySpawnType, ticks:e.ticks,
      spawnFrequency:e.spawnFrequency, spawnOffset:e.spawnOffset, nextSpawnTick:e.nextSpawnTick,
      seenPlayer:e.seenPlayer, heardPlayer:e.heardPlayer, aggro:e.aggro, buffed:e.buffed,
      skipNextTurns:e.skipNextTurns, poison:{...e.status.poison}, bleed:{...e.status.bleed},
      isBossEnemy:e.isBossEnemy });
  return validate({ format:"horizon-spawner-state-v1", entities });
}
export function restorePlanningSpawners(input: unknown, rooms: readonly RoomRef[], supported: Supported) {
  const v=validate(input), targets=new Map<string,{e:any;room:string}>();
  for (const room of rooms) for (const e of room.entities) if (!e.dead && supported(e)) {
    if (targets.has(e.globalId)) invalid("Duplicate restored spawner");
    targets.set(e.globalId,{e,room:room.globalId});
  }
  if (v.entities.length!==targets.size) invalid("Saved/restored spawner sets differ");
  const staged=v.entities.map((state:any)=>{
    const target=targets.get(state.gid);
    if (!target || target.room!==state.roomGid || target.e.constructor.name!==state.kind)
      invalid("Missing or incompatible spawner");
    for (const key of ["enemyTable","enemySpawnType","ticks","spawnFrequency","spawnOffset","nextSpawnTick","seenPlayer",
      "heardPlayer","aggro","skipNextTurns","status","isBossEnemy"]) {
      const descriptor=Object.getOwnPropertyDescriptor(target.e,key);
      if (!descriptor || !("value" in descriptor) || !descriptor.writable) invalid("Unsupported spawner field layout");
    }
    const buffedDescriptor=Object.getOwnPropertyDescriptor(target.e,"buffed");
    if (buffedDescriptor && (!("value" in buffedDescriptor) || !buffedDescriptor.writable)) invalid("Unsupported spawner field layout");
    return {e:target.e,state};
  });
  for (const {e,state} of staged) {
    e.enemyTable=[...state.enemyTable]; e.enemySpawnType=state.enemySpawnType; e.ticks=state.ticks;
    e.spawnFrequency=state.spawnFrequency; e.spawnOffset=state.spawnOffset; e.nextSpawnTick=state.nextSpawnTick;
    e.seenPlayer=state.seenPlayer; e.heardPlayer=state.heardPlayer; e.aggro=state.aggro; e.buffed=state.buffed;
    e.skipNextTurns=state.skipNextTurns; e.status.poison={...state.poison}; e.status.bleed={...state.bleed};
    e.isBossEnemy=state.isBossEnemy;
  }
}
