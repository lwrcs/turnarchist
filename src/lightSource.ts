export class LightSource {
  x: number;
  y: number;
  r: number;
  c: [number, number, number];
  constructor(x: number, y: number, r: number, c: [number, number, number] = [255, 130, 5]) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.c = c;
  }
}
