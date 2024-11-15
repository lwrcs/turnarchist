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
  radius: number;
  maxBrightness: number;
  minBrightness: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
    this.fuel = 0;
    this.fuelCap = 250;
    this.maxBrightness = 2;
    this.minBrightness = 0.3;
    this.radius = 6;
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
      this.wielder.defaultSightRadius + this.fuelPercentage * this.radius;
  };

  setBrightness = () => {
    this.wielder.lightBrightness =
      this.minBrightness + this.fuelPercentage * this.maxBrightness;
  };

  toggleEquip = () => {
    this.equipped = !this.equipped;
    if (this.isIgnited()) {
      this.setRadius();
      this.wielder.lightEquipped = true;
    } else {
      this.resetRadius();
      this.wielder.lightEquipped = false;
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
}
