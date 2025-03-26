import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room/room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Usable } from "./usable";
import { Lantern } from "./lantern";
import { Light } from "./light";

export class Coal extends Usable {
  static itemName = "coal";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 17;
    this.tileY = 0;
    this.stackable = true;
    this.stackCount = Math.ceil(Math.random() * 7 + 3);
    this.name = Coal.itemName;
    this.description = "A piece of coal. Fuels lantern.";
    this.canUseOnOther = true;
  }
  onUse = (player: Player) => {
    let l = player.inventory.hasItem(Lantern);
    if (l instanceof Lantern) {
      if (l.fuel <= l.fuelCap - 50) {
        player.game.pushMessage("You add some fuel to your lantern.");
        this.stackCount -= 1;
        if (this.stackCount <= 0) {
          player.inventory.removeItem(this);
        }
      }
    }
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Light) {
      if (other.canRefuel && other.fuel <= 0 && other.broken) {
        let amountToRefuel = Math.min(this.stackCount * 25, other.fuelCap);
        other.fuel += amountToRefuel;
        this.stackCount -= amountToRefuel / 25;
        other.broken = false;
        this.level.game.pushMessage(
          `You add refuel your ${other.name} with ${amountToRefuel / 25} coal.`,
        );

        if (this.stackCount <= 0) player.inventory.removeItem(this);
      }
    }
  };
}
