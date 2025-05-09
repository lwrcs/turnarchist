import { Direction, Game } from "../game";
import { GameConstants } from "../gameConstants";
import { HitWarning } from "../hitWarning";
import { LevelConstants } from "../levelConstants";
import { MouseCursor } from "../mouseCursor";
import { PostProcessor } from "../postProcess";
import { statsTracker } from "../stats";
import { Utils } from "../utils";
import { Spellbook } from "../weapon/spellbook";
import { Player } from "./player";

export class PlayerRenderer {
  private player: Player;
  private flashingFrame: number;
  private guiHeartFrame: number;
  private hurtAlpha: number;
  private jumpY: number;
  private motionSpeed: number;
  slowMotionEnabled: boolean;
  private jumpHeight: number;
  private hurting: boolean;
  private hurtingShield: boolean;
  drawX: number;
  drawY: number;
  hitX: number;
  hitY: number;
  private frame: number;
  private slowMotionTickDuration: number;
  private lowHealthFrame: number;
  private flashing: boolean;

  constructor(player: Player) {
    this.player = player;
    this.jumpY = 0;
    this.flashingFrame = 0;
    this.guiHeartFrame = 0;
    this.motionSpeed = 1;
    this.hitX = 0;
    this.hitY = 0;
    this.drawX = 0;
    this.drawY = 0;
    this.hurtAlpha = 0.25;
    this.jumpHeight = 0.25;
    this.hurting = false;
    this.hurtingShield = false;
    this.slowMotionEnabled = false;
    this.slowMotionTickDuration = 0;
    this.flashing = false;
    this.lowHealthFrame = 0;
    this.frame = 0;
  }

  hurt = () => {
    this.hurting = true;
    this.hurtAlpha = 0.25;
  };
  hurtShield = () => {
    this.hurtingShield = true;
  };

  flash = () => {
    this.flashing = true;
  };

  disableFlash = () => {
    this.flashing = false;
  };

  beginSlowMotion = () => {
    this.slowMotionEnabled = true;
  };

  endSlowMotion = () => {
    this.slowMotionEnabled = false;
  };

  setNewDrawXY = (x: number, y: number) => {
    this.drawX += x - this.player.x;
    this.drawY += y - this.player.y;
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

  updateSlowMotion = () => {
    if (this.slowMotionTickDuration > 0) this.slowMotionTickDuration -= 1;
    if (this.slowMotionTickDuration === 0) this.slowMotionEnabled = false;
  };

  /**
   * Draws the player sprite to the canvas.
   * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
   * to ensure canvas state is preserved.
   */
  drawPlayerSprite = (delta: number) => {
    const player = this.player;
    Game.ctx.save(); // Save the current canvas state

    if (this.drawSmear()) {
      Game.drawMob(
        this.setSmearFrame().x,
        this.setSmearFrame().y,
        1,
        2,
        player.x - this.drawX - this.hitX,
        player.y - 1.45 - this.drawY - this.jumpY - this.hitY,
        1,
        2,
        this.shadeColor(),
      );
    } else if (
      this.player.inputHandler.mostRecentMoveInput === "mouse" &&
      this.mouseDiagonal()
    ) {
      const angle = (this.player.inputHandler.mouseAngle() * 180) / Math.PI;
      let diagonalTile = { x: 1, y: 18 };
      if (angle > -150 && angle <= -120) diagonalTile = { x: 3, y: 18 };
      if (angle > -60 && angle <= -30) diagonalTile = { x: 4, y: 18 };
      if (angle > 30 && angle <= 60) diagonalTile = { x: 2, y: 18 };
      if (angle > 120 && angle <= 150) diagonalTile = { x: 1, y: 18 };

      Game.drawMob(
        diagonalTile.x,
        diagonalTile.y,
        1,
        2,
        player.x - this.drawX - this.hitX,
        player.y - 1.45 - this.drawY - this.jumpY - this.hitY,
        1,
        2,
        this.shadeColor(),
      );
    } else {
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      Game.drawMob(
        1 + Math.floor(this.frame),
        8 + player.direction * 2,
        1,
        2,
        player.x - this.drawX - this.hitX,
        player.y - 1.45 - this.drawY - this.jumpY - this.hitY,
        1,
        2,
        this.shadeColor(),
      );
    }
    if (player.inventory.getArmor() && player.inventory.getArmor().health > 0) {
      // TODO draw armor
    }

    Game.ctx.restore(); // Restore the canvas state
  };

  mouseDiagonal = () => {
    const angle = (this.player.inputHandler.mouseAngle() * 180) / Math.PI;
    if (angle > 30 && angle < 60) return true;
    if (angle > 120 && angle < 150) return true;
    if (angle > -150 && angle < -120) return true;
    if (angle > -60 && angle < -30) return true;
    return false;
  };

  drawSmear = () => {
    if (this.player.direction === this.player.lastDirection) return false;
    let t = 100;
    const lastDir = this.player.lastDirection;
    const dir = this.player.direction;
    if (
      (dir === Direction.UP && lastDir === Direction.DOWN) ||
      (dir === Direction.DOWN && lastDir === Direction.UP) ||
      (dir === Direction.LEFT && lastDir === Direction.RIGHT) ||
      (dir === Direction.RIGHT && lastDir === Direction.LEFT)
    )
      t = 150;
    const timeSince = Date.now() - this.player.movement.lastChangeDirectionTime;
    if (timeSince <= t) return true;
    else return false;
  };

  setSmearFrame = () => {
    let tile = { x: 1, y: 18 };
    const timeSince = Date.now() - this.player.movement.lastChangeDirectionTime;
    const t = 50;

    if (
      (this.player.direction === Direction.UP &&
        this.player.lastDirection === Direction.LEFT) ||
      (this.player.direction === Direction.LEFT &&
        this.player.lastDirection === Direction.UP)
    ) {
      tile.x = 3;
      return tile;
    }
    if (
      (this.player.direction === Direction.UP &&
        this.player.lastDirection === Direction.RIGHT) ||
      (this.player.direction === Direction.RIGHT &&
        this.player.lastDirection === Direction.UP)
    ) {
      tile.x = 4;
      return tile;
    }
    if (
      (this.player.direction === Direction.DOWN &&
        this.player.lastDirection === Direction.RIGHT) ||
      (this.player.direction === Direction.RIGHT &&
        this.player.lastDirection === Direction.DOWN)
    ) {
      tile.x = 2;
      return tile;
    }
    if (
      (this.player.direction === Direction.DOWN &&
        this.player.lastDirection === Direction.LEFT) ||
      (this.player.direction === Direction.LEFT &&
        this.player.lastDirection === Direction.DOWN)
    ) {
      tile.x = 1;
      return tile;
    }
    if (
      this.player.direction === Direction.DOWN &&
      this.player.lastDirection === Direction.UP
    ) {
      if (timeSince < t) tile.x = 3;
      if (timeSince >= t && timeSince < t * 2) {
        tile.x = 1;
        tile.y = 14;
      }
      if (timeSince >= t * 2 && timeSince < t * 3) tile.x = 1;
      return tile;
    }
    if (
      this.player.direction === Direction.LEFT &&
      this.player.lastDirection === Direction.RIGHT
    ) {
      if (timeSince < t) tile.x = 2;
      if (timeSince >= t && timeSince < t * 2) {
        tile.x = 1;
        tile.y = 8;
      }
      if (timeSince >= t * 2 && timeSince < t * 3) tile.x = 1;
      return tile;
    }
    if (
      this.player.direction === Direction.UP &&
      this.player.lastDirection === Direction.DOWN
    ) {
      if (timeSince < t) tile.x = 2;
      if (timeSince >= t && timeSince < t * 2) {
        tile.x = 1;
        tile.y = 12;
      }
      if (timeSince >= t * 2 && timeSince < t * 3) tile.x = 4;
      return tile;
    }
    if (
      this.player.direction === Direction.RIGHT &&
      this.player.lastDirection === Direction.LEFT
    ) {
      if (timeSince < t) tile.x = 1;
      if (timeSince >= t && timeSince < t * 2) {
        tile.x = 1;
        tile.y = 8;
      }
      if (timeSince >= t * 2 && timeSince < t * 3) tile.x = 2;
      return tile;
    }
  };

  draw = (delta: number) => {
    const player = this.player;

    Game.ctx.save();
    this.updateDrawXY(delta);
    player.drawableY = player.y;
    this.flashingFrame += (delta * 12) / GameConstants.FPS;
    if (!player.dead) {
      Game.drawMob(
        0,
        0,
        1,
        1,
        player.x - this.drawX,
        player.y - this.drawY,
        1,
        1,
      );
      if (!this.flashing || Math.floor(this.flashingFrame) % 2 === 0) {
        this.drawPlayerSprite(delta);
      }
    }
    this.drawSpellBeam(delta);
    Game.ctx.restore();
  };

  drawSpellBeam = (delta: number) => {
    Game.ctx.save();
    // Clear existing beam effects each frame
    this.player.game.levels[this.player.depth].rooms[
      this.player.levelID
    ].beamEffects = [];

    if (this.player.inventory.getWeapon() instanceof Spellbook) {
      const spellbook = this.player.inventory.getWeapon() as Spellbook;
      if (spellbook.isTargeting) {
        let targets = spellbook.targets;
        for (let target of targets) {
          // Create a new beam effect from the player to the enemy
          this.player.game.levels[this.player.depth].rooms[
            this.player.levelID
          ].addBeamEffect(
            this.player.x - this.drawX,
            this.player.y - this.drawY,
            target.x - target.drawX,
            target.y - target.drawY,
            target,
          );

          // Retrieve the newly added beam effect
          const beam =
            this.player.game.levels[this.player.depth].rooms[
              this.player.levelID
            ].beamEffects[
              this.player.game.levels[this.player.depth].rooms[
                this.player.levelID
              ].beamEffects.length - 1
            ];

          // Render the beam
          beam.render(
            this.player.x - this.drawX,
            this.player.y - this.drawY,
            target.x - target.drawX,
            target.y - target.drawY,
            "cyan",
            2,
            delta,
          );
        }
      }
    }
    Game.ctx.restore();
  };

  shadeColor = () => {
    const player = this.player;

    if (!GameConstants.CUSTOM_SHADER_COLOR_ENABLED) {
      return "black";
    } else {
      return Utils.rgbToHex(
        player.game.levels[player.depth].rooms[player.levelID].col[player.x][
          player.y
        ][0],
        player.game.levels[player.depth].rooms[player.levelID].col[player.x][
          player.y
        ][1],
        player.game.levels[player.depth].rooms[player.levelID].col[player.x][
          player.y
        ][2],
      );
    }
  };

  drawTopLayer = (delta: number) => {
    Game.ctx.save(); // Save the current canvas state

    this.player.healthBar.draw(
      delta,
      this.player.health,
      this.player.maxHealth,
      this.player.x - this.drawX,
      this.player.y - this.drawY,
      !this.flashing || Math.floor(this.flashingFrame) % 2 === 0,
    );

    Game.ctx.restore(); // Restore the canvas state
  };

  updateDrawXY = (delta: number) => {
    if (!this.doneMoving()) {
      this.drawX *= 0.85 ** delta;
      this.drawY *= 0.85 ** delta;
      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
    }
    if (this.doneHitting()) {
      this.jump(delta);
    }

    if (!this.doneHitting()) {
      this.updateHitXY(delta);
    }

    this.enableSlowMotion();
    GameConstants.ANIMATION_SPEED = this.motionSpeed;
  };

  updateHitXY = (delta: number) => {
    const hitX = this.hitX - this.hitX * 0.3;
    const hitY = this.hitY - this.hitY * 0.3;
    this.hitX = Math.min(Math.max(hitX, -1), 1);
    this.hitY = Math.min(Math.max(hitY, -1), 1);
    if (Math.abs(hitX) < 0.01) this.hitX = 0;
    if (Math.abs(hitY) < 0.01) this.hitY = 0;
  };

  doneMoving = (): boolean => {
    let EPSILON = 0.01;
    return Math.abs(this.drawX) < EPSILON && Math.abs(this.drawY) < EPSILON;
  };

  doneHitting = (): boolean => {
    let EPSILON = 0.01;
    return Math.abs(this.hitX) < EPSILON && Math.abs(this.hitY) < EPSILON;
  };

  snapDrawStuff = () => {
    this.drawX = 0;
    this.drawY = 0;
    this.hitX = 0;
    this.hitY = 0;
    this.jumpY = 0;
  };

  setHitXY = (x: number, y: number) => {
    this.hitX = x;
    this.hitY = y;
  };

  drawGUI = (delta: number, transitioning: boolean = false) => {
    Game.ctx.save();
    if (!this.player.dead) {
      if (!transitioning) this.player.inventory.draw(delta);
      if (this.player.bestiary) this.player.bestiary.draw(delta);
      //this.actionTab.draw(delta);

      if (this.guiHeartFrame > 0) this.guiHeartFrame += delta;
      if (this.guiHeartFrame > 5) {
        this.guiHeartFrame = 0;
      }

      const armor = this.player.inventory.getArmor();

      // Get the quickbar's left edge position
      const quickbarStartX =
        this.player.inventory.getQuickbarStartX() + (armor ? -34 : -24);
      // Convert to tile coordinates
      let heartStartX = quickbarStartX / GameConstants.TILESIZE;

      // Ensure hearts don't go off the left edge of the screen
      if (heartStartX < 0.25) {
        heartStartX = 0.25;
      }

      for (let i = 0; i < this.player.maxHealth; i++) {
        let shake = 0;
        let shakeY = 0;
        if (this.player.health <= 1) {
          shake =
            Math.round(Math.sin(Date.now() / 25 / (i + 1)) + i / 2) /
            2 /
            GameConstants.TILESIZE;
          shakeY =
            Math.round(Math.sin(Date.now() / 25 / (i + 2)) + i / 2) /
            2 /
            GameConstants.TILESIZE;
        }
        let frame = this.guiHeartFrame > 0 ? 1 : 0;
        let offsetY = GameConstants.WIDTH > 175 ? 0 : -1.25;

        if (i >= Math.floor(this.player.health)) {
          if (
            i == Math.floor(this.player.health) &&
            (this.player.health * 2) % 2 == 1
          ) {
            // draw half heart
            Game.drawFX(
              4,
              2,
              0.75,
              0.75,
              heartStartX + i / 1.5 + shake,
              GameConstants.HEIGHT / GameConstants.TILESIZE -
                1 +
                shakeY +
                offsetY,
              0.75,
              0.75,
            );
          } else {
            Game.drawFX(
              3,
              2,
              0.75,
              0.75,
              heartStartX + i / 1.5 + shake,
              GameConstants.HEIGHT / GameConstants.TILESIZE -
                1 +
                shakeY +
                offsetY,
              0.75,
              0.75,
            );
          }
        } else {
          Game.drawFX(
            frame,
            2,
            0.75,
            0.75,
            heartStartX + i / 1.5 + shake,
            GameConstants.HEIGHT / GameConstants.TILESIZE -
              1 +
              shakeY +
              offsetY,
            0.75,
            0.75,
          );
        }
      }
      //this.drawCooldownBar();
      if (armor) armor.drawGUI(delta, this.player.maxHealth, quickbarStartX);
    } else {
      Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
      const enemies = statsTracker.getStats().enemies;
      // Count the occurrences of each enemy
      const enemyCounts = enemies.reduce(
        (acc, enemy) => {
          acc[enemy] = (acc[enemy] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Create individual lines
      const lines: string[] = [];

      // Line 1: Game Over or slain by
      if (this.player.lastHitBy !== "enemy") {
        lines.push(`You were slain by ${this.player.lastHitBy}.`);
      } else {
        lines.push("Game Over");
      }

      lines.push(
        `Depth reached: ${this.player.game.levels[this.player.depth].rooms[this.player.levelID].depth}`,
      );

      // Line 2: Enemies killed
      lines.push(
        `${Object.values(enemyCounts).reduce(
          (a, b) => a + b,
          0,
        )} enemies killed in total:`,
      );

      // Subsequent lines: Each enemy count
      Object.entries(enemyCounts).forEach(([enemy, count]) => {
        lines.push(`${enemy} x${count}`);
      });

      // Line after enemy counts: Restart instruction
      let restartButton = "Press space or click to restart";
      if (GameConstants.isMobile) restartButton = "Tap to restart";

      // Calculate total height based on number of lines
      const lineHeight = Game.letter_height + 2; // Adjust spacing as needed
      const totalHeight = lines.length * lineHeight + lineHeight; // Additional space for restart button

      // Starting Y position to center the text block
      let startY = GameConstants.HEIGHT / 2 - totalHeight / 2;

      // Draw each line centered horizontally
      lines.forEach((line, index) => {
        const textWidth = Game.measureText(line).width;
        const spacing =
          index === 0 || index === 1 || index === lines.length - 1
            ? lineHeight * 1.5
            : lineHeight;
        Game.fillText(line, GameConstants.WIDTH / 2 - textWidth / 2, startY);
        startY += spacing;
      });

      // Draw the restart button
      const restartTextWidth = Game.measureText(restartButton).width;
      Game.fillText(
        restartButton,
        GameConstants.WIDTH / 2 - restartTextWidth / 2,
        startY,
      );
    }
    PostProcessor.draw(delta);
    if (this.hurting) this.drawHurt(delta);

    if (this.player.mapToggled === true) this.player.map.draw(delta);
    //this.drawTileCursor(delta);
    this.player.setCursorIcon();

    //this.drawInventoryButton(delta);
    if (this.player.menu.open) this.player.menu.drawMenu();
    Game.ctx.restore();
  };

  drawCooldownBar = () => {
    Game.ctx.save();
    if (this.player.cooldownRemaining > 0) {
      this.player.cooldownRemaining =
        1 -
        (Date.now() - this.player.movement.lastMoveTime) /
          this.player.movement.adjustedCooldown;
    } else this.player.cooldownRemaining = 0;
    const tile = GameConstants.TILESIZE;
    Game.drawFX(
      12 +
        Math.max(
          0,
          Math.min(14, Math.floor(17 * this.player.cooldownRemaining)),
        ),
      2,
      1,
      1,
      0.45,
      GameConstants.HEIGHT / tile - 2.125,
      1,
      1,
    );
    Game.ctx.restore();
  };

  drawHurt = (delta: number) => {
    Game.ctx.save(); // Save the current canvas state
    Game.ctx.globalAlpha = this.hurtAlpha;
    this.hurtAlpha -= (this.hurtAlpha / 10) * delta;
    if (this.hurtAlpha <= 0.01) {
      this.hurtAlpha = 0;
      this.hurting = false;
      this.hurtingShield = false;
    }
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.fillStyle = "#cc3333"; // bright but not fully saturated red
    if (this.hurtingShield) {
      Game.ctx.fillStyle = "#639bff"; // bright but not fully saturated blue
    }

    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    Game.ctx.restore(); // Restore the canvas state
  };

  drawLowHealth = (delta: number) => {
    Game.ctx.save();
    //unused
    if (this.player.health <= 1 && !this.player.dead) {
      // Calculate pulsating alpha for the vignette effect
      const lowHealthAlpha = 0.5; //Math.sin(this.lowHealthFrame / 10) * 0.5 + 0.5;
      Game.ctx.globalAlpha = lowHealthAlpha;
      this.lowHealthFrame += delta;

      const gradientBottom = Game.ctx.createLinearGradient(
        0,
        GameConstants.HEIGHT,
        0,
        (GameConstants.HEIGHT * 2) / 3,
      );

      // Define gradient color stops
      [gradientBottom].forEach((gradient) => {
        gradient.addColorStop(0, "#cc3333"); // Solid red at edges
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent toward center
      });

      // Draw the gradients
      Game.ctx.globalCompositeOperation = "source-over";

      Game.ctx.fillStyle = gradientBottom;
      Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

      // Reset composite operation and alpha
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.globalAlpha = 1.0;
    } else {
      this.lowHealthFrame = 0;
    }
    Game.ctx.restore();
  };

  heartbeat = () => {
    this.guiHeartFrame = 1;
  };

  /**
   * Draws the tile cursor to the canvas.
   * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
   * to ensure canvas state is preserved.
   */
  drawTileCursor = (delta: number) => {
    if (this.player.inventory.isOpen) return;
    Game.ctx.save(); // Save the current canvas state

    if (
      !this.player.mouseInLine() ||
      !this.player.isMouseAboveFloor() ||
      this.player.isMouseOnPlayerTile()
    )
      return;
    let tileX = 22; //inRange ? 22 : 24;
    let tileY = 3;

    const moveData = this.player.canMoveWithMouse();
    if (moveData && moveData.direction !== undefined) {
      switch (moveData.direction) {
        case Direction.UP:
          tileY = 3;
          break;
        case Direction.RIGHT:
          tileY = 4;
          break;
        case Direction.DOWN:
          tileY = 5;
          break;
        case Direction.LEFT:
          tileY = 6;
          break;
      }
    }

    Game.drawFX(
      tileX + Math.floor(HitWarning.frame),
      tileY,
      1,
      1,
      this.player.tileCursor.x,
      this.player.tileCursor.y,
      1,
      1,
    );

    Game.ctx.restore(); // Restore the canvas state
  };

  jump = (delta: number) => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.jumpY = Math.abs(Math.sin(j * Math.PI) * this.jumpHeight);
    if (Math.abs(this.jumpY) < 0.01) this.jumpY = 0;
    if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
  };
}
