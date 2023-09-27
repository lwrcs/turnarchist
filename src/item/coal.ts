import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Usable } from "./usable";
import { Lantern } from "./lantern";

export class Coal extends Usable {
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);

    this.tileX = 17;
    this.tileY = 0;
    this.stackable = true;
  }
  onUse = (player: Player) => {
    let l = player.inventory.hasItem(Lantern);
    if (l instanceof Lantern) {
      if (l.fuel <= l.fuelCap - 50) {
        l.addFuel(50);
        player.game.pushMessage("You add some fuel to your lantern.");
        this.stackCount -= 1;
        if (this.stackCount <= 0) {
          player.inventory.removeItem(this);
        }
      }
    }
  };

  getDescription = (): string => {
    return "COAL\nA lump of coal.";
  };
}
