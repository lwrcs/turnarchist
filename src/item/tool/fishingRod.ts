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
import { Gold } from "../resource/gold";
export class FishingRod extends Item {
  static itemName = "fishing rod";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 31;
    this.tileY = 2;
    this.offsetY = -0.1;
    this.description = "useful for catching fish";
    this.name = FishingRod.itemName;
  }
}
