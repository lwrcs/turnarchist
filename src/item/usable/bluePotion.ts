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
    // Mana is derived from spellbook cooldown. This potion reduces that cooldown.
    const spellbooks: Spellbook[] = [];
    for (const it of player.inventory.items) {
      if (it instanceof Spellbook) spellbooks.push(it);
    }
    const equipped = player.inventory.weapon;
    if (equipped instanceof Spellbook && !spellbooks.includes(equipped)) {
      spellbooks.push(equipped);
    }

    if (spellbooks.length === 0) {
      player.game.pushMessage("You don't have a spellbook.");
      return;
    }

    const maxCooldown = Math.max(0, ...spellbooks.map((b) => b.cooldown || 0));
    if (maxCooldown <= 0) {
      player.game.pushMessage("Mana is already full.");
      return;
    }

    const restore = 5;
    for (const b of spellbooks) {
      if (b.cooldown > 0) b.cooldown = Math.max(0, b.cooldown - restore);
    }
    player.syncManaFromSpellbookCooldowns();

    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.playMagic();
    player.inventory.removeItem(this);

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  getDescription = () => {
    return "MANA POTION\nRestores mana";
  };
}
