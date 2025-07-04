import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { Direction } from "../../game";

export class Scythe extends Weapon {
  static itemName = "scythe";
  hitDelay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 23;
    this.tileY = 2;
    this.damage = 1;
    this.name = "scythe";
    this.hitDelay = 150;
    this.useCost = 2;
    this.offsetY = 0;
    this.iconOffset = 0.2;
  }

  hitSound = () => {
    Sound.hit();
    //Sound.playScythe();
  };

  weaponMove = (newX: number, newY: number): boolean => {
    let leftPos = { x: newX, y: newY };
    let rightPos = { x: newX, y: newY };
    let positions = [leftPos, rightPos];

    switch (this.wielder.direction) {
      case Direction.DOWN:
        leftPos.x = newX - 1;
        rightPos.x = newX + 1;
        break;
      case Direction.UP:
        leftPos.x = newX + 1;
        rightPos.x = newX - 1;
        break;
      case Direction.LEFT:
        leftPos.y = newY + 1;
        rightPos.y = newY - 1;
        break;
      case Direction.RIGHT:
        leftPos.y = newY - 1;
        rightPos.y = newY + 1;
        break;
    }

    if (this.checkForPushables(newX, newY)) return true;

    const hitSomething = this.executeAttack(newX, newY);
    if (hitSomething) {
      for (const pos of positions) {
        if (
          !this.game.rooms[this.wielder.levelID].roomArray[pos.x][
            pos.y
          ].isSolid()
        ) {
          this.executeAttack(pos.x, pos.y);
        }
      }
    }

    return !hitSomething;
  };

  shakeScreen = () => {
    this.wielder.beginSlowMotion();

    setTimeout(() => {
      this.wielder.endSlowMotion();
      switch (this.wielder.direction) {
        case Direction.DOWN:
          this.game.shakeScreen(0, -5, false);
          break;
        case Direction.UP:
          this.game.shakeScreen(0, -5, false);
          break;
        case Direction.LEFT:
          this.game.shakeScreen(-5, -5, false);
          break;
        case Direction.RIGHT:
          this.game.shakeScreen(5, -5, false);
          break;
      }
    }, this.hitDelay);
  };
}
