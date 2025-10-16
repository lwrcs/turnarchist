import { Item } from "../item";
import { Player } from "../../player/player";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "../usable/usable";

import { WeaponFragments } from "../usable/weaponFragments";

import { Random } from "../../utility/random";
import { Crossbow } from "./crossbow";
export class CrossbowBolt extends Usable {
  static itemName = "crossbow bolt";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 21;
    this.tileY = 4;
    this.offsetY = -0.3;
    this.canUseOnOther = true;
    this.description = "useful for shooting with a crossbow";
    this.stackable = true;
    this.stackCount = Math.ceil(Random.rand() * 10) + 5;
    this.name = CrossbowBolt.itemName;
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
    if (other instanceof Crossbow) {
      if (other.addBolt()) {
        this.stackCount--;
        if (this.stackCount <= 0) player.inventory.removeItem(this);
      }
    }
  };

  disassemble = (player: Player) => {
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.ceil(Random.rand() * 2 + 3);
    player.inventory.removeItem(this);
    player.inventory.addItem(
      new WeaponFragments(this.level, inventoryX, inventoryY, numFragments),
    );
  };
}
