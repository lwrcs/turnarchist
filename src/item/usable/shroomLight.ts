import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Usable } from "./usable";
import { Sound } from "../../sound/sound";
import { Light } from "../light/light";

export class ShroomLight extends Light {
  static itemName = "glowshrooms";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.fuel = 100;
    this.tileX = 7;
    this.tileY = 2;

    this.name = ShroomLight.itemName;
    this.fuelCap = 100;
    this.radius = 10;
    this.stackable = true;
    this.maxBrightness = 2;
    //teal blue green rgb 0-255
    this.color = [5, 100, 150];
    this.waterproof = true;
    this.falloffDecay = 0.7;
  }

  getDescription = (): string => {
    return "GLOWSHROOMS\nGives off a faint blue glow";
  };
}
