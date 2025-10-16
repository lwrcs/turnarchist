import { Item } from "../item";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { Equippable } from "../equippable";
import { Candle } from "./candle";
import { Torch } from "./torch";
import { Light } from "./light";
import { Coal } from "../resource/coal";

export class Lantern extends Light {
  fuelCap: number;
  static itemName = "lantern";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.fuel = 250;
    this.tileX = 29;
    this.tileY = 0;
    this.fuelCap = 250;
    this.name = "lantern";
    this.canRefuel = true;
    this.maxBrightness = 20;
    this.minBrightness = 5;
    this.radius = 7;
    this.broken = this.fuel <= 0 ? true : false;
  }

  getDescription = () => {
    const percentage = Math.round((this.fuel / this.fuelCap) * 100);
    return `LANTERN - Fuel: ${percentage}%, Capacity: ${this.fuelCap / 50}`;
  };

  // Auto-refuel the lantern using Coal from the wielder's inventory; supports partial refuel
  protected tryAutoRefuel = (): boolean => {
    if (!this.wielder || !this.canRefuel) return false;
    const inventory = this.wielder.inventory;
    const coalItem = inventory?.hasItem?.(Coal);
    if (!(coalItem instanceof Coal)) return false;

    const missing = Math.max(0, this.fuelCap - this.fuel);
    if (missing <= 0) return false;

    // Each coal unit provides 25 fuel; use as many as needed up to missing
    const fuelPerCoal = 25;
    const availableCoalUnits = Math.max(0, coalItem.stackCount);
    const unitsNeeded = Math.ceil(missing / fuelPerCoal);
    const unitsToUse = Math.min(availableCoalUnits, unitsNeeded);
    if (unitsToUse <= 0) return false;

    const fuelAdded = unitsToUse * fuelPerCoal;
    this.fuel = Math.min(this.fuel + fuelAdded, this.fuelCap);
    coalItem.stackCount -= unitsToUse;

    if (coalItem.stackCount <= 0) {
      inventory.removeItem(coalItem);
    }

    this.broken = this.fuel <= 0;
    this.wielder.game.pushMessage(
      `You refuel your lantern with ${unitsToUse} coal.`,
    );
    return true;
  };
}
