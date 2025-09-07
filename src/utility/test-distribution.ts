import { Random } from "./random";

// Generate a random integer with a cosine-based distribution
function randomSineInt(
  min: number,
  max: number,
  options: { median?: number } = {},
): number {
  const roundedMax = Math.ceil(max);
  const roundedMin = Math.floor(min);
  const range = roundedMax - roundedMin + 1;

  const { median = roundedMin + (range - 1) / 2 } = options;

  // Validate median is within range
  const clampedMedian = Math.min(Math.max(median, roundedMin), roundedMax);

  // Generate two random numbers for a more normal-like distribution
  const x1 = Random.rand() * 2 * Math.PI;
  const x2 = Random.rand() * 2 * Math.PI;

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

  // Check if clamping would change the result
  if (result < roundedMin || result > roundedMax) {
  }

  return Math.min(Math.max(result, roundedMin), roundedMax);
}

// Test different distributions
function runDistributionTest(
  min: number,
  max: number,
  options: { median?: number } = {},
  description: string,
) {
  const sampleSize = 100000; // Increased sample size to better catch edge cases
  const results: number[] = [];
  const counts = new Array(max - min + 1).fill(0);

  // Generate samples
  for (let i = 0; i < sampleSize; i++) {
    const value = randomSineInt(min, max, options);
    results.push(value);
    counts[value - min]++;
  }

  // Print distribution
  counts.forEach((count, index) => {
    const value = index + min;
    const percentage = ((count / sampleSize) * 100).toFixed(2);
  });
}

// Run tests with different configurations
const min = 0;
const max = 10;
const range = max - min + 1;
const quarterPoint = min + Math.floor(range * 0.25);
const threeQuarterPoint = min + Math.floor(range * 0.75);

// Test 1: Normal distribution (centered)
runDistributionTest(min, max, {}, "Normal Distribution (centered)");

// Test 2: Skewed to 1/4 point
runDistributionTest(
  min,
  max,
  { median: quarterPoint },
  `Skewed Distribution (median at ${quarterPoint})`,
);

// Test 3: Skewed to 3/4 point
runDistributionTest(
  min,
  max,
  { median: threeQuarterPoint },
  `Skewed Distribution (median at ${threeQuarterPoint})`,
);
