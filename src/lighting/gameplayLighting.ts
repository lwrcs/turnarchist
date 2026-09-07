/** Shared numerical lighting. No canvas, DOM, camera, timers, or game-class imports.
 * Preserve the game's existing 2.2 gamma, ray sampling, clipping and inverse luminance.
 */
export type LightBuffer = [number, number, number, number][][][];
export interface LightRayContext {
  buffer: LightBuffer;
  maxDistance: number;
  isPositionInRoom(x: number, y: number): boolean;
  isInnerWall(x: number, y: number): boolean;
  opaqueEntityPositions?: Set<string>;
}

export const sRGBToLinear = (value: number): number => {
    const normalized = value / 255;
    if (normalized <= 0.04045) {
      return normalized / 12.92;
    } else {
      return Math.pow((normalized + 0.055) / 1.055, 2.2);
    }
  };

export const linearToSRGB = (value: number): number => {
    if (value <= 0.0031308) {
      return Math.round(12.92 * value * 255);
    } else {
      return Math.round(
        (1.055 * Math.pow(value, 1 / 2.2 /*gamma*/) - 0.055) * 255,
      );
    }
  };

export const clamp = (value: number, min: number = 0, max: number = 1): number => {
    return Math.min(Math.max(value, min), max);
  };

export const blendColorsArray = (
    colors: [red: number, green: number, blue: number, alpha: number][],
  ): [red: number, green: number, blue: number] => {
    if (colors.length === 0) return [0, 0, 0];

    // Sum all color channels in linear RGB
    const sum = colors.reduce(
      (accumulator, color) => [
        accumulator[0] + color[0] * color[3],
        accumulator[1] + color[1] * color[3],
        accumulator[2] + color[2] * color[3],
      ],
      [0, 0, 0],
    );

    // Apply scaling factor to manage overall brightness
    const scalingFactor = 0.45 * 2.5; // Adjust as needed
    const scaledSum = [
      sum[0] * scalingFactor,
      sum[1] * scalingFactor,
      sum[2] * scalingFactor,
    ];

    // Clamp each channel to [0, 1] to prevent overflow
    const clampedSum: [number, number, number] = [
      clamp(scaledSum[0], 0, 1),
      clamp(scaledSum[1], 0, 1),
      clamp(scaledSum[2], 0, 1),
    ];
    // Convert back to sRGB
    return [
      linearToSRGB(clampedSum[0]),
      linearToSRGB(clampedSum[1]),
      linearToSRGB(clampedSum[2]),
    ];
  };

export const rgbToLuminance = (color: [number, number, number]): number => {
    //map to 1-0 range
    return 1 - (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
  };

export const processLightRay = (
    context: LightRayContext,
    angle: number,
    px: number,
    py: number,
    radius: number,
    color: [number, number, number],
    brightness: number,
    falloffDecay: number = 1,
    action: "cast" | "unCast" = "cast",
  ) => {
    // A light source with zero (or negative) radius casts no light at all,
    // not even at its own origin tile.
    if (radius <= 0) return;

    const dx = Math.cos((angle * Math.PI) / 180);
    const dy = Math.sin((angle * Math.PI) / 180);
    // Lighting is currently computed for the local active z-layer only.
    

    // Convert input color from sRGB to linear RGB
    const linearColor: [number, number, number] = [
      sRGBToLinear(color[0]),
      sRGBToLinear(color[1]),
      sRGBToLinear(color[2]),
    ];

    for (
      let i = 0;
      i <= Math.min(context.maxDistance, radius);
      i++
    ) {
      const currentX = Math.floor(px + dx * i);
      const currentY = Math.floor(py + dy * i);

      if (!context.isPositionInRoom(currentX, currentY)) return; // Outside the room

      // Z-aware tile lookup for lighting blockers:
      // - Default: tiles are shared across layers
      // - Z_DEBUG_MODE: use the z=1 override tile map (Floor/Air) when activeZ === 1
      const blocksLight = context.isInnerWall(currentX, currentY);

      // Handle i=0 separately to ensure correct intensity
      let intensity: number;
      // Exponential falloff with origin boost preserved
      if (i === 0) {
        intensity = brightness * 0.1;
      } else {
        intensity = brightness * Math.exp(-falloffDecay * (i - 0.25));
      }
      if (intensity < 0.005) intensity = 0;

      if (intensity <= 0) continue;

      if (!context.buffer[currentX]) {
        context.buffer[currentX] = [];
      }
      if (!context.buffer[currentX][currentY]) {
        context.buffer[currentX][currentY] = [];
      }

      // Inner walls block light explicitly and terminate the ray
      if (blocksLight) {
        const weightedLinearColor: [number, number, number, number] = [
          linearColor[0],
          linearColor[1],
          linearColor[2],
          intensity,
        ];

        if (action === "cast") {
          context.buffer[currentX][currentY].push(weightedLinearColor);
        } else if (action === "unCast") {
          context.buffer[currentX][currentY] = context.buffer[currentX][
            currentY
          ].filter(
            (colorEntry) =>
              !(
                Math.abs(colorEntry[0] - weightedLinearColor[0]) < 0.0001 &&
                Math.abs(colorEntry[1] - weightedLinearColor[1]) < 0.0001 &&
                Math.abs(colorEntry[2] - weightedLinearColor[2]) < 0.0001 &&
                Math.abs(colorEntry[3] - weightedLinearColor[3]) < 0.0001
              ),
          );
        }
        return; // Terminate after processing the opaque wall
      }

      if (context.opaqueEntityPositions) {
        // O(1) membership check instead of scanning entities
        if (context.opaqueEntityPositions.has(`${currentX},${currentY}`)) {
          //intensity = intensity * (1 - entity.opacity);
          // Set the intensity for this tile and then terminate to create shadow effect
          const weightedLinearColor: [number, number, number, number] = [
            linearColor[0],
            linearColor[1],
            linearColor[2],
            intensity,
          ];

          if (action === "cast") {
            context.buffer[currentX][currentY].push(weightedLinearColor);
          } else if (action === "unCast") {
            context.buffer[currentX][currentY] = context.buffer[currentX][
              currentY
            ].filter(
              (colorEntry) =>
                !(
                  Math.abs(colorEntry[0] - weightedLinearColor[0]) < 0.0001 &&
                  Math.abs(colorEntry[1] - weightedLinearColor[1]) < 0.0001 &&
                  Math.abs(colorEntry[2] - weightedLinearColor[2]) < 0.0001 &&
                  Math.abs(colorEntry[3] - weightedLinearColor[3]) < 0.0001
                ),
            );
          }
          return; // Terminate after processing the opaque entity
        }
      }
      //end processing opaque entities

      const weightedLinearColor: [number, number, number, number] = [
        linearColor[0],
        linearColor[1],
        linearColor[2],
        intensity,
      ];

      if (action === "cast") {
        context.buffer[currentX][currentY].push(weightedLinearColor);
      } else if (action === "unCast") {
        context.buffer[currentX][currentY] = context.buffer[currentX][
          currentY
        ].filter(
          (colorEntry) =>
            !(
              Math.abs(colorEntry[0] - weightedLinearColor[0]) < 0.0001 &&
              Math.abs(colorEntry[1] - weightedLinearColor[1]) < 0.0001 &&
              Math.abs(colorEntry[2] - weightedLinearColor[2]) < 0.0001 &&
              Math.abs(colorEntry[3] - weightedLinearColor[3]) < 0.0001
            ),
        );
      }
    }
  };
