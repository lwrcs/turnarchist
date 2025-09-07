import { Game } from "../game";

export class CameraAnimation {
  constructor(
    public x: number,
    public y: number,
    public duration: number,
    public speed: number,
    public frame: number,
    public active: boolean,
  ) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.frame = 0;
    this.active = false;
  }
}
