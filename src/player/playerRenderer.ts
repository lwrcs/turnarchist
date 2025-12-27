import { Direction, Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { HitWarning } from "../drawable/hitWarning";
import { LevelConstants } from "../level/levelConstants";
import { MouseCursor } from "../gui/mouseCursor";
import { PostProcessor } from "../gui/postProcess";
import { statsTracker } from "../game/stats";
import { Utils } from "../utility/utils";
import { Spellbook } from "../item/weapon/spellbook";
import { Player } from "./player";
import { HoverText } from "../gui/hoverText";
import { Shadow } from "../drawable/shadow";
import { getOrCreateUserId, safeRecordGameStats } from "../api";
import { getDeviceInfo } from "../utility/deviceDetector";
import { VendingMachine } from "../entity/object/vendingMachine";

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
  drawZ: number;
  hitX: number;
  hitY: number;
  private frame: number;
  private slowMotionTickDuration: number;
  private lowHealthFrame: number;
  private flashing: boolean;
  private lightingDirectionBucket: number | null;

  private readonly divingHelmetTileX: number = 0;
  private readonly divingHelmetTileY: number = 12;

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
    this.drawZ = 0;
    this.hurtAlpha = 0.25;
    this.jumpHeight = 0.25;
    this.hurting = false;
    this.hurtingShield = false;
    this.slowMotionEnabled = false;
    this.slowMotionTickDuration = 0;
    this.flashing = false;
    this.lowHealthFrame = 0;
    this.frame = 0;
    this.lightingDirectionBucket = null;
  }

  hurt = () => {
    this.hurting = true;
    this.hurtAlpha = 0.25;
  };
  hurtShield = () => {
    this.hurtingShield = true;
  };

  outlineColor = () => {
    let color = "black";
    const buffed = this.player.damageBonus > 0;
    const shielded =
      this.player.inventory.getArmor() &&
      this.player.inventory.getArmor().health > 0;

    if (buffed) {
      color = GameConstants.PLAYER_DAMAGE_BUFF_COLOR;
    }
    /*
    if (shielded) {
      color = GameConstants.PLAYER_SHIELD_COLOR;
    }
    if (buffed && shielded) {
      color =
        Math.floor(this.frame) % 2 === 0
          ? GameConstants.PLAYER_DAMAGE_BUFF_COLOR
          : GameConstants.PLAYER_SHIELD_COLOR;
    }
          */
    return color;
  };

  outlineOpacity = () => {
    let opacity = 0;

    const buffed = this.player.damageBonus > 0;
    const shielded =
      this.player.inventory.getArmor() &&
      this.player.inventory.getArmor().health > 0;

    if (buffed) {
      opacity = 0.25; //Math.sin(Date.now() / 100) * 0.1 + 0.25;
    }
    /*
    if (shielded) {
      opacity = 0.25;
    }
    if (buffed && shielded) {
      opacity = 0.5;
    }
      */
    return opacity;
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

  setNewDrawXY = (x: number, y: number, z: number) => {
    this.drawX += x - this.player.x;
    this.drawY += y - this.player.y;
    this.drawZ += z - this.player.z;
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

  getJumpOffset = (): number => {
    return this.jumpY;
  };

  /**
   * Draws the player sprite to the canvas.
   * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
   * to ensure canvas state is preserved.
   */
  drawPlayerSprite = (delta: number) => {
    const player = this.player;
    const divingHelmet = player.inventory.divingHelmetEquipped();
    const tileX = divingHelmet
      ? this.divingHelmetTileX
      : 1 + Math.floor(this.frame);
    const tileY = divingHelmet
      ? this.divingHelmetTileY + player.direction * 2
      : 8 + player.direction * 2;
    Game.ctx.save(); // Save the current canvas state
    const divingHelmetOffsetY = divingHelmet ? 2 : 0;

    if (this.drawSmear()) {
      Game.drawMob(
        this.setSmearFrame().x,
        this.setSmearFrame().y,
        1,
        2,
        player.x - this.drawX - this.hitX,
        player.y - 1.45 - this.drawY - this.jumpY - this.hitY - this.drawZ,
        1,
        2,
        this.shadeColor(),
        undefined,
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
      );
    } else if (
      this.player.inputHandler.mostRecentMoveInput === "mouse" &&
      this.mouseDiagonal() &&
      !GameConstants.isMobile
    ) {
      const angle = (this.player.inputHandler.mouseAngle() * 180) / Math.PI;
      let diagonalTile = { x: 1, y: 18 };

      if (angle > -150 && angle <= -120)
        diagonalTile = { x: 3, y: 18 + divingHelmetOffsetY };
      if (angle > -60 && angle <= -30)
        diagonalTile = { x: 4, y: 18 + divingHelmetOffsetY };
      if (angle > 30 && angle <= 60)
        diagonalTile = { x: 2, y: 18 + divingHelmetOffsetY };
      if (angle > 120 && angle <= 150)
        diagonalTile = { x: 1, y: 18 + divingHelmetOffsetY };

      Game.drawMob(
        diagonalTile.x,
        diagonalTile.y,
        1,
        2,
        player.x - this.drawX - this.hitX,
        player.y - 1.45 - this.drawY - this.jumpY - this.hitY - this.drawZ,
        1,
        2,
        this.shadeColor(),
        undefined,
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
      );
    } else {
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      Game.drawMob(
        tileX,
        tileY,
        1,
        2,
        player.x - this.drawX - this.hitX,
        player.y - 1.45 - this.drawY - this.jumpY - this.hitY - this.drawZ,
        1,
        2,
        this.shadeColor(),
        undefined,
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
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

  private trackMouseLightingDirection = () => {
    if (
      !GameConstants.NARROWED_LIGHTING_FOV ||
      GameConstants.isMobile ||
      !GameConstants.MOVE_WITH_MOUSE
    ) {
      this.lightingDirectionBucket = null;
      return;
    }

    const room = (this.player as any).getRoom
      ? (this.player as any).getRoom()
      : this.player.game.levels[this.player.depth].rooms[this.player.levelID];
    if (!room) {
      this.lightingDirectionBucket = null;
      return;
    }

    const inputHandler = this.player.inputHandler;
    if (inputHandler?.mostRecentMoveInput !== "mouse") {
      this.lightingDirectionBucket = null;
      return;
    }

    const angleDegrees = this.normalizeDegrees(
      (inputHandler.mouseAngle() * 180) / Math.PI,
    );
    const bucket = this.getMouseDirectionBucket(angleDegrees);

    if (bucket === this.lightingDirectionBucket) return;

    this.lightingDirectionBucket = bucket;
    room.updateLighting({ x: this.player.x, y: this.player.y });
  };

  private getMouseDirectionBucket = (angle: number): number => {
    const normalized = this.normalizeDegrees(angle);
    return Math.floor((normalized + 22.5) / 45) % 8;
  };

  private normalizeDegrees = (angle: number): number => {
    const normalized = angle % 360;
    return normalized < 0 ? normalized + 360 : normalized;
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

    const divingHelmet = this.player.inventory.divingHelmetEquipped();
    tile.y = divingHelmet ? 20 : 18;

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
        if (divingHelmet) {
          tile.x = 0;
          tile.y = 18;
        }
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
        if (divingHelmet) {
          tile.x = 0;
          tile.y = 12;
        }
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
        if (divingHelmet) {
          tile.x = 0;
          tile.y = 16;
        }
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
        if (divingHelmet) {
          tile.x = 0;
          tile.y = 12;
        }
      }
      if (timeSince >= t * 2 && timeSince < t * 3) tile.x = 2;
      return tile;
    }
  };

  draw = (delta: number) => {
    const player = this.player;
    Game.ctx.save();
    this.trackMouseLightingDirection();
    this.updateDrawXY(delta);
    player.drawableY = player.y;
    this.flashingFrame += (delta * 12) / GameConstants.FPS;
    if (!player.dead) {
      Shadow.draw(player.x - this.drawX, player.y - this.drawY, 1, 1);
      //this.drawTileCursor(delta);

      if (!this.flashing || Math.floor(this.flashingFrame) % 2 === 0) {
        this.drawPlayerSprite(delta);
      }
    }
    this.drawSpellBeam(delta);
    Game.ctx.restore();
  };

  drawSpellBeam = (delta: number) => {
    Game.ctx.save();

    if (this.player.inventory.getWeapon() instanceof Spellbook) {
      const spellbook = this.player.inventory.getWeapon() as Spellbook;
      spellbook.drawBeams(
        this.player.x - this.drawX,
        this.player.y - this.drawY,
        delta,
      );
    }

    Game.ctx.restore();
  };

  shadeColor = () => {
    const player = this.player;

    if (!GameConstants.CUSTOM_SHADER_COLOR_ENABLED) {
      return "black";
    } else {
      const room = (this.player as any).getRoom
        ? (this.player as any).getRoom()
        : this.player.game.levels[this.player.depth].rooms[this.player.levelID];
      return Utils.rgbToHex(
        room.col[player.x][player.y][0],
        room.col[player.x][player.y][1],
        room.col[player.x][player.y][2],
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
      this.player.y - this.drawY - this.drawZ,
      !this.flashing || Math.floor(this.flashingFrame) % 2 === 0,
    );

    Game.ctx.restore(); // Restore the canvas state
  };

  updateDrawXY = (delta: number) => {
    if (!this.doneMoving()) {
      this.drawX *= 0.85 ** delta;
      this.drawY *= 0.85 ** delta;
      this.drawZ *= 0.85 ** delta;
      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
      this.drawZ = Math.abs(this.drawZ) < 0.01 ? 0 : this.drawZ;
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
    // Use exponential decay like updateDrawXY for stable behavior with variable frame rates
    this.hitX *= 0.7 ** delta;
    this.hitY *= 0.7 ** delta;

    // Clamp values to prevent extreme behavior
    this.hitX = Math.min(Math.max(this.hitX, -1), 1);
    this.hitY = Math.min(Math.max(this.hitY, -1), 1);

    // Snap to zero when values get very small
    if (Math.abs(this.hitX) < 0.01) this.hitX = 0;
    if (Math.abs(this.hitY) < 0.01) this.hitY = 0;
  };

  doneMoving = (): boolean => {
    let EPSILON = 0.01;
    return (
      Math.abs(this.drawX) < EPSILON &&
      Math.abs(this.drawY) < EPSILON &&
      Math.abs(this.drawZ) < EPSILON
    );
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
      //if (this.player.menu.open) this.player.menu.draw();

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
        if (
          this.player.health <= 1 &&
          this.player.health !== this.player.maxHealth
        ) {
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
      this.drawBreathStatus(quickbarStartX);
      if (armor) armor.drawGUI(delta, this.player.maxHealth, quickbarStartX);
      if (!transitioning) this.player.inventory.draw(delta);
      const inventoryOpen = this.player.inventory.isOpen;
      const quickbarOpen =
        this.player.inventory.isPointInQuickbarBounds(
          MouseCursor.getInstance().getPosition().x,
          MouseCursor.getInstance().getPosition().y,
        ).inBounds && !this.player.inventory.isOpen;
      const inVendingMachine =
        this.player.openVendingMachine &&
        VendingMachine.isPointInVendingMachineBounds(
          MouseCursor.getInstance().getPosition().x,
          MouseCursor.getInstance().getPosition().y,
          this.player.openVendingMachine,
        );
      const inInventoryBounds = this.player.inventory.isPointInInventoryBounds(
        MouseCursor.getInstance().getPosition().x,
        MouseCursor.getInstance().getPosition().y,
      ).inBounds;

      const drawFor =
        GameConstants.IN_GAME_HOVER_TEXT_ENABLED &&
        !this.player.menu.open &&
        !this.player.bestiary?.isOpen &&
        !inventoryOpen &&
        !quickbarOpen &&
        !this.player.openVendingMachine
          ? "inGame"
          : GameConstants.INVENTORY_HOVER_TEXT_ENABLED &&
              !this.player.menu.open &&
              !this.player.bestiary?.isOpen &&
              ((inventoryOpen && inInventoryBounds) || quickbarOpen)
            ? "inventory"
            : GameConstants.VENDING_MACHINE_HOVER_TEXT_ENABLED &&
                !this.player.menu.open &&
                !this.player.bestiary?.isOpen &&
                inVendingMachine
              ? "vendingMachine"
              : "none";

      if (GameConstants.HOVER_TEXT_ENABLED) {
        HoverText.draw(
          delta,
          this.player.x,
          this.player.y,
          this.player.getRoom
            ? this.player.getRoom()
            : this.player.game.levels[this.player.depth].rooms[
                this.player.levelID
              ],
          this.player,
          MouseCursor.getInstance().getPosition().x,
          MouseCursor.getInstance().getPosition().y,
          drawFor,
        );
      }

      // Draw bestiary last so it renders above inventory/quickbar.
      if (this.player.bestiary) this.player.bestiary.draw(delta);
    } else {
      Game.ctx.fillStyle = LevelConstants.LEVEL_TEXT_COLOR;
      const gameStats = statsTracker.getStats();
      const enemies = gameStats.enemies;
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

      const diedInRoom = (this.player as any).getRoom
        ? (this.player as any).getRoom()
        : this.player.game.levels[this.player.depth].rooms[this.player.levelID];
      lines.push(`Depth reached: ${diedInRoom.depth}`);

      // Line 2: Enemies killed
      lines.push(
        `${Object.values(enemyCounts).reduce(
          (a, b) => a + b,
          0,
        )} enemies killed in total:`,
      );

      // Build enemy lines
      const enemyLines: string[] = [];
      Object.entries(enemyCounts).forEach(([enemy, count]) => {
        enemyLines.push(`${enemy} x${count}`);
      });

      // Line after enemy counts: Restart instruction
      let restartButton = "Press space or click to restart";
      if (GameConstants.isMobile) restartButton = "Tap to restart";
      const lineHeight = Game.letter_height + 2; // Adjust spacing as needed

      // Reserve bottom area for restart + feedback button + margins
      const restartAreaHeight = lineHeight * 2; // restart text + small spacing
      const feedbackButtonHeight = 16; // from LinkButton
      const bottomMargin = 10;
      const reservedBottomHeight =
        restartAreaHeight + feedbackButtonHeight + bottomMargin + 8; // extra padding

      // Compute available vertical space for content between top margin and reserved bottom
      const topMargin = 20;
      const availableHeight = Math.max(
        0,
        GameConstants.HEIGHT - reservedBottomHeight - topMargin,
      );

      // Fixed header lines (Game Over / Depth / Total)
      const headerLines = lines.length; // currently 3
      const headerHeight = headerLines * lineHeight + lineHeight * 0.5; // slight extra spacing

      // How many enemy lines fit
      const remainingForEnemies = Math.max(0, availableHeight - headerHeight);
      const enemiesPerPageBase = Math.max(
        1,
        Math.floor(remainingForEnemies / lineHeight),
      );

      // Pagination setup
      let enemiesPerPage = enemiesPerPageBase;
      const totalEnemyLines = enemyLines.length;
      // Precompute pages; if more than one page, reserve a row for page indicator by reducing capacity by one
      let totalPages = Math.max(1, Math.ceil(totalEnemyLines / enemiesPerPage));
      if (totalPages > 1) {
        enemiesPerPage = Math.max(1, enemiesPerPageBase - 1);
        totalPages = Math.max(1, Math.ceil(totalEnemyLines / enemiesPerPage));
      }
      this.player.deathScreenPageCount = totalPages;
      const currentPage = Math.min(
        Math.max(0, this.player.deathScreenPageIndex || 0),
        totalPages - 1,
      );
      this.player.deathScreenPageIndex = currentPage;

      const startIdx = currentPage * enemiesPerPage;
      const endIdx = Math.min(totalEnemyLines, startIdx + enemiesPerPage);
      const pageEnemyLines = enemyLines.slice(startIdx, endIdx);

      // Compute starting Y to vertically position the block within available area
      let startY = topMargin;

      // Draw headers
      lines.forEach((line, index) => {
        const textWidth = Game.measureText(line).width;
        const spacing = index <= 1 ? lineHeight * 1.5 : lineHeight;
        Game.fillText(line, GameConstants.WIDTH / 2 - textWidth / 2, startY);
        startY += spacing;
      });

      // Draw enemies for current page
      pageEnemyLines.forEach((line) => {
        const textWidth = Game.measureText(line).width;
        Game.fillText(line, GameConstants.WIDTH / 2 - textWidth / 2, startY);
        startY += lineHeight;
      });

      // Draw page indicator if multiple pages
      if (totalPages > 1) {
        const indicator = `Page ${currentPage + 1}/${totalPages}`;
        const w = Game.measureText(indicator).width;
        const y = GameConstants.HEIGHT - reservedBottomHeight - 6;
        Game.fillText(indicator, GameConstants.WIDTH / 2 - w / 2, y);
      }

      // Draw the restart button above the feedback button
      const restartTextWidth = Game.measureText(restartButton).width;
      const restartY = GameConstants.HEIGHT - reservedBottomHeight + 4;
      Game.fillText(
        restartButton,
        GameConstants.WIDTH / 2 - restartTextWidth / 2,
        restartY,
      );

      // Draw feedback button at the very bottom reserved area
      if (this.player.game.feedbackButton) {
        const feedbackY = restartY + lineHeight + 6;

        const textWidth = Game.measureText(
          this.player.game.feedbackButton.text,
        ).width;
        const buttonWidth = textWidth + 10;
        const centeredX = (GameConstants.WIDTH - buttonWidth) / 2;

        this.player.game.feedbackButton.x = centeredX;
        this.player.game.feedbackButton.y = feedbackY;
        this.player.game.feedbackButton.draw();
      }

      // Navigation hint for pagination on desktop
      if (!GameConstants.isMobile && totalPages > 1) {
        const hint = "Use arrow keys to view more";
        const hintWidth = Game.measureText(hint).width;
        const hintY =
          (this.player.game.feedbackButton?.y || GameConstants.HEIGHT - 20) +
          feedbackButtonHeight +
          4;
        if (hintY < GameConstants.HEIGHT - 2) {
          Game.fillText(hint, GameConstants.WIDTH / 2 - hintWidth / 2, hintY);
        }
      }

      if (!this.player.game.hasRecordedStats) {
        // The default value for `lastHitBy` is "enemy", so we compare to that to determine if
        // the player was killed by an enemy
        const gameDurationMs = Date.now() - this.player.game.gameStartTimeMs;
        const inventoryItems = this.player.inventory.items
          .filter((item) => item?.name && item?.stackCount)
          .map((item) => ({
            name: item.name,
            stackSize: item.stackCount,
          }));

        const { createGameState } = require("../game/gameState");

        // Report game stats to Turnarchist backend server
        safeRecordGameStats({
          userId: getOrCreateUserId(),
          xp: gameStats.xp,
          level: gameStats.level,
          gameDurationMs,
          inventory: inventoryItems,
          killedBy: this.player.lastHitBy ?? null,
          enemiesKilled: enemies,
          damageDone: gameStats.damageDone,
          damageTaken: gameStats.damageTaken,
          depthReached: diedInRoom.depth,
          turnsPassed: gameStats.turnsPassed,
          coinsCollected: gameStats.coinsCollected,
          itemsCollected: gameStats.itemsCollected,
          deviceType: getDeviceInfo(),
          sidePathsEntered: gameStats.sidePathsEntered,
          weaponChoice: gameStats.weaponChoice,
          gameState: createGameState(this.player.game),
          gameVersion: this.player.game.version,
          loadedFromSaveFile: this.player.game.loadedFromSaveFile,
        });
        this.player.game.hasRecordedStats = true;
      }
    }

    const game = this.player?.game;
    const cameraOrigin = game?.getWaterOverlayOrigin?.() ?? {
      x: 0,
      y: 0,
    };

    PostProcessor.draw(
      delta,
      this.player?.getRoom()?.underwater ?? false,
      cameraOrigin,
    );
    if (this.hurting) this.drawHurt(delta);

    if (this.player.mapToggled === true && !this.player.bestiary?.isOpen)
      this.player.map.draw(delta);
    this.drawTileCursor(delta);
    this.player.setCursorIcon();

    //this.drawInventoryButton(delta);
    if (this.player.menu.open) this.player.menu.draw(delta);
    Game.ctx.restore();
  };

  private drawBreathStatus = (quickbarStartX: number) => {
    const helmet = this.player.getEquippedDivingHelmet();
    const barWidth = 64;
    const barHeight = 6;
    const barX = Math.max(8, quickbarStartX - 16);
    const barY = GameConstants.HEIGHT - 28;

    if (helmet) {
      const ratio = Math.max(0, helmet.currentAir / helmet.maxAir);
      Game.ctx.fillStyle = "rgba(8, 20, 32, 0.65)";
      Game.ctx.fillRect(barX, barY, barWidth, barHeight);
      Game.ctx.fillStyle = "#2bd6ff";
      Game.ctx.fillRect(
        barX + 1,
        barY + 1,
        Math.max(0, (barWidth - 2) * ratio),
        barHeight - 2,
      );
      Game.fillTextOutline(
        `Air ${Math.ceil(helmet.currentAir)}/${helmet.maxAir}`,
        barX,
        barY - 2,
        GameConstants.OUTLINE,
        "white",
      );
      return;
    }

    if (!this.player.isDrowning) return;

    const turns = Math.max(0, this.player.getDrowningTurnsUntilDamage());
    Game.fillTextOutline(
      `Drowning ${turns}t`,
      barX,
      barY - 2,
      GameConstants.OUTLINE,
      GameConstants.WARNING_RED,
    );
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
    if (
      this.player.inventory.isOpen ||
      this.player.inputHandler.mostRecentMoveInput === "keyboard" ||
      GameConstants.isMobile
    )
      return;
    Game.ctx.save(); // Save the current canvas state

    if (
      !this.player.mouseInLine() ||
      !this.player.isMouseAboveFloor() ||
      this.player.isMouseOnPlayerTile()
    )
      return;
    let tileX = 24; //inRange ? 22 : 24;
    let tileY = 5;

    Game.drawFX(
      tileX + Math.floor(HitWarning.frame),
      tileY,
      1,
      1,
      this.player.tileCursor.x + this.player.drawX,
      this.player.tileCursor.y + this.player.drawY,
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
