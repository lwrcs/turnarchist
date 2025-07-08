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

  static currentlyPlaying: Set<number> = new Set();

  static readonly PRIORITY = {
    AMBIENT: 1,
    FOOTSTEPS: 2,
    INTERACTIONS: 3,
    COMBAT: 4,
    CRITICAL: 5,
  };

  static toggleMute() {
    Sound.audioMuted = !Sound.audioMuted;
    if (Sound.audioMuted) {
      Howler.mute(true);
    } else {
      Howler.mute(false);
    }
  }

  static loadSounds = async () => {
    if (Sound.initialized) return;
    Sound.initialized = true;
    if (ReverbEngine.initialized) Sound.audioMuted = false;

    const createHowlArray = (
      basePath: string,
      indices: number[],
      volume: number = 1.0,
      maxConcurrent: number = 3,
    ): Array<Howl> => {
      return indices.map((i) => {
        const howl = new Howl({
          src: [`${basePath}${i}.mp3`],
          volume: volume,
          preload: true,
          html5: false,
          pool: maxConcurrent,
        });

        // DEBUG: Check if volume was set correctly
        console.log(
          `Created ${basePath}${i}.mp3 with volume:`,
          volume,
          "actual volume:",
          howl.volume(),
        );
        return howl;
      });
    };

    const createHowl = (
      src: string,
      volume: number = 1.0,
      loop: boolean = false,
      maxConcurrent: number = 2,
    ): Howl => {
      const howl = new Howl({
        src: [src],
        volume: volume,
        preload: true,
        loop: loop,
        html5: false,
        pool: maxConcurrent,
      });

      // DEBUG: Check if volume was set correctly
      console.log(
        `Created ${src} with volume:`,
        volume,
        "actual volume:",
        howl.volume(),
      );
      return howl;
    };

    try {
      // Test with a few sounds first
      console.log("=== DEBUGGING VOLUME SETTINGS ===");

      Sound.magicSound = createHowl(
        "res/SFX/attacks/magic2.mp3",
        0.25,
        false,
        2,
      );
      Sound.warHammerSound = createHowl(
        "res/SFX/attacks/warhammer.mp3",
        1,
        false,
        2,
      );
      Sound.healSound = createHowl("res/SFX/items/powerup1.mp3", 0.5, false, 1);

      // Let's also try setting volume AFTER creation
      console.log("=== TESTING POST-CREATION VOLUME SETTING ===");
      Sound.magicSound.volume(0.25);
      Sound.warHammerSound.volume(1);
      Sound.healSound.volume(0.5);

      console.log("After manual setting - Magic:", Sound.magicSound.volume());
      console.log(
        "After manual setting - WarHammer:",
        Sound.warHammerSound.volume(),
      );
      console.log("After manual setting - Heal:", Sound.healSound.volume());

      // EXACT ORIGINAL VOLUMES - Load footstep sounds
      Sound.playerStoneFootsteps = createHowlArray(
        "res/SFX/footsteps/stone/footstep",
        [1, 2, 3],
        1.0,
        2,
      );
      Sound.playerGrassFootsteps = createHowlArray(
        "res/SFX/footsteps/grass/footstep",
        [1, 2, 3, 6],
        1.0,
        2,
      );
      Sound.playerDirtFootsteps = createHowlArray(
        "res/SFX/footsteps/dirt/footstep",
        [1, 2, 3, 4, 5],
        1.0,
        2,
      );
      Sound.enemyFootsteps = createHowlArray(
        "res/SFX/footsteps/enemy/enemyfootstep",
        [1, 2, 3, 4, 5],
        1.0,
        3,
      );

      // EXACT ORIGINAL VOLUMES - Load combat sounds
      Sound.swingSounds = createHowlArray(
        "res/SFX/attacks/swing",
        [1, 2, 3, 4],
        0.5,
        4,
      );
      Sound.hitSounds = createHowlArray("res/SFX/attacks/hurt", [1, 2], 0.5, 3);
      Sound.hurtSounds = [createHowl("res/SFX/attacks/hit.mp3", 0.3, false, 3)]; // Original: 0.3
      Sound.sliceSound = createHowlArray(
        "res/SFX/attacks/slice",
        [1, 2, 3],
        0.5,
        3,
      );
      Sound.shortSliceSound = createHowlArray(
        "res/SFX/attacks/sliceShort",
        [1, 2, 3],
        0.5,
        3,
      );
      Sound.parrySounds = createHowlArray(
        "res/SFX/attacks/parry",
        [1, 2],
        0.5,
        2,
      );

      // EXACT ORIGINAL VOLUMES - Load single sounds
      Sound.enemySpawnSound = createHowl(
        "res/SFX/attacks/enemyspawn.mp3",
        0.7,
        false,
        2,
      );
      Sound.wooshSound = createHowl(
        "res/SFX/attacks/woosh1.mp3",
        0.2,
        false,
        2,
      );

      // EXACT ORIGINAL VOLUMES - Load interaction sounds
      Sound.chestSounds = createHowlArray(
        "res/SFX/chest/chest",
        [1, 2, 3],
        0.5,
        2,
      );
      Sound.coinPickupSounds = createHowlArray(
        "res/SFX/items/coins",
        [1, 2, 3, 4],
        1.0,
        3,
      );
      Sound.genericPickupSound = createHowl(
        "res/SFX/items/pickup.mp3",
        1.0,
        false,
        2,
      );
      Sound.keyPickupSound = createHowl(
        "res/SFX/items/keyPickup.mp3",
        1.0,
        false,
        1,
      );
      Sound.backpackSound = createHowl(
        "res/SFX/items/backpack.mp3",
        0.75,
        false,
        1,
      );
      Sound.smithSound = createHowl("res/SFX/items/smith.mp3", 0.5, false, 1);

      // EXACT ORIGINAL VOLUMES - Load mining sounds
      Sound.miningSounds = createHowlArray(
        "res/SFX/resources/Pickaxe",
        [1, 2, 3, 4],
        0.3,
        2,
      );
      Sound.breakRockSound = createHowl(
        "res/SFX/resources/rockbreak.mp3",
        1.0,
        false,
        1,
      );

      // EXACT ORIGINAL VOLUMES - Load door sounds
      Sound.unlockSounds = createHowlArray("res/SFX/door/unlock", [1], 0.5, 1);
      Sound.doorOpenSounds = createHowlArray(
        "res/SFX/door/open",
        [1, 2],
        0.5,
        2,
      );

      // EXACT ORIGINAL VOLUMES - Load object sounds
      Sound.potSmashSounds = createHowlArray(
        "res/SFX/objects/potSmash",
        [1, 2, 3],
        0.5,
        2,
      );
      Sound.bushSounds = createHowlArray(
        "res/SFX/objects/plantHit",
        [1, 2],
        0.75,
        2,
      );
      Sound.pushSounds = createHowlArray(
        "res/SFX/pushing/push",
        [1, 2],
        1.0,
        2,
      );

      // EXACT ORIGINAL VOLUMES - Load bomb sounds
      Sound.bombSounds = createHowlArray(
        "res/SFX/attacks/explode",
        [1, 2],
        0.7,
        2,
      );
      Sound.fuseBurnSound = createHowl(
        "res/SFX/attacks/fuse.mp3",
        0.2,
        false,
        1,
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
        1,
      );

      // EXACT ORIGINAL VOLUMES - Load ambient sounds
      Sound.forestMusic = createHowl("res/music/forest1.mp3", 0.25, true, 1);
      Sound.graveSound = createHowl(
        "res/SFX/attacks/skelespawn.mp3",
        1.0,
        false,
        1,
      ); // NOTE: Volume set to 0.3 in skeleSpawn method
      Sound.ambientSound = createHowl(
        "res/SFX/ambient/ambientDark2.mp3",
        1.0,
        true,
        1,
      ); // Original: volume = 1 (not 1.0)
      Sound.goreSound = createHowl(
        "res/SFX/misc Unused/gore2.mp3",
        0.5,
        false,
        1,
      );

      console.log("All sounds loaded successfully with original volumes");
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
      if (Sound.currentlyPlaying.size > 8 && priority < Sound.PRIORITY.COMBAT) {
        console.warn("Too many sounds playing, skipping lower priority sound");
        return null;
      }

      const soundId = ReverbEngine.applyReverb(sound);

      if (soundId) {
        Sound.currentlyPlaying.add(soundId);

        sound.once("end", () => {
          Sound.currentlyPlaying.delete(soundId);
        });

        setTimeout(() => {
          Sound.currentlyPlaying.delete(soundId);
        }, 10000);
      }

      return soundId;
    } catch (error) {
      console.error("Error playing sound with reverb:", error);
      return sound.play();
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

  static hit = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.swingSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.COMBAT);

    setTimeout(() => {
      let f = Game.randTable(Sound.hitSounds, Math.random);
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

  static playForestMusic = (index: number = 0) => {
    if (Sound.audioMuted) return;
    if (!Sound.forestMusic.playing()) {
      Sound.forestMusic.play();
    }
  };

  static doorOpen = () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.doorOpenSounds, Math.random);
    this.playWithReverb(f, Sound.PRIORITY.INTERACTIONS);
  };

  static playAmbient = () => {
    if (Sound.audioMuted) return;
    if (!Sound.ambientSound.playing()) {
      Sound.ambientSound.play();
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
    this.playWithReverb(Sound.warHammerSound, Sound.PRIORITY.COMBAT);
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
