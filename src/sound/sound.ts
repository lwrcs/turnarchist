import { Game } from "../game";
import { ReverbEngine } from "./reverb";

export class Sound {
  static playerStoneFootsteps: Array<HTMLAudioElement>;
  static playerGrassFootsteps: Array<HTMLAudioElement>;
  static playerDirtFootsteps: Array<HTMLAudioElement>;
  static enemyFootsteps: Array<HTMLAudioElement>;
  static hitSounds: Array<HTMLAudioElement>;
  static enemySpawnSound: HTMLAudioElement;
  static chestSounds: Array<HTMLAudioElement>;
  static coinPickupSounds: Array<HTMLAudioElement>;
  static miningSounds: Array<HTMLAudioElement>;
  static breakRockSound: HTMLAudioElement;
  static hurtSounds: Array<HTMLAudioElement>;
  static genericPickupSound: HTMLAudioElement;
  static pushSounds: Array<HTMLAudioElement>;
  static healSound: HTMLAudioElement;
  static forestMusic: Array<HTMLAudioElement>;
  static graveSound: HTMLAudioElement;
  static ambientSound: HTMLAudioElement;
  static goreSound: HTMLAudioElement;
  static swingSounds: Array<HTMLAudioElement>;
  static unlockSounds: Array<HTMLAudioElement>;
  static doorOpenSounds: Array<HTMLAudioElement>;
  static potSmashSounds: Array<HTMLAudioElement>;
  static keyPickupSound: HTMLAudioElement;
  static magicSound: HTMLAudioElement;
  static wooshSound: HTMLAudioElement;
  static initialized: boolean = false;
  static audioMuted: boolean = true;
  static bombSounds: Array<HTMLAudioElement>;
  static fuseBurnSound: HTMLAudioElement;
  static fuseLoopSound: HTMLAudioElement;
  static fuseStartSound: HTMLAudioElement;
  static warHammerSound: HTMLAudioElement;
  static sliceSound: Array<HTMLAudioElement>;
  static shortSliceSound: Array<HTMLAudioElement>;
  static backpackSound: HTMLAudioElement;
  static smithSound: HTMLAudioElement;
  static bushSounds: Array<HTMLAudioElement>;
  static parrySounds: Array<HTMLAudioElement>;

  static loopHandlers: Map<HTMLAudioElement, EventListener> = new Map();
  static currentlyPlaying: Array<HTMLAudioElement> = [];

  static toggleMute() {
    Sound.audioMuted = !Sound.audioMuted;
    Sound.ambientSound.removeEventListener("ended", Sound.ambientSound.onended);
    Sound.ambientSound.pause();
    if (Sound.audioMuted) {
      Sound.currentlyPlaying.forEach((audio) => {
        audio.pause();
      });
      Sound.currentlyPlaying = [];
    } else {
      Sound.ambientSound.addEventListener("ended", Sound.ambientSound.onended);
      Sound.ambientSound.play();
    }
  }

  private static isMobile(): boolean {
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }

  // Helper function to preload and decode audio arrays
  private static async preloadAudioArray(
    basePath: string,
    indices: number[],
    volume: number = 1.0,
  ): Promise<HTMLAudioElement[]> {
    const audioArray: HTMLAudioElement[] = [];

    if (Sound.isMobile()) {
      // Mobile: preload and force decode
      const preloadPromises = indices.map(async (i) => {
        const audio = new Audio(`${basePath}${i}.mp3`);
        audio.preload = "auto";
        audio.volume = volume;
        audio.load();

        // Force decode by playing silently
        return new Promise<HTMLAudioElement>((resolve) => {
          const onCanPlay = async () => {
            try {
              const originalVolume = audio.volume;
              audio.volume = 0;
              await audio.play();
              audio.pause();
              audio.currentTime = 0;
              audio.volume = originalVolume;
              resolve(audio);
            } catch (error) {
              console.warn(`Failed to preload ${basePath}${i}.mp3:`, error);
              resolve(audio); // Still return the audio element
            }
          };

          audio.addEventListener("canplaythrough", onCanPlay, { once: true });
          audio.addEventListener("error", () => resolve(audio), { once: true });
        });
      });

      const loadedAudio = await Promise.all(preloadPromises);
      audioArray.push(...loadedAudio);
    } else {
      // Desktop: normal loading
      indices.forEach((i) => {
        const audio = new Audio(`${basePath}${i}.mp3`);
        audio.volume = volume;
        audioArray.push(audio);
      });
    }

    return audioArray;
  }

  // Helper function for single audio files
  private static async preloadSingleAudio(
    path: string,
    volume: number = 1.0,
  ): Promise<HTMLAudioElement> {
    const audio = new Audio(path);
    audio.volume = volume;

    if (Sound.isMobile()) {
      audio.preload = "auto";
      audio.load();

      return new Promise<HTMLAudioElement>((resolve) => {
        const onCanPlay = async () => {
          try {
            const originalVolume = audio.volume;
            audio.volume = 0;
            await audio.play();
            audio.pause();
            audio.currentTime = 0;
            audio.volume = originalVolume;
            resolve(audio);
          } catch (error) {
            console.warn(`Failed to preload ${path}:`, error);
            resolve(audio);
          }
        };

        audio.addEventListener("canplaythrough", onCanPlay, { once: true });
        audio.addEventListener("error", () => resolve(audio), { once: true });
      });
    }

    return audio;
  }

  static loadSounds = async () => {
    if (Sound.initialized) return;
    Sound.initialized = true;
    if (ReverbEngine.initialized) Sound.audioMuted = false;

    try {
      console.log("Loading sounds...");

      // Use helper functions for all sound arrays
      Sound.playerStoneFootsteps = await Sound.preloadAudioArray(
        "res/SFX/footsteps/stone/footstep",
        [1, 2, 3],
        1.0,
      );

      Sound.playerGrassFootsteps = await Sound.preloadAudioArray(
        "res/SFX/footsteps/grass/footstep",
        [1, 2, 3, 6],
        1.0,
      );

      Sound.playerDirtFootsteps = await Sound.preloadAudioArray(
        "res/SFX/footsteps/dirt/footstep",
        [1, 2, 3, 4, 5],
        1.0,
      );

      Sound.enemyFootsteps = await Sound.preloadAudioArray(
        "res/SFX/footsteps/enemy/enemyfootstep",
        [1, 2, 3, 4, 5],
        1.0,
      );

      Sound.swingSounds = await Sound.preloadAudioArray(
        "res/SFX/attacks/swing",
        [1, 2, 3, 4],
        0.5,
      );

      Sound.hitSounds = await Sound.preloadAudioArray(
        "res/SFX/attacks/hurt",
        [1, 2],
        0.5,
      );

      Sound.chestSounds = await Sound.preloadAudioArray(
        "res/SFX/chest/chest",
        [1, 2, 3],
        0.5,
      );

      Sound.coinPickupSounds = await Sound.preloadAudioArray(
        "res/SFX/items/coins",
        [1, 2, 3, 4],
        1.0,
      );

      Sound.miningSounds = await Sound.preloadAudioArray(
        "res/SFX/resources/Pickaxe",
        [1, 2, 3, 4],
        0.3,
      );

      Sound.unlockSounds = await Sound.preloadAudioArray(
        "res/SFX/door/unlock",
        [1],
        0.5,
      );

      Sound.doorOpenSounds = await Sound.preloadAudioArray(
        "res/SFX/door/open",
        [1, 2],
        0.5,
      );

      Sound.potSmashSounds = await Sound.preloadAudioArray(
        "res/SFX/objects/potSmash",
        [1, 2, 3],
        0.5,
      );

      Sound.bombSounds = await Sound.preloadAudioArray(
        "res/SFX/attacks/explode",
        [1, 2],
        0.7,
      );

      Sound.sliceSound = await Sound.preloadAudioArray(
        "res/SFX/attacks/slice",
        [1, 2, 3],
        0.5,
      );

      Sound.shortSliceSound = await Sound.preloadAudioArray(
        "res/SFX/attacks/sliceShort",
        [1, 2, 3],
        0.5,
      );

      Sound.bushSounds = await Sound.preloadAudioArray(
        "res/SFX/objects/plantHit",
        [1, 2],
        0.75,
      );

      Sound.parrySounds = await Sound.preloadAudioArray(
        "res/SFX/attacks/parry",
        [1, 2],
        0.5,
      );

      // Single audio files
      Sound.enemySpawnSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/enemyspawn.mp3",
        0.7,
      );
      Sound.breakRockSound = await Sound.preloadSingleAudio(
        "res/SFX/resources/rockbreak.mp3",
        1.0,
      );
      Sound.genericPickupSound = await Sound.preloadSingleAudio(
        "res/SFX/items/pickup.mp3",
        1.0,
      );
      Sound.healSound = await Sound.preloadSingleAudio(
        "res/SFX/items/powerup1.mp3",
        0.5,
      );
      Sound.graveSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/skelespawn.mp3",
        0.3,
      );
      Sound.ambientSound = await Sound.preloadSingleAudio(
        "res/SFX/ambient/ambientDark2.mp3",
        1.0,
      );
      Sound.goreSound = await Sound.preloadSingleAudio(
        "res/SFX/misc Unused/gore2.mp3",
        0.5,
      );
      Sound.keyPickupSound = await Sound.preloadSingleAudio(
        "res/SFX/items/keyPickup.mp3",
        1.0,
      );
      Sound.magicSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/magic2.mp3",
        0.25,
      );
      Sound.wooshSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/woosh1.mp3",
        0.2,
      );
      Sound.fuseBurnSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/fuse.mp3",
        0.2,
      );
      Sound.fuseLoopSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/fuseLoop.mp3",
        0.2,
      );
      Sound.fuseStartSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/fuseStart.mp3",
        0.2,
      );
      Sound.warHammerSound = await Sound.preloadSingleAudio(
        "res/SFX/attacks/warhammer.mp3",
        1.0,
      );
      Sound.backpackSound = await Sound.preloadSingleAudio(
        "res/SFX/items/backpack.mp3",
        0.75,
      );
      Sound.smithSound = await Sound.preloadSingleAudio(
        "res/SFX/items/smith.mp3",
        0.5,
      );

      // Music (don't preload these as they're large)
      Sound.forestMusic = [new Audio("res/music/forest1.mp3")];
      Sound.forestMusic.forEach((music) => (music.volume = 0.25));

      console.log("All sounds loaded and preloaded for mobile");
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  };

  private static playSoundSafely(audio: HTMLAudioElement) {
    audio.play().catch((err) => {
      if (err.name === "NotAllowedError") {
        console.warn("Audio playback requires user interaction first");
      } else {
        console.error("Error playing sound:", err);
      }
    });
  }

  static async playWithReverb(audio: HTMLAudioElement) {
    await ReverbEngine.initialize();
    Sound.currentlyPlaying.push(audio);

    ReverbEngine.applyReverb(audio);
    this.playSoundSafely(audio);
  }

  static playerStoneFootstep = async (environment: number) => {
    if (Sound.audioMuted) return;
    let sound = Sound.playerStoneFootsteps;
    if (environment === 2) sound = Sound.playerGrassFootsteps;
    if (environment === 1) sound = Sound.playerDirtFootsteps;

    let f = Game.randTable(sound, Math.random);
    await this.playWithReverb(f);
    f.currentTime = 0;
    f.play();
  };

  static enemyFootstep = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.enemyFootsteps, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static hit = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.swingSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;

    setTimeout(() => {
      let f = Game.randTable(Sound.hitSounds, Math.random);
      this.playWithReverb(f);
      f.currentTime = 0;
    }, 100);
  };

  static hurt = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.hurtSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static enemySpawn = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.enemySpawnSound);
    Sound.enemySpawnSound.currentTime = 0;
  };

  static chest = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.chestSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static potSmash = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.potSmashSounds, Math.random);
    this.delayPlay(() => this.playWithReverb(f), 100);
    f.currentTime = 0;
  };

  static pickupCoin = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.coinPickupSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static mine = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.miningSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static breakRock = () => {
    if (Sound.audioMuted) return;
    setTimeout(() => {
      this.playWithReverb(Sound.breakRockSound);
    }, 100);
    Sound.breakRockSound.currentTime = 0;
  };

  static heal = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.healSound);
    Sound.healSound.currentTime = 0;
  };

  static genericPickup = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.genericPickupSound);
    Sound.genericPickupSound.currentTime = 0;
  };

  static keyPickup = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.keyPickupSound);
    Sound.keyPickupSound.currentTime = 0;
  };

  static push = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.pushSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static skeleSpawn = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.graveSound);
    Sound.graveSound.currentTime = 0;
    Sound.graveSound.volume = 0.3;
  };

  static unlock = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.unlockSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static playForestMusic = (index: number) => {
    if (Sound.audioMuted) return;

    const music = Sound.forestMusic[index];
    if (music.paused) {
      music.currentTime = 0;
      Sound.playSoundSafely(music);
    } else {
      music.play();
    }
    music.addEventListener(
      "ended",
      () => {
        music.currentTime = 0;
        Sound.playSoundSafely(music);
      },
      false,
    );
    Sound.playSoundSafely(music);
  };

  static doorOpen = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.doorOpenSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static playAmbient = () => {
    if (Sound.audioMuted) return;
    Sound.ambientSound.addEventListener(
      "ended",
      () => {
        Sound.ambientSound.currentTime = 0;
        this.playWithReverb(Sound.ambientSound);
      },
      true,
    );
    this.playWithReverb(Sound.ambientSound);
  };

  static playFuse = () => {
    if (Sound.audioMuted) return;
    Sound.fuseStartSound.currentTime = 0;

    // Play the start sound first
    this.playWithReverb(Sound.fuseStartSound);

    // When start sound ends, begin the loop
    Sound.fuseStartSound.addEventListener(
      "ended",
      () => {
        Sound.fuseLoopSound.currentTime = 0;
        this.playWithReverb(Sound.fuseLoopSound);
      },
      { once: true },
    );

    // Set up loop sound to repeat
    Sound.fuseLoopSound.addEventListener("ended", () => {
      Sound.fuseLoopSound.currentTime = 0;
      this.playWithReverb(Sound.fuseLoopSound);
    });

    // Store the loop handler so we can remove it later
    const loopHandler = () => {
      Sound.fuseLoopSound.currentTime = 0;
      this.playWithReverb(Sound.fuseLoopSound);
    };
    Sound.loopHandlers.set(Sound.fuseLoopSound, loopHandler);
  };

  static stopFuse = () => {
    Sound.fuseLoopSound.pause();
    Sound.fuseLoopSound.currentTime = 0;
    Sound.fuseStartSound.pause();
    Sound.fuseStartSound.currentTime = 0;

    // Remove the loop handler
    const handler = Sound.loopHandlers.get(Sound.fuseLoopSound);
    if (handler) {
      Sound.fuseLoopSound.removeEventListener("ended", handler);
      Sound.loopHandlers.delete(Sound.fuseLoopSound);
    }
  };

  static playGore = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.goreSound);
    Sound.goreSound.currentTime = 0;
  };

  static playBomb = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.bombSounds, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static playWarHammer = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.warHammerSound);
    Sound.warHammerSound.currentTime = 0;
  };

  static playMagic = () => {
    if (Sound.audioMuted) return;
    let f = Sound.magicSound;
    let woosh = Sound.wooshSound;
    this.playWithReverb(f);
    this.playWithReverb(woosh);
    f.currentTime = 0;
    woosh.currentTime = 0;
  };

  static playSlice = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.sliceSound, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static playShortSlice = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.shortSliceSound, Math.random);
    this.playWithReverb(f);
    f.currentTime = 0;
  };

  static playBackpack = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.backpackSound);
    Sound.backpackSound.currentTime = 0;
  };

  static playSmith = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.smithSound);
    Sound.smithSound.currentTime = 0;
  };

  static playBush = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.bushSounds, Math.random);
    this.delayPlay(() => this.playWithReverb(f), 100);
    f.currentTime = 0;
  };

  static playParry = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.parrySounds, Math.random);
    this.delayPlay(() => this.playWithReverb(f), 100);
    f.currentTime = 0;
  };

  static delayPlay = (method: () => void, delay: number) => {
    setTimeout(method, delay);
  };

  static stopSound(audio: HTMLAudioElement) {
    audio.pause();
    audio.currentTime = 0;
  }

  static stopSoundWithReverb(audio: HTMLAudioElement) {
    ReverbEngine.removeReverb(audio);
    this.stopSound(audio);
  }
}
