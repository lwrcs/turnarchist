import { Player } from "./player";
import { PlayerAction } from "./playerAction";

export class PlayerActionProcessor {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  process(action: PlayerAction) {
    switch (action.type) {
      case "Move":
        this.player.movement.move(action.direction);
        break;

      case "MouseMove":
        this.player.movement.moveMouse(action.direction);
        break;
      case "OpenInventory":
        this.player.inventory.open();
        break;

      case "CloseInventory":
        this.player.inventory.close();
        break;

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
