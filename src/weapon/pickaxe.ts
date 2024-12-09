import { Game } from "../game";
import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../entity/object/crate";
import { Barrel } from "../entity/object/barrel";

export class Pickaxe extends Weapon {
  static itemName = "pickaxe";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 30;
    this.tileY = 0;
    this.canMine = true;
  }
}
