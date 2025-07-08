import { Game } from "../game";
import { Sound } from "./sound";
import { Howl, Howler } from "howler";

export class ReverbEngine {
  private static audioContext: AudioContext;
  private static convolver: ConvolverNode;
  private static reverbBuffer: AudioBuffer | null = null;
  private static gainNodes: Map<number, GainNode> = new Map(); // Fixed: Use Map instead of WeakMap
  static initialized: boolean = false;

  // Initialize the AudioContext and ConvolverNode
  public static async initialize() {
    if (ReverbEngine.initialized) return;
    let canInitialize = Game.inputReceived;

    if (!canInitialize) {
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
      try {
        // Use Howler's audio context
        ReverbEngine.audioContext =
          Howler.ctx ||
          new (window.AudioContext || (window as any).webkitAudioContext)();

        ReverbEngine.convolver = ReverbEngine.audioContext.createConvolver();
        ReverbEngine.convolver.connect(ReverbEngine.audioContext.destination);
        await ReverbEngine.loadReverbBuffer(`res/SFX/impulses/small.mp3`);
        ReverbEngine.setDefaultReverb();
        ReverbEngine.initialized = true;
        if (Sound.initialized) Sound.audioMuted = false;
      } catch (error) {
        console.error("Failed to initialize ReverbEngine:", error);
      }
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

  // Add mobile detection
  private static isMobile(): boolean {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth <= 768
    );
  }

  // Apply reverb to a given Howl sound
  public static applyReverb(sound: Howl): number {
    // Skip reverb entirely on mobile
    if (ReverbEngine.isMobile()) return sound.play();

    if (!ReverbEngine.initialized) return sound.play();

    try {
      const soundId = sound.play();
      const gainNode = ReverbEngine.audioContext.createGain();

      // POTENTIAL FIX: Set gain node to match the Howl's volume
      gainNode.gain.setValueAtTime(
        sound.volume(),
        ReverbEngine.audioContext.currentTime,
      );

      gainNode.connect(ReverbEngine.convolver);
      ReverbEngine.gainNodes.set(soundId, gainNode);

      sound.once("play", () => {
        try {
          const soundInstance = (sound as any)._sounds.find(
            (s: any) => s._id === soundId,
          );
          if (soundInstance && soundInstance._node) {
            if (soundInstance._node.bufferSource) {
              soundInstance._node.bufferSource.disconnect();
              soundInstance._node.bufferSource.connect(gainNode);
            }
          }
        } catch (error) {
          console.warn("Could not apply reverb to sound:", error);
        }
      });

      return soundId;
    } catch (error) {
      console.error("Error applying reverb:", error);
      return sound.play();
    }
  }

  // Remove reverb from a given Howl sound
  public static removeReverb(sound: Howl) {
    if (!ReverbEngine.initialized) return;

    // Clean up all gain nodes for this sound
    const soundIds = (sound as any)._sounds.map((s: any) => s._id);
    soundIds.forEach((id: number) => {
      const gainNode = ReverbEngine.gainNodes.get(id);
      if (gainNode) {
        gainNode.disconnect();
        ReverbEngine.gainNodes.delete(id);
      }
    });
  }

  // Cleanup method
  public static cleanup() {
    // Clean up all gain nodes
    ReverbEngine.gainNodes.forEach((gainNode) => {
      gainNode.disconnect();
    });
    ReverbEngine.gainNodes.clear();

    if (
      ReverbEngine.audioContext &&
      ReverbEngine.audioContext.state !== "closed"
    ) {
      ReverbEngine.audioContext.close();
    }
    ReverbEngine.initialized = false;
  }
}
