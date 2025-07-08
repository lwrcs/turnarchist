import { Game } from "../game";
import { Sound } from "./sound";
import { Howl, Howler } from "howler";

export class ReverbEngine {
  private static audioContext: AudioContext;
  private static convolver: ConvolverNode;
  private static reverbBuffer: AudioBuffer | null = null;
  private static gainNodes: Map<number, GainNode> = new Map(); // Fixed: Use Map instead of WeakMap
  static initialized: boolean = false;

  static isMobile(): boolean {
    return Sound.isMobile;
  }

  public static async initialize() {
    if (ReverbEngine.initialized) return;

    let canInitialize = Game.inputReceived;

    if (!canInitialize) {
      try {
        await new Promise<void>((resolve) => {
          const checkInput = () => {
            if (Game.inputReceived) {
              resolve();
              canInitialize = true;
            } else {
              requestAnimationFrame(checkInput);
            }
          };
          checkInput();
        });
      } catch (error) {
        console.error("Failed to wait for input:", error);
        return;
      }
    }

    if (
      !ReverbEngine.audioContext &&
      !ReverbEngine.initialized &&
      canInitialize
    ) {
      try {
        // Wait for Howler to initialize its context
        if (!Howler.ctx) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        ReverbEngine.audioContext =
          Howler.ctx ||
          new (window.AudioContext || (window as any).webkitAudioContext)();

        // Resume context if suspended (mobile)
        if (ReverbEngine.audioContext.state === "suspended") {
          await ReverbEngine.audioContext.resume();
        }

        ReverbEngine.convolver = ReverbEngine.audioContext.createConvolver();
        ReverbEngine.convolver.connect(ReverbEngine.audioContext.destination);

        await ReverbEngine.loadReverbBuffer(`res/SFX/impulses/small.mp3`);
        ReverbEngine.setDefaultReverb();
        ReverbEngine.initialized = true;

        if (Sound.initialized) Sound.audioMuted = false;

        console.log("ReverbEngine initialized successfully");
      } catch (error) {
        console.error("Failed to initialize ReverbEngine:", error);
        // Mark as initialized anyway to prevent repeated attempts
        ReverbEngine.initialized = true;
        if (Sound.initialized) Sound.audioMuted = false;
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

  // Apply reverb to a given Howl sound
  public static applyReverb(sound: Howl): number {
    if (!ReverbEngine.initialized) return sound.play();

    try {
      const soundId = sound.play();

      // Only apply reverb processing if we have a valid context
      if (ReverbEngine.audioContext && ReverbEngine.convolver) {
        const gainNode = ReverbEngine.audioContext.createGain();
        gainNode.gain.setValueAtTime(
          sound.volume() * 0.7,
          ReverbEngine.audioContext.currentTime,
        );
        gainNode.connect(ReverbEngine.convolver);

        ReverbEngine.gainNodes.set(soundId, gainNode);

        // Apply reverb routing when sound starts playing
        sound.once("play", () => {
          try {
            const soundInstance = (sound as any)._sounds.find(
              (s: any) => s._id === soundId,
            );
            if (
              soundInstance &&
              soundInstance._node &&
              soundInstance._node.bufferSource
            ) {
              soundInstance._node.bufferSource.disconnect();
              soundInstance._node.bufferSource.connect(gainNode);
            }
          } catch (error) {
            // Silently fail - reverb is not critical
          }
        });
      }

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
