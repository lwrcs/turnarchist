import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "../usable/usable";
import { Weapon } from "../weapon/weapon";
import { Dagger } from "../weapon/dagger";
import { WeaponFragments } from "../usable/weaponFragments";
import { Geode } from "../resource/geode";
import { Pickaxe } from "./pickaxe";
export class Hammer extends Usable {
  static itemName = "hammer";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 21;
    this.tileY = 2;
    this.offsetY = -0.3;
    this.canUseOnOther = true;
    this.description = "useful for breaking weapons down into fragments";
    this.name = Hammer.itemName;
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Weapon && other.name !== "dagger") {
      other.disassemble();
    } else if (other.name === "dagger") {
      this.level.game.pushMessage(
        `You probably shouldn't disassemble your dagger...`,
      );
    } else if (other.name === "hammer" && other !== this) {
      let hammer = other as Hammer;
      hammer.disassemble(player);
      this.level.game.pushMessage(`I only needed one of those anyways...`);
    } else if (other.name === "geode") {
      let geode = other as Geode;
      geode.split(player.inventory);
      this.level.game.pushMessage(`You hit the geode with the hammer.`);
    } else if (other.name === "pickaxe") {
      let pickaxe = other as Pickaxe;
      pickaxe.disassemble();
    }
  };

  disassemble = (player: Player) => {
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.ceil(Math.random() * 5 + 5);
    player.inventory.removeItem(this);
    player.inventory.addItem(
      new WeaponFragments(this.level, inventoryX, inventoryY, numFragments),
    );
  };
}
