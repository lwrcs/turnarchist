import { Projectile } from "./projectile";
import { Game } from "../game";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { Player } from "../player/player";
import { HitWarning } from "../drawable/hitWarning";
import { Lighting } from "../lighting/lighting";
import { Utils } from "../utility/utils";
import { Entity } from "../entity/entity";
import { Bomb } from "../entity/object/bomb";
export class Explosion extends Projectile {
  state: number;
  frame: number;
  delay: number;
  parent: Entity;
  offsetFrame: number;

  constructor(entity: Entity, x: number, y: number, playerHitBy: Player) {
    super(entity, x, y);
    this.state = 0;
    this.frame = 6;
    this.parent = entity;
    this.offsetFrame =
      -Utils.distance(this.parent.x, this.parent.y, this.x, this.y) * 100;
    this.delay = 0;
    Lighting.momentaryLight(
      this.parent.room,
      this.x + 0.5,
      this.y + 0.5,
      0.5,
      [255, 100, 0],
      350,
      20,
      Math.abs(this.offsetFrame),
    );
    const distance = Utils.distance(
      this.parent.x,
      this.parent.y,
      this.x,
      this.y,
    );

    const damage =
      distance === 0 ? 1 : Math.max(0.5, Math.floor((1 / distance) * 6) / 2);
    for (const entity of this.parent.room.entities) {
      // Z: explosion only affects entities on the same z-layer as the source.
      if ((entity?.z ?? 0) !== (this.z ?? 0)) continue;
      if (
        entity.x === this.x &&
        entity.y === this.y &&
        entity !== this.parent
      ) {
        if (entity instanceof Bomb) {
          entity.fuseLength = 1;
        }
        entity.hurt(playerHitBy, damage);
      }
    }

    // Z/room: only hurt the player if they're on the same z and in the same room.
    try {
      const playerRoom = playerHitBy?.getRoom
        ? playerHitBy.getRoom()
        : this.parent?.room?.game?.rooms?.[playerHitBy.levelID];
      if (
        playerRoom === this.parent.room &&
        (playerHitBy?.z ?? 0) === (this.z ?? 0) &&
        playerHitBy.x === this.x &&
        playerHitBy.y === this.y
      ) {
        playerHitBy.hurt(damage, "bomb", { source: { x: this.x, y: this.y } });
      }
    } catch {}
  }
  drawTopLayer = (delta: number) => {
    if (this.dead) return;
    if (this.offsetFrame < 0) this.offsetFrame += 10 * delta;
    if (this.offsetFrame >= 0) {
      this.frame += 0.25 * delta;
    }

    if (this.frame > 17) this.dead = true;
    Game.drawFX(Math.floor(this.frame), 6, 1, 2, this.x, this.y - 1, 1, 2);
  };
}
