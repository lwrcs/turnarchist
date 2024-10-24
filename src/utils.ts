export class Utils {
  static distance = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    return Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  };
}
