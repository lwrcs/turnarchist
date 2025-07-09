import { GameConstants } from "../game/gameConstants";

export class WebGLBlurRenderer {
  private static instance: WebGLBlurRenderer;
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private shaderProgram: WebGLProgram;
  private positionBuffer: WebGLBuffer;
  private texCoordBuffer: WebGLBuffer;
  private framebuffer: WebGLFramebuffer;
  private texture: WebGLTexture;
  private tempTexture: WebGLTexture;
  private tempFramebuffer: WebGLFramebuffer;

  // Shader attribute/uniform locations
  private positionLocation: number;
  private texCoordLocation: number;
  private resolutionLocation: WebGLUniformLocation;
  private textureLocation: WebGLUniformLocation;
  private directionLocation: WebGLUniformLocation;
  private radiusLocation: WebGLUniformLocation;

  // Vertex shader source
  private vertexShaderSource = `
    precision mediump float;
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    uniform mediump vec2 u_resolution;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 zeroToOne = a_position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      v_texCoord = a_texCoord;
    }
  `;

  // Fragment shader source - Increased blur strength
  private fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform mediump vec2 u_resolution;
    uniform mediump vec2 u_direction;
    uniform mediump float u_radius;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 texelSize = 1.0 / u_resolution;
      vec4 color = vec4(0.0);
      float totalWeight = 0.0;
      
      // Increased blur strength with better sigma calculation
      float sigma = u_radius * 0.4;
      float twoSigmaSquare = 2.0 * sigma * sigma;
      
      // Increased sample range for stronger blur
      for (float i = -24.0; i <= 24.0; i++) {
        if (abs(i) > u_radius) continue;
        
        vec2 offset = u_direction * texelSize * i;
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

    const context = this.canvas.getContext(
      "webgl",
    ) as WebGLRenderingContext | null;
    const experimentalContext = this.canvas.getContext(
      "experimental-webgl",
    ) as WebGLRenderingContext | null;

    this.gl = context || experimentalContext;
    if (!this.gl) {
      throw new Error("WebGL not supported");
    }

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
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.fragmentShaderSource,
    );

    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, vertexShader);
    this.gl.attachShader(this.shaderProgram, fragmentShader);
    this.gl.linkProgram(this.shaderProgram);

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      throw new Error(
        "Unable to initialize the shader program: " +
          this.gl.getProgramInfoLog(this.shaderProgram),
      );
    }

    this.positionLocation = this.gl.getAttribLocation(
      this.shaderProgram,
      "a_position",
    );
    this.texCoordLocation = this.gl.getAttribLocation(
      this.shaderProgram,
      "a_texCoord",
    );
    this.resolutionLocation = this.gl.getUniformLocation(
      this.shaderProgram,
      "u_resolution",
    );
    this.textureLocation = this.gl.getUniformLocation(
      this.shaderProgram,
      "u_texture",
    );
    this.directionLocation = this.gl.getUniformLocation(
      this.shaderProgram,
      "u_direction",
    );
    this.radiusLocation = this.gl.getUniformLocation(
      this.shaderProgram,
      "u_radius",
    );
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(
        "An error occurred compiling the shaders: " +
          this.gl.getShaderInfoLog(shader),
      );
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

  /**
   * Apply blur to a canvas and return the result as a new canvas
   * @param sourceCanvas - The source canvas to blur
   * @param blurRadius - The blur radius in pixels (will be multiplied for stronger effect)
   * @returns A new canvas with the blurred result
   */
  applyBlur(
    sourceCanvas: HTMLCanvasElement,
    blurRadius: number,
  ): HTMLCanvasElement {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    // Increase blur strength by multiplying the radius
    const enhancedRadius = blurRadius * 1.5;

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

    this.gl.useProgram(this.shaderProgram);

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
    this.gl.uniform1i(this.textureLocation, 0);
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

    // Create properly sized result canvas
    const resultCanvas = document.createElement("canvas");
    resultCanvas.width = width;
    resultCanvas.height = height;
    const resultCtx = resultCanvas.getContext("2d");
    resultCtx.drawImage(this.canvas, 0, 0, width, height, 0, 0, width, height);

    return resultCanvas;
  }

  dispose(): void {
    if (this.gl) {
      this.gl.deleteProgram(this.shaderProgram);
      this.gl.deleteBuffer(this.positionBuffer);
      this.gl.deleteBuffer(this.texCoordBuffer);
      this.gl.deleteTexture(this.texture);
      this.gl.deleteTexture(this.tempTexture);
      this.gl.deleteFramebuffer(this.framebuffer);
      this.gl.deleteFramebuffer(this.tempFramebuffer);
    }
  }
}
