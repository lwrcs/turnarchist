import { Game } from "../game";
import { Sound } from "./sound";
import { Howl, Howler } from "howler";

export class ReverbEngine {
  private static audioContext: AudioContext;
  private static convolver: ConvolverNode;
  private static reverbBuffer: AudioBuffer | null = null;
  private static gainNodes: Map<number, GainNode> = new Map();
  private static originalRefreshBuffer: any;
  static initialized: boolean = false;

  static isMobile(): boolean {
    return Sound.isMobile;
  }

  // Helper function to get sound identifier for logging
  private static getSoundName(sound: Howl): string {
    const src = (sound as any)._src;
    if (Array.isArray(src) && src.length > 0) {
      return src[0].split("/").pop() || "unknown";
    } else if (typeof src === "string") {
      return src.split("/").pop() || "unknown";
    }
    return "unknown";
  }

  // General logging function to avoid repetition
  private static logStep(
    step: string,
    soundName: string,
    message: string,
    soundId?: number,
  ) {
    const idStr = soundId !== undefined ? ` [ID:${soundId}]` : "";
    console.log(`[REVERB-${step}] ${soundName}${idStr}: ${message}`);
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

        // Set up the convolver
        ReverbEngine.convolver = ReverbEngine.audioContext.createConvolver();
        ReverbEngine.convolver.connect(ReverbEngine.audioContext.destination);

        await ReverbEngine.loadReverbBuffer(`res/SFX/impulses/small.mp3`);
        ReverbEngine.setDefaultReverb();

        // HOOK INTO _refreshBuffer METHOD
        if (!ReverbEngine.originalRefreshBuffer) {
          ReverbEngine.originalRefreshBuffer = Howl.prototype._refreshBuffer;

          Howl.prototype._refreshBuffer = function (sound: any) {
            const soundName = ReverbEngine.getSoundName(this);
            ReverbEngine.logStep(
              "A",
              soundName,
              "Intercepted _refreshBuffer",
              sound._id,
            );

            // Call the original method first
            ReverbEngine.originalRefreshBuffer.call(this, sound);

            // Now intercept the connection and add our reverb routing
            if (sound._node && sound._node.bufferSource) {
              ReverbEngine.logStep(
                "B",
                soundName,
                "Setting up reverb routing",
                sound._id,
              );

              // Disconnect from the original destination
              sound._node.bufferSource.disconnect();

              // Create or get gain node for this sound
              let gainNode = ReverbEngine.gainNodes.get(sound._id);
              if (!gainNode) {
                gainNode = ReverbEngine.audioContext.createGain();
                const volume = (this as any)._volume || 1.0; // Use original volume, no reduction
                gainNode.gain.setValueAtTime(
                  volume,
                  ReverbEngine.audioContext.currentTime,
                );
                gainNode.connect(ReverbEngine.convolver);
                ReverbEngine.gainNodes.set(sound._id, gainNode);
                ReverbEngine.logStep(
                  "C",
                  soundName,
                  `Created gain node with volume ${volume}`,
                  sound._id,
                );
              }

              // Connect buffer source to our gain node instead of the original destination
              sound._node.bufferSource.connect(gainNode);
              ReverbEngine.logStep(
                "D",
                soundName,
                "Connected to reverb gain node",
                sound._id,
              );
            }
          };
        }

        ReverbEngine.initialized = true;
        if (Sound.initialized) Sound.audioMuted = false;

        console.log(
          "ReverbEngine connection intercept initialized successfully",
        );
      } catch (error) {
        console.error("Failed to initialize ReverbEngine:", error);
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

  // CONNECTION INTERCEPT APPROACH: The _refreshBuffer hook handles everything
  public static applyReverb(sound: Howl): number {
    const soundName = ReverbEngine.getSoundName(sound);

    ReverbEngine.logStep(
      "E",
      soundName,
      "CONNECTION INTERCEPT - _refreshBuffer hook will handle reverb",
    );

    if (!ReverbEngine.initialized) {
      ReverbEngine.logStep(
        "E1",
        soundName,
        "Not initialized, playing without reverb",
      );
      return sound.play();
    }

    // Just call play normally - our _refreshBuffer hook will handle the rest
    return sound.play();
  }

  // Remove reverb from a given Howl sound
  public static removeReverb(sound: Howl) {
    const soundName = ReverbEngine.getSoundName(sound);

    // Clean up any gain nodes associated with this sound
    for (const [soundId, gainNode] of ReverbEngine.gainNodes.entries()) {
      if (gainNode) {
        gainNode.disconnect();
        ReverbEngine.gainNodes.delete(soundId);
      }
    }

    ReverbEngine.logStep(
      "R",
      soundName,
      "Reverb removed and gain nodes cleaned up",
    );
  }

  // Cleanup method
  public static cleanup() {
    console.log("[REVERB-CLEANUP] Starting cleanup");

    // Restore original _refreshBuffer method
    if (ReverbEngine.originalRefreshBuffer) {
      Howl.prototype._refreshBuffer = ReverbEngine.originalRefreshBuffer;
    }

    // Clean up all gain nodes
    for (const [soundId, gainNode] of ReverbEngine.gainNodes.entries()) {
      if (gainNode) {
        gainNode.disconnect();
      }
    }
    ReverbEngine.gainNodes.clear();

    if (ReverbEngine.convolver) {
      ReverbEngine.convolver.disconnect();
    }

    if (
      ReverbEngine.audioContext &&
      ReverbEngine.audioContext.state !== "closed"
    ) {
      ReverbEngine.audioContext.close();
    }
    ReverbEngine.initialized = false;

    console.log("[REVERB-CLEANUP] Cleanup completed");
  }
}
