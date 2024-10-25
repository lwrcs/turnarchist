import { globalEventBus } from "./eventBus";
import { Enemy } from "./entity/enemy/enemy";
import { Room, RoomType } from "./room";
import { Game } from "./game";
import { DownLadder } from "./tile/downLadder";
import { Door, DoorType } from "./tile/door";
import { Player } from "./player";

export class TutorialListener {
  private seenEnemies: Set<typeof Enemy> = new Set();
  private pendingNewEnemies: Set<typeof Enemy> = new Set();
  private tutorialCreationTimeout: NodeJS.Timeout | null = null;
  private game: Game;
  private player: Player;
  private room: Room;

  constructor(game: Game) {
    //console.log("Tutorial constructor called");
    this.setupEventListeners();
    console.log(`TutorialListener constructor called for room: ${game}`);
    this.game = game;
  }

  private setupEventListeners(): void {
    //console.log("Setting up event listeners");
    globalEventBus.on("EnemySeenPlayer", this.handleEnemySeen.bind(this));
  }

  private handleEnemySeen(data: {
    enemyType: typeof Enemy;
    enemy: Enemy;
  }): void {
    console.log(`handleEnemySeen called with enemy: ${data.enemyType}`);
    if (!this.hasSeenEnemy(data.enemyType)) {
      console.log(`New enemy encountered: ${data.enemyType}`);
      this.addSeenEnemy(data.enemyType);
      this.pendingNewEnemies.add(data.enemyType);
      this.scheduleTutorialCreation();
    } else {
      console.log(`Enemy already seen: ${data.enemyType}`);
    }
  }

  private scheduleTutorialCreation(): void {
    if (this.tutorialCreationTimeout === null) {
      this.tutorialCreationTimeout = setTimeout(() => {
        this.createTutorialRoom(Array.from(this.pendingNewEnemies));
        this.pendingNewEnemies.clear();
        this.tutorialCreationTimeout = null;
      }, 100); // Wait 100ms to collect all new enemies
    }
  }

  private createTutorialRoom(enemyTypes: Array<typeof Enemy>) {
    this.game.tutorialActive = true;
    this.game.room.doors.forEach((door: Door) => {
      door.guard();
    });

    console.log(
      `Creating tutorial room for new enemies: ${enemyTypes.join(", ")}`
    );
  }

  // Method to check if an enemy has been seen before
  hasSeenEnemy(enemyType: typeof Enemy): boolean {
    //console.log(`Checking if enemy has been seen: ${enemyType}`);
    return this.seenEnemies.has(enemyType);
  }

  // Method to manually add an enemy to the seen list (useful for testing or manual control)
  addSeenEnemy(enemyType: typeof Enemy): void {
    //console.log(`Adding enemy to seen list: ${enemyType}`);
    this.seenEnemies.add(enemyType);
  }

  // Method to reset the seen enemies list (useful for testing or game resets)
  resetSeenEnemies(): void {
    //console.log("Resetting seen enemies list");
    this.seenEnemies.clear();
  }

  // Method to clean up event listeners when needed
  cleanup(): void {
    //console.log("Cleaning up event listeners");
    globalEventBus.off("EnemySeenPlayer", this.handleEnemySeen.bind(this));
  }
}
