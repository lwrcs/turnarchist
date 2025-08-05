import { Player } from "../player/player";
import { Entity } from "../entity/entity";
import { Drawable } from "../drawable/drawable";
import { HitWarning } from "../drawable/hitWarning";
import { Direction } from "../game";
import { LightSource } from "../lighting/lightSource";
import { WizardEnemy } from "../entity/enemy/wizardEnemy";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { GlobalStateManager } from "../globalStateManager/GlobalStateManager";
import { TypeRegistry } from "../globalStateManager/TypeRegistry";

export class Projectile extends Drawable {
  static readonly SAVE_KEY = "Projectile";
  globalId: string;
  x: number;
  y: number;
  dead: boolean;
  parent: Entity | Player;
  dir: Direction;
  bloomOffsetY: number;
  lightSource: LightSource;

  constructor(parent: Entity | Player, x: number, y: number) {
    super();
    this.globalId = IdGenerator.generate("PROJ");
    GlobalStateManager.instance.registerProjectile(this);

    this.x = x;
    this.y = y;
    this.dead = false;
    this.parent = parent;
    this.drawableY = y;
    this.hasBloom = false;
    this.bloomColor = "#00BFFF";
    this.bloomOffsetY = 0;
  }

  get distanceToParent() {
    return Math.abs(this.x - this.parent.x) + Math.abs(this.y - this.parent.y);
  }

  setTarget(x: number, y: number, x2: number, y2: number) {}

  hitPlayer = (player: Player) => {};
  hitEnemy = (enemy: Entity) => {};

  tick = () => {};
  draw = (delta: number) => {};
  drawTopLayer = (delta: number) => {};

  protected serializeExtra(): any | undefined {
    return undefined;
  }
}
TypeRegistry.registerProjectile(Projectile.SAVE_KEY, Projectile);
