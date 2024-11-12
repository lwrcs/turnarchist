import { Item } from "./item";
import { Game } from "../game";
import { Room } from "../room";
import { Equippable } from "./equippable";
import { Candle } from "./candle";
import { Lantern } from "./lantern";
import { Torch } from "./torch";
import { PostProcessor } from "../postProcess";
import { GameConstants } from "../gameConstants";
import { LightSource } from "../lightSource";

export class Light extends Equippable {
  fuel: number;
  fuelCap: number;
  maxRadius: number;
  minRadius: number;
  static warmEnabled = false;
  static warmth = 0;
  static maxWarmth = 0.2;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
    this.fuel = 0;
    this.fuelCap = 250;
    this.maxRadius = 6;
    this.minRadius = 2;
  }

  updateLighting = () => {
    this.wielder.game.rooms[this.wielder.levelID].updateLighting();
  };

  get fuelPercentage() {
    return this.fuel / this.fuelCap;
  }

  isIgnited = () => {
    if (this.fuel > 0 && this.equipped) {
      return true;
    }
    return false;
  };

  setRadius = () => {
    this.wielder.sightRadius =
      this.wielder.defaultSightRadius + this.fuelPercentage * this.maxRadius;
  };

  toggleEquip = () => {
    this.equipped = !this.equipped;
    if (this.isIgnited()) {
      this.setRadius();
      this.wielder.lightEquipped = true;
      //Light.warmEnabled = true;
    } else {
      this.resetRadius();
      this.wielder.lightEquipped = false;
      //Light.warmEnabled = false;
    }
    this.updateLighting();
  };

  coEquippable = (other: Light): boolean => {
    return !(other instanceof Light);
  };

  resetRadius = () => {
    this.wielder.sightRadius = this.wielder.defaultSightRadius;
  };

  burn = () => {
    if (this.fuel <= 0) {
      this.wielder.game.pushMessage(`${this.name} depletes.`);
      this.resetRadius();
      this.wielder.lightEquipped = false;
      this.wielder.inventory.removeItem(this);
      this.updateLighting();
    } else if (this.isIgnited()) {
      this.fuel--;
      this.setRadius();
    }
  };

  tickInInventory = () => {
    this.burn();
  };

  getDescription = () => {
    return `${this.name}: ${this.fuelPercentage * 100}%`;
  };

  static drawTint = (delta: number) => {
    const warmthChange = 0.02 * delta;
    if (Light.warmth <= Light.maxWarmth && Light.warmEnabled) {
      Light.warmth += warmthChange;
    }
    if (Light.warmth > 0 && !Light.warmEnabled) {
      Light.warmth -= warmthChange;
    }
    if (Light.warmth < 0) Light.warmth = 0;
    if (Light.warmth > Light.maxWarmth) Light.warmth = Light.maxWarmth;
    Game.ctx.globalAlpha = Light.warmth;
    Game.ctx.globalCompositeOperation = "overlay";
    Game.ctx.fillStyle = "#FF8C00"; // reddish orange red
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.globalCompositeOperation = "source-over";
  };
}
