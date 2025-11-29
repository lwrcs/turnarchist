import { GameConstants } from "../game/gameConstants";
import type { WebGLWaterLayerOptions } from "./webglWaterOverlayRenderer";
import { WebGLWaterOverlayRenderer } from "./webglWaterOverlayRenderer";

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface VoronoiLayerConfig {
  color: string;
  seed: number;
  scale: number;
  holeRadius: number;
  sharpness: number;
  opacity: number;
  speedX: number;
  speedY: number;
  offsetX: number;
  offsetY: number;
}

interface PreparedVoronoiLayer extends VoronoiLayerConfig {
  colorRgb: RGB;
}

interface WaterOverlayConfig {
  overlayAlpha: number;
  shimmerAmplitude: number;
  shimmerSpeed: number;
  scrollSpeedX: number;
  scrollSpeedY: number;
  canvasPadding: number;
  layers: VoronoiLayerConfig[];
}

const waterOverlayConfig: WaterOverlayConfig = {
  overlayAlpha: 0.55,
  shimmerAmplitude: 0.18,
  shimmerSpeed: 0.45,
  scrollSpeedX: 12,
  scrollSpeedY: -9,
  canvasPadding: 128,
  layers: [
    {
      color: "#02182a",
      seed: 37,
      scale: 65,
      holeRadius: 1.15,
      sharpness: 1.5,
      opacity: 0.75,
      speedX: 5,
      speedY: -5,
      offsetX: 0,
      offsetY: 0,
    },
    {
      color: "#042c3a",
      seed: 91,
      scale: 80,
      holeRadius: 1.25,
      sharpness: 1.15,
      opacity: 0.5,
      speedX: -2,
      speedY: 2,
      offsetX: 200,
      offsetY: 100,
    },
  ],
};

export class WaterOverlay {
  private static cpuBuffer: HTMLCanvasElement | null = null;
  private static cpuBufferCtx: CanvasRenderingContext2D | null = null;
  private static cpuFrameData: ImageData | null = null;
  private static time = 0;
  private static scrollX = 0;
  private static scrollY = 0;
  private static webglFailed = false;

  private static readonly config = waterOverlayConfig;
  private static readonly layers: PreparedVoronoiLayer[] =
    waterOverlayConfig.layers.map((layer) => ({
      ...layer,
      colorRgb: hexToRgb(layer.color),
    }));

  static draw(
    ctx: CanvasRenderingContext2D,
    delta: number,
    cameraOrigin?: { x: number; y: number },
  ) {
    const deltaSeconds = delta / GameConstants.FPS;
    WaterOverlay.time += deltaSeconds;
    WaterOverlay.scrollX += WaterOverlay.config.scrollSpeedX * deltaSeconds;
    WaterOverlay.scrollY += WaterOverlay.config.scrollSpeedY * deltaSeconds;

    const shimmer =
      1 +
      Math.sin(
        WaterOverlay.time * WaterOverlay.config.shimmerSpeed * Math.PI * 2,
      ) *
        WaterOverlay.config.shimmerAmplitude;
    const overlayAlpha = clamp(
      WaterOverlay.config.overlayAlpha * shimmer,
      0,
      1,
    );

    const padding = WaterOverlay.config.canvasPadding;
    const width = GameConstants.WIDTH + padding * 2;
    const height = GameConstants.HEIGHT + padding * 2;
    const anchorX = cameraOrigin?.x ?? 0;
    const anchorY = cameraOrigin?.y ?? 0;
    const originX = anchorX - padding + WaterOverlay.scrollX;
    const originY = anchorY - padding + WaterOverlay.scrollY;

    if (WaterOverlay.canUseWebgl()) {
      const webglCanvas = WaterOverlay.renderWithWebgl(
        width,
        height,
        originX,
        originY,
      );
      if (webglCanvas) {
        WaterOverlay.drawBuffer(ctx, webglCanvas, overlayAlpha);
        return;
      }
    }

    if (!WaterOverlay.ensureCpuBuffer(width, height)) return;
    WaterOverlay.renderCpuTexture(originX, originY);
    WaterOverlay.drawBuffer(ctx, WaterOverlay.cpuBuffer!, overlayAlpha);
  }

  private static canUseWebgl() {
    return (
      GameConstants.USE_WEBGL_WATER_OVERLAY &&
      !WaterOverlay.webglFailed &&
      WebGLWaterOverlayRenderer.isSupported()
    );
  }

  private static renderWithWebgl(
    width: number,
    height: number,
    originX: number,
    originY: number,
  ) {
    try {
      const renderer = WebGLWaterOverlayRenderer.getInstance();
      const layerUniforms: WebGLWaterLayerOptions[] = WaterOverlay.layers.map(
        (layer) => ({
          color: [
            layer.colorRgb.r / 255,
            layer.colorRgb.g / 255,
            layer.colorRgb.b / 255,
          ],
          seed: layer.seed,
          scale: layer.scale,
          holeRadius: layer.holeRadius,
          sharpness: layer.sharpness,
          opacity: layer.opacity,
          speed: [layer.speedX, layer.speedY],
          offset: [layer.offsetX, layer.offsetY],
        }),
      );

      return renderer.render({
        width,
        height,
        layers: layerUniforms,
        time: WaterOverlay.time,
        originX,
        originY,
      });
    } catch (error) {
      console.warn(
        "[WaterOverlay] WebGL renderer failed – falling back to Canvas2D",
        error,
      );
      WaterOverlay.webglFailed = true;
      return null;
    }
  }

  private static drawBuffer(
    ctx: CanvasRenderingContext2D,
    source: HTMLCanvasElement,
    overlayAlpha: number,
  ) {
    ctx.save();
    ctx.globalAlpha = overlayAlpha;
    ctx.globalCompositeOperation = "screen";

    ctx.drawImage(
      source,
      -WaterOverlay.config.canvasPadding,
      -WaterOverlay.config.canvasPadding,
    );
    ctx.restore();
  }

  private static ensureCpuBuffer(width: number, height: number) {
    if (
      WaterOverlay.cpuBuffer &&
      WaterOverlay.cpuBufferCtx &&
      WaterOverlay.cpuFrameData &&
      WaterOverlay.cpuBuffer.width === width &&
      WaterOverlay.cpuBuffer.height === height
    ) {
      return true;
    }

    if (typeof document === "undefined") return false;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return false;

    WaterOverlay.cpuBuffer = canvas;
    WaterOverlay.cpuBufferCtx = ctx;
    WaterOverlay.cpuFrameData = ctx.createImageData(width, height);

    return true;
  }

  private static renderCpuTexture(originX: number, originY: number) {
    if (!WaterOverlay.cpuBufferCtx || !WaterOverlay.cpuFrameData) return;

    const { data, width, height } = WaterOverlay.cpuFrameData;

    for (let y = 0; y < height; y++) {
      const worldY = originY + y;
      for (let x = 0; x < width; x++) {
        const worldX = originX + x;
        let accumR = 0;
        let accumG = 0;
        let accumB = 0;
        let accumA = 0;

        for (const layer of WaterOverlay.layers) {
          const distance = WaterOverlay.sampleVoronoiLayer(
            layer,
            worldX,
            worldY,
          );
          const normalized = clamp(distance / layer.holeRadius, 0, 1);
          const fill = Math.pow(normalized, layer.sharpness) * layer.opacity;
          const layerAlpha = clamp(fill, 0, 1);

          accumR += layer.colorRgb.r * layerAlpha;
          accumG += layer.colorRgb.g * layerAlpha;
          accumB += layer.colorRgb.b * layerAlpha;
          accumA += layerAlpha;
        }

        const idx = (y * width + x) * 4;
        data[idx] = clamp(Math.round(accumR), 0, 255);
        data[idx + 1] = clamp(Math.round(accumG), 0, 255);
        data[idx + 2] = clamp(Math.round(accumB), 0, 255);
        data[idx + 3] = clamp(Math.round(accumA * 255), 0, 255);
      }
    }

    WaterOverlay.cpuBufferCtx.putImageData(WaterOverlay.cpuFrameData, 0, 0);
  }

  private static sampleVoronoiLayer(
    layer: PreparedVoronoiLayer,
    worldX: number,
    worldY: number,
  ) {
    const offsetX = layer.offsetX + WaterOverlay.time * layer.speedX;
    const offsetY = layer.offsetY + WaterOverlay.time * layer.speedY;
    const scaledX = (worldX + offsetX) / layer.scale;
    const scaledY = (worldY + offsetY) / layer.scale;

    return worleyNoise(scaledX, scaledY, layer.seed);
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? parseInt(
          normalized
            .split("")
            .map((char) => char + char)
            .join(""),
          16,
        )
      : parseInt(normalized, 16);

  return {
    r: (value >> 16) & 0xff,
    g: (value >> 8) & 0xff,
    b: value & 0xff,
  };
}

const UINT32_MAX = 0xffffffff;

const hash2d = (x: number, y: number, seed: number) => {
  let h = (x * 374761393 + y * 668265263 + seed * 362437) | 0;
  h = (h ^ (h >> 13)) >>> 0;
  h = (h * 1274126177) >>> 0;
  return h / UINT32_MAX;
};

const worleyNoise = (x: number, y: number, seed: number) => {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  let minDistance = Infinity;

  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      const neighborX = cellX + offsetX;
      const neighborY = cellY + offsetY;
      const pointX = neighborX + hash2d(neighborX, neighborY, seed);
      const pointY = neighborY + hash2d(neighborX, neighborY, seed + 1337);
      const dx = pointX - x;
      const dy = pointY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
      }
    }
  }

  return clamp(minDistance / Math.SQRT2, 0, 1);
};
