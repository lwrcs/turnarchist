import { Game } from "../game";
import { Input } from "../game/input";
import { GameConstants } from "../game/gameConstants";

export class MouseCursor {
  private static instance: MouseCursor;
  private cursorSize: number = 5; // Size of the cursor rectangle
  private clickX: number = 0;
  private clickY: number = 0;
  private tileX: number = 6;

  private constructor() {}
  private frame: number = 0;

  public static getInstance(): MouseCursor {
    if (!MouseCursor.instance) {
      MouseCursor.instance = new MouseCursor();
    }
    return MouseCursor.instance;
  }

  public drawCursor(): void {
    Game.ctx.save();

    //Game.ctx.fillRect(Input.mouseX, Input.mouseY, 1, 1);
    Game.drawFX(
      this.tileX,
      0,
      1,
      1,
      Input.mouseX / GameConstants.TILESIZE - 8 / GameConstants.TILESIZE,
      Input.mouseY / GameConstants.TILESIZE - 8 / GameConstants.TILESIZE,
      1,
      1,
    );
    Game.ctx.restore();
  }

  public drawAnimation(delta: number): void {
    if (this.frame > 5) {
      //14 is max frame for animation
      return;
    }
    Game.drawFX(
      9 + Math.ceil(this.frame),
      1,
      1,
      1,
      this.clickX / GameConstants.TILESIZE - 8 / GameConstants.TILESIZE,
      this.clickY / GameConstants.TILESIZE - 8 / GameConstants.TILESIZE,
      1,
      1,
    );
    this.frame = this.frame + delta / 5;
  }

  public startClickAnim(): void {
    this.frame = 0;
    this.clickX = Input.mouseX;
    this.clickY = Input.mouseY;
  }

  public setIcon = (icon: string) => {
    switch (icon) {
      case "arrow":
        this.tileX = 8;
        break;
      case "sword":
        this.tileX = 7;
        break;
      case "hand":
        this.tileX = 6;
        break;
      case "wait":
        this.tileX = 9;
        break;
      case "grab":
        this.tileX = 10;
        break;
      case "up":
        this.tileX = 11;
        break;
      case "right":
        this.tileX = 12;
        break;
      case "down":
        this.tileX = 13;
        break;
      case "left":
        this.tileX = 14;
        break;
      case "mine":
        this.tileX = 15;
        break;
    }
  };

  public draw = (
    delta: number,
    mobile: boolean = false,
    isMouseInput: boolean = true,
  ) => {
    if (!mobile && isMouseInput) this.drawCursor();
    this.drawAnimation(delta);
  };

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
