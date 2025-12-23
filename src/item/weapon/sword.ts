import { Weapon } from "./weapon";
import { Room } from "../../room/room";
import { Sound } from "../../sound/sound";
import { Direction } from "../../game";

export class Sword extends Weapon {
  static itemName = "sword";
  hitDelay: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 28;
    this.tileY = 2;
    this.damage = 1;
    this.name = "sword";
    //this.hitDelay = 150;
    this.degradeable = false;
    this.useCost = 2;
    this.offsetY = -0.5;
    //this.iconOffset = 0.2;
  }

  hitSound = () => {
    Sound.hit();
    Sound.playShortSlice();
  };

  weaponMove = (newX: number, newY: number): boolean => {
    const room = this.wielder?.getRoom
      ? this.wielder.getRoom()
      : this.game.rooms[this.wielder.levelID];
    const z = this.wielder?.z ?? 0;
    let leftCorner = { x: newX, y: newY };
    let rightCorner = { x: newX, y: newY };

    let positions = [leftCorner, rightCorner];

    switch (this.wielder.direction) {
      case Direction.DOWN:
        leftCorner.x = newX - 1;
        rightCorner.x = newX + 1;

        break;
      case Direction.UP:
        leftCorner.x = newX + 1;
        rightCorner.x = newX - 1;

        break;
      case Direction.LEFT:
        leftCorner.y = newY + 1;
        rightCorner.y = newY - 1;

        break;
      case Direction.RIGHT:
        leftCorner.y = newY - 1;
        rightCorner.y = newY + 1;

        break;
    }

    if (this.checkForPushables(newX, newY)) return true;
    this.beginSwing();
    const hitSomething = this.executeAttack(
      newX,
      newY,
      true,
      this.damage + this.wielder.damageBonus,
      true,
      true,
      true,
      false,
    );
    if (hitSomething) {
      for (const pos of positions) {
        if (
          room.roomArray[pos.x] &&
          room.roomArray[pos.x][pos.y] &&
          !room.isSolidAt(pos.x, pos.y, z)
        ) {
          const damage = this.damage + this.wielder.damageBonus;
          this.hitEntitiesAt(pos.x, pos.y, damage);
        }
      }
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
    }
    this.endSwing();

    return !hitSomething;
  };

  shakeScreen = () => {
    //this.wielder.beginSlowMotion();

    setTimeout(() => {
      //this.wielder.endSlowMotion();
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
