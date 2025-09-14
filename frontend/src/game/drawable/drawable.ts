export class Drawable {
  drawableY = 0;
  // When true, this drawable should be rendered above the Player
  shouldDrawAbovePlayer: boolean = false;

  draw = (delta: number) => {};

  hasBloom: boolean = false;
  bloomColor: string = "#FFFFFF";
  bloomAlpha: number = 1;
  softBloomAlpha: number = 0;
  updateBloom = (delta: number) => {
    if (this.hasBloom) {
      let diff = this.softBloomAlpha - this.bloomAlpha;
      if (Math.abs(diff) > 0.001) {
        this.softBloomAlpha = this.softBloomAlpha - diff * 0.1 * delta;
      } else {
        this.softBloomAlpha = this.bloomAlpha;
      }
    } else {
      this.softBloomAlpha = 0;
    }
  };
}
