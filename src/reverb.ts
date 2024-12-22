import { Game } from "./game";

export class ReverbEngine {
  private static audioContext: AudioContext;
  private static convolver: ConvolverNode;
  private static reverbBuffer: AudioBuffer | null = null;
  private static mediaSources: WeakMap<
    HTMLAudioElement,
    MediaElementAudioSourceNode
  > = new WeakMap();
  static initialized: boolean = false;

  // Initialize the AudioContext and ConvolverNode
  public static async initialize() {
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
  private static async loadReverbBuffer(filePath: string) {
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
  private static setDefaultReverb() {
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

  // Apply reverb to a given HTMLAudioElement
  public static async applyReverb(audioElement: HTMLAudioElement) {
    await ReverbEngine.initialize();
    if (!ReverbEngine.initialized) return;
    try {
      if (ReverbEngine.mediaSources.has(audioElement)) {
        return;
      }

      const track =
        ReverbEngine.audioContext.createMediaElementSource(audioElement);
      track.connect(ReverbEngine.convolver);
      ReverbEngine.mediaSources.set(audioElement, track);
    } catch (error) {
      console.error("Error applying reverb:", error);
    }
  }

  // Remove reverb from a given HTMLAudioElement
  public static async removeReverb(audioElement: HTMLAudioElement) {
    await ReverbEngine.initialize();
    if (!ReverbEngine.initialized) return;
    const track = ReverbEngine.mediaSources.get(audioElement);
    if (track) {
      track.disconnect();
      ReverbEngine.mediaSources.delete(audioElement);
    }
  }
}
