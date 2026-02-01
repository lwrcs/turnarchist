import { Player } from "../../player/player";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";
import { Spellbook } from "../weapon/spellbook";

export class BluePotion extends Usable {
  static itemName = "mana potion";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 9;
    this.tileY = 0;
    this.offsetY = -0.3;
    this.name = BluePotion.itemName;
  }

  onUse = (player: Player) => {
    const spellbooks: Spellbook[] = [];
    for (const it of player.inventory.items) {
      if (it instanceof Spellbook) spellbooks.push(it);
    }
    // Defensive: equipped weapon should already be in items, but don't assume.
    const equipped = player.inventory.weapon;
    if (equipped instanceof Spellbook && !spellbooks.includes(equipped)) {
      spellbooks.push(equipped);
    }

    if (spellbooks.length === 0) {
      player.game.pushMessage("You don't have a spellbook.");
      return;
    }

    const hasCooldown = spellbooks.some((b) => b.cooldown > 0);
    if (!hasCooldown) {
      player.game.pushMessage("No spellbook is on cooldown.");
      return;
    }

    for (const b of spellbooks) {
      if (b.cooldown > 0) b.cooldown = 0;
    }

    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.playMagic();
    player.inventory.removeItem(this);

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  getDescription = () => {
    return "MANA POTION\nResets spellbook cooldowns";
  };
}
