import type { Direction } from "../game";

export type GameAction =
  // Single directional action — the executor (tryMove) decides whether this resolves
  // as a walk, attack, push, interact, door-unlock, etc. based on game state at
  // execution time. Replay validates by comparing post-action state, not the label.
  | { type: "Directional"; direction: Direction; targetX: number; targetY: number }
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
  | { type: "AutoPickup"; itemX: number; itemY: number; itemKind: string }
  // A choice made from a crafting selection menu (iron-bar → armor recipes).
  // Recorded so replay can reproduce the recipe applied without relying on the
  // wall-clock UI state of the menu.
  | { type: "SmithRecipe"; recipe: string }
  // Chat-typed developer command (e.g. "spawn zombie", "populate testbed"). Recorded
  // so replay can reproduce state changes that came from chat input rather than
  // player movement. Re-executed during replay by re-invoking game.commandHandler.
  | { type: "Command"; command: string }
  // DownLadder screen-message choice. The screenMessage absorbs input until
  // dismissed, so its open/closed state must be reproduced exactly during replay
  // — otherwise subsequent inputs apply against different room state.
  | { type: "LadderConfirm" }
  | { type: "LadderCancel" };

// backward-compat alias — import sites can keep using PlayerAction
export type PlayerAction = GameAction;
