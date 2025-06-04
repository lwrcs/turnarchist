import { Game } from "../game";

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

  // Generate a random integer with normal distribution
  static randomSineInt = (min: number, max: number): number => {
    // Generate random value from 0 to π
    const x = Math.random() * 2 * Math.PI;

    // sin(x) gives us values from 0 to 1 with peak at π/2
    const sinValue = Math.sin(x - Math.PI / 2) + 1;

    // Map to our integer range
    const range = max - min + 1;
    return Math.floor((sinValue / 2) * range) + min;
  };

  static randTableWeighted = (table: any[]): any => {
    // If table is empty, return null
    if (!table || table.length === 0) return null;

    // Check if items have weight property
    const hasWeights = table.some(
      (item) => item && typeof item.weight === "number",
    );

    if (!hasWeights) {
      // Fallback to equal probability selection
      return table[Game.rand(0, table.length - 1, Math.random)];
    }

    // Calculate total weight
    const totalWeight = table.reduce((sum, item) => {
      return sum + (item && typeof item.weight === "number" ? item.weight : 0);
    }, 0);

    if (totalWeight <= 0) {
      // If no valid weights, fallback to equal probability
      return table[Game.rand(0, table.length - 1, Math.random)];
    }

    // Generate random number between 0 and totalWeight
    let randomValue = Math.random() * totalWeight;

    // Find the item that corresponds to this random value
    for (const item of table) {
      if (item && typeof item.weight === "number") {
        randomValue -= item.weight;
        if (randomValue <= 0) {
          return item;
        }
      }
    }

    // Fallback (should rarely happen due to floating point precision)
    return table[table.length - 1];
  };
}
