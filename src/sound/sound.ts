import { Game } from "../game";
import { ReverbEngine, AudioBufferConfig } from "./reverb";

interface BufferCollection {
  buffers: AudioBuffer[];
  volume: number;
}

export class Sound {
  // Audio buffer collections for different sound types
  static playerStoneFootsteps: BufferCollection;
  static playerGrassFootsteps: BufferCollection;
  static playerDirtFootsteps: BufferCollection;
  static enemyFootsteps: BufferCollection;
  static hitSounds: BufferCollection;
  static chestSounds: BufferCollection;
  static coinPickupSounds: BufferCollection;
  static miningSounds: BufferCollection;
  static hurtSounds: BufferCollection;
  static pushSounds: BufferCollection;
  static forestMusic: BufferCollection;
  static swingSounds: BufferCollection;
  static unlockSounds: BufferCollection;
  static doorOpenSounds: BufferCollection;
  static potSmashSounds: BufferCollection;
  static bombSounds: BufferCollection;
  static sliceSound: BufferCollection;
  static shortSliceSound: BufferCollection;
  static bushSounds: BufferCollection;
  static parrySounds: BufferCollection;

  // Single audio buffers
  static enemySpawnSound: { buffer: AudioBuffer; volume: number };
  static breakRockSound: { buffer: AudioBuffer; volume: number };
  static genericPickupSound: { buffer: AudioBuffer; volume: number };
  static healSound: { buffer: AudioBuffer; volume: number };
  static graveSound: { buffer: AudioBuffer; volume: number };
  static ambientSound: { buffer: AudioBuffer; volume: number };
  static goreSound: { buffer: AudioBuffer; volume: number };
  static keyPickupSound: { buffer: AudioBuffer; volume: number };
  static magicSound: { buffer: AudioBuffer; volume: number };
  static wooshSound: { buffer: AudioBuffer; volume: number };
  static fuseBurnSound: { buffer: AudioBuffer; volume: number };
  static fuseLoopSound: { buffer: AudioBuffer; volume: number };
  static fuseStartSound: { buffer: AudioBuffer; volume: number };
  static warHammerSound: { buffer: AudioBuffer; volume: number };
  static backpackSound: { buffer: AudioBuffer; volume: number };
  static smithSound: { buffer: AudioBuffer; volume: number };

  static initialized: boolean = false;
  static audioMuted: boolean = true;

  // Track current playing sources for management
  static currentlyPlaying: Set<AudioBufferSourceNode> = new Set();
  static loopingSources: Map<string, AudioBufferSourceNode> = new Map();

  static toggleMute(): void {
    Sound.audioMuted = !Sound.audioMuted;

    if (Sound.audioMuted) {
      // Stop all currently playing sounds
      Sound.currentlyPlaying.forEach((source) => {
        ReverbEngine.stopSource(source);
      });
      Sound.currentlyPlaying.clear();

      // Stop looping sounds
      Sound.loopingSources.forEach((source) => {
        ReverbEngine.stopSource(source);
      });
      Sound.loopingSources.clear();
    } else {
      // Restart ambient sound
      Sound.playAmbient();
    }
  }

  /**
   * Load all sound buffers
   */
  static loadSounds = async (): Promise<void> => {
    if (Sound.initialized) return;
    Sound.initialized = true;

    await ReverbEngine.initialize();
    Sound.audioMuted = false;

    try {
      // Load footstep sounds
      Sound.playerStoneFootsteps = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/footsteps/stone/footstep",
          [1, 2, 3],
          ".mp3",
        ),
        volume: 1.0,
      };

      Sound.playerGrassFootsteps = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/footsteps/grass/footstep",
          [1, 2, 3, 6],
          ".mp3",
        ),
        volume: 1.0,
      };

      Sound.playerDirtFootsteps = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/footsteps/dirt/footstep",
          [1, 2, 3, 4, 5],
          ".mp3",
        ),
        volume: 1.0,
      };

      Sound.enemyFootsteps = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/footsteps/enemy/enemyfootstep",
          [1, 2, 3, 4, 5],
          ".mp3",
        ),
        volume: 1.0,
      };

      // Load combat sounds
      Sound.swingSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/attacks/swing",
          [1, 2, 3, 4],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.hitSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/attacks/hurt",
          [1, 2],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.hurtSounds = {
        buffers: await Sound.loadSingleBuffer("res/SFX/attacks/hit.mp3").then(
          (buffer) => [buffer],
        ),
        volume: 0.3,
      };

      Sound.sliceSound = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/attacks/slice",
          [1, 2, 3],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.shortSliceSound = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/attacks/sliceShort",
          [1, 2, 3],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.parrySounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/attacks/parry",
          [1, 2],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.bombSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/attacks/explode",
          [1, 2],
          ".mp3",
        ),
        volume: 0.7,
      };

      // Load interaction sounds
      Sound.chestSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/chest/chest",
          [1, 2, 3],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.coinPickupSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/items/coins",
          [1, 2, 3, 4],
          ".mp3",
        ),
        volume: 1.0,
      };

      Sound.miningSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/resources/Pickaxe",
          [1, 2, 3, 4],
          ".mp3",
        ),
        volume: 0.3,
      };

      Sound.pushSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/pushing/push",
          [1, 2],
          ".mp3",
        ),
        volume: 1.0,
      };

      Sound.unlockSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/door/unlock",
          [1],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.doorOpenSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/door/open",
          [1, 2],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.potSmashSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/objects/potSmash",
          [1, 2, 3],
          ".mp3",
        ),
        volume: 0.5,
      };

      Sound.bushSounds = {
        buffers: await Sound.loadBufferArray(
          "res/SFX/objects/plantHit",
          [1, 2],
          ".mp3",
        ),
        volume: 0.75,
      };

      // Load music
      Sound.forestMusic = {
        buffers: await Sound.loadBufferArray("res/music/forest", [1], ".mp3"),
        volume: 0.25,
      };

      // Load single sounds
      const singleSounds = [
        {
          prop: "enemySpawnSound",
          path: "res/SFX/attacks/enemyspawn.mp3",
          volume: 0.7,
        },
        {
          prop: "breakRockSound",
          path: "res/SFX/resources/rockbreak.mp3",
          volume: 1.0,
        },
        {
          prop: "genericPickupSound",
          path: "res/SFX/items/pickup.mp3",
          volume: 1.0,
        },
        { prop: "healSound", path: "res/SFX/items/powerup1.mp3", volume: 0.5 },
        {
          prop: "graveSound",
          path: "res/SFX/attacks/skelespawn.mp3",
          volume: 0.3,
        },
        {
          prop: "ambientSound",
          path: "res/SFX/ambient/ambientDark2.mp3",
          volume: 1.0,
        },
        {
          prop: "goreSound",
          path: "res/SFX/misc Unused/gore2.mp3",
          volume: 0.5,
        },
        {
          prop: "keyPickupSound",
          path: "res/SFX/items/keyPickup.mp3",
          volume: 1.0,
        },
        {
          prop: "magicSound",
          path: "res/SFX/attacks/magic2.mp3",
          volume: 0.25,
        },
        { prop: "wooshSound", path: "res/SFX/attacks/woosh1.mp3", volume: 0.2 },
        {
          prop: "fuseBurnSound",
          path: "res/SFX/attacks/fuse.mp3",
          volume: 0.2,
        },
        {
          prop: "fuseLoopSound",
          path: "res/SFX/attacks/fuseLoop.mp3",
          volume: 0.2,
        },
        {
          prop: "fuseStartSound",
          path: "res/SFX/attacks/fuseStart.mp3",
          volume: 0.2,
        },
        {
          prop: "warHammerSound",
          path: "res/SFX/attacks/warhammer.mp3",
          volume: 1.0,
        },
        {
          prop: "backpackSound",
          path: "res/SFX/items/backpack.mp3",
          volume: 0.75,
        },
        { prop: "smithSound", path: "res/SFX/items/smith.mp3", volume: 0.5 },
      ];

      for (const sound of singleSounds) {
        const buffer = await Sound.loadSingleBuffer(sound.path);
        if (buffer) {
          (Sound as any)[sound.prop] = { buffer, volume: sound.volume };
        }
      }
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  };

  /**
   * Load a single audio buffer
   */
  private static async loadSingleBuffer(
    path: string,
  ): Promise<AudioBuffer | null> {
    return await ReverbEngine.loadAudioBuffer(path);
  }

  /**
   * Load an array of audio buffers
   */
  private static async loadBufferArray(
    basePath: string,
    indices: number[],
    extension: string,
  ): Promise<AudioBuffer[]> {
    const buffers: AudioBuffer[] = [];

    for (const index of indices) {
      const path = `${basePath}${index}${extension}`;
      const buffer = await Sound.loadSingleBuffer(path);
      if (buffer) {
        buffers.push(buffer);
      }
    }

    return buffers;
  }

  /**
   * Play a sound with reverb (internal method)
   */
  private static async playWithReverb(
    config: AudioBufferConfig,
    delay: number = 0,
  ): Promise<AudioBufferSourceNode | null> {
    if (Sound.audioMuted) return null;

    const source = await ReverbEngine.playBufferWithReverb(config, delay);
    if (source) {
      Sound.currentlyPlaying.add(source);
      source.addEventListener("ended", () => {
        Sound.currentlyPlaying.delete(source);
      });
    }
    return source;
  }

  /**
   * Play a random sound from a collection
   */
  private static async playRandomFromCollection(
    collection: BufferCollection,
    delay: number = 0,
  ): Promise<AudioBufferSourceNode | null> {
    if (collection.buffers.length === 0) return null;

    const buffer = Game.randTable(collection.buffers, Math.random);
    return await Sound.playWithReverb(
      {
        buffer,
        volume: collection.volume,
      },
      delay,
    );
  }

  /**
   * Play a single sound
   */
  private static async playSingle(
    sound: { buffer: AudioBuffer; volume: number },
    delay: number = 0,
  ): Promise<AudioBufferSourceNode | null> {
    return await Sound.playWithReverb(
      {
        buffer: sound.buffer,
        volume: sound.volume,
      },
      delay,
    );
  }

  // Public API methods (maintain same interface as before)
  static playerStoneFootstep = async (environment: number): Promise<void> => {
    if (Sound.audioMuted) return;

    let collection = Sound.playerStoneFootsteps;
    if (environment === 2) collection = Sound.playerGrassFootsteps;
    if (environment === 1) collection = Sound.playerDirtFootsteps;

    await Sound.playRandomFromCollection(collection);
  };

  static enemyFootstep = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.enemyFootsteps);
  };

  static hit = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.swingSounds);

    setTimeout(async () => {
      await Sound.playRandomFromCollection(Sound.hitSounds);
    }, 100);
  };

  static hurt = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.hurtSounds);
  };

  static enemySpawn = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.enemySpawnSound);
  };

  static chest = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.chestSounds);
  };

  static potSmash = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.potSmashSounds, 0.1);
  };

  static pickupCoin = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.coinPickupSounds);
  };

  static mine = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.miningSounds);
  };

  static breakRock = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.breakRockSound, 0.1);
  };

  static heal = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.healSound);
  };

  static genericPickup = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.genericPickupSound);
  };

  static keyPickup = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.keyPickupSound);
  };

  static push = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.pushSounds);
  };

  static skeleSpawn = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.graveSound);
  };

  static unlock = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.unlockSounds);
  };

  static playForestMusic = async (index: number): Promise<void> => {
    if (Sound.audioMuted || index >= Sound.forestMusic.buffers.length) return;

    // Stop current music if playing
    const currentMusic = Sound.loopingSources.get("forestMusic");
    if (currentMusic) {
      ReverbEngine.stopSource(currentMusic);
    }

    const source = await ReverbEngine.playBufferWithReverb({
      buffer: Sound.forestMusic.buffers[index],
      volume: Sound.forestMusic.volume,
      loop: true,
    });

    if (source) {
      Sound.loopingSources.set("forestMusic", source);
    }
  };

  static doorOpen = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.doorOpenSounds);
  };

  static playAmbient = async (): Promise<void> => {
    if (Sound.audioMuted) return;

    // Stop current ambient if playing
    const currentAmbient = Sound.loopingSources.get("ambient");
    if (currentAmbient) {
      ReverbEngine.stopSource(currentAmbient);
    }

    const source = await ReverbEngine.playBufferWithReverb({
      buffer: Sound.ambientSound.buffer,
      volume: Sound.ambientSound.volume,
      loop: true,
    });

    if (source) {
      Sound.loopingSources.set("ambient", source);
    }
  };

  static playFuse = async (): Promise<void> => {
    if (Sound.audioMuted) return;

    // Play start sound first
    const startSource = await Sound.playSingle(Sound.fuseStartSound);

    if (startSource) {
      startSource.addEventListener("ended", async () => {
        // When start sound ends, begin the loop
        const loopSource = await ReverbEngine.playBufferWithReverb({
          buffer: Sound.fuseLoopSound.buffer,
          volume: Sound.fuseLoopSound.volume,
          loop: true,
        });

        if (loopSource) {
          Sound.loopingSources.set("fuse", loopSource);
        }
      });
    }
  };

  static stopFuse = (): void => {
    const fuseSource = Sound.loopingSources.get("fuse");
    if (fuseSource) {
      ReverbEngine.stopSource(fuseSource);
      Sound.loopingSources.delete("fuse");
    }
  };

  static playGore = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.goreSound);
  };

  static playBomb = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.bombSounds);
  };

  static playWarHammer = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.warHammerSound);
  };

  static playMagic = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.magicSound);
    await Sound.playSingle(Sound.wooshSound);
  };

  static playSlice = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.sliceSound);
  };

  static playShortSlice = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.shortSliceSound);
  };

  static playBackpack = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.backpackSound);
  };

  static playSmith = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playSingle(Sound.smithSound);
  };

  static playBush = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.bushSounds, 0.1);
  };

  static playParry = async (): Promise<void> => {
    if (Sound.audioMuted) return;
    await Sound.playRandomFromCollection(Sound.parrySounds, 0.1);
  };

  static delayPlay = (method: () => void, delay: number): void => {
    setTimeout(method, delay);
  };

  static stopSound(source: AudioBufferSourceNode): void {
    ReverbEngine.stopSource(source);
  }

  static stopAllSounds(): void {
    ReverbEngine.stopAllSources();
    Sound.currentlyPlaying.clear();
    Sound.loopingSources.clear();
  }
}
