import { Game } from "../game";

export interface AudioBufferConfig {
  buffer: AudioBuffer;
  volume: number;
  loop?: boolean;
  loopStart?: number;
  loopEnd?: number;
}

export class ReverbEngine {
  private static audioContext: AudioContext;
  private static convolver: ConvolverNode;
  private static reverbBuffer: AudioBuffer | null = null;
  private static currentSources: Set<AudioBufferSourceNode> = new Set();
  static initialized: boolean = false;

  // Initialize the AudioContext and ConvolverNode
  public static async initialize(): Promise<void> {
    if (ReverbEngine.initialized) return;
    let canInitialize = false;

    if (!Game.inputReceived) {
      console.time("initializeReverb");
      try {
        await new Promise<void>((resolve) => {
          const checkInput = () => {
            if (Game.inputReceived) {
              resolve();
              canInitialize = true;
              console.timeEnd("initializeReverb");
            } else {
              requestAnimationFrame(checkInput);
            }
          };
          checkInput();
        });
      } catch (error) {
        console.error("Failed to initialize ReverbEngine:", error);
        return;
      }
    }

    if (
      !ReverbEngine.audioContext &&
      !ReverbEngine.initialized &&
      canInitialize
    ) {
      ReverbEngine.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      ReverbEngine.convolver = ReverbEngine.audioContext.createConvolver();
      ReverbEngine.convolver.connect(ReverbEngine.audioContext.destination);
      await ReverbEngine.loadReverbBuffer(`res/SFX/impulses/small.mp3`);
      ReverbEngine.setDefaultReverb();
      ReverbEngine.initialized = true;
    }
  }

  // Load a specified impulse response
  private static async loadReverbBuffer(filePath: string): Promise<void> {
    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      ReverbEngine.reverbBuffer =
        await ReverbEngine.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error("Error loading reverb buffer:", error);
    }
  }

  // Set the default reverb buffer
  private static setDefaultReverb(): void {
    if (ReverbEngine.reverbBuffer) {
      ReverbEngine.convolver.buffer = ReverbEngine.reverbBuffer;
    }
  }

  /**
   * Set the reverb characteristics by specifying an impulse response file.
   * @param filePath - The path to the impulse response file.
   */
  public static async setReverbImpulse(filePath: string): Promise<void> {
    if (!ReverbEngine.initialized) return;
    try {
      await ReverbEngine.loadReverbBuffer(filePath);
      if (ReverbEngine.reverbBuffer) {
        ReverbEngine.convolver.buffer = ReverbEngine.reverbBuffer;
      }
    } catch (error) {
      console.error("Error setting reverb impulse:", error);
    }
  }

  /**
   * Get the initialized AudioContext
   */
  public static getAudioContext(): AudioContext | null {
    return ReverbEngine.audioContext || null;
  }

  /**
   * Play an AudioBuffer with reverb applied
   * @param config - Audio buffer configuration including buffer, volume, and loop settings
   * @param delay - Optional delay in seconds before playing
   * @returns AudioBufferSourceNode that was created
   */
  public static async playBufferWithReverb(
    config: AudioBufferConfig,
    delay: number = 0,
  ): Promise<AudioBufferSourceNode | null> {
    await ReverbEngine.initialize();
    if (!ReverbEngine.initialized || !ReverbEngine.audioContext) return null;

    try {
      const source = ReverbEngine.audioContext.createBufferSource();
      const gainNode = ReverbEngine.audioContext.createGain();

      source.buffer = config.buffer;
      source.loop = config.loop || false;
      if (config.loopStart !== undefined) source.loopStart = config.loopStart;
      if (config.loopEnd !== undefined) source.loopEnd = config.loopEnd;

      gainNode.gain.value = config.volume;

      source.connect(gainNode);
      gainNode.connect(ReverbEngine.convolver);

      // Track the source
      ReverbEngine.currentSources.add(source);

      // Clean up when the source ends
      source.addEventListener("ended", () => {
        ReverbEngine.currentSources.delete(source);
        source.disconnect();
        gainNode.disconnect();
      });

      source.start(ReverbEngine.audioContext.currentTime + delay);
      return source;
    } catch (error) {
      console.error("Error playing buffer with reverb:", error);
      return null;
    }
  }

  /**
   * Play an AudioBuffer without reverb (direct to destination)
   * @param config - Audio buffer configuration
   * @param delay - Optional delay in seconds before playing
   * @returns AudioBufferSourceNode that was created
   */
  public static async playBufferDirect(
    config: AudioBufferConfig,
    delay: number = 0,
  ): Promise<AudioBufferSourceNode | null> {
    await ReverbEngine.initialize();
    if (!ReverbEngine.initialized || !ReverbEngine.audioContext) return null;

    try {
      const source = ReverbEngine.audioContext.createBufferSource();
      const gainNode = ReverbEngine.audioContext.createGain();

      source.buffer = config.buffer;
      source.loop = config.loop || false;
      if (config.loopStart !== undefined) source.loopStart = config.loopStart;
      if (config.loopEnd !== undefined) source.loopEnd = config.loopEnd;

      gainNode.gain.value = config.volume;

      source.connect(gainNode);
      gainNode.connect(ReverbEngine.audioContext.destination);

      // Track the source
      ReverbEngine.currentSources.add(source);

      // Clean up when the source ends
      source.addEventListener("ended", () => {
        ReverbEngine.currentSources.delete(source);
        source.disconnect();
        gainNode.disconnect();
      });

      source.start(ReverbEngine.audioContext.currentTime + delay);
      return source;
    } catch (error) {
      console.error("Error playing buffer direct:", error);
      return null;
    }
  }

  /**
   * Stop a specific audio source
   * @param source - The AudioBufferSourceNode to stop
   */
  public static stopSource(source: AudioBufferSourceNode): void {
    if (ReverbEngine.currentSources.has(source)) {
      try {
        source.stop();
      } catch (error) {
        // Source may already be stopped
      }
      ReverbEngine.currentSources.delete(source);
    }
  }

  /**
   * Stop all currently playing audio sources
   */
  public static stopAllSources(): void {
    ReverbEngine.currentSources.forEach((source) => {
      try {
        source.stop();
      } catch (error) {
        // Source may already be stopped
      }
    });
    ReverbEngine.currentSources.clear();
  }

  /**
   * Load an audio file and return its AudioBuffer
   * @param filePath - Path to the audio file
   * @returns Promise that resolves to AudioBuffer or null if failed
   */
  public static async loadAudioBuffer(
    filePath: string,
  ): Promise<AudioBuffer | null> {
    await ReverbEngine.initialize();
    if (!ReverbEngine.audioContext) return null;

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return await ReverbEngine.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`Error loading audio buffer from ${filePath}:`, error);
      return null;
    }
  }
}
