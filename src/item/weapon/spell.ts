export type SpellPattern = {
  offsets: Array<{ dx: number; dy: number }>;
  delays: number[]; // parallel array — delay units per tile (0 = immediate)
};

export abstract class Spell {
  abstract id: string;
  abstract name: string;
  damage?: number;
  manaCost: number = 10;
  abstract getPattern(): SpellPattern;
}

export class PlusSpell extends Spell {
  id = "plus";
  name = "Plus";
  manaCost = 10;
  getPattern(): SpellPattern {
    return {
      offsets: [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ],
      delays: [0, 0, 0, 0, 0],
    };
  }
}

export class CrossSpell extends Spell {
  id = "cross";
  name = "Cross";
  manaCost = 10;
  getPattern(): SpellPattern {
    return {
      offsets: [
        { dx: 0, dy: 0 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: 1, dy: 1 },
      ],
      delays: [0, 0, 0, 0, 0],
    };
  }
}

export class PointSpell extends Spell {
  id = "point";
  name = "Point";
  damage = 2;
  manaCost = 5;
  getPattern(): SpellPattern {
    return {
      offsets: [{ dx: 0, dy: 0 }],
      delays: [0],
    };
  }
}

export class WaveSpell extends Spell {
  id = "wave";
  name = "Wave";
  manaCost = 20;
  getPattern(): SpellPattern {
    const offsets: Array<{ dx: number; dy: number }> = [];
    const delays: number[] = [];

    // Center: delay 0
    offsets.push({ dx: 0, dy: 0 });
    delays.push(0);

    // Inner 3×3 ring (8 tiles): delay 1
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        offsets.push({ dx, dy });
        delays.push(1);
      }
    }

    // Outer 5×5 ring without corners (12 tiles): delay 2
    // Corners would be (±2,±2); exclude those.
    const outerRing = [
      { dx: -1, dy: -2 }, { dx: 0, dy: -2 }, { dx: 1, dy: -2 },
      { dx: -2, dy: -1 },                     { dx: 2, dy: -1 },
      { dx: -2, dy:  0 },                     { dx: 2, dy:  0 },
      { dx: -2, dy:  1 },                     { dx: 2, dy:  1 },
      { dx: -1, dy:  2 }, { dx: 0, dy:  2 }, { dx: 1, dy:  2 },
    ];
    for (const o of outerRing) {
      offsets.push(o);
      delays.push(2);
    }

    return { offsets, delays };
  }
}

export const SPELL_REGISTRY: Record<string, Spell> = {
  plus: new PlusSpell(),
  cross: new CrossSpell(),
  point: new PointSpell(),
  wave: new WaveSpell(),
};

export const spellById = (id: string): Spell | null => SPELL_REGISTRY[id] ?? null;
