/** Planning-only restoration of the ordinary down-ladder confirmation. */
import { PlanningDataError, planningEncode, planningDecode } from "./agentPlanning";
interface PlayerRef { x: number; y: number; z: number; screenMessage: { open: boolean }; getRoom(): any }
interface LadderRef { lockable: { isLocked(): boolean }; onCollide(player: any): void }
type LadderCheck = (tile: any) => boolean;
const PATH = "/runtime/interactionContinuation";
function invalid(message: string): never {
  throw new PlanningDataError("PLANNING_INTERACTION_UNSUPPORTED", PATH, message);
}
export function capturePlanningInteraction(player: PlayerRef, isLadder: LadderCheck) {
  if (!player.screenMessage.open) return null;
  const room = player.getRoom(), tile = room.roomArray[player.x]?.[player.y] as LadderRef;
  if (!isLadder(tile) || tile.lockable.isLocked()) invalid("Open interaction is not an unlocked base DownLadder prompt");
  return { format: "horizon-down-ladder-prompt-v1", roomGid: room.globalId,
    x: player.x, y: player.y, z: player.z };
}
export function restorePlanningInteraction(input: unknown, player: PlayerRef, players: PlayerRef[], isLadder: LadderCheck) {
  if (input == null) return;
  const v = planningDecode(planningEncode(input, PATH)) as any;
  if (!v || typeof v !== "object" || Object.keys(v).sort().join(",") !== "format,roomGid,x,y,z" ||
      v.format !== "horizon-down-ladder-prompt-v1" || typeof v.roomGid !== "string" || !v.roomGid ||
      ![v.x, v.y, v.z].every(Number.isFinite)) invalid("Invalid ladder prompt continuation");
  const room = player.getRoom(), tile = room.roomArray[player.x]?.[player.y] as LadderRef;
  if (room.globalId !== v.roomGid || player.x !== v.x || player.y !== v.y || player.z !== v.z ||
      !isLadder(tile) || tile.lockable.isLocked() || !players.includes(player) ||
      players.some(p => p.getRoom() !== room || p.x !== v.x || p.y !== v.y))
    invalid("Saved ladder prompt does not match the restored unlocked ladder and players");
  // The guarded unlocked branch only shows the actual prompt and binds its real
  // confirm/cancel callbacks. It does not move, unlock, generate, record or tick.
  tile.onCollide(player);
  if (!player.screenMessage.open) invalid("Ladder did not recreate its confirmation");
}
