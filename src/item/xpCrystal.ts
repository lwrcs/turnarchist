import { Item } from "./item";
import type { Room } from "../room/room";
import { Random } from "../utility/random";
import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Shadow } from "../drawable/shadow";
import { Utils } from "../utility/utils";
import type { Player } from "../player/player";
import type { Skill } from "../game/skills";

export type XpCrystalType = "melee" | "magic" | "ranged";

type OrbitSpec = {
  tileX: number;
  tileY: number;
  orbitRotation: number;
  speed: number;
  phase: number;
  radius: number;
  ellipse: { rx: number; ry: number };
};

export class XpCrystal extends Item {
  static itemName = "xp crystal";
  static examineText = "A crystal of condensed experience.";

  readonly crystalType: XpCrystalType;

  private orbitT: number;
  private orbit: readonly OrbitSpec[];

  constructor(level: Room, x: number, y: number, crystalType: XpCrystalType) {
    super(level, x, y);
    this.crystalType = crystalType;

    // Placeholder coordinates on the image-particles tileset.
    // These are intentionally in the FX sheet so the look matches ImageParticle-style sprites.
    this.tileX = 9;
    this.tileY = 26;

    this.stackCount = 1;
    this.stackable = false;
    this.name = XpCrystal.itemName;

    // Keep the three orbiting sprites out of sync across instances.
    this.orbitT = Random.rand() * Math.PI * 2;
    const phaseA = Random.rand() * Math.PI * 2;
    const phaseB = Random.rand() * Math.PI * 2;
    const phaseC = Random.rand() * Math.PI * 2;

    this.orbit = [
      {
        tileX: this.tileX,
        tileY: this.tileY,
        orbitRotation: 0,
        speed: 0.085,
        phase: phaseA,
        radius: 0.22,
        ellipse: { rx: 1, ry: 0.65 },
      },
      {
        tileX: this.tileX + 1,
        tileY: this.tileY,
        orbitRotation: (Math.PI * 2) / 3,
        speed: 0.1,
        phase: phaseB,
        radius: 0.24,
        ellipse: { rx: 1, ry: 0.55 },
      },
      {
        tileX: this.tileX + 2,
        tileY: this.tileY,
        orbitRotation: (Math.PI * 4) / 3,
        speed: 0.115,
        phase: phaseC,
        radius: 0.2,
        ellipse: { rx: 1, ry: 0.75 },
      },
    ] as const;
  }

  get skillType(): Skill {
    // The crystal types are a strict subset of Skill.
    return this.crystalType;
  }

  wantsDrawOffset = (): boolean => {
    // Always render centered even when multiple items share a tile.
    return false;
  };

  private drawOrbitSprites = (
    centerX: number,
    centerY: number,
    shadeColor: string | undefined,
    shadeAmount: number,
  ) => {
    // Draw 3 sprites orbiting around a shared center, each with a distinct orbit rotation,
    // speed, and phase offset (out of sync).
    for (const o of this.orbit) {
      const a = this.orbitT * o.speed + o.phase;
      const localX = Math.cos(a) * o.radius * o.ellipse.rx;
      const localY = Math.sin(a) * o.radius * o.ellipse.ry;

      const c = Math.cos(o.orbitRotation);
      const s = Math.sin(o.orbitRotation);
      const dx = localX * c - localY * s;
      const dy = localX * s + localY * c;

      Game.drawFX(
        o.tileX,
        o.tileY,
        1,
        1,
        centerX + dx - 0.5,
        centerY + dy - 0.5,
        1,
        1,
        shadeColor,
        shadeAmount,
      );
    }
  };

  draw = (delta: number) => {
    Game.ctx.save();
    // Mirrors Item.draw: keep playing the float-up reveal even when the crystal
    // has been logically picked up from a chest, until the reveal completes and
    // drawAboveShading takes over the fly-to-inventory animation.
    if (!this.pickedUp || this.inChest) {
      Game.ctx.globalAlpha = this.alpha;
      if (this.alpha < 1) this.alpha += 0.01 * delta;
      this.drawableY = this.y;
      if (this.inChest) {
        this.chestOffsetY -= Math.abs(this.chestOffsetY + 0.5) * 0.035 * delta;
        if (this.chestOffsetY < -0.47) this.chestOffsetY = -0.5;
      }
      if (this.sineAnimateFactor < 1 && this.chestOffsetY < -0.45)
        this.sineAnimateFactor += 0.2 * delta;
      if (this.inChest && this.chestOffsetY <= -0.5 && this.sineAnimateFactor >= 1) {
        this.inChest = false;
        if (this.pickedUp && this.animateToInventory === true && this.player) {
          this.animStartX = this.x;
          this.animStartY = this.y;
          this.animTargetX = this.player.x;
          this.animTargetY = this.player.y;
          this.animT = 0;
          this.animStartDistance = null;
        }
      }

      if (this.scaleFactor > 0) {
        this.scaleFactor *= 0.5 ** delta;
        if (this.scaleFactor < 0.01) this.scaleFactor = 0;
      }

      const scale = 1 / (this.scaleFactor + 1);
      Game.ctx.imageSmoothingEnabled = false;
      Shadow.draw(this.x, this.y, 1, 1);

      // Keep orbit time stable and frame-rate independent.
      this.orbitT += delta;

      // Anchor the FX sprites like ImageParticles: center at tile center.
      // (Unlike 1x2 item sprites, these are 1x1, so don't apply the -1 tile offset.)
      const centerX = this.x + 0.5;
      const centerY =
        this.y +
        0.5 +
        this.chestOffsetY +
        this.sineAnimateFactor * Math.sin(this.frame) * 0.07;

      // Minor bob like items, but render using FX-sheet sprites.
      this.frame += (delta * (Math.PI * 2)) / 60;
      this.drawOrbitSprites(
        centerX,
        centerY,
        this.level.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  drawAboveShading = (delta: number) => {
    const baseAlpha = Game.ctx.globalAlpha;
    if (this.pickedUp && !this.inChest) {
      if (this.animateToInventory === true && this.player) {
        // Lerp towards the inventory button with ease-out.
        const speed = 0.025 * delta;
        this.animT = Math.min(1, this.animT + speed);
        const t = Math.pow(this.animT, 2);
        const posX =
          this.animStartX * (1 - t) +
          this.animTargetX * t +
          (this.player.x - this.animTargetX - this.player.drawX) * t +
          this.drawOffset;
        const posY =
          this.animStartY * (1 - t) +
          this.animTargetY * t +
          (this.player.y - this.animTargetY - this.player.drawY) * t +
          this.chestOffsetY;

        if (this.animStartDistance === null) {
          this.animStartDistance = Utils.distance(
            this.player.x - this.player.drawX,
            this.player.y - this.player.drawY,
            posX,
            posY,
          );
        }
        const distance = Math.abs(
          Utils.distance(
            this.player.x - this.player.drawX,
            this.player.y - this.player.drawY,
            posX,
            posY,
          ),
        );

        const fadeStart = 0.5;
        if (t > fadeStart) {
          const k = (t - fadeStart) / (1 - fadeStart);
          this.alpha = Math.max(
            1 - k,
            Math.abs(distance / this.animStartDistance),
          );
        }

        if (GameConstants.ALPHA_ENABLED)
          Game.ctx.globalAlpha = baseAlpha * Math.max(0, this.alpha);

        // Keep orbit time stable while animating.
        this.orbitT += delta;

        // Render FX sprites near the inventory button; keep the same vertical offset
        // as items so it visually "flies into" the UI.
        this.drawOrbitSprites(
          posX + 0.5,
          posY + 0.5,
          this.level.shadeColor,
          this.shadeAmount(),
        );

        Game.ctx.globalAlpha = baseAlpha;
        this.x = Math.floor(posX);
        this.y = Math.floor(posY);

        if (this.animT >= 1) {
          this.level.items = this.level.items.filter((x) => x !== this);
        }
        return;
      }
      return;
    }
    Game.ctx.globalAlpha = baseAlpha;
  };
}

export class MeleeXpCrystal extends XpCrystal {
  static itemName = "melee xp crystal";
  static examineText = "A crystal humming with martial memory.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y, "melee");
    this.name = MeleeXpCrystal.itemName;
  }
}

export class MagicXpCrystal extends XpCrystal {
  static itemName = "magic xp crystal";
  static examineText = "A crystal crackling with arcane insight.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y, "magic");
    this.name = MagicXpCrystal.itemName;
  }
}

export class RangedXpCrystal extends XpCrystal {
  static itemName = "ranged xp crystal";
  static examineText = "A crystal vibrating with steady aim.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y, "ranged");
    this.name = RangedXpCrystal.itemName;
  }
}
