import { Game } from "../game";
import { Room } from "../room";
import { Equippable } from "./equippable";
import { GameConstants } from "../gameConstants";
import { Utils } from "../utils";

export abstract class Light extends Equippable {
  fuel: number;
  fuelCap: number;
  radius: number;
  maxBrightness: number;
  minBrightness: number;
  canRefuel: boolean = false;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
    this.fuel = 0;
    this.fuelCap = 250;
    this.maxBrightness = 2;
    this.minBrightness = 0.3;
    this.radius = 6;
    this.equipped = false;
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
    if (this.fuel > 0) {
      this.equipped = !this.equipped;
      if (this.isIgnited()) {
        this.setRadius();
        this.wielder.lightEquipped = true;
      } else {
        this.resetRadius();
        this.wielder.lightEquipped = false;
      }
    } else {
      this.wielder.game.pushMessage(
        "I'll need some fuel before I can use this",
      );
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
    // Handle active burning
    if (this.isIgnited()) {
      this.fuel--;
      this.setRadius();
    }

    // Handle depleted fuel
    if (this.fuel <= 0) {
      if (this.stackable) {
        this.stackCount--;
        this.fuel = this.fuelCap;
      }

      // Check if item should be removed after stack reduction
      if (this.equipped) {
        if (
          (this.stackable && this.stackCount <= 0) ||
          (!this.stackable && !this.canRefuel)
        ) {
          this.resetRadius();
          this.wielder.lightEquipped = false;
          this.wielder.inventory.removeItem(this);
          this.wielder.game.pushMessage(`${this.name} depletes.`);
        } else if (this.canRefuel) {
          this.wielder.game.pushMessage(`${this.name} depletes.`);
          this.equipped = false;
          this.resetRadius();
          this.wielder.lightEquipped = false;
          this.broken = true;
        }

        this.updateLighting();
      }
    }
  };

  drawDurability = (x: number, y: number) => {
    if (this.fuel < this.fuelCap) {
      // Calculate durability ratio (1 = full, 0 = broken)
      const durabilityRatio = this.fuel / this.fuelCap;

      // Map durability ratio to hue (120 = green, 0 = red)
      let color = Utils.hsvToHex(
        120 * durabilityRatio, // Hue from 120 (green) to 0 (red)
        1, // Full saturation
        1, // Full value
      );

      const iconWidth = GameConstants.TILESIZE;
      const barWidth = durabilityRatio * iconWidth;
      const barHeight = 2; // 2 pixels tall

      // Calculate the position of the durability bar
      const barX = x * GameConstants.TILESIZE;
      const barY = y * GameConstants.TILESIZE + GameConstants.TILESIZE - 2;

      // Set the fill style for the durability bar
      Game.ctx.fillStyle = color;
      // Set the interpolation mode to nearest neighbor
      Game.ctx.imageSmoothingEnabled = false;

      // Draw the durability bar
      Game.ctx.fillRect(barX, barY, barWidth, barHeight);

      // Reset fill style to default
      Game.ctx.fillStyle = "white";
    }
  };

  tickInInventory = () => {
    this.burn();
  };

  getDescription = () => {
    return `${this.name}: ${Math.ceil(this.fuelPercentage * 100)}%`;
  };
}
