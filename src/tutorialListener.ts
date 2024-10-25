import { EventEmitter } from "./eventEmitter";
import { Room } from "./room";
import { Enemy } from "./entity/enemy/enemy";

export class Tutorial {
  private seenEnemies: Set<string> = new Set();
  private eventEmitter: EventEmitter;

  constructor() {
    console.log("Tutorial constructor called");
    this.eventEmitter = new EventEmitter();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    console.log("Setting up event listeners");
    this.eventEmitter.on<typeof Enemy>(
      "SeenPlayer",
      this.handleEnemySeen.bind(this)
    );
  }

  private handleEnemySeen(enemyConstructor: typeof Enemy): void {
    console.log(`handleEnemySeen called with enemy: ${enemyConstructor.name}`);
    const enemyName = enemyConstructor.name;
    if (!this.hasSeenEnemy(enemyName)) {
      console.log(`New enemy encountered: ${enemyName}`);
      this.addSeenEnemy(enemyName);
      this.createTutorialRoom(enemyName);
    } else {
      console.log(`Enemy already seen: ${enemyName}`);
    }
  }

  private createTutorialRoom(enemyName: string): void {
    // This function is blank for now, but will be implemented later
    console.log(`Creating tutorial room for new enemy: ${enemyName}`);
  }

  // Method to check if an enemy has been seen before
  hasSeenEnemy(enemyName: string): boolean {
    console.log(`Checking if enemy has been seen: ${enemyName}`);
    return this.seenEnemies.has(enemyName);
  }

  // Method to manually add an enemy to the seen list (useful for testing or manual control)
  addSeenEnemy(enemyName: string): void {
    console.log(`Adding enemy to seen list: ${enemyName}`);
    this.seenEnemies.add(enemyName);
  }

  // Method to reset the seen enemies list (useful for testing or game resets)
  resetSeenEnemies(): void {
    console.log("Resetting seen enemies list");
    this.seenEnemies.clear();
  }

  // Method to clean up event listeners when needed
  cleanup(): void {
    console.log("Cleaning up event listeners");
    this.eventEmitter.off<typeof Enemy>(
      "SeenPlayer",
      this.handleEnemySeen.bind(this)
    );
  }
}
