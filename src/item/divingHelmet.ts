import { Room } from "../room/room";
import { Equippable } from "./equippable";

/**
 * Diving helmet keeps track of an internal air supply that only depletes when
 * the wielder is underwater. Player logic is responsible for deciding when to
 * consume or replenish air each turn.
 */
export class DivingHelmet extends Equippable {
  static itemName = "diving helmet";

  readonly maxAir: number;
  private _air: number;
  private readonly airDrainPerTurn: number;

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 4;
    this.tileY = 2;
    this.name = DivingHelmet.itemName;

    this.degradeable = false;
    this.iconOffset = 0.1; //default 0
    this.maxAir = 100;
    this._air = this.maxAir;
    this.airDrainPerTurn = 1;
  }

  get currentAir() {
    return this._air;
  }

  set currentAir(value: number) {
    this._air = Math.min(Math.max(value, 0), this.maxAir);
  }

  getDescription = (): string => {
    return `DIVING HELMET\nStores ${this.maxAir} turns of air for underwater travel.`;
  };

  onEquip = () => {
    this.refreshLighting();
  };

  onUnequip = () => {
    this.refreshLighting();
  };

  coEquippable = (other: Equippable): boolean => {
    // Only prevent multiple diving helmets from being active at once.
    return !(other instanceof DivingHelmet);
  };

  hasAir = (): boolean => {
    return this.currentAir > 0;
  };

  consumeAir = (amount: number = this.airDrainPerTurn): boolean => {
    if (!this.hasAir()) return false;

    this.currentAir = this.currentAir - amount;
    if (this.currentAir <= 0) {
      this.currentAir = 0;
      this.level.game.pushMessage("Your diving helmet runs out of air!");
    }

    return this.hasAir();
  };

  restoreAir = (amount: number) => {
    if (amount <= 0) return;
    const previousAir = this.currentAir;
    this.currentAir = Math.min(this.maxAir, this.currentAir + amount);
    if (previousAir === 0 && this.currentAir > 0) {
      this.level.game.pushMessage("The diving helmet refills with air.");
    }
  };

  refillCompletely = () => {
    this.currentAir = this.maxAir;
  };

  tickInInventory = () => {};

  private refreshLighting = () => {
    try {
      const room =
        (this.wielder as any)?.getRoom?.() ??
        this.wielder?.game?.rooms?.[this.wielder?.levelID];
      room?.updateLighting?.();
    } catch {}
  };
}
