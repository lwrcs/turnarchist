import { Room } from "./room";

export class LightSource {
  x: number;
  y: number;
  r: number;
  c: [number, number, number];
  b: number = 1;
  constructor(
    x: number,
    y: number,
    r: number,
    c: [number, number, number] = [180, 60, 5],
    b: number = 1
  ) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.c = c;
    this.b = b;
  }

  updatePosition = (x: number, y: number) => {
    this.x = x;
    this.y = y;
  };
}
