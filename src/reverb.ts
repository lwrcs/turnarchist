export class ReverbEngine {
  private static audioContext: AudioContext;
  private static convolver: ConvolverNode;
  private static reverbBuffer: AudioBuffer | null = null;
  private static mediaSources: WeakMap<
    HTMLAudioElement,
    MediaElementAudioSourceNode
  > = new WeakMap();

  // Initialize the AudioContext and ConvolverNode
  public static async initialize() {
    if (!ReverbEngine.audioContext) {
      ReverbEngine.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      ReverbEngine.convolver = ReverbEngine.audioContext.createConvolver();
      ReverbEngine.convolver.connect(ReverbEngine.audioContext.destination);
      await ReverbEngine.loadReverbBuffer(`res/SFX/impulses/default.wav`);
      ReverbEngine.setDefaultReverb();
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
      console.log(
        `ReverbEngine: Reverb buffer loaded from ${filePath} successfully.`
      );
    } catch (error) {
      console.error("ReverbEngine: Failed to load reverb buffer.", error);
    }
  }

  // Set the default reverb buffer
  private static setDefaultReverb() {
    if (ReverbEngine.reverbBuffer) {
      ReverbEngine.convolver.buffer = ReverbEngine.reverbBuffer;
    } else {
      console.warn("ReverbEngine: Default reverb buffer not loaded.");
    }
  }

  /**
   * Set the reverb characteristics by specifying an impulse response file.
   * @param filePath - The path to the impulse response file.
   */
  public static async setReverbImpulse(filePath: string): Promise<void> {
    try {
      await ReverbEngine.loadReverbBuffer(filePath);
      if (ReverbEngine.reverbBuffer) {
        ReverbEngine.convolver.buffer = ReverbEngine.reverbBuffer;
        console.log(`ReverbEngine: Reverb impulse set to ${filePath}`);
      } else {
        console.warn(`ReverbEngine: Reverb buffer not set for ${filePath}`);
      }
    } catch (error) {
      console.error("ReverbEngine: Failed to set reverb impulse.", error);
    }
  }

  // Apply reverb to a given HTMLAudioElement
  public static applyReverb(audioElement: HTMLAudioElement) {
    try {
      if (ReverbEngine.mediaSources.has(audioElement)) {
        console.warn(
          "ReverbEngine: Reverb already applied to this audio element."
        );
        return;
      }

      const track =
        ReverbEngine.audioContext.createMediaElementSource(audioElement);
      track.connect(ReverbEngine.convolver);
      ReverbEngine.mediaSources.set(audioElement, track);
      console.log(`ReverbEngine: Reverb applied to ${audioElement.src}`);
    } catch (error) {
      console.error("ReverbEngine: Failed to apply reverb.", error);
    }
  }

  // Remove reverb from a given HTMLAudioElement
  public static removeReverb(audioElement: HTMLAudioElement) {
    const track = ReverbEngine.mediaSources.get(audioElement);
    if (track) {
      track.disconnect();
      ReverbEngine.mediaSources.delete(audioElement);
      console.log(`ReverbEngine: Reverb removed from ${audioElement.src}`);
    } else {
      console.warn(
        "ReverbEngine: No reverb connection found for this audio element."
      );
    }
  }
}
