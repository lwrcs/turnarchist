export class Utils {
  static distance = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ) => {
    return Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  };

  static calculateExponentialFalloff = (
    distance: number,
    falloffRate: number,
  ): number => {
    return Math.exp(-falloffRate * distance);
  };

  // Corrected HSV to HEX conversion
  static hsvToHex = (h: number, s: number, v: number): string => {
    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;
    let r = 0,
      g = 0,
      b = 0;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    // Convert to RGB values
    const rFinal = Math.round((r + m) * 255);
    const gFinal = Math.round((g + m) * 255);
    const bFinal = Math.round((b + m) * 255);

    return Utils.rgbToHex(rFinal, gFinal, bFinal);
  };

  // RGB to HEX conversion
  static rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (val: number) => {
      const hex = val.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
}
