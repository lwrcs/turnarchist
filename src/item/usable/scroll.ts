import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Usable } from "./usable";
import { Spellbook } from "../weapon/spellbook";
import { CrossSpell, PointSpell, PlusSpell, WaveSpell, type Spell } from "../weapon/spell";
import { SpellbookPage } from "./spellbookPage";
import { Random } from "../../utility/random";

export class Scroll extends Usable {
  spell: Spell;
  static itemName = "scroll";
  static examineText = "A rolled scroll inscribed with arcane patterns.";

  constructor(level: Room, x: number, y: number, spell: Spell) {
    super(level, x, y);
    this.spell = spell;
    this.name = `Scroll of ${spell.name}`;
    this.tileX = 26;
    this.tileY = 2;
    this.canUseOnOther = false;
    this.description = `A scroll containing the ${spell.name} spell pattern.`;
  }

  onUse = (player: Player) => {
    const book = player.inventory.items.find(
      (i) => i instanceof Spellbook,
    ) as Spellbook | undefined;
    if (!book) {
      player.game.pushMessage(
        "You have no spellbook to inscribe this scroll into.",
      );
      return;
    }
    const alreadyKnown = player.knownSpells.includes(this.spell.id);
    if (alreadyKnown) {
      const pageCount = Math.ceil(Random.rand() * 3);
      const existingPages = player.inventory.items.find((i) => i instanceof SpellbookPage) as SpellbookPage | undefined;
      if (existingPages) {
        existingPages.stackCount += pageCount;
        player.inventory.removeItem(this);
      } else {
        const pages = new SpellbookPage(this.level, this.x, this.y, pageCount);
        const idx = player.inventory.items.indexOf(this);
        if (idx !== -1) {
          player.inventory.items[idx] = pages;
        } else {
          player.inventory.addItem(pages);
        }
      }
      player.game.pushMessage(
        `You already know the ${this.spell.name} spell. The scroll crumbles into ${pageCount} spellbook page${pageCount > 1 ? "s" : ""}.`,
      );
      return;
    }
    player.addKnownSpell(this.spell.id);
    player.syncSpellbooksFromKnownSpells();
    player.game.pushMessage(
      `You study the scroll and inscribe its knowledge into your spellbook.`,
    );
    player.inventory.removeItem(this);
  };
}

export class WaveScroll extends Scroll {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y, new WaveSpell());
  }
}

export class CrossScroll extends Scroll {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y, new CrossSpell());
  }
}

export class PointScroll extends Scroll {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y, new PointSpell());
  }
}

export class PlusScroll extends Scroll {
  constructor(level: Room, x: number, y: number) {
    super(level, x, y, new PlusSpell());
  }
}
