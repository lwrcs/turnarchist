import { Game } from "../game";
import { Weapon } from "./weapon";
import { Room } from "../room";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import { Crate } from "../entity/object/crate";
import { Barrel } from "../entity/object/barrel";

export class Warhammer extends Weapon {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 22;
    this.tileY = 2;
    this.damage = 2;
    this.name = "Warhammer";
  }
}