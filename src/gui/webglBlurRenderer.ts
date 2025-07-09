import { GameConstants } from "../game/gameConstants";

export class WebGLBlurRenderer {
  private static instance: WebGLBlurRenderer;
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private highQualityShaderProgram: WebGLProgram;
  private performanceShaderProgram: WebGLProgram;
  private currentShaderProgram: WebGLProgram;
  private positionBuffer: WebGLBuffer;
  private texCoordBuffer: WebGLBuffer;
  private framebuffer: WebGLFramebuffer;
  private texture: WebGLTexture;
  private tempTexture: WebGLTexture;
  private tempFramebuffer: WebGLFramebuffer;

  // Shader attribute/uniform locations (shared between both shaders)
  private positionLocation: number;
  private texCoordLocation: number;
  private resolutionLocation: WebGLUniformLocation;
  private textureLocation: WebGLUniformLocation;
  private directionLocation: WebGLUniformLocation;
  private radiusLocation: WebGLUniformLocation;

  // Cache for result canvases to avoid recreation
  private resultCanvasCache: Map<string, HTMLCanvasElement> = new Map();
  private maxCacheSize: number = 10;

  // Vertex shader source (shared)
  private vertexShaderSource = `
    precision mediump float;
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    uniform vec2 u_resolution;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_texCoord = a_texCoord;
    }
  `;

  // High quality fragment shader (49 samples)
  private highQualityFragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform vec2 u_direction;
    uniform float u_radius;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 texelSize = u_direction / u_resolution;
      vec4 color = vec4(0.0);
      float totalWeight = 0.0;
      
      // High quality blur with original 49 samples
      float sigma = u_radius * 0.4;
      float twoSigmaSquare = 2.0 * sigma * sigma;
      
      for (float i = -24.0; i <= 24.0; i++) {
        if (abs(i) > u_radius) continue;
        
        vec2 offset = texelSize * i;
        float weight = exp(-i * i / twoSigmaSquare);
        
        color += texture2D(u_texture, v_texCoord + offset) * weight;
        totalWeight += weight;
      }
      
      gl_FragColor = color / totalWeight;
    }
  `;

  // Performance fragment shader (13 samples)
  private performanceFragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform vec2 u_direction;
    uniform float u_radius;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 texelSize = u_direction / u_resolution;
      vec4 color = vec4(0.0);
      float totalWeight = 0.0;
      
      // Performance blur with 13 samples
      float sigma = u_radius * 0.4;
      float twoSigmaSquare = 2.0 * sigma * sigma;
      
      for (float i = -6.0; i <= 6.0; i++) {
        if (abs(i) > u_radius) continue;
        
        vec2 offset = texelSize * i;
        float weight = exp(-i * i / twoSigmaSquare);
        
        color += texture2D(u_texture, v_texCoord + offset) * weight;
        totalWeight += weight;
      }
      
      gl_FragColor = color / totalWeight;
    }
  `;

  private constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = GameConstants.WIDTH;
    this.canvas.height = GameConstants.HEIGHT;

    const context = this.canvas.getContext("webgl", {
      antialias: false,
      depth: false,
      stencil: false,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) as WebGLRenderingContext | null;

    const experimentalContext = this.canvas.getContext("experimental-webgl", {
      antialias: false,
      depth: false,
      stencil: false,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) as WebGLRenderingContext | null;

    this.gl = context || experimentalContext;
    if (!this.gl) {
      throw new Error("WebGL not supported");
    }

    // Optimize GL state
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.CULL_FACE);
    this.gl.disable(this.gl.BLEND);

    this.initShaders();
    this.initBuffers();
    this.initTextures();
  }

  static getInstance(): WebGLBlurRenderer {
    if (!WebGLBlurRenderer.instance) {
      WebGLBlurRenderer.instance = new WebGLBlurRenderer();
    }
    return WebGLBlurRenderer.instance;
  }

  private initShaders(): void {
    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      this.vertexShaderSource,
    );

    // Create high quality shader program
    const highQualityFragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.highQualityFragmentShaderSource,
    );

    this.highQualityShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.highQualityShaderProgram, vertexShader);
    this.gl.attachShader(
      this.highQualityShaderProgram,
      highQualityFragmentShader,
    );
    this.gl.linkProgram(this.highQualityShaderProgram);

    if (
      !this.gl.getProgramParameter(
        this.highQualityShaderProgram,
        this.gl.LINK_STATUS,
      )
    ) {
      throw new Error(
        "Unable to initialize high quality shader program: " +
          this.gl.getProgramInfoLog(this.highQualityShaderProgram),
      );
    }

    // Create performance shader program
    const performanceFragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.performanceFragmentShaderSource,
    );

    this.performanceShaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.performanceShaderProgram, vertexShader);
    this.gl.attachShader(
      this.performanceShaderProgram,
      performanceFragmentShader,
    );
    this.gl.linkProgram(this.performanceShaderProgram);

    if (
      !this.gl.getProgramParameter(
        this.performanceShaderProgram,
        this.gl.LINK_STATUS,
      )
    ) {
      throw new Error(
        "Unable to initialize performance shader program: " +
          this.gl.getProgramInfoLog(this.performanceShaderProgram),
      );
    }

    // Clean up shaders after linking
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(highQualityFragmentShader);
    this.gl.deleteShader(performanceFragmentShader);

    // Set initial shader program
    this.updateShaderProgram();
  }

  private updateShaderProgram(): void {
    this.currentShaderProgram = GameConstants.HIGH_QUALITY_BLUR
      ? this.highQualityShaderProgram
      : this.performanceShaderProgram;

    this.gl.useProgram(this.currentShaderProgram);

    // Cache uniform and attribute locations for current shader
    this.positionLocation = this.gl.getAttribLocation(
      this.currentShaderProgram,
      "a_position",
    );
    this.texCoordLocation = this.gl.getAttribLocation(
      this.currentShaderProgram,
      "a_texCoord",
    );
    this.resolutionLocation = this.gl.getUniformLocation(
      this.currentShaderProgram,
      "u_resolution",
    );
    this.textureLocation = this.gl.getUniformLocation(
      this.currentShaderProgram,
      "u_texture",
    );
    this.directionLocation = this.gl.getUniformLocation(
      this.currentShaderProgram,
      "u_direction",
    );
    this.radiusLocation = this.gl.getUniformLocation(
      this.currentShaderProgram,
      "u_radius",
    );

    // Set texture uniform
    this.gl.uniform1i(this.textureLocation, 0);
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error("An error occurred compiling the shaders: " + error);
    }

    return shader;
  }

  private initBuffers(): void {
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([
        0,
        0,
        this.canvas.width,
        0,
        0,
        this.canvas.height,
        0,
        this.canvas.height,
        this.canvas.width,
        0,
        this.canvas.width,
        this.canvas.height,
      ]),
      this.gl.STATIC_DRAW,
    );

    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      this.gl.STATIC_DRAW,
    );
  }

  private initTextures(): void {
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR,
    );

    this.tempTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tempTexture);
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_S,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_WRAP_T,
      this.gl.CLAMP_TO_EDGE,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MIN_FILTER,
      this.gl.LINEAR,
    );
    this.gl.texParameteri(
      this.gl.TEXTURE_2D,
      this.gl.TEXTURE_MAG_FILTER,
      this.gl.LINEAR,
    );

    this.framebuffer = this.gl.createFramebuffer();
    this.tempFramebuffer = this.gl.createFramebuffer();
  }

  private getCachedCanvas(width: number, height: number): HTMLCanvasElement {
    const key = `${width}x${height}`;
    let canvas = this.resultCanvasCache.get(key);

    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Manage cache size
      if (this.resultCanvasCache.size >= this.maxCacheSize) {
        const firstKey = this.resultCanvasCache.keys().next().value;
        this.resultCanvasCache.delete(firstKey);
      }

      this.resultCanvasCache.set(key, canvas);
    }

    return canvas;
  }

  /**
   * Apply blur with configurable quality (49 or 13 samples)
   */
  applyBlur(
    sourceCanvas: HTMLCanvasElement,
    blurRadius: number,
  ): HTMLCanvasElement {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    // Reduce the multiplier significantly for bloom visibility
    const enhancedRadius = blurRadius * 1; // Reduced from 2.5 to 1.0

    // Update shader program if quality setting changed
    const expectedShader = GameConstants.HIGH_QUALITY_BLUR
      ? this.highQualityShaderProgram
      : this.performanceShaderProgram;

    if (this.currentShaderProgram !== expectedShader) {
      this.updateShaderProgram();
    }

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);

      // Update position buffer for new dimensions
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
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      sourceCanvas,
    );

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tempTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(
      this.positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.enableVertexAttribArray(this.texCoordLocation);
    this.gl.vertexAttribPointer(
      this.texCoordLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0,
    );

    this.gl.uniform2f(this.resolutionLocation, width, height);
    this.gl.uniform1f(this.radiusLocation, enhancedRadius);

    // First pass: horizontal blur
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.tempFramebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.tempTexture,
      0,
    );

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform2f(this.directionLocation, 1.0, 0.0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Second pass: vertical blur
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.texture,
      0,
    );

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tempTexture);
    this.gl.uniform2f(this.directionLocation, 0.0, 1.0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Final pass: render to screen
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Get cached result canvas
    const resultCanvas = this.getCachedCanvas(width, height);
    const resultCtx = resultCanvas.getContext("2d");
    resultCtx.clearRect(0, 0, width, height);
    resultCtx.drawImage(this.canvas, 0, 0);

    return resultCanvas;
  }

  clearCache(): void {
    this.resultCanvasCache.clear();
  }

  dispose(): void {
    this.clearCache();

    if (this.gl) {
      this.gl.deleteProgram(this.highQualityShaderProgram);
      this.gl.deleteProgram(this.performanceShaderProgram);
      this.gl.deleteBuffer(this.positionBuffer);
      this.gl.deleteBuffer(this.texCoordBuffer);
      this.gl.deleteTexture(this.texture);
      this.gl.deleteTexture(this.tempTexture);
      this.gl.deleteFramebuffer(this.framebuffer);
      this.gl.deleteFramebuffer(this.tempFramebuffer);
    }
  }
}
