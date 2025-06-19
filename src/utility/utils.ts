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

  /**
   * Generates a random integer using a modified cosine distribution that approximates a normal distribution.
   *
   * @param min - The minimum value (inclusive) of the range
   * @param max - The maximum value (inclusive) of the range
   * @param options - Optional parameters to modify the distribution
   * @param options.median - The value to skew the distribution towards (must be between min and max).
   *                        Default is the middle of the range. This acts as the peak of the distribution curve.
   * @returns A random integer between min and max (inclusive) following the specified distribution
   *
   * @example
   * // Normal bell curve distribution between 0 and 10 (centered at 5)
   * randomSineInt(0, 10)
   *
   * @example
   * // Distribution skewed towards 7
   * randomSineInt(0, 10, { median: 7 })
   */
  static randomSineInt = (
    min: number,
    max: number,
    options: {
      median?: number;
    } = {},
  ): number => {
    const roundedMax = Math.ceil(max);
    const roundedMin = Math.floor(min);
    const range = roundedMax - roundedMin + 1;

    const { median = roundedMin + (range - 1) / 2 } = options;

    // Validate median is within range
    const clampedMedian = Math.min(Math.max(median, roundedMin), roundedMax);

    // Generate two random numbers for a more normal-like distribution
    const x1 = Math.random() * 2 * Math.PI;
    const x2 = Math.random() * 2 * Math.PI;

    // Average two cosines to create smoother bell curve, normalized to [0,1]
    const value = (Math.cos(x1) + Math.cos(x2) + 2) / 4;

    // Calculate the relative median position in [0,1] range
    const medianPosition = (clampedMedian - roundedMin) / (range - 1);

    // Apply skewing by using a weighted average
    const weight = 0.7; // How strong the skewing effect should be
    const skewedValue =
      value * (1 - weight) +
      (value < 0.5
        ? value * (medianPosition / 0.5)
        : medianPosition + (value - 0.5) * 2 * (1 - medianPosition)) *
        weight;

    // Ensure we stay within bounds while avoiding edge cases
    const epsilon = 0.001;
    const boundedValue = Math.min(Math.max(skewedValue, epsilon), 1 - epsilon);

    // Map to integer range
    const result = Math.floor(boundedValue * range) + roundedMin;

    return Math.min(Math.max(result, roundedMin), roundedMax);
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

  /**
   * Generates a random integer using a real normal distribution.
   *
   * @param min - The value that represents -2 standard deviations from the mean
   * @param max - The value that represents +2 standard deviations from the mean
   * @param options - Optional parameters to modify the distribution
   * @param options.median - The mean of the distribution (center point).
   *                        Default is the middle of the range.
   * @returns A random integer following a normal distribution, with negative values clamped to 0
   *
   * @example
   * // Normal distribution centered at 5, with min/max representing ±2 std devs
   * randomNormalInt(0, 10)
   *
   * @example
   * // Normal distribution centered at 7
   * randomNormalInt(0, 10, { median: 7 })
   */
  static randomNormalInt = (
    min: number,
    max: number,
    options: {
      median?: number;
    } = {},
  ): number => {
    const { median = min + (max - min) / 2 } = options;

    // Calculate standard deviation: (max - min) / 4 since min/max are ±2 std devs
    const standardDeviation = (max - min) / 5;

    // Box-Muller transform to generate normal distribution
    // Generate two uniform random numbers
    let u1 = Math.random();
    let u2 = Math.random();

    // Ensure u1 is not 0 to avoid log(0)
    while (u1 === 0) {
      u1 = Math.random();
    }

    // Box-Muller transformation
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Scale and shift to desired mean and standard deviation
    const normalValue = z0 * standardDeviation + median;

    // Clamp negative values to 0
    const clampedValue = Math.max(0, normalValue);

    // Round to integer
    return Math.round(clampedValue);
  };
}
