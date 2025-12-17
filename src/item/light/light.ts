import { Game } from "../../game";
import { Room } from "../../room/room";
import { Equippable } from "../equippable";
import { GameConstants } from "../../game/gameConstants";
import { Utils } from "../../utility/utils";
import { LevelConstants } from "../../level/levelConstants";

export abstract class Light extends Equippable {
  fuel: number;
  fuelCap: number;
  radius: number;
  maxBrightness: number;
  minBrightness: number;
  canRefuel: boolean = false;
  waterproof: boolean;
  color: [number, number, number];
  // Field of view in degrees for this light; defaults to full circle
  fov: number;
  // Controls how quickly light intensity decays; lower = slower falloff
  falloffDecay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 0;
    this.fuel = 0;
    this.fuelCap = 250;
    this.maxBrightness = 5;
    this.minBrightness = 2;
    this.radius = 6;
    this.equipped = false;
    this.color = LevelConstants.TORCH_LIGHT_COLOR;
    this.waterproof = false;
    this.fov = GameConstants.DEFAULT_LIGHTING_FOV_DEGREES ?? 360;
    this.falloffDecay = 1;
  }

  updateLighting = () => {
    const room = this.wielder?.getRoom
      ? this.wielder.getRoom()
      : this.wielder.game.rooms[this.wielder.levelID];
    room?.updateLighting();
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

  dropFromInventory = () => {
    console.log("onDrop");
    if (this.equipped) {
      this.toggleEquip();
    }
  };

  setRadius = () => {
    this.wielder.sightRadius = this.radius + this.fuelPercentage * this.radius;
  };

  setBrightness = () => {
    this.wielder.lightBrightness =
      this.minBrightness + this.fuelPercentage * this.maxBrightness;
  };

  toggleEquip = () => {
    if (this.fuel > 0) {
      if (this.enforceUnderwaterRestrictions()) {
        this.wielder.game.pushMessage?.("You can't use this underwater.");

        return;
      }
      this.equipped = !this.equipped;

      if (this.isIgnited()) {
        //this.setRadius();
        this.setBrightness();
        this.wielder.lightEquipped = true;
        this.wielder.lightColor = this.color;
        this.setFov();
        this.setFalloff();
      } else {
        //this.resetRadius();
        this.resetBrightness();
        this.wielder.lightEquipped = false;
        this.wielder.lightColor = LevelConstants.AMBIENT_LIGHT_COLOR;
        this.resetFov();
        this.resetFalloff();
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

  resetBrightness = () => {
    this.wielder.lightBrightness = 0.5;
  };

  setFov = () => {
    if (!this.wielder) return;
    this.wielder.lightFov = this.fov ?? GameConstants.DEFAULT_LIGHTING_FOV_DEGREES;
  };

  resetFov = () => {
    if (!this.wielder) return;
    this.wielder.lightFov = GameConstants.DEFAULT_LIGHTING_FOV_DEGREES;
  };

  setFalloff = () => {
    if (!this.wielder) return;
    this.wielder.lightFalloffDecay = this.falloffDecay ?? 1;
  };

  resetFalloff = () => {
    if (!this.wielder) return;
    this.wielder.lightFalloffDecay = 1;
  };

  burn = () => {
    if (this.enforceUnderwaterRestrictions()) {
      return;
    }

    // Handle active burning, don't burn fuel in empty rooms
    if (this.isIgnited()) {
      const room = (this.wielder as any)?.getRoom
        ? (this.wielder as any).getRoom()
        : this.wielder.game.rooms[this.wielder.levelID];
      const roomCleared = room.roomCleared();
      if (!roomCleared) this.fuel--;
      else this.fuel -= 0.2;

      this.setRadius();
      this.setBrightness();
    }

    // Handle depleted fuel
    if (this.fuel <= 0) {
      // Attempt auto-refuel for refuelable lights (e.g., lanterns)
      if (this.canRefuel) {
        const refueled = this.tryAutoRefuel?.() === true;
        if (refueled) {
          // Ensure lighting updates after refuel
          this.setRadius();
          this.setBrightness();
          this.setFov();
          this.setFalloff();
          this.updateLighting();
          return;
        }
      }
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
          this.resetFov();
          this.resetFalloff();
        } else if (this.canRefuel) {
          this.wielder.game.pushMessage(`${this.name} depletes.`);
          this.equipped = false;
          this.resetRadius();
          this.wielder.lightEquipped = false;
          this.broken = true;
          this.resetFov();
          this.resetFalloff();
        }

        this.updateLighting();
      }
    }
  };

  // Hook for auto-refuelable lights; subclasses can override
  protected tryAutoRefuel(): boolean {
    return false;
  }

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

  protected getCurrentRoom(): Room | undefined {
    if (!this.wielder) {
      return undefined;
    }
    const wielderAny = this.wielder as any;
    if (typeof wielderAny.getRoom === "function") {
      return wielderAny.getRoom();
    }
    return this.wielder.game.rooms[this.wielder.levelID];
  }

  protected enforceUnderwaterRestrictions(): boolean {
    if (!this.wielder || this.waterproof) {
      return false;
    }

    const room = this.getCurrentRoom();
    const underwater = room?.underwater === true;

    if (underwater && this.equipped) {
      this.equipped = false;
      this.resetRadius();
      this.resetBrightness();
      this.wielder.lightEquipped = false;
      this.wielder.lightColor = LevelConstants.AMBIENT_LIGHT_COLOR;
      this.resetFov();
      this.resetFalloff();
      this.wielder.game.pushMessage?.(`${this.name} fizzles out underwater.`);
      this.updateLighting();
    }
    return underwater;
  }
}
