import { Player } from "../../player/player";
import { Room } from "../../room/room";
import { FloatingTextPopup } from "../../particle/floatingTextPopup";
import { Equippable } from "../equippable";
import { Sound } from "../../sound/sound";

export class EmeraldRing extends Equippable {
  static itemName = "emerald ring";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 11;
    this.tileY = 2;
    this.name = EmeraldRing.itemName;
    this.stackable = false;
    this.description = "A ring of emerald. Shatters to save you from death.";
  }

  /** Called when the player would die. Returns true if the ring saved the player. */
  onDeathSave(player: Player): boolean {
    if (!this.equipped) return false;
    if (!player.game.teleportPlayerToUpLadder(player)) return false;

    player.health = 1;
    player.inventory.removeItem(this);

    player.game.pushMessage("The emerald ring shatters, saving your life!");
    Sound.breakRock();

    player.game.room.particles.push(
      new FloatingTextPopup({ room: player.game.room, anchor: player, text: "Saved!", color: "#00ff50" }),
    );

    return true;
  }
}
