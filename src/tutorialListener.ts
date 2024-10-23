import { EventEmitter } from "./eventEmitter";

export class TutorialListener {
  private seenEnemies: Set<string> = new Set();

  constructor(private eventEmitter: EventEmitter) {
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventEmitter.on("entityPresent", this.handleEntityPresent.bind(this));
  }

  private handleEntityPresent(enemyName: string): void {
    if (!this.seenEnemies.has(enemyName)) {
      this.seenEnemies.add(enemyName);
      this.createTutorialRoom(enemyName);
    }
  }

  private createTutorialRoom(enemyName: string): void {
    // This function is blank for now, but will be implemented later
    console.log(`Creating tutorial room for new enemy: ${enemyName}`);
  }

  // Method to check if an enemy has been seen before
  hasSeenEnemy(enemyName: string): boolean {
    return this.seenEnemies.has(enemyName);
  }

  // Method to manually add an enemy to the seen list (useful for testing or manual control)
  addSeenEnemy(enemyName: string): void {
    this.seenEnemies.add(enemyName);
  }

  // Method to reset the seen enemies list (useful for testing or game resets)
  resetSeenEnemies(): void {
    this.seenEnemies.clear();
  }
}
