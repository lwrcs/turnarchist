import { Game } from "../game";
import { ReverbEngine } from "./reverb";
import { Howl, Howler } from "howler";

export class Sound {
  static playerStoneFootsteps: Array<Howl>;
  static playerGrassFootsteps: Array<Howl>;
  static playerDirtFootsteps: Array<Howl>;
  static enemyFootsteps: Array<Howl>;
  static hitSounds: Array<Howl>;
  static enemySpawnSound: Howl;
  static chestSounds: Array<Howl>;
  static coinPickupSounds: Array<Howl>;
  static miningSounds: Array<Howl>;
  static breakRockSound: Howl;
  static hurtSounds: Array<Howl>;
  static genericPickupSound: Howl;
  static pushSounds: Array<Howl>;
  static healSound: Howl;
  static forestMusic: Howl;
  static caveMusic: Howl;
  static graveSound: Howl;
  static ambientSound: Howl;
  static goreSound: Howl;
  static swingSounds: Array<Howl>;
  static unlockSounds: Array<Howl>;
  static doorOpenSounds: Array<Howl>;
  static potSmashSounds: Array<Howl>;
  static keyPickupSound: Howl;
  static magicSound: Howl;
  static wooshSound: Howl;
  static initialized: boolean = false;
  static audioMuted: boolean = true;
  static bombSounds: Array<Howl>;
  static fuseBurnSound: Howl;
  static fuseLoopSound: Howl;
  static fuseStartSound: Howl;
  static warHammerSound: Howl;
  static sliceSound: Array<Howl>;
  static shortSliceSound: Array<Howl>;
  static backpackSound: Howl;
  static smithSound: Howl;
  static bushSounds: Array<Howl>;
  static parrySounds: Array<Howl>;
  static eatSounds: Array<Howl>;
  static gruntSounds: Array<Howl>;
  static lockedSound: Howl;
  static woodSound: Howl;

  static currentlyPlaying: Set<number> = new Set();

  static readonly PRIORITY = {
    AMBIENT: 1,
    FOOTSTEPS: 2,
    INTERACTIONS: 3,
    COMBAT: 4,
    CRITICAL: 5,
  };

  static isMobile: boolean = false;
  static audioContextResumed: boolean = false;
  static forestMusicId: number | null = null;
  static caveMusicId: number | null = null;
  static ambientSoundId: number | null = null;

  static detectMobile() {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any).opera;
    Sound.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );
    return Sound.isMobile;
  }

  static async enableAudioForMobile() {
    if (Sound.audioContextResumed) return;

    try {
      if (Howler.ctx && Howler.ctx.state === "suspended") {
        await Howler.ctx.resume();
        Sound.audioContextResumed = true;
        console.log("AudioContext resumed");
      }
    } catch (error) {
      console.warn("Could not resume AudioContext:", error);
    }
  }

  static addMobileAudioHandlers() {
    const enableAudio = async () => {
      await Sound.enableAudioForMobile();
      if (Sound.audioMuted && ReverbEngine.initialized) {
        Sound.audioMuted = false;
        Howler.mute(false);
      }
    };

    const events = ["touchstart", "click", "keydown"];
    const handler = () => {
      enableAudio();
      events.forEach((event) => {
        document.removeEventListener(event, handler);
      });
    };

    events.forEach((event) => {
      document.addEventListener(event, handler, { once: true });
    });
  }

  static toggleMute() {
    Sound.audioMuted = !Sound.audioMuted;
    if (Sound.audioMuted) {
      Howler.mute(true);
    } else {
      Howler.mute(false);
      if (Sound.isMobile) {
        Sound.enableAudioForMobile();
      }
    }
  }

  static loadSounds = async () => {
    if (Sound.initialized) return;
    Sound.initialized = true;

    Sound.detectMobile();
    if (Sound.isMobile) {
      Sound.addMobileAudioHandlers();
    }

    if (ReverbEngine.initialized) {
      Sound.audioMuted = false;
    }

    // Optimized Howl creation - always use Web Audio API for better performance
    const createHowlArray = (
      basePath: string,
      indices: number[],
      volume: number = 1.0,
      maxConcurrent: number = 3,
    ): Array<Howl> => {
      return indices.map((i) => {
        return new Howl({
          src: [`${basePath}${i}.mp3`],
          volume: volume,
          preload: true,
          html5: false, // Always use Web Audio API
          pool: maxConcurrent,
        });
      });
    };

    const createHowl = (
      src: string,
      volume: number = 1.0,
      loop: boolean = false,
      maxConcurrent: number = 2,
    ): Howl => {
      return new Howl({
        src: [src],
        volume: volume,
        preload: true,
        loop: loop,
        html5: false, // Always use Web Audio API
        pool: maxConcurrent,
      });
    };

    try {
      // Load all sounds with optimized settings
      Sound.magicSound = createHowl(
        "res/SFX/attacks/magic2.mp3",
        0.25,
        false,
        3,
      );
      Sound.warHammerSound = createHowl(
        "res/SFX/attacks/warhammer.mp3",
        1,
        false,
        3,
      );
      Sound.healSound = createHowl("res/SFX/items/powerup1.mp3", 0.5, false, 1);
      Sound.eatSounds = createHowlArray("res/SFX/items/eat", [1, 2], 1.0, 5);
      // Footstep sounds
      Sound.playerStoneFootsteps = createHowlArray(
        "res/SFX/footsteps/stone/footstep",
        [1, 2, 3],
        1.0,
        4,
      );
      Sound.playerGrassFootsteps = createHowlArray(
        "res/SFX/footsteps/grass/footstep",
        [1, 2, 3, 6],
        1.0,
        4,
      );
      Sound.playerDirtFootsteps = createHowlArray(
        "res/SFX/footsteps/dirt/footstep",
        [1, 2, 3, 4, 5],
        1.0,
        4,
      );
      Sound.enemyFootsteps = createHowlArray(
        "res/SFX/footsteps/enemy/enemyfootstep",
        [1, 2, 3, 4, 5],
        1.0,
        4,
      );

      // Combat sounds
      Sound.swingSounds = createHowlArray(
        "res/SFX/attacks/swing",
        [1, 2, 3, 4],
        0.5,
        6,
      );
      Sound.hitSounds = createHowlArray(
        "res/SFX/attacks/hurt",
        [1, 2, 3, 4],
        0.5,
        4,
      );
      Sound.hurtSounds = [createHowl("res/SFX/attacks/hit.mp3", 0.3, false, 0)];
      Sound.sliceSound = createHowlArray(
        "res/SFX/attacks/slice",
        [1, 2, 3],
        0.5,
        4,
      );
      Sound.shortSliceSound = createHowlArray(
        "res/SFX/attacks/sliceShort",
        [1, 2, 3],
        0.5,
        4,
      );
      Sound.parrySounds = createHowlArray(
        "res/SFX/attacks/parry",
        [1, 2],
        0.5,
        3,
      );
      Sound.gruntSounds = createHowlArray(
        "res/SFX/attacks/grunt",
        [1],
        0.35,
        1,
      );

      // Single sounds
      Sound.enemySpawnSound = createHowl(
        "res/SFX/attacks/enemyspawn.mp3",
        0.7,
        false,
        3,
      );
      Sound.wooshSound = createHowl(
        "res/SFX/attacks/woosh1.mp3",
        0.2,
        false,
        3,
      );

      // Interaction sounds
      Sound.chestSounds = createHowlArray(
        "res/SFX/chest/chest",
        [1, 2, 3],
        0.5,
        3,
      );
      Sound.coinPickupSounds = createHowlArray(
        "res/SFX/items/coins",
        [1, 2, 3, 4],
        1.0,
        5,
      );
      Sound.genericPickupSound = createHowl(
        "res/SFX/items/pickup.mp3",
        0.8,
        false,
        3,
      );
      Sound.keyPickupSound = createHowl(
        "res/SFX/items/keyPickup.mp3",
        1.0,
        false,
        2,
      );
      Sound.backpackSound = createHowl(
        "res/SFX/items/backpack.mp3",
        0.75,
        false,
        2,
      );
      Sound.smithSound = createHowl("res/SFX/items/smith.mp3", 0.5, false, 2);
      Sound.lockedSound = createHowl(
        "res/SFX/door/locked1.mp3",
        0.75,
        false,
        2,
      );
      Sound.woodSound = createHowl(
        "res/SFX/objects/woodHit1.mp3",
        1.25,
        false,
        2,
      );
      // Mining sounds
      Sound.miningSounds = createHowlArray(
        "res/SFX/resources/Pickaxe",
        [1, 2, 3, 4],
        0.3,
        3,
      );
      Sound.breakRockSound = createHowl(
        "res/SFX/resources/rockbreak.mp3",
        1.0,
        false,
        2,
      );

      // Door sounds
      Sound.unlockSounds = createHowlArray("res/SFX/door/unlock", [1], 0.5, 2);
      Sound.doorOpenSounds = createHowlArray(
        "res/SFX/door/open",
        [1, 2],
        0.5,
        3,
      );

      // Object sounds
      Sound.potSmashSounds = createHowlArray(
        "res/SFX/objects/potSmash",
        [1, 2, 3],
        0.5,
        3,
      );
      Sound.bushSounds = createHowlArray(
        "res/SFX/objects/plantHit",
        [1, 2],
        0.75,
        3,
      );
      Sound.pushSounds = createHowlArray(
        "res/SFX/pushing/push",
        [1, 2],
        1.0,
        3,
      );

      // Bomb sounds
      Sound.bombSounds = createHowlArray(
        "res/SFX/attacks/explode",
        [1, 2],
        0.7,
        3,
      );
      Sound.fuseBurnSound = createHowl(
        "res/SFX/attacks/fuse.mp3",
        0.2,
        false,
        2,
      );
      Sound.fuseLoopSound = createHowl(
        "res/SFX/attacks/fuseLoop.mp3",
        0.2,
        true,
        1,
      );
      Sound.fuseStartSound = createHowl(
        "res/SFX/attacks/fuseStart.mp3",
        0.2,
        false,
        2,
      );

      // Ambient sounds - critical for mobile
      Sound.forestMusic = createHowl("res/music/forest1.mp3", 0.25, true, 1);
      Sound.caveMusic = createHowl("res/music/cave1.mp3", 0.25, true, 1);
      Sound.graveSound = createHowl(
        "res/SFX/attacks/skelespawn.mp3",
        1.0,
        false,
        2,
      );
      Sound.ambientSound = createHowl(
        "res/SFX/ambient/ambientDark2.mp3",
        0.3,
        true,
        1,
      ); // Reduced volume
      Sound.goreSound = createHowl(
        "res/SFX/misc Unused/gore2.mp3",
        0.5,
        false,
        2,
      );

      console.log("All sounds loaded successfully");
    } catch (error) {
      console.error("Error loading sounds:", error);
    }
  };

  static playWithReverb(
    sound: Howl,
    priority: number = Sound.PRIORITY.INTERACTIONS,
  ): number | null {
    if (Sound.audioMuted) return null;

    try {
      // Simple volume-based priority system
      if (
        Sound.currentlyPlaying.size > 10 &&
        priority < Sound.PRIORITY.COMBAT
      ) {
        return null;
      }

      let soundId: number | null = null;

      // Always try to use reverb if available and not on mobile
      if (ReverbEngine.initialized && !Sound.isMobile) {
        soundId = ReverbEngine.applyReverb(sound);
      } else {
        soundId = sound.play();
      }

      if (soundId) {
        Sound.currentlyPlaying.add(soundId);

        // Clean up tracking
        sound.once("end", () => {
          Sound.currentlyPlaying.delete(soundId);
        });

        // Fallback cleanup
        setTimeout(() => {
          Sound.currentlyPlaying.delete(soundId);
        }, 5000);
      }

      return soundId;
    } catch (error) {
      console.error("Error playing sound:", error);
      return null;
    }
  }

  static playerStoneFootstep = (environment: number) => {
    if (Sound.audioMuted) return;
    let sound = Sound.playerStoneFootsteps;
    if (environment === 2) sound = Sound.playerGrassFootsteps;
    if (environment === 1) sound = Sound.playerDirtFootsteps;

    let f = Game.randTable(sound, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.FOOTSTEPS);
  };

  static enemyFootstep = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.enemyFootsteps, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.FOOTSTEPS);
  };

  static swing = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.swingSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.COMBAT);
  };

  static hit = (hard: boolean = false) => {
    if (Sound.audioMuted) return;

    let sounds = Sound.hitSounds.slice(hard ? 2 : 0, hard ? 3 : 2);

    setTimeout(() => {
      let f = Game.randTable(sounds, Math.random);
      this.playWithReverb(f, Sound.PRIORITY.COMBAT);
    }, 100);
  };

  static hurt = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.hurtSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.CRITICAL);
  };

  static enemySpawn = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.enemySpawnSound, Sound.PRIORITY.CRITICAL);
  };

  static chest = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.chestSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static potSmash = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.potSmashSounds, Math.random);
    this.delayPlay(
      () => this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS),
      100,
    );
  };

  static pickupCoin = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.coinPickupSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static mine = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.miningSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static breakRock = () => {
    if (Sound.audioMuted) return;
    setTimeout(() => {
      this.playWithReverb(Sound.breakRockSound, Sound.PRIORITY.INTERACTIONS);
    }, 100);
  };

  static heal = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.healSound, Sound.PRIORITY.CRITICAL);
  };

  static genericPickup = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.genericPickupSound, Sound.PRIORITY.INTERACTIONS);
  };

  static keyPickup = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.keyPickupSound, Sound.PRIORITY.INTERACTIONS);
  };

  static push = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.pushSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static skeleSpawn = () => {
    if (Sound.audioMuted) return;
    // IMPORTANT: Original implementation set volume to 0.3 in this method
    Sound.graveSound.volume(0.3);
    this.playWithReverb(Sound.graveSound, Sound.PRIORITY.CRITICAL);
  };

  static unlock = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.unlockSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static playCaveMusic = (index: number = 0) => {
    if (Sound.audioMuted) return;

    try {
      // Stop any existing forest music
      if (Sound.caveMusicId) {
        Sound.caveMusic.stop(Sound.caveMusicId);
      }

      // Play new instance
      Sound.caveMusicId = Sound.caveMusic.play();

      // Handle mobile audio context
      if (Sound.isMobile && !Sound.audioContextResumed) {
        Sound.enableAudioForMobile();
      }
    } catch (error) {
      console.error("Error playing cave music:", error);
    }
  };

  static playForestMusic = (index: number = 0) => {
    if (Sound.audioMuted) return;

    try {
      // Stop any existing forest music
      if (Sound.forestMusicId) {
        Sound.forestMusic.stop(Sound.forestMusicId);
      }

      // Play new instance
      Sound.forestMusicId = Sound.forestMusic.play();

      // Handle mobile audio context
      if (Sound.isMobile && !Sound.audioContextResumed) {
        Sound.enableAudioForMobile();
      }
    } catch (error) {
      console.error("Error playing forest music:", error);
    }
  };

  static doorOpen = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.doorOpenSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static playAmbient = () => {
    if (Sound.audioMuted) return;

    try {
      // Only play if not already playing
      if (
        !Sound.ambientSoundId ||
        !Sound.ambientSound.playing(Sound.ambientSoundId)
      ) {
        Sound.ambientSoundId = Sound.ambientSound.play();
      }
    } catch (error) {
      console.error("Error playing ambient sound:", error);
    }
  };

  static stopAmbient = () => {
    if (Sound.ambientSoundId) {
      Sound.ambientSound.stop(Sound.ambientSoundId);
      Sound.ambientSoundId = null;
    }
  };

  static playFuse = () => {
    if (Sound.audioMuted) return;

    Sound.fuseStartSound.play();

    Sound.fuseStartSound.once("end", () => {
      Sound.fuseLoopSound.play();
    });
  };

  static stopFuse = () => {
    Sound.fuseLoopSound.stop();
    Sound.fuseStartSound.stop();
  };

  static playGore = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.goreSound, Sound.PRIORITY.COMBAT);
  };

  static playBomb = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.bombSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.CRITICAL);
  };

  static playWarHammer = () => {
    if (Sound.audioMuted) return;
    this.delayPlay(() => {
      this.playWithReverb(Sound.hitSounds[2], Sound.PRIORITY.COMBAT);
    }, 200);
  };

  static playMagic = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.magicSound, Sound.PRIORITY.COMBAT);
    this.playWithReverb(Sound.wooshSound, Sound.PRIORITY.COMBAT);
  };

  static playSlice = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.sliceSound, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.COMBAT);
  };

  static playShortSlice = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.shortSliceSound, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.COMBAT);
  };

  static playBackpack = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.backpackSound, Sound.PRIORITY.INTERACTIONS);
  };

  static playSmith = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.smithSound, Sound.PRIORITY.INTERACTIONS);
  };

  static playBush = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.bushSounds, Math.random);
    this.delayPlay(
      () => this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS),
      100,
    );
  };

  static playParry = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.parrySounds, Math.random);
    this.delayPlay(() => this.playWithReverb(f, Sound.PRIORITY.CRITICAL), 100);
  };

  static playEat = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.eatSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static playGrunt = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.gruntSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.COMBAT);
  };

  static playLocked = () => {
    if (Sound.audioMuted) return;
    this.playWithReverb(Sound.lockedSound, Sound.PRIORITY.INTERACTIONS);
  };

  static playWood = () => {
    if (Sound.audioMuted) return;
    this.delayPlay(() => {
      this.playWithReverb(Sound.woodSound, Sound.PRIORITY.INTERACTIONS);
    }, 150);
  };

  static delayPlay = (method: () => void, delay: number) => {
    setTimeout(method, delay);
  };

  static stopSound(sound: Howl) {
    sound.stop();
  }

  static stopSoundWithReverb(sound: Howl) {
    ReverbEngine.removeReverb(sound);
    this.stopSound(sound);
  }

  static cleanup() {
    Sound.currentlyPlaying.clear();
    Howler.unload();
  }
}
