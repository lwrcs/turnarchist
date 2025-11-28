const MAX_LAYERS = 4;

export interface WebGLWaterLayerOptions {
  color: [number, number, number];
  seed: number;
  scale: number;
  holeRadius: number;
  sharpness: number;
  opacity: number;
  speed: [number, number];
  offset: [number, number];
}

export interface WebGLWaterRenderParams {
  width: number;
  height: number;
  layers: WebGLWaterLayerOptions[];
  time: number;
  originX: number;
  originY: number;
}

export class WebGLWaterOverlayRenderer {
  private static instance: WebGLWaterOverlayRenderer | null = null;
  private static supportCache: boolean | null = null;

  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly positionBuffer: WebGLBuffer;

  private readonly resolutionLocation: WebGLUniformLocation;
  private readonly timeLocation: WebGLUniformLocation;
  private readonly layerCountLocation: WebGLUniformLocation;
  private readonly layerColorLocations: WebGLUniformLocation[] = [];
  private readonly layerSeedLocations: WebGLUniformLocation[] = [];
  private readonly layerScaleLocations: WebGLUniformLocation[] = [];
  private readonly layerHoleLocations: WebGLUniformLocation[] = [];
  private readonly layerSharpnessLocations: WebGLUniformLocation[] = [];
  private readonly layerOpacityLocations: WebGLUniformLocation[] = [];
  private readonly layerSpeedLocations: WebGLUniformLocation[] = [];
  private readonly layerOffsetLocations: WebGLUniformLocation[] = [];
  private readonly originLocation: WebGLUniformLocation;

  private currentWidth: number = 0;
  private currentHeight: number = 0;

  static isSupported(): boolean {
    if (WebGLWaterOverlayRenderer.supportCache !== null) {
      return WebGLWaterOverlayRenderer.supportCache;
    }

    if (typeof document === "undefined") {
      WebGLWaterOverlayRenderer.supportCache = false;
      return false;
    }

    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl", { alpha: true }) ||
      canvas.getContext("experimental-webgl", { alpha: true });
    WebGLWaterOverlayRenderer.supportCache = !!gl;
    return WebGLWaterOverlayRenderer.supportCache;
  }

  static getInstance(): WebGLWaterOverlayRenderer {
    if (!WebGLWaterOverlayRenderer.instance) {
      WebGLWaterOverlayRenderer.instance = new WebGLWaterOverlayRenderer();
    }
    return WebGLWaterOverlayRenderer.instance;
  }

  private constructor() {
    if (typeof document === "undefined") {
      throw new Error("WebGL water overlay requires a browser environment.");
    }

    this.canvas = document.createElement("canvas");
    const context =
      (this.canvas.getContext("webgl", {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
      }) as WebGLRenderingContext | null) ||
      (this.canvas.getContext("experimental-webgl", {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: false,
        premultipliedAlpha: false,
        powerPreference: "high-performance",
      }) as WebGLRenderingContext | null);

    if (!context) {
      throw new Error("Unable to initialize WebGL for water overlay.");
    }

    this.gl = context;
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.disable(this.gl.STENCIL_TEST);
    this.gl.disable(this.gl.BLEND);

    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      `
        precision mediump float;
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        void main() {
          vec2 zeroToOne = a_position / u_resolution;
          vec2 zeroToTwo = zeroToOne * 2.0;
          vec2 clipSpace = zeroToTwo - 1.0;
          gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        }
      `,
    );

    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      `
        precision mediump float;
        #define MAX_LAYERS ${MAX_LAYERS}

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform int u_layerCount;
        uniform vec3 u_layerColor[MAX_LAYERS];
        uniform float u_layerSeed[MAX_LAYERS];
        uniform float u_layerScale[MAX_LAYERS];
        uniform float u_layerHoleRadius[MAX_LAYERS];
        uniform float u_layerSharpness[MAX_LAYERS];
        uniform float u_layerOpacity[MAX_LAYERS];
        uniform vec2 u_layerSpeed[MAX_LAYERS];
        uniform vec2 u_layerOffset[MAX_LAYERS];
        uniform vec2 u_origin;

        float hash(vec2 p, float seed) {
          vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031 + seed);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        float worley(vec2 p, float seed) {
          vec2 cell = floor(p);
          float minDistance = 1.41421356237;

          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              vec2 neighbor = cell + vec2(float(x), float(y));
              vec2 jitter = vec2(
                hash(neighbor + vec2(0.17, 0.53), seed),
                hash(neighbor + vec2(0.73, 0.19), seed + 19.0)
              );
              vec2 featurePoint = neighbor + jitter;
              float distanceToFeature = distance(p, featurePoint);
              if (distanceToFeature < minDistance) {
                minDistance = distanceToFeature;
              }
            }
          }

          return minDistance;
        }

        void main() {
          vec2 pixel = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
          vec2 world = u_origin + pixel;
          vec4 color = vec4(0.0);

          for (int i = 0; i < MAX_LAYERS; i++) {
            if (i >= u_layerCount) {
              break;
            }

            float scale = max(u_layerScale[i], 0.001);
            vec2 animatedOffset = u_layerOffset[i] + u_layerSpeed[i] * u_time;
            vec2 samplePoint = (world + animatedOffset) / scale;
            float distanceToFeature = worley(samplePoint, u_layerSeed[i]);
            float normalized = clamp(distanceToFeature / u_layerHoleRadius[i], 0.0, 1.0);
            float fill = pow(normalized, u_layerSharpness[i]);
            float layerAlpha = clamp(fill * u_layerOpacity[i], 0.0, 1.0);

            color.rgb += u_layerColor[i] * layerAlpha;
            color.a += layerAlpha;
          }

          color.rgb = clamp(color.rgb, 0.0, 1.5);
          color.a = clamp(color.a, 0.0, 1.0);
          gl_FragColor = color;
        }
      `,
    );

    this.program = this.createProgram(vertexShader, fragmentShader);
    this.gl.useProgram(this.program);

    this.positionBuffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      this.gl.DYNAMIC_DRAW,
    );

    const positionLocation = this.gl.getAttribLocation(
      this.program,
      "a_position",
    );
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );

    this.resolutionLocation = this.getUniform("u_resolution");
    this.timeLocation = this.getUniform("u_time");
    this.layerCountLocation = this.getUniform("u_layerCount");
    this.originLocation = this.getUniform("u_origin");

    for (let i = 0; i < MAX_LAYERS; i++) {
      this.layerColorLocations.push(this.getUniform(`u_layerColor[${i}]`));
      this.layerSeedLocations.push(this.getUniform(`u_layerSeed[${i}]`));
      this.layerScaleLocations.push(this.getUniform(`u_layerScale[${i}]`));
      this.layerHoleLocations.push(this.getUniform(`u_layerHoleRadius[${i}]`));
      this.layerSharpnessLocations.push(
        this.getUniform(`u_layerSharpness[${i}]`),
      );
      this.layerOpacityLocations.push(this.getUniform(`u_layerOpacity[${i}]`));
      this.layerSpeedLocations.push(this.getUniform(`u_layerSpeed[${i}]`));
      this.layerOffsetLocations.push(this.getUniform(`u_layerOffset[${i}]`));
    }
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error("Failed to create shader.");
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const info = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${info || "unknown error"}`);
    }

    return shader;
  }

  private createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ) {
    const program = this.gl.createProgram();
    if (!program) {
      throw new Error("Failed to create shader program.");
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const info = this.gl.getProgramInfoLog(program);
      throw new Error(
        `Failed to link shader program: ${info || "unknown error"}`,
      );
    }

    return program;
  }

  private getUniform(name: string): WebGLUniformLocation {
    const location = this.gl.getUniformLocation(this.program, name);
    if (!location) {
      throw new Error(`Uniform ${name} not found.`);
    }
    return location;
  }

  private ensureCanvasSize(width: number, height: number) {
    if (this.currentWidth === width && this.currentHeight === height) {
      return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.currentWidth = width;
    this.currentHeight = height;

    this.gl.viewport(0, 0, width, height);

    // Update quad to match new dimensions
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([
        0,
        0,
        width,
        0,
        0,
        height,
        0,
        height,
        width,
        0,
        width,
        height,
      ]),
      this.gl.STATIC_DRAW,
    );

    const positionLocation = this.gl.getAttribLocation(
      this.program,
      "a_position",
    );
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
  }

  render(params: WebGLWaterRenderParams): HTMLCanvasElement {
    const layerCount = Math.min(params.layers.length, MAX_LAYERS);
    this.ensureCanvasSize(params.width, params.height);

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.resolutionLocation, params.width, params.height);
    this.gl.uniform1f(this.timeLocation, params.time);
    this.gl.uniform1i(this.layerCountLocation, layerCount);
    this.gl.uniform2f(this.originLocation, params.originX, params.originY);

    for (let i = 0; i < layerCount; i++) {
      const layer = params.layers[i];
      this.gl.uniform3fv(
        this.layerColorLocations[i],
        new Float32Array(layer.color),
      );
      this.gl.uniform1f(this.layerSeedLocations[i], layer.seed);
      this.gl.uniform1f(this.layerScaleLocations[i], layer.scale);
      this.gl.uniform1f(this.layerHoleLocations[i], layer.holeRadius);
      this.gl.uniform1f(this.layerSharpnessLocations[i], layer.sharpness);
      this.gl.uniform1f(this.layerOpacityLocations[i], layer.opacity);
      this.gl.uniform2fv(
        this.layerSpeedLocations[i],
        new Float32Array(layer.speed),
      );
      this.gl.uniform2fv(
        this.layerOffsetLocations[i],
        new Float32Array(layer.offset),
      );
    }

    // Zero out unused uniforms to avoid stale data affecting rendering when layer count shrinks.
    for (let i = layerCount; i < MAX_LAYERS; i++) {
      this.gl.uniform3fv(
        this.layerColorLocations[i],
        new Float32Array([0, 0, 0]),
      );
      this.gl.uniform1f(this.layerSeedLocations[i], 0);
      this.gl.uniform1f(this.layerScaleLocations[i], 1);
      this.gl.uniform1f(this.layerHoleLocations[i], 1);
      this.gl.uniform1f(this.layerSharpnessLocations[i], 1);
      this.gl.uniform1f(this.layerOpacityLocations[i], 0);
      this.gl.uniform2fv(this.layerSpeedLocations[i], new Float32Array([0, 0]));
      this.gl.uniform2fv(
        this.layerOffsetLocations[i],
        new Float32Array([0, 0]),
      );
    }

    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    return this.canvas;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
