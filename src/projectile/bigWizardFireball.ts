import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { Player } from "../player/player";
import { HitWarning } from "../drawable/hitWarning";
import { LightSource } from "../lighting/lightSource";
import { Lighting } from "../lighting/lighting";
import { Utils } from "../utility/utils";
import { Random } from "../utility/random";

export class BigWizardFireball extends Projectile {
  state: number;
  frame: number;
  parent: WizardEnemy;
  delay: number;

  constructor(parent: WizardEnemy, x: number, y: number) {
    super(parent, x, y);
    this.parent = parent;
    this.frame = 0;
    this.state = 0;
    this.lightSource = new LightSource(
      this.x + 1,
      this.y + 1,
      6,
      (parent as WizardEnemy).projectileColor,
      0.15,
    );
    this.parent.addLightSource(this.lightSource);
    this.hasBloom = true;
    this.bloomColor = Utils.rgbToHex(
      (this.parent as WizardEnemy).projectileColor[0],
      (this.parent as WizardEnemy).projectileColor[1],
      (this.parent as WizardEnemy).projectileColor[2],
    );
    this.bloomAlpha = 0.5;
    this.softBloomAlpha = 0;
  }

  tick = () => {
    if (this.parent.dead || this.state === 3) {
      this.parent.removeLightSource(this.lightSource);
      this.dead = true;
    }

    if (!this.dead && this.state === 0) {
      this.bloomAlpha = 1;
    }

    this.state++;

    if (!this.dead && this.state === 1) {
      this.bloomAlpha = 0.5;
      const lightSource = this.parent.room.lightSources.find(
        (ls) => ls === this.lightSource,
      );
      if (lightSource) lightSource.b = 0.4;
      // Hit warnings for the full 2×2 area
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          this.parent.room.hitwarnings.push(
            new HitWarning(
              this.parent.game,
              this.x + dx,
              this.y + dy,
              this.parent.x,
              this.parent.y,
              true,
            ),
          );
        }
      }
    }
    if (!this.dead && this.state === 2) {
      this.bloomAlpha = 0;
      Lighting.momentaryLight(
        this.parent.room,
        this.x + 0.5,
        this.y + 0.5,
        5,
        (this.parent as WizardEnemy).projectileColor,
        500,
        5,
        350,
      );
      this.parent.removeLightSource(this.lightSource);
      this.frame = 0;
      this.delay = Game.rand(0, 10, Random.rand);

      // Check extended tiles of the 2×2 area that the room won't check automatically.
      // The room only calls hitPlayer for the projectile's single (x, y) position.
      for (const pl of Object.values(this.parent.game.players)) {
        if (!pl) continue;
        if ((pl as any).getRoom?.() !== this.parent.room) continue;
        for (let dx = 0; dx < 2; dx++) {
          for (let dy = 0; dy < 2; dy++) {
            if (dx === 0 && dy === 0) continue; // (x, y) handled by room via hitPlayer
            if (pl.x === this.x + dx && pl.y === this.y + dy) {
              pl.hurt(1, this.parent.name, {
                source: { x: this.parent.x, y: this.parent.y },
              });
            }
          }
        }
      }
    }
  };

  hitPlayer = (player: Player) => {
    if (!this.dead && this.state === 2) {
      player.hurt(1, this.parent.name, {
        source: { x: this.parent.x, y: this.parent.y },
      });
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    if (this.state >= 0) {
      if (this.state === 0) {
        this.frame += 0.25 * delta;
        if (this.frame >= 4) this.frame = 0;
        Game.drawFX(
          11 + Math.floor(this.frame) * 2,
          18,
          2,
          2,
          this.x - 0.5,
          this.y - 0.5,
          2,
          2,
        );
      } else if (this.state === 1) {
        this.frame += 0.25 * delta;
        if (this.frame >= 4) this.frame = 0;
        Game.drawFX(
          11 + Math.floor(this.frame) * 2,
          18,
          2,
          2,
          this.x - 0.5,
          this.y - 0.7,
          2,
          2,
        );
      } else {
        if (this.delay > 0) {
          this.delay--;
          return;
        }
        this.frame += 0.3 * delta;
        if (this.frame > 17) this.dead = true;
        Game.drawFX(
          Math.floor(this.frame),
          6,
          1,
          2,
          this.x - 0.5,
          this.y - 2,
          2,
          4,
        );
      }
    }
  };
}
