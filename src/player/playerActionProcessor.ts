import { Player } from "./player";
import { PlayerAction } from "./playerAction";
import { Game } from "../game";

export class PlayerActionProcessor {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  process(action: PlayerAction) {
    // Record the action for replay
    try {
      (this.player.game as any).replayManager?.recordAction(action);
    } catch {}
    switch (action.type) {
      case "Move":
        this.player.movement.move(
          action.direction,
          action.targetX,
          action.targetY,
        );
        break;

      case "MouseMove":
        this.player.movement.moveMouse(
          action.direction,
          action.targetX,
          action.targetY,
        );
        break;
      case "OpenInventory":
        this.player.inventory.open();
        break;

      case "CloseInventory":
        this.player.inventory.close();
        break;

      case "InventoryLeft":
        this.player.inventory.leftQuickbar();
        break;

      case "InventoryRight":
        this.player.inventory.rightQuickbar();
        break;

      case "InventoryUse":
        this.player.inventory.spaceQuickbar();
        break;

      case "InventoryDrop":
        this.player.inventory.drop();
        break;

      case "InventorySelect": {
        const inv = this.player.inventory;
        const idx = Math.max(0, Math.min(action.index, inv.totalCapacity() - 1));
        inv.selX = idx % inv.cols;
        inv.selY = Math.floor(idx / inv.cols);
        inv.spaceQuickbar();
        break;
      }
      case "InventoryMove": {
        const from = Math.max(
          0,
          Math.min(
            action.fromIndex,
            this.player.inventory.cols *
              (this.player.inventory.rows +
                (this.player.inventory as any).expansion) -
              1,
          ),
        );
        const to = Math.max(
          0,
          Math.min(
            action.toIndex,
            this.player.inventory.cols *
              (this.player.inventory.rows +
                (this.player.inventory as any).expansion) -
              1,
          ),
        );
        const item = this.player.inventory.items[from];
        if (item) {
          const existing = this.player.inventory.items[to];
          this.player.inventory.items[from] = existing;
          this.player.inventory.items[to] = item;
        }
        break;
      }

      case "Restart":
        this.player.restart();
        break;

      case "Attack":
        // TODO: Route to PlayerCombat module once it's ready
        console.warn("Attack action received but not yet implemented.");
        break;

      case "Interact":
        this.player.tryMove(action.target.x, action.target.y); // will replace with cleaner interaction API later
        break;
    }
  }
}
