import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Usable } from "../usable/usable";
import { Lantern } from "../light/lantern";
import { Light } from "../light/light";
import { Random } from "../../utility/random";

export class Coal extends Usable {
  static itemName = "coal";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 17;
    this.tileY = 0;
    this.stackable = true;
    this.stackCount = Math.ceil(Random.rand() * 7 + 3);
    this.name = Coal.itemName;
    this.description = "A piece of coal. Fuels lantern.";
    this.canUseOnOther = true;
  }
  onUse = (player: Player) => {
    let l = player.inventory.hasItem(Lantern);
    if (l instanceof Lantern) {
      const fuelPerCoal = 25;
      const missing = Math.max(0, l.fuelCap - l.fuel);
      if (missing <= 0) return;
      // Use 1 unit by default when using coal directly
      const unitsToUse = Math.min(1, this.stackCount);
      if (unitsToUse <= 0) return;
      const fuelAdded = Math.min(unitsToUse * fuelPerCoal, missing);
      l.fuel = Math.min(l.fuel + fuelAdded, l.fuelCap);
      this.stackCount -= unitsToUse;
      player.game.pushMessage("You add some fuel to your lantern.");
      if (this.stackCount <= 0) {
        player.inventory.removeItem(this);
      }
    }
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Light) {
      if (other.canRefuel) {
        const fuelPerCoal = 25;
        const missing = Math.max(0, other.fuelCap - other.fuel);
        if (missing <= 0) return;
        const unitsToUse = Math.min(
          this.stackCount,
          Math.ceil(missing / fuelPerCoal),
        );
        if (unitsToUse <= 0) return;
        const fuelAdded = Math.min(unitsToUse * fuelPerCoal, missing);
        other.fuel = Math.min(other.fuel + fuelAdded, other.fuelCap);
        this.stackCount -= unitsToUse;
        other.broken = other.fuel <= 0;
        this.level.game.pushMessage(
          `You refuel your ${other.name} with ${unitsToUse} coal.`,
        );
        if (this.stackCount <= 0) player.inventory.removeItem(this);
      }
    }
  };
}
