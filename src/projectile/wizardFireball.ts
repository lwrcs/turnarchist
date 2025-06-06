import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { Player } from "../player/player";
import { HitWarning } from "../drawable/hitWarning";
import { Entity } from "../entity/entity";
import { Enemy } from "../entity/enemy/enemy";
import { LightSource } from "../lighting/lightSource";
import { Lighting } from "../lighting/lighting";
import { Utils } from "../utility/utils";

export class WizardFireball extends Projectile {
  state: number;
  frame: number;
  parent: WizardEnemy;
  delay: number;
  frameOffset: number;
  offsetX: number;
  hitWarning: HitWarning;
  tileX: number;
  tileY: number;

  constructor(parent: WizardEnemy, x: number, y: number) {
    super(parent, x, y);
    this.tileY = parent.name === "wizard bomber" ? 7 : 8;
    this.parent = parent;
    this.frame = 0;
    this.state = 0; // this.distanceToParent;
    this.lightSource = new LightSource(
      this.x + 0.5,
      this.y + 0.5,
      4,
      (parent as WizardEnemy).projectileColor,
      0.1,
    );
    this.parent.addLightSource(this.lightSource);
    //this.parent.room.updateLighting();
    this.hasBloom = true;
    this.bloomColor = Utils.rgbToHex(
      (this.parent as WizardEnemy).projectileColor[0],
      (this.parent as WizardEnemy).projectileColor[1],
      (this.parent as WizardEnemy).projectileColor[2],
    );
    this.bloomAlpha = 0.5;
    this.softBloomAlpha = 0;
  }
  setMarkerFrame = () => {
    // Calculate offsetX based on direction
    this.offsetX = Math.floor(((this.dir + 1) % 8) / 2);
  };

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
      lightSource.b = 0.4;
      this.parent.room.hitwarnings.push(
        new HitWarning(
          this.parent.game,
          this.x,
          this.y,
          this.parent.x,
          this.parent.y,
          true,
        ),
      );
    }
    if (!this.dead && this.state === 2) {
      this.bloomAlpha = 0;
      Lighting.momentaryLight(
        this.parent.room,
        this.x,
        this.y,
        3,
        (this.parent as WizardEnemy).projectileColor,
        500,
        5,
        350,
      );
      this.parent.removeLightSource(this.lightSource);
      this.frame = 0;
      this.delay = Game.rand(0, 10, Math.random);
    }
  };

  hitPlayer = (player: Player) => {
    if (!this.dead && this.state === 2) {
      player.hurt(1, this.parent.name);
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    /*Game.drawFX(
      18 + this.offsetX, //+ Math.floor(HitWarning.frame),
      4,
      1,
      1,
      this.x,
      this.y,
      1,
      1
    );*/

    if (this.state >= 0) {
      if (this.state === 0) {
        this.frame += 0.25 * delta;
        if (this.frame >= 4) this.frame = 0;
        Game.drawFX(
          22 + Math.floor(this.frame),
          this.tileY,
          1,
          1,
          this.x,
          this.y,
          1,
          1,
        );
      } else if (this.state === 1) {
        this.frame += 0.25 * delta;
        if (this.frame >= 4) this.frame = 0;
        Game.drawFX(
          18 + Math.floor(this.frame),
          this.tileY,
          1,
          1,
          this.x,
          this.y - 0.2,
          1,
          1,
        );
      } else {
        if (this.delay > 0) {
          this.delay--;
          return;
        }
        this.frame += 0.3 * delta;
        if (this.frame > 17) this.dead = true;
        Game.drawFX(Math.floor(this.frame), 6, 1, 2, this.x, this.y - 1, 1, 2);
      }
    }
  };
}
