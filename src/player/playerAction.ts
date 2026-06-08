import type { Direction } from "../game";

export type GameAction =
  | { type: "Move";         direction: Direction; targetX: number; targetY: number }
  | { type: "Attack";       direction: Direction; targetX: number; targetY: number }
  | { type: "BumpInteract"; direction: Direction; targetX: number; targetY: number }
  | { type: "TileInteract"; direction: Direction; targetX: number; targetY: number }
  | { type: "Wait" }
  | { type: "CastSpell";   spellId: string; targetX: number; targetY: number }
  | { type: "FireRanged";  targetX: number; targetY: number }
  | { type: "UseItem";     slotIndex: number }
  | { type: "UseItemOn";   fromSlot: number; toSlot: number }
  | { type: "DropItem";    slotIndex: number }
  | { type: "MoveItem";        fromSlot: number; toSlot: number }
  | { type: "VendingMachineBuy" }
  | { type: "Restart" }
  // Deferred autopickup from chest reveal timer — not a direct player input.
  // Recorded so replay can reproduce the pickup without relying on wall-clock timing.
  | { type: "AutoPickup"; itemX: number; itemY: number; itemKind: string };

// backward-compat alias — import sites can keep using PlayerAction
export type PlayerAction = GameAction;
