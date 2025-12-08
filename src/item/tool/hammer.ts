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
import { GoldBar } from "../resource/goldBar";
import { Random } from "../../utility/random";
import { FishingRod } from "./fishingRod";
import { GoldOre } from "../resource/goldOre";
import { IronOre } from "../resource/ironOre";
import { IronBar } from "../resource/ironBar";
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
    const room = (player as any)?.getRoom
      ? (player as any).getRoom()
      : this.level.game.rooms[player.levelID];
    if (room === this.level.game.room) Sound.heal();

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
    } else if (other.name === "gold bar") {
      let goldBar = other as GoldBar;
      goldBar.smith(player);
    } else if (other.name === "gold ore") {
      let gold = other as GoldOre;
      gold.smelt(player);
    } else if (other.name === "fishing rod") {
      let fishingRod = other as FishingRod;
      fishingRod.disassemble();
    } else if (other.name === "iron bar") {
      let ironBar = other as IronBar;
      ironBar.smith(player);
    } else if (other.name === "iron ore") {
      let iron = other as IronOre;
      iron.smelt(player);
    }
  };

  disassemble = (player: Player) => {
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.ceil(Random.rand() * 5 + 5);
    player.inventory.removeItem(this);
    player.inventory.addItem(
      new WeaponFragments(this.level, inventoryX, inventoryY, numFragments),
    );
  };
}
