import { Room } from "./room";

export class LightSource {
  x: number;
  y: number;
  r: number;
  c: [number, number, number];
  b: number = 1;

  oldX: number;
  oldY: number;
  oldR: number;
  oldC: [number, number, number];
  oldB: number;

  hasChanged: boolean;
  constructor(
    x: number,
    y: number,
    r: number,
    c: [number, number, number] = [180, 60, 5],
    b: number = 1,
  ) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.c = c;
    this.b = b;
    this.oldX = x;
    this.oldY = y;
    this.oldR = r;
    this.oldC = c;
    this.oldB = b;
    this.hasChanged = true;
  }

  updatePosition = (x: number, y: number) => {
    this.x = x;
    this.y = y;
  };

  shouldUpdate = () => {
    return true;
    this.hasChanged =
      this.x !== this.oldX ||
      this.y !== this.oldY ||
      this.r !== this.oldR ||
      this.c !== this.oldC ||
      this.b !== this.oldB ||
      this.hasChanged;
    return this.hasChanged;
  };
}
