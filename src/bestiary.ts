import { Game } from "./game";
import { Player } from "./player";
import { Input } from "./input";
import { MouseCursor } from "./mouseCursor";
import { LevelConstants } from "./levelConstants";
import { GameConstants } from "./gameConstants";
import { Enemy } from "./entity/enemy/enemy";
import { CrabEnemy } from "./entity/enemy/crabEnemy";
import { FrogEnemy } from "./entity/enemy/frogEnemy";
import { ZombieEnemy } from "./entity/enemy/zombieEnemy";
import { SkullEnemy } from "./entity/enemy/skullEnemy";
import { EnergyWizardEnemy } from "./entity/enemy/energyWizard";
import { ChargeEnemy } from "./entity/enemy/chargeEnemy";
import { RookEnemy } from "./entity/enemy/rookEnemy";
import { BishopEnemy } from "./entity/enemy/bishopEnemy";
import { ArmoredzombieEnemy } from "./entity/enemy/armoredzombieEnemy";
import { BigSkullEnemy } from "./entity/enemy/bigSkullEnemy";
import { QueenEnemy } from "./entity/enemy/queenEnemy";
import { KnightEnemy } from "./entity/enemy/knightEnemy";
import { BigKnightEnemy } from "./entity/enemy/bigKnightEnemy";
import { FireWizardEnemy } from "./entity/enemy/fireWizard";
import { Spawner } from "./entity/enemy/spawner";
import { OccultistEnemy } from "./entity/enemy/occultistEnemy";

//enemy typeof to class map
const enemyClassMap = {
  CrabEnemy: CrabEnemy,
  FrogEnemy: FrogEnemy,
  ZombieEnemy: ZombieEnemy,
  SkullEnemy: SkullEnemy,
  EnergyWizardEnemy: EnergyWizardEnemy,
  ChargeEnemy: ChargeEnemy,
  RookEnemy: RookEnemy,
  BishopEnemy: BishopEnemy,
  ArmoredzombieEnemy: ArmoredzombieEnemy,
  BigSkullEnemy: BigSkullEnemy,
  QueenEnemy: QueenEnemy,
  KnightEnemy: KnightEnemy,
  BigKnightEnemy: BigKnightEnemy,
  FireWizardEnemy: FireWizardEnemy,
  Spawner: Spawner,
  OccultistEnemy: OccultistEnemy,
};

interface BestiaryEntry {
  name: string;
  description: string;
  tileX: number;
  tileY: number;
}

export class Bestiary {
  game: Game;
  player: Player;
  isOpen: boolean = false;
  openTime: number = Date.now();
  entries: Array<BestiaryEntry>;
  seenEnemies: Set<typeof Enemy>;
  frame: number = 0;
  activeEntryIndex: number = 0;
  // Static variables for logbook button position
  private buttonY: number;
  private buttonX: number;

  constructor(game: Game, player: Player) {
    this.game = game;
    this.player = player;
    this.entries = [];
    this.activeEntryIndex = 0;
    this.buttonX = Math.round(
      (Math.round(GameConstants.WIDTH / 2) + 3) / GameConstants.TILESIZE,
    );
    this.buttonY = Math.round(10);
    this.seenEnemies = new Set();
  }

  /**
   * Opens the logbook window.
   */
  open = () => {
    if (this.seenEnemies.size === 0)
      this.seenEnemies = this.game.tutorialListener.seenEnemies;
    this.isOpen = true;
    this.openTime = Date.now();
  };

  /**
   * Closes the logbook window.
   */
  close = () => {
    this.isOpen = false;
  };

  entryUp = () => {
    this.activeEntryIndex =
      (this.activeEntryIndex - 1 + this.entries.length) % this.entries.length;
  };

  entryDown = () => {
    this.activeEntryIndex = (this.activeEntryIndex + 1) % this.entries.length;
  };

  /**
   * Toggles the logbook window's open state.
   */
  toggleOpen = () => {
    this.isOpen ? this.close() : this.open();
  };

  /**
   * Adds a new entry to the logbook.
   * @param enemy The enemy to add.
   */
  addEntry = (enemy: typeof Enemy) => {
    const enemyClass = enemyClassMap[enemy.name];
    this.entries.push({
      name: enemy.name,
      description: enemyClass.prototype.description,
      tileX: enemyClass.prototype.tileX,
      tileY: enemyClass.prototype.tileY,
    });
  };

  /**
   * Draws the logbook interface.
   * @param delta The time delta since the last frame.
   */
  draw = (delta: number) => {
    if (!this.isOpen) return;
    Game.ctx.save();

    // Draw semi-transparent background
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    // Define dimensions similar to Inventory
    const s = Math.min(18, (18 * (Date.now() - this.openTime)) / 100); // example scaling
    const b = 2; // border
    const g = -2; // gap
    const ob = 1; // outer border
    const width = 5 * (s + 2 * b + g) - g; // assuming 5 columns
    const height = 4 * (s + 2 * b + g) - g; // assuming 4 rows

    const startX = Math.round(0.5 * GameConstants.WIDTH - 0.5 * width) - ob;
    const startY = Math.round(0.5 * GameConstants.HEIGHT - 0.5 * height) - ob;

    // Draw main logbook background
    Game.ctx.fillStyle = "white";
    Game.ctx.fillRect(startX, startY, width + 2 * ob, height + 2 * ob);

    // Draw logbook entries
    Game.ctx.fillStyle = "black";
    const padding = 10;

    if (this.entries.length === 0) {
      Game.fillText("No enemies seen yet", startX + padding, startY + padding);
    } else {
      this.entries.forEach((entry, index) => {
        Game.fillText(
          entry.name,
          startX + padding,
          startY + padding + index * 20,
        );
      });

      this.drawEnemySprite(
        this.entries[this.activeEntryIndex].tileX,
        this.entries[this.activeEntryIndex].tileY,
        delta,
      );
    }
    // Draw logbook button
    this.drawLogbookButton(delta);
    Game.ctx.restore();
  };

  drawEnemySprite = (tileX: number, tileY: number, delta: number) => {
    this.frame += Math.round(0.1 * delta * 10) / 10;
    if (this.frame >= 4) this.frame = 0;

    Game.drawMob(tileX, tileY, 1, 1, 1, 1, 1, 1, "Black", 0);
  };

  /**
   * Draws the logbook button on the screen.
   * @param delta The time delta since the last frame.
   */
  drawLogbookButton = (delta: number) => {
    Game.ctx.save();
    this.buttonX = LevelConstants.SCREEN_W - 2;
    this.buttonY = LevelConstants.SCREEN_H - 2.25;
    Game.drawFX(0, 0, 2, 2, this.buttonX, this.buttonY, 2, 2);
    Game.ctx.restore();
  };

  /**
   * Handles mouse down events.
   * @param x The x-coordinate of the mouse.
   * @param y The y-coordinate of the mouse.
   * @param button The mouse button pressed.
   */
  handleMouseDown = (x: number, y: number, button: number) => {
    if (button !== 0) return; // Only respond to left click

    if (this.isPointInLogbookButton(x, y)) {
      this.toggleOpen();
    }
  };

  /**
   * Handles mouse up events.
   * @param x The x-coordinate of the mouse.
   * @param y The y-coordinate of the mouse.
   * @param button The mouse button released.
   */
  handleMouseUp = (x: number, y: number, button: number) => {
    // Implement if needed
  };

  /**
   * Handles hold detection.
   */
  onHoldDetected = () => {
    // Implement if needed
  };

  /**
   * Checks if a point is within the logbook button bounds.
   * @param x The x-coordinate to check.
   * @param y The y-coordinate to check.
   * @returns True if the point is within the button bounds, else false.
   */
  isPointInLogbookButton = (x: number, y: number): boolean => {
    const tX = x / GameConstants.TILESIZE;
    const tY = y / GameConstants.TILESIZE;
    return (
      tX >= this.buttonX &&
      tX <= this.buttonX + 2 &&
      tY >= this.buttonY &&
      tY <= this.buttonY + 2
    );
  };

  /**
   * Updates the logbook state each game tick.
   */
  tick = () => {
    if (this.isOpen) {
      // Update logbook-related logic here
    }
  };
}
