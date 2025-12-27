import { globalEventBus } from "../event/eventBus";
import { Game } from "../game";
import { Player } from "../player/player";

export class TutorialListener {
  // EnemySeenPlayer currently emits `enemyType` as a string (constructor.name).
  // Track by type-name so this stays consistent and serializable.
  private _seenEnemyTypes: Set<string> = new Set();
  private pendingNewEnemyTypes: Set<string> = new Set();
  private tutorialCreationTimeout: NodeJS.Timeout | null = null;
  private game: Game;
  private player: Player;

  constructor(game: Game) {
    //console.log("Tutorial constructor called");
    this.setupEventListeners();
    this.game = game;
    this.player = this.game.player;
  }

  get seenEnemyTypes(): Set<string> {
    if (this._seenEnemyTypes === undefined) {
      this._seenEnemyTypes = new Set();
    }
    return this._seenEnemyTypes;
  }

  private setupEventListeners(): void {
    //console.log("Setting up event listeners");
    globalEventBus.on("EnemySeenPlayer", this.handleEnemySeen.bind(this));
  }

  private handleEnemySeen(data: {
    enemyType: string;
    enemyName: string;
  }): void {
    if (!this.hasSeenEnemyType(data.enemyType)) {
      this.game.pushMessage(`New enemy encountered: ${data.enemyName}`);
      this.addSeenEnemyType(data.enemyType);
      this.pendingNewEnemyTypes.add(data.enemyType);
      this.scheduleTutorialCreation();
      // Bestiary handles persistence + entry creation now; keep this for immediate session UI.
      this.player.bestiary.addEntry(data.enemyType);
    }
  }

  private scheduleTutorialCreation(): void {
    if (this.tutorialCreationTimeout === null) {
      this.tutorialCreationTimeout = setTimeout(() => {
        this.createTutorialRoom(Array.from(this.pendingNewEnemyTypes));
        //this.game.pushMessage("Defeat the enemies guarding the exits.");
        this.pendingNewEnemyTypes.clear();
        this.tutorialCreationTimeout = null;
      }, 100); // Wait 100ms to collect all new enemies
    }
  }

  private createTutorialRoom(enemyTypes: Array<string>) {
    /*
    this.game.tutorialActive = true;
    this.game.room.doors.forEach((door: Door) => {
      door.guard();
    });
    */
  }

  // Method to check if an enemy has been seen before
  hasSeenEnemyType(enemyType: string): boolean {
    return this._seenEnemyTypes.has(enemyType);
  }

  // Method to manually add an enemy to the seen list (useful for testing or manual control)
  addSeenEnemyType(enemyType: string): void {
    this._seenEnemyTypes.add(enemyType);
  }

  // Method to reset the seen enemies list (useful for testing or game resets)
  resetSeenEnemies(): void {
    //console.log("Resetting seen enemies list");
    this._seenEnemyTypes.clear();
  }

  // Method to clean up event listeners when needed
  cleanup(): void {
    //console.log("Cleaning up event listeners");
    globalEventBus.off("EnemySeenPlayer", this.handleEnemySeen.bind(this));
  }
}
