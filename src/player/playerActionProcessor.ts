import { Player } from "./player";
import type { GameAction } from "./playerAction";

export class PlayerActionProcessor {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  process(action: GameAction) {
    switch (action.type) {
      // --- Directional / world actions ---
      // Record only if movement.move() confirms the input was productive (executed or queued).
      // Inputs that arrive while on cooldown AND the queue is full/locked are silently dropped;
      // recording them would cause replay to play back moves that never happened during recording.
      case "Move":
      case "Attack":
      case "BumpInteract":
      case "TileInteract": {
        const productive = this.player.movement.move(action.direction, action.targetX, action.targetY);
        if (productive) {
          try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        }
        break;
      }

      case "Wait":
        // Advance the room turn without moving. No-op for human play; used by AI harness.
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        try {
          (this.player as any).getRoom?.()?.tick?.(this.player);
        } catch {}
        break;

      // --- Ranged / spell ---
      case "CastSpell":
      case "FireRanged": {
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        const rt = this.player.rangedTargeting;
        if (rt) {
          if (!rt.active) {
            // During replay the targeting UI isn't running — start it with the equipped weapon.
            const weapon = this.player.inventory?.weapon;
            if (weapon && typeof (weapon as any).fireAtTarget === "function") {
              rt.start(weapon as any);
            }
          }
          rt.targetX = action.targetX;
          rt.targetY = action.targetY;
          rt.fire();
        }
        break;
      }

      // --- Inventory (slot-direct, cursor-independent) ---
      case "UseItem":
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        this.player.inventory.itemUseAt(action.slotIndex);
        break;

      case "UseItemOn":
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        this.player.inventory.itemUseOnAt(action.fromSlot, action.toSlot);
        break;

      case "DropItem":
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        this.player.inventory.dropItemAt(action.slotIndex);
        break;

      case "MoveItem":
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        this.player.inventory.swapSlots(action.fromSlot, action.toSlot);
        break;

      case "VendingMachineBuy":
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        this.player.openVendingMachine?.space();
        break;

      case "Restart":
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        this.player.restart();
        break;

      case "AutoPickup": {
        // Replay path: find the deferred-autopickup item by position+kind and pick it up.
        // During normal play this action is never routed here — it's recorded directly from
        // the chest-reveal timer and the timer calls autoPickup() itself.
        try {
          const room = (this.player as any).getRoom?.();
          if (!room) break;
          const item = room.items?.find?.(
            (i: any) =>
              i.x === action.itemX && i.y === action.itemY && i.name === action.itemKind,
          );
          if (item) {
            (item as any).inChest = false;
            item.onPickup(this.player);
          }
        } catch {}
        break;
      }
    }
  }
}
