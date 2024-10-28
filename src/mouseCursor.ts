import { Game } from "./game";
import { Input } from "./input";
import { GameConstants } from "./gameConstants";

export class MouseCursor {
  private static instance: MouseCursor;
  private cursorSize: number = 5; // Size of the cursor rectangle

  private constructor() {}

  public static getInstance(): MouseCursor {
    if (!MouseCursor.instance) {
      MouseCursor.instance = new MouseCursor();
    }
    return MouseCursor.instance;
  }

  public draw(): void {
    /*
    Game.ctx.save();
    Game.ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Semi-transparent red
    Game.ctx.fillRect(
      Input.mouseX - this.cursorSize / 2,
      Input.mouseY - this.cursorSize / 2,
      this.cursorSize,
      this.cursorSize
    );
    Game.ctx.restore();
    */
  }

  public getPosition(): { x: number; y: number } {
    return { x: Input.mouseX, y: Input.mouseY };
  }

  public getTilePosition(): { x: number; y: number } {
    return {
      x: Math.floor(Input.mouseX / GameConstants.TILESIZE),
      y: Math.floor(Input.mouseY / GameConstants.TILESIZE),
    };
  }

  public getInventoryPosition(): { x: number; y: number } {
    return {
      x: Input.mouseX,
      y: Input.mouseY,
    };
  }
}
