import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Partition, PartialLevel } from "./partitionGenerator";
import { LevelParameters } from "./levelParametersGenerator";

export interface AnimationConfig {
  partitionSplitDelay: number;
  pathfindingDelay: number;
  largeStepDelay: number;
  animationConstant: number;
  enabled: boolean;
}

export interface VisualizationState {
  currentStep: string;
  progress: number;
  partitions: Partition[];
  centerX: number;
  centerY: number;
}

export class GenerationVisualizer {
  private game: Game;
  private animationConfig: AnimationConfig;
  private visualizationState: VisualizationState;
  private debugMode: boolean;

  constructor(game: Game) {
    this.game = game;
    this.debugMode = document.cookie.includes("showgeneration=true");

    this.animationConfig = {
      partitionSplitDelay: this.debugMode ? 10 : 0,
      pathfindingDelay: this.debugMode ? 100 : 0,
      largeStepDelay: this.debugMode ? 100 : 0,
      animationConstant: 1,
      enabled: this.debugMode,
    };

    this.visualizationState = {
      currentStep: "initializing",
      progress: 0,
      partitions: [],
      centerX: 0,
      centerY: 0,
    };
  }

  /**
   * Updates the animation configuration
   */
  updateAnimationConfig(config: Partial<AnimationConfig>): void {
    this.animationConfig = { ...this.animationConfig, ...config };
  }

  /**
   * Sets the visualization state for rendering
   */
  setVisualizationState(
    partitions: Partition[],
    centerX: number,
    centerY: number,
    step: string = "generating",
    progress: number = 0,
  ): void {
    this.visualizationState = {
      currentStep: step,
      progress,
      partitions,
      centerX,
      centerY,
    };
  }

  /**
   * Draws the current generation state
   */
  draw(delta: number): void {
    // Clear the canvas
    Game.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    if (this.debugMode) {
      this.drawGenerationProgress(delta);
    } else {
      this.drawSimpleLoadingScreen();
    }
  }

  /**
   * Draws detailed generation progress for debug mode
   */
  private drawGenerationProgress(delta: number): void {
    if (this.visualizationState.partitions.length > 0) {
      // Draw all partitions
      this.visualizationState.partitions.forEach((partition) => {
        this.drawPartition(
          partition,
          delta,
          this.visualizationState.centerX,
          this.visualizationState.centerY,
        );
      });

      // Draw progress information
      this.drawProgressInfo();
    }
  }

  /**
   * Draws a simple loading screen for normal mode
   */
  private drawSimpleLoadingScreen(): void {
    this.game.drawTextScreen("generating level");
  }

  /**
   * Draws an individual partition
   */
  drawPartition(
    partition: Partition,
    delta: number,
    levelCenterX: number,
    levelCenterY: number,
  ): void {
    // Draw partition rectangle
    Game.ctx.fillStyle = partition.fillStyle;
    Game.ctx.fillRect(
      Math.round(GameConstants.WIDTH / 2 + partition.x - levelCenterX),
      Math.round(GameConstants.HEIGHT / 2 + partition.y - levelCenterY),
      partition.w,
      partition.h,
    );

    // Draw connections
    this.drawPartitionConnections(partition, levelCenterX, levelCenterY);

    // Draw partition info if in debug mode
    if (this.debugMode) {
      this.drawPartitionInfo(partition, levelCenterX, levelCenterY);
    }
  }

  /**
   * Draws connections for a partition
   */
  private drawPartitionConnections(
    partition: Partition,
    levelCenterX: number,
    levelCenterY: number,
  ): void {
    Game.ctx.fillStyle = "white";
    for (let connection of partition.connections) {
      Game.ctx.fillRect(
        Math.round(GameConstants.WIDTH / 2 + connection.x - levelCenterX),
        Math.round(GameConstants.HEIGHT / 2 + connection.y - levelCenterY),
        1,
        1,
      );
    }
  }

  /**
   * Draws debug information for a partition
   */
  private drawPartitionInfo(
    partition: Partition,
    levelCenterX: number,
    levelCenterY: number,
  ): void {
    const x = Math.round(GameConstants.WIDTH / 2 + partition.x - levelCenterX);
    const y = Math.round(GameConstants.HEIGHT / 2 + partition.y - levelCenterY);

    Game.ctx.fillStyle = "yellow";
    Game.ctx.font = "8px Arial";
    Game.ctx.fillText(`${partition.type}`, x + 2, y + 10);
    Game.ctx.fillText(`D:${partition.distance}`, x + 2, y + 20);
  }

  /**
   * Draws progress information overlay
   */
  private drawProgressInfo(): void {
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    Game.ctx.fillRect(10, 10, 200, 60);

    Game.ctx.fillStyle = "white";
    Game.ctx.font = "12px Arial";
    Game.ctx.fillText(`Step: ${this.visualizationState.currentStep}`, 20, 30);
    Game.ctx.fillText(
      `Partitions: ${this.visualizationState.partitions.length}`,
      20,
      45,
    );
    Game.ctx.fillText(
      `Progress: ${Math.round(this.visualizationState.progress * 100)}%`,
      20,
      60,
    );
  }

  /**
   * Creates an animation delay promise
   */
  async createAnimationDelay(
    delayType: "partition" | "pathfinding" | "large",
  ): Promise<void> {
    if (!this.animationConfig.enabled) {
      return Promise.resolve();
    }

    let delay = 0;
    switch (delayType) {
      case "partition":
        delay =
          this.animationConfig.animationConstant *
          this.animationConfig.partitionSplitDelay;
        break;
      case "pathfinding":
        delay =
          this.animationConfig.animationConstant *
          this.animationConfig.pathfindingDelay;
        break;
      case "large":
        delay =
          this.animationConfig.animationConstant *
          this.animationConfig.largeStepDelay;
        break;
    }

    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Updates partition visual styles during generation
   */
  updatePartitionStyles(partitions: Partition[]): void {
    // Sort partitions by area for consistent styling
    const sortedPartitions = [...partitions].sort(
      (a, b) => a.area() - b.area(),
    );

    if (sortedPartitions.length === 0) return;

    const minArea = sortedPartitions[0].area();
    const maxArea = sortedPartitions[sortedPartitions.length - 1].area();

    // Apply area-based styling
    partitions.forEach((partition) => {
      if (partition.type === "START") {
        partition.fillStyle = "rgb(0, 255, 0)";
      } else if (partition.type === "BOSS") {
        partition.fillStyle = "rgb(255, 0, 0)";
      } else if (partition.type === "DOWNLADDER") {
        partition.fillStyle = "blue";
      } else if (partition.type === "ROPEHOLE") {
        partition.fillStyle = "purple";
      } else {
        // Default area-based styling
        const normalizedArea =
          maxArea > minArea
            ? (partition.area() - minArea) / (maxArea - minArea)
            : 0;
        const opacity = 0.3 + normalizedArea * 0.7;
        partition.fillStyle = `rgba(128, 128, 128, ${opacity})`;
      }
    });
  }

  /**
   * Visualizes partition layout in console (for debugging)
   */
  visualizePartitionsInConsole(
    partitions: Partition[],
    mapWidth: number,
    mapHeight: number,
  ): void {
    if (!this.debugMode) return;

    const grid = Array.from({ length: mapHeight }, () =>
      Array(mapWidth).fill(" . "),
    );

    const maxIndex = partitions.length - 1;
    const padLength = maxIndex.toString().length;

    partitions.forEach((partition, index) => {
      const paddedIndex = index.toString().padStart(padLength, " ");

      for (let x = partition.x; x < partition.x + partition.w; x++) {
        for (let y = partition.y; y < partition.y + partition.h; y++) {
          if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
            grid[y][x] = ` ${paddedIndex} `;
          }
        }
      }
    });

    console.log("Partition Layout:");
    console.log(
      "   " + [...Array(mapWidth)].map((_, i) => i % 10).join("  ") + " X",
    );
    grid.forEach((row, index) => {
      const paddedIndex = index.toString().padStart(2, " ");
      console.log(`${paddedIndex} ${row.join("")}`);
    });
    console.log("Y");
  }

  /**
   * Logs generation progress messages
   */
  logGenerationStep(step: string, details?: string): void {
    if (!this.debugMode) return;

    const message = details ? `${step}: ${details}` : step;
    console.log(`[GenerationVisualizer] ${message}`);

    if (this.game && this.game.pushMessage) {
      this.game.pushMessage(message);
    }
  }

  /**
   * Creates visual effects for specific generation events
   */
  createVisualEffect(
    effectType:
      | "partition_split"
      | "room_connected"
      | "boss_found"
      | "generation_complete",
    partition?: Partition,
  ): void {
    if (!this.debugMode) return;

    switch (effectType) {
      case "partition_split":
        if (partition) {
          // Temporarily highlight the partition
          const originalStyle = partition.fillStyle;
          partition.fillStyle = "yellow";
          setTimeout(() => {
            partition.fillStyle = originalStyle;
          }, 200);
        }
        break;
      case "room_connected":
        if (partition) {
          partition.fillStyle = "lightgreen";
        }
        break;
      case "boss_found":
        if (partition) {
          partition.fillStyle = "rgb(255, 0, 0)";
        }
        this.logGenerationStep("Boss room found!");
        break;
      case "generation_complete":
        this.logGenerationStep("Generation complete!");
        break;
    }
  }

  /**
   * Updates the current generation progress
   */
  updateProgress(step: string, progress: number): void {
    this.visualizationState.currentStep = step;
    this.visualizationState.progress = Math.max(0, Math.min(1, progress));

    this.logGenerationStep(step, `${Math.round(progress * 100)}%`);
  }

  /**
   * Resets the visualizer state
   */
  reset(): void {
    this.visualizationState = {
      currentStep: "initializing",
      progress: 0,
      partitions: [],
      centerX: 0,
      centerY: 0,
    };
  }

  /**
   * Gets the current animation configuration
   */
  getAnimationConfig(): AnimationConfig {
    return { ...this.animationConfig };
  }

  /**
   * Gets the current visualization state
   */
  getVisualizationState(): VisualizationState {
    return { ...this.visualizationState };
  }
}
