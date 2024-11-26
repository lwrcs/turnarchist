import { Input, InputEnum } from "./input";
import { GameConstants } from "./gameConstants";
import { ChatMessage, Direction, Game, LevelState } from "./game";
import { Door, DoorType } from "./tile/door";
import { Trapdoor } from "./tile/trapdoor";
import { Inventory } from "./inventory";
import { Sound } from "./sound";
import { LevelConstants } from "./levelConstants";
import { Map } from "./map";
import { SlashParticle } from "./particle/slashParticle";
import { HealthBar } from "./healthbar";
import { VendingMachine } from "./entity/object/vendingMachine";
import { Drawable } from "./drawable";
import { Random } from "./random";
import { GenericParticle } from "./particle/genericParticle";
import { ActionState, ActionTab } from "./actionTab";
import { HitWarning } from "./hitWarning";
import { Entity, EntityType } from "./entity/entity";
import { ZombieEnemy } from "./entity/enemy/zombieEnemy";
import { Item } from "./item/item";
import { PostProcessor } from "./postProcess";
import { Weapon } from "./weapon/weapon";
import { Room } from "./room";
import { ImageParticle } from "./particle/imageParticle";
import { Enemy } from "./entity/enemy/enemy";
import { MouseCursor } from "./mouseCursor";
import { Light } from "./item/light";
import { LightSource } from "./lightSource";

export enum PlayerDirection {
  DOWN,
  UP,
  RIGHT,
  LEFT,
}

enum DrawDirection {
  X,
  Y,
}

export class Player extends Drawable {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  drawX: number;
  drawY: number;
  hitX: number;
  hitY: number;
  frame: number;
  direction: Direction;
  game: Game;
  levelID: number; // which room we're in (level[levelID])
  flashing: boolean;
  flashingFrame: number;
  health: number;
  maxHealth: number;
  healthBar: HealthBar;
  dead: boolean;
  lastTickHealth: number;
  inventory: Inventory;
  sightRadius: number;
  defaultSightRadius: number;
  static minSightRadius: number = 2; //hard minimum sight radius that ignores depth
  guiHeartFrame: number;
  map: Map;
  openVendingMachine: VendingMachine;
  isLocalPlayer: boolean;
  mapToggled: boolean;
  //actionTab: ActionTab;
  lastHitBy: string;
  turnCount: number;
  triedMove: boolean;
  tutorialRoom: boolean;
  private lastMoveTime: number;
  private moveCooldown: number;
  moveRange: number;
  tileCursor: { x: number; y: number };
  private jumpY: number;
  lightEquipped: boolean;
  lightSource: LightSource;
  hurtAlpha: number;
  hurting: boolean;
  lightBrightness: number;
  sineAngle: number;
  drawMoveSpeed: number;
  jumpHeight: number;
  moveDistance: number;
  moveQueue: { x: number; y: number; direction: Direction }[];
  lastX: number;
  lastY: number;
  motionSpeed: number;
  slowMotionEnabled: boolean;
  justMoved: DrawDirection;
  slowMotionTickDuration: number;
  private animationFrameId: number | null = null;
  private isProcessingQueue: boolean = false;
  constructor(game: Game, x: number, y: number, isLocalPlayer: boolean) {
    super();

    this.game = game;

    this.levelID = 0;

    this.x = x;
    this.y = y;
    this.w = 1;
    this.h = 1;
    this.drawX = 0;
    this.drawY = 0;
    this.jumpY = 0;
    this.jumpHeight = 0.3;
    this.frame = 0;
    this.moveDistance = 0;
    this.direction = Direction.UP;
    this.lastX = 0;
    this.lastY = 0;
    this.isLocalPlayer = isLocalPlayer;
    if (isLocalPlayer) {
      Input.leftSwipeListener = () => this.inputHandler(InputEnum.LEFT);
      Input.rightSwipeListener = () => this.inputHandler(InputEnum.RIGHT);
      Input.upSwipeListener = () => this.inputHandler(InputEnum.UP);
      Input.downSwipeListener = () => this.inputHandler(InputEnum.DOWN);
      Input.commaListener = () => this.inputHandler(InputEnum.COMMA);
      Input.periodListener = () => this.inputHandler(InputEnum.PERIOD);
      Input.tapListener = () => {
        /*
        if (this.inventory.isOpen) {
          if (this.inventory.pointInside(Input.mouseX, Input.mouseY)) {
            this.inputHandler(InputEnum.SPACE);
          } else {
            this.inputHandler(InputEnum.I);
          }
        } else this.inputHandler(InputEnum.I);
         */
      };
      Input.mouseMoveListener = () => this.inputHandler(InputEnum.MOUSE_MOVE);
      Input.mouseLeftClickListeners.push(() =>
        this.inputHandler(InputEnum.LEFT_CLICK)
      );
      Input.mouseRightClickListeners.push(() =>
        this.inputHandler(InputEnum.RIGHT_CLICK)
      );
      Input.numKeyListener = (num: number) =>
        this.inputHandler(InputEnum.NUMBER_1 + num - 1);
    }
    this.mapToggled = true;
    this.health = 3;
    this.maxHealth = 3;
    this.healthBar = new HealthBar();
    this.dead = false;
    this.flashing = false;
    this.flashingFrame = 0;
    this.lastTickHealth = this.health;
    this.guiHeartFrame = 0;

    this.inventory = new Inventory(game, this);
    this.defaultSightRadius = 3;
    this.sightRadius = this.defaultSightRadius;
    this.map = new Map(this.game, this);
    //this.actionTab = new ActionTab(this.inventory, this.game);
    this.turnCount = 0;
    this.triedMove = false;
    this.tutorialRoom = false;
    this.lastMoveTime = 0;
    this.moveCooldown = 100; // Cooldown in milliseconds (adjust as needed)
    this.tileCursor = { x: 0, y: 0 };
    this.moveRange = 1;
    this.lightEquipped = false;
    this.hurting = false;
    this.hurtAlpha = 0.5;
    this.lightBrightness = 0.3;
    this.sineAngle = Math.PI / 2;
    this.drawMoveSpeed = 0.3; // greater than 1 less than 2
    this.moveQueue = [];
    this.isProcessingQueue = false;

    this.hitX = 0;
    this.hitY = 0;
    this.motionSpeed = 1;
    this.slowMotionEnabled = false;
    this.slowMotionTickDuration = 0;
    this.justMoved = DrawDirection.Y;
  }

  get angle(): number {
    if (this.direction !== undefined) {
      switch (this.direction) {
        case Direction.UP:
          return 270;
        case Direction.RIGHT:
          return 0;
        case Direction.DOWN:
          return 90;
        case Direction.LEFT:
          return 180;
      }
    } else {
      return 0;
    }
  }

  inputHandler = (input: InputEnum) => {
    if (!this.game.started && input !== InputEnum.MOUSE_MOVE) {
      this.game.startedFadeOut = true;
      return;
    }
    switch (input) {
      case InputEnum.I:
        this.iListener();
        break;
      case InputEnum.Q:
        this.qListener();
        break;
      case InputEnum.LEFT:
        if (!this.ignoreDirectionInput()) this.leftListener(false);
        break;
      case InputEnum.RIGHT:
        if (!this.ignoreDirectionInput()) this.rightListener(false);
        break;
      case InputEnum.UP:
        if (!this.ignoreDirectionInput()) this.upListener(false);
        break;
      case InputEnum.DOWN:
        if (!this.ignoreDirectionInput()) this.downListener(false);
        break;
      case InputEnum.SPACE:
        this.spaceListener();
        break;
      case InputEnum.COMMA:
        this.commaListener();
        break;
      case InputEnum.PERIOD:
        this.periodListener();
        break;
      case InputEnum.LEFT_CLICK:
        this.mouseLeftClick();
        break;
      case InputEnum.RIGHT_CLICK:
        this.mouseRightClick();
        break;
      case InputEnum.MOUSE_MOVE:
        this.mouseMove();
        break;
      case InputEnum.NUMBER_1:
      case InputEnum.NUMBER_2:
      case InputEnum.NUMBER_3:
      case InputEnum.NUMBER_4:
      case InputEnum.NUMBER_5:
      case InputEnum.NUMBER_6:
      case InputEnum.NUMBER_7:
      case InputEnum.NUMBER_8:
      case InputEnum.NUMBER_9:
        this.numKeyListener(input);
        break;
    }
  };
  commaListener = () => {
    this.inventory.left();
  };
  periodListener = () => {
    this.inventory.right();
  };
  numKeyListener = (input: InputEnum) => {
    this.inventory.handleNumKey(input - 13);
  };

  tapListener = () => {
    this.inventory.open();
  };
  iListener = () => {
    this.inventory.open();
  };
  qListener = () => {
    if (this.inventory.isOpen) {
      this.inventory.drop();
    }
  };
  ignoreDirectionInput = (): boolean => {
    return (
      !this.inventory.isOpen &&
      (this.dead || this.game.levelState !== LevelState.IN_LEVEL)
    );
  };
  leftListener = (isLocal: boolean): boolean => {
    if (this.inventory.isOpen) {
      this.inventory.left();
      return true;
    }
    if (
      !this.dead &&
      (!isLocal || this.game.levelState === LevelState.IN_LEVEL)
    ) {
      this.left();
      return true;
    }

    return false;
  };
  rightListener = (isLocal: boolean): boolean => {
    if (this.inventory.isOpen) {
      this.inventory.right();
      return true;
    }
    if (
      !this.dead &&
      (!isLocal || this.game.levelState === LevelState.IN_LEVEL)
    ) {
      this.right();
      return true;
    }

    return false;
  };
  upListener = (isLocal: boolean): boolean => {
    if (this.inventory.isOpen) {
      this.inventory.up();
      return true;
    }
    if (
      !this.dead &&
      (!isLocal || this.game.levelState === LevelState.IN_LEVEL)
    ) {
      this.up();
      return true;
    }

    return false;
  };
  downListener = (isLocal: boolean): boolean => {
    if (this.inventory.isOpen) {
      this.inventory.down();
      return true;
    }
    if (
      !this.dead &&
      (!isLocal || this.game.levelState === LevelState.IN_LEVEL)
    ) {
      this.down();
      return true;
    }

    return false;
  };
  spaceListener = () => {
    if (!this.game.chatOpen) {
      if (this.dead) {
        this.restart();
      } else if (this.openVendingMachine) {
        this.openVendingMachine.space();
      } else if (
        this.inventory.isOpen ||
        this.game.levelState === LevelState.IN_LEVEL
      ) {
        this.inventory.space();
        return;
      }
    }
  };
  mouseLeftClick = () => {
    if (this.dead) {
      this.restart();
    } else {
      this.inventory.mouseLeftClick();
    }
    if (
      !this.inventory.isOpen &&
      !this.inventory.isPointInInventoryButton(
        MouseCursor.getInstance().getPosition().x,
        MouseCursor.getInstance().getPosition().y
      ) &&
      !this.inventory.isPointInQuickbarBounds(
        MouseCursor.getInstance().getPosition().x,
        MouseCursor.getInstance().getPosition().y
      ).inBounds
    ) {
      this.moveWithMouse();
    } else if (
      this.inventory.isPointInInventoryButton(
        MouseCursor.getInstance().getPosition().x,
        MouseCursor.getInstance().getPosition().y
      )
    ) {
      this.inventory.open();
    }
  };
  mouseRightClick = () => {
    this.inventory.mouseRightClick();
  };

  mouseMove = () => {
    this.inventory.mouseMove();
    //this.faceMouse();
    this.setTileCursorPosition();
  };

  moveWithMouse = () => {
    /*
    this.faceMouse();
    if (this.moveRangeCheck(this.mouseToTile().x, this.mouseToTile().y)) {
      this.tryMove(this.mouseToTile().x, this.mouseToTile().y);
    }
    */
  };

  mouseToTile = () => {
    // Get screen center coordinates
    const screenCenterX = GameConstants.WIDTH / 2;
    const screenCenterY = GameConstants.HEIGHT / 2;

    // Convert pixel offset to tile offset (this part was working correctly)
    const tileOffsetX = Math.floor(
      (Input.mouseX - screenCenterX + GameConstants.TILESIZE / 2) /
      GameConstants.TILESIZE
    );
    const tileOffsetY = Math.floor(
      (Input.mouseY - screenCenterY + GameConstants.TILESIZE / 2) /
      GameConstants.TILESIZE
    );

    return {
      x: this.x + tileOffsetX,
      y: this.y + tileOffsetY,
    };
  };

  tryVaultOver = (x: number, y: number, direction: PlayerDirection) => {
    switch (direction) {
      case PlayerDirection.UP:
        this.tryMove(x, y - 1);
        break;
      case PlayerDirection.DOWN:
        this.tryMove(x, y + 1);
        break;
      case PlayerDirection.LEFT:
        this.tryMove(x - 1, y);
        break;
      case PlayerDirection.RIGHT:
        this.tryMove(x + 1, y);
        break;
    }
  };

  moveRangeCheck = (x: number, y: number) => {
    const dx = Math.abs(this.x - x);
    const dy = Math.abs(this.y - y);
    return dx <= this.moveRange && dy <= this.moveRange && dx + dy !== 0;
  };

  setTileCursorPosition = () => {
    this.tileCursor = {
      x: Math.floor(Input.mouseX / GameConstants.TILESIZE),
      y: Math.floor(Input.mouseY / GameConstants.TILESIZE),
    };
  };

  restart = () => {
    this.dead = false;
    this.game.newGame();
  };

  left = () => {
    if (this.canMove() || this.moveQueue.length >= 1) {
      this.direction = Direction.LEFT;
      this.tryMove(this.x - 1, this.y);
    } else this.queueMove(this.x - 1, this.y, Direction.LEFT);
  };
  right = () => {
    if (this.canMove() || this.moveQueue.length >= 1) {
      this.direction = Direction.RIGHT;
      this.tryMove(this.x + 1, this.y);
    } else this.queueMove(this.x + 1, this.y, Direction.RIGHT);
  };
  up = () => {
    if (this.canMove() || this.moveQueue.length >= 1) {
      this.direction = Direction.UP;
      this.tryMove(this.x, this.y - 1);
    } else this.queueMove(this.x, this.y - 1, Direction.UP);
  };
  down = () => {
    if (this.canMove() || this.moveQueue.length >= 1) {
      this.direction = Direction.DOWN;
      this.tryMove(this.x, this.y + 1);
    } else this.queueMove(this.x, this.y + 1, Direction.DOWN);
  };

  hit = (): number => {
    return 1;
  };

  tryCollide = (other: any, newX: number, newY: number) => {
    if (newX >= other.x + other.w || newX + this.w <= other.x) return false;
    if (newY >= other.y + other.h || newY + this.h <= other.y) return false;
    return true;
  };

  tryMove = (x: number, y: number) => {
    this.updateLastPosition();
    let slowMotion = this.slowMotionEnabled;
    let newMove = { x: x, y: y };
    // TODO don't move if hit by enemy
    this.game.rooms[this.levelID].catchUp();
    if (this.dead) return;

    for (let i = 0; i < 2; i++)
      if (
        this.inventory.hasWeapon() &&
        !this.inventory.getWeapon().weaponMove(x, y)
      ) {
        //for (let h of this.game.levels[this.levelID].hitwarnings) {
        //if (newMove instanceof HitWarning)
        return;
        //}
      }

    for (let e of this.game.rooms[this.levelID].entities) {
      if (this.tryCollide(e, x, y)) {
        if (e.pushable) {
          // pushing a crate or barrel
          let dx = x - this.x;
          let dy = y - this.y;
          let nextX = x + dx;
          let nextY = y + dy;
          let foundEnd = false; // end of the train of whatever we're pushing
          let enemyEnd = false; // end of the train is a solid enemy (i.e. potted plant)
          let pushedEnemies = [];
          while (true) {
            foundEnd = true;
            for (const f of this.game.rooms[this.levelID].entities) {
              if (f.pointIn(nextX, nextY)) {
                if (!f.chainPushable) {
                  enemyEnd = true;
                  foundEnd = true;
                  break;
                }
                foundEnd = false;
                pushedEnemies.push(f);
                break;
              }
            }
            if (foundEnd) break;
            nextX += dx * pushedEnemies[pushedEnemies.length - 1].w;
            nextY += dy * pushedEnemies[pushedEnemies.length - 1].h;
          }
          /* if no enemies and there is a wall, no move
          otherwise, push everything, killing last enemy if there is a wall */
          // here, (nextX, nextY) is the position immediately after the end of the train

          if (
            pushedEnemies.length === 0 &&
            (this.game.rooms[this.levelID].roomArray[nextX][
              nextY
            ].canCrushEnemy() ||
              enemyEnd)
          ) {
            if (e.destroyable) {
              e.kill();
              if (this.game.rooms[this.levelID] === this.game.room) Sound.hit();
              this.game.rooms[this.levelID].particles.push(
                new SlashParticle(e.x, e.y)
              );
              this.shakeScreen(this.x, this.y, e.x, e.y, 10);

              this.game.rooms[this.levelID].tick(this);
              return;
            }
          } else {
            if (this.game.rooms[this.levelID] === this.game.room) Sound.push();
            // here pushedEnemies may still be []
            for (const f of pushedEnemies) {
              f.x += dx;
              f.y += dy;
              f.drawX = dx;
              f.drawY = dy;
              f.skipNextTurns = 1; // skip next turn, so they don't move while we're pushing them
            }
            if (
              this.game.rooms[this.levelID].roomArray[nextX][
                nextY
              ].canCrushEnemy() ||
              enemyEnd
            ) {
              pushedEnemies[pushedEnemies.length - 1].crush();
              if (this.game.rooms[this.levelID] === this.game.room) Sound.hit();
            }
            e.x += dx;
            e.y += dy;
            e.drawX = dx;
            e.drawY = dy;
            this.move(x, y);
            this.moveDistance++;
            this.game.rooms[this.levelID].tick(this);
            return;
          }
        } else {
          // if we're trying to hit an enemy, check if it's destroyable
          if (!e.dead) {
            if (e.interactable) e.interact(this);
            //this.actionTab.actionState = ActionState.ATTACK;
            //sets the action tab state to Attack
            return;
          }
        }
      }
    }
    let other = this.game.rooms[this.levelID].roomArray[x][y];
    if (!other.isSolid()) {
      this.move(x, y);
      other.onCollide(this);
      if (!(other instanceof Door || other instanceof Trapdoor))
        this.game.rooms[this.levelID].tick(this);
    } else {
      if (other instanceof Door) {
        this.shakeScreen(this.x, this.y, x, y, 10);
        if (other.canUnlock(this)) other.unlock(this);
      }
    }
  };
  private updateLastPosition = () => {
    this.lastX = this.drawX;
    this.lastY = this.drawY;
  };

  //get cancelHoldMove = () => {};

  wouldHurt = (x: number, y: number) => {
    for (let h of this.game.rooms[this.levelID].hitwarnings) {
      if (h instanceof HitWarning && h.x == x && h.y == y) return true;
      else {
        return false;
      }
    }
  };

  hurt = (damage: number, enemy: string) => {
    if (this.game.rooms[this.levelID] === this.game.room) Sound.hurt();

    if (this.inventory.getArmor() && this.inventory.getArmor().health > 0) {
      this.inventory.getArmor().hurt(damage);
    } else {
      this.lastHitBy = enemy;
      //console.log("Last Hit by: ", enemy);
      this.healthBar.hurt();
      this.flashing = true;
      this.health -= damage;
      this.hurting = true;
      this.hurtAlpha = 0.5;
      if (this.health <= 0 && !GameConstants.DEVELOPER_MODE) {
        this.dead = true;
      }

      /*
      if (this.health <= 0) {
        this.health = 0;
        
        if (!this.game.tutorialActive) {
          this.dead = true;
        } else {
          this.health = 2;
          this.game.pushMessage("You are dead, but you can try again!");
        }
        */
    }
  };

  dashMove = (x: number, y: number) => {
    this.x = x;
    this.y = y;

    for (let i of this.game.rooms[this.levelID].items) {
      if (i.x === x && i.y === y) {
        i.onPickup(this);
      }
    }

    //this.game.rooms[this.levelID].updateLighting();
  };

  doneMoving = (): boolean => {
    let EPSILON = 0.01;
    return Math.abs(this.drawX) < EPSILON && Math.abs(this.drawY) < EPSILON;
  };

  doneHitting = (): boolean => {
    let EPSILON = 0.01;
    return Math.abs(this.hitX) < EPSILON && Math.abs(this.hitY) < EPSILON;
  };

  enableSlowMotion = () => {
    if (this.motionSpeed < 1 && !this.slowMotionEnabled) {
      this.motionSpeed *= 1.08;
      if (this.motionSpeed >= 1) this.motionSpeed = 1;
    }
    if (this.slowMotionEnabled && this.motionSpeed > 0.25) {
      this.motionSpeed *= 0.95;
      if (this.motionSpeed < 0.25) this.motionSpeed = 0.25;
    }
  };

  move = (x: number, y: number) => {
    this.lastX = this.x;
    this.lastY = this.y;
    //this.actionTab.setState(ActionState.MOVE);
    if (this.game.rooms[this.levelID] === this.game.room)
      Sound.playerStoneFootstep();

    if (this.openVendingMachine) this.openVendingMachine.close();

    this.drawX += x - this.x;
    this.drawY += y - this.y;

    /*
    if (this.drawX > 1) this.drawX = 1;
    if (this.drawY > 1) this.drawY = 1;
    if (this.drawX < -1) this.drawX = -1;
    if (this.drawY < -1) this.drawY = -1;
    */

    this.x = x;
    this.y = y;

    for (let i of this.game.rooms[this.levelID].items) {
      if (i.x === x && i.y === y) {
        i.onPickup(this);
      }
    }
    let diffX = x - this.lastX;
    let diffY = y - this.lastY;
    if (diffX === 0 && diffY === 0) return;

    //this.game.rooms[this.levelID].updateLighting();
  };

  moveNoSmooth = (x: number, y: number) => {
    // doesn't touch smoothing
    this.x = x;
    this.y = y;
  };

  moveSnap = (x: number, y: number) => {
    // no smoothing
    this.x = x;
    this.y = y;
    this.drawX = 0;
    this.drawY = 0;
    this.hitX = 0;
    this.hitY = 0;
  };

  update = () => { };
  updateSlowMotion = () => {
    if (this.slowMotionTickDuration > 0) this.slowMotionTickDuration -= 1;
    if (this.slowMotionTickDuration === 0) this.slowMotionEnabled = false;
  };

  finishTick = () => {
    this.turnCount += 1;
    this.inventory.tick();

    this.flashing = false;

    let totalHealthDiff = this.health - this.lastTickHealth;
    this.lastTickHealth = this.health; // update last tick health
    if (totalHealthDiff < 0) {
      this.flashing = true;
    }
    this.moveDistance = 0;

    //this.actionTab.actionState = ActionState.READY;
    //Sets the action tab state to Wait (during enemy turn)
  };

  drawPlayerSprite = (delta: number) => {
    this.frame += 0.1 * delta;
    if (this.frame >= 4) this.frame = 0;
    Game.drawMob(
      1 + Math.floor(this.frame),
      8 + this.direction * 2,
      1,
      2,
      this.x - this.drawX,
      this.y - 1.45 - this.drawY - this.jumpY,
      1,
      2
    );
    if (this.inventory.getArmor() && this.inventory.getArmor().health > 0) {
      // TODO draw armor
    }
  };

  draw = (delta: number) => {
    this.drawableY = this.y;

    this.flashingFrame += (delta * 12) / GameConstants.FPS;
    if (!this.dead) {
      Game.drawMob(0, 0, 1, 1, this.x - this.drawX, this.y - this.drawY, 1, 1);
      if (!this.flashing || Math.floor(this.flashingFrame) % 2 === 0) {
        this.drawPlayerSprite(delta);
      }
    }
  };

  faceMouse = () => {
    const mousePosition = MouseCursor.getInstance().getPosition();
    const playerPixelPosition = {
      x: GameConstants.WIDTH / 2,
      y: GameConstants.HEIGHT / 2,
    };
    const dx = mousePosition.x - playerPixelPosition.x;
    const dy = mousePosition.y - playerPixelPosition.y;
    const angle = Math.atan2(dy, dx);

    // Convert angle to direction
    // atan2 returns angle in radians (-π to π)
    // Divide the circle into 4 sectors for the 4 directions
    if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
      this.direction = Direction.RIGHT;
    } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
      this.direction = Direction.DOWN;
    } else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
      this.direction = Direction.UP;
    } else {
      this.direction = Direction.LEFT;
    }
  };

  heartbeat = () => {
    this.guiHeartFrame = 1;
  };

  tapHoldHandler = () => {
    this.mapToggled = !this.mapToggled;
  };

  drawTopLayer = (delta: number) => {
    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x - this.drawX,
      this.y - this.drawY,
      !this.flashing || Math.floor(this.flashingFrame) % 2 === 0
    );
  };

  drawGUI = (delta: number, transitioning: boolean = false) => {
    if (!this.dead) {
      if (!transitioning) this.inventory.draw(delta);
      //this.actionTab.draw(delta);

      if (this.guiHeartFrame > 0) this.guiHeartFrame += delta;
      if (this.guiHeartFrame > 5) {
        this.guiHeartFrame = 0;
      }
      for (let i = 0; i < this.maxHealth; i++) {
        let frame = this.guiHeartFrame > 0 ? 1 : 0;
        if (i >= Math.floor(this.health)) {
          if (i == Math.floor(this.health) && (this.health * 2) % 2 == 1) {
            // draw half heart

            Game.drawFX(4, 2, 1, 1, i, LevelConstants.SCREEN_H - 1, 1, 1);
          } else {
            Game.drawFX(3, 2, 1, 1, i, LevelConstants.SCREEN_H - 1, 1, 1);
          }
        } else
          Game.drawFX(frame, 2, 1, 1, i, LevelConstants.SCREEN_H - 1, 1, 1);
      }
      if (this.inventory.getArmor())
        this.inventory.getArmor().drawGUI(delta, this.maxHealth);
    } else {
      Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
      let gameOverString = "Game Over";
      if (this.lastHitBy !== "enemy") {
        gameOverString = `You were slain by ${this.lastHitBy}.`;
      }

      Game.fillText(
        gameOverString,
        GameConstants.WIDTH / 2 - Game.measureText(gameOverString).width / 2,
        GameConstants.HEIGHT / 2 - Game.letter_height + 2
      );
      let restartButton = "Press space or click to restart";
      Game.fillText(
        restartButton,
        GameConstants.WIDTH / 2 - Game.measureText(restartButton).width / 2,
        GameConstants.HEIGHT / 2 + Game.letter_height + 5
      );
    }
    PostProcessor.draw(delta);
    if (this.hurting) this.drawHurt(delta);
    if (this.mapToggled === true) this.map.draw(delta);
    //this.drawTileCursor(delta);
    this.drawInventoryButton(delta);
  };

  drawHurt = (delta: number) => {
    Game.ctx.globalAlpha = this.hurtAlpha;
    this.hurtAlpha -= (this.hurtAlpha / 10) * delta;
    if (this.hurtAlpha <= 0.03) {
      this.hurtAlpha = 0;
      this.hurting = false;
    }
    Game.ctx.globalCompositeOperation = "screen";
    Game.ctx.fillStyle = "#cc3333"; // bright but not fully saturated red

    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.globalCompositeOperation = "source-over";
  };

  updateDrawXY = (delta: number) => {
    //console.log("this.x", this.x);
    //console.log("this.y", this.y);
    if (!this.doneMoving()) {
      this.drawX -= this.drawX * this.drawMoveSpeed * delta;
      this.drawY -= this.drawY * this.drawMoveSpeed * delta;
    }
    if (this.doneHitting()) {
      this.jump(delta);
    }
    if (Math.abs(this.drawX) < 0.01) {
      this.drawX = 0;
      this.justMoved = DrawDirection.Y;
    }
    if (Math.abs(this.drawY) < 0.01) {
      this.drawY = 0;
      this.justMoved = DrawDirection.X;
    }
    if (!this.doneHitting()) {
      this.updateHitXY(delta);
    }
    this.drawX += this.hitX;
    this.drawY += this.hitY;

    this.enableSlowMotion();
    GameConstants.ANIMATION_SPEED = this.motionSpeed;
  };

  updateHitXY = (delta: number) => {
    this.hitX -= this.hitX * 0.3;
    this.hitY -= this.hitY * 0.3;
    if (Math.abs(this.hitX) < 0.01) this.hitX = 0;
    if (Math.abs(this.hitY) < 0.01) this.hitY = 0;
  };

  hitShake = (
    playerX: number,
    playerY: number,
    otherX: number,
    otherY: number
  ) => {
    this.hitX = 0.5 * (playerX - otherX);
    this.hitY = 0.5 * (playerY - otherY);
  };

  shakeScreen = (
    playerX: number,
    playerY: number,
    otherX: number,
    otherY: number,
    shakeStrength: number = 10
  ) => {
    this.hitShake(playerX, playerY, otherX, otherY);

    this.game.shakeScreen(this.hitX * shakeStrength, this.hitY * shakeStrength);
  };

  jump = (delta: number) => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.jumpY = Math.sin(j * Math.PI * delta) * this.jumpHeight;
    if (this.jumpY < 0.01 && this.jumpY > -0.01) this.jumpY = 0;
    if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
  };

  drawInventoryButton = (delta: number) => {
    Game.drawFX(0, 0, 2, 2, LevelConstants.SCREEN_W - 2, 0, 2, 2);
  };

  drawTileCursor = (delta: number) => {
    const inRange = this.moveRangeCheck(
      this.mouseToTile().x,
      this.mouseToTile().y
    );
    let tileX = inRange ? 22 : 24;

    Game.drawFX(
      tileX + Math.floor(HitWarning.frame),
      4,
      1,
      2,
      this.tileCursor.x,
      //round to lower odd number
      this.tileCursor.y - 1,
      1,
      2
    );
  };

  private queueHandler = () => {
    //      console.log("Queue handler running, queue length:", this.moveQueue.length);
    //console.log("Is processing queue:", this.isProcessingQueue);

    if (!this.isProcessingQueue) {
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastMove = currentTime - this.lastMoveTime;
    //console.log("Time since last move:", timeSinceLastMove);

    if (currentTime - this.lastMoveTime >= GameConstants.MOVEMENT_COOLDOWN) {
      if (this.moveQueue.length > 0) {
        const { x, y, direction } = this.moveQueue.shift();
        //console.log("Processing move to:", x, y);
        this.handleMoveLoop({ x, y, direction });
        this.lastMoveTime = currentTime;
      } else {
        //console.log("Queue empty, stopping processing");
        this.stopQueueProcessing();
      }
    } else {
      //console.log(
      //  "Waiting for cooldown, remaining time:",
      //  GameConstants.MOVEMENT_COOLDOWN - timeSinceLastMove
      //);
    }

    this.animationFrameId = requestAnimationFrame(this.queueHandler);
    //console.log("Next animation frame requested:", this.animationFrameId);
  };

  private startQueueProcessing = () => {
    //console.log("Attempting to start queue processing");
    //console.log(
    //  "Current state - isProcessing:",
    //  this.isProcessingQueue,
    //  "animationFrameId:",
    //  this.animationFrameId
    //);

    if (!this.isProcessingQueue) {
      //console.log("Starting queue processing");
      this.isProcessingQueue = true;
      this.animationFrameId = requestAnimationFrame(this.queueHandler);
      //console.log("Animation frame requested:", this.animationFrameId);
    } else {
      //console.log("Queue processing already running");
    }
  };

  private stopQueueProcessing = () => {
    //console.log("Stopping queue processing");
    //console.log(
    //  "Current state - isProcessing:",
    //  this.isProcessingQueue,
    //  "animationFrameId:",
    //  this.animationFrameId
    //);

    this.isProcessingQueue = false;
    if (this.animationFrameId !== null) {
      //console.log("Canceling animation frame:", this.animationFrameId);
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  };

  handleMoveLoop = ({
    x,
    y,
    direction,
  }: {
    x: number;
    y: number;
    direction: Direction;
  }) => {
    switch (direction) {
      case Direction.RIGHT:
        this.right();
        break;
      case Direction.LEFT:
        this.left();
        break;
      case Direction.DOWN:
        this.down();
        break;
      case Direction.UP:
        this.up();
        break;
    }
  };

  queueMove = (x: number, y: number, direction: Direction) => {
    if (!x || !y || this.moveQueue.length > 0) return;

    //console.log("Queueing move to:", x, y);
    //console.log("Current queue length:", this.moveQueue.length);
    const move = { x, y, direction };
    this.moveQueue.push(move);
    this.startQueueProcessing();
    //console.log("Queue length after push:", this.moveQueue.length);
  };

  private canMove(): boolean {
    const currentTime = Date.now();
    if (currentTime - this.lastMoveTime >= GameConstants.MOVEMENT_COOLDOWN) {
      this.lastMoveTime = currentTime;
      return true;
    }
    return false;
  }
}
