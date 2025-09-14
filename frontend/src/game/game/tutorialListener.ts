import { globalEventBus } from "../event/eventBus";
import { Enemy } from "../entity/enemy/enemy";
import { Room, RoomType } from "../room/room";
import { Game } from "../game";
import { DownLadder } from "../tile/downLadder";
import { Door, DoorType } from "../tile/door";
import { Player } from "../player/player";
import { Bestiary } from "./bestiary";

export class TutorialListener {
  private _seenEnemies: Set<typeof Enemy> = new Set();
  private _seenEnemyClasses: Set<Enemy> = new Set();
  private pendingNewEnemies: Set<typeof Enemy> = new Set();
  private tutorialCreationTimeout: NodeJS.Timeout | null = null;
  private game: Game;
  private player: Player;

  constructor(game: Game) {
    //console.log("Tutorial constructor called");
    this.setupEventListeners();
    this.game = game;
    this.player = this.game.player;
  }

  get seenEnemies(): Set<typeof Enemy> {
    if (this._seenEnemies === undefined) {
      this._seenEnemies = new Set();
    }
    return this._seenEnemies;
  }

  private setupEventListeners(): void {
    //console.log("Setting up event listeners");
    globalEventBus.on("EnemySeenPlayer", this.handleEnemySeen.bind(this));
  }

  private handleEnemySeen(data: {
    enemyType: typeof Enemy;
    enemyName: string;
  }): void {
    if (!this.hasSeenEnemy(data.enemyType)) {
      this.game.pushMessage(`New enemy encountered: ${data.enemyName}`);
      this.addSeenEnemy(data.enemyType);
      this.pendingNewEnemies.add(data.enemyType);
      this.scheduleTutorialCreation();

      this.player.bestiary.addEntry(data.enemyType);
      console.log(this.player.bestiary.entries);
    }
  }

  private scheduleTutorialCreation(): void {
    if (this.tutorialCreationTimeout === null) {
      this.tutorialCreationTimeout = setTimeout(() => {
        this.createTutorialRoom(Array.from(this.pendingNewEnemies));
        //this.game.pushMessage("Defeat the enemies guarding the exits.");
        this.pendingNewEnemies.clear();
        this.tutorialCreationTimeout = null;
      }, 100); // Wait 100ms to collect all new enemies
    }
  }

  private createTutorialRoom(enemyTypes: Array<typeof Enemy>) {
    /*
    this.game.tutorialActive = true;
    this.game.room.doors.forEach((door: Door) => {
      door.guard();
    });
    */
  }

  // Method to check if an enemy has been seen before
  hasSeenEnemy(enemyType: typeof Enemy): boolean {
    //console.log(`Checking if enemy has been seen: ${enemyType}`);
    return this._seenEnemies.has(enemyType);
  }

  // Method to manually add an enemy to the seen list (useful for testing or manual control)
  addSeenEnemy(enemyType: typeof Enemy): void {
    //console.log(`Adding enemy to seen list: ${enemyType}`);
    this._seenEnemies.add(enemyType);
    this._seenEnemyClasses.add(enemyType.prototype);
  }

  // Method to reset the seen enemies list (useful for testing or game resets)
  resetSeenEnemies(): void {
    //console.log("Resetting seen enemies list");
    this._seenEnemies.clear();
    this._seenEnemyClasses.clear();
  }

  // Method to clean up event listeners when needed
  cleanup(): void {
    //console.log("Cleaning up event listeners");
    globalEventBus.off("EnemySeenPlayer", this.handleEnemySeen.bind(this));
  }
}
