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

  static loadSounds = async () => {
    if (Sound.initialized) return;
    Sound.initialized = true;
    if (ReverbEngine.initialized) Sound.audioMuted = false;
    Sound.playerStoneFootsteps = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.playerStoneFootsteps.push(
        new Audio("res/SFX/footsteps/stone/footstep" + i + ".mp3"),
      ),
    );
    for (let f of Sound.playerStoneFootsteps) f.volume = 1.0;

    Sound.playerGrassFootsteps = new Array<HTMLAudioElement>();
    [1, 2, 3, 6].forEach((i) =>
      Sound.playerGrassFootsteps.push(
        new Audio("res/SFX/footsteps/grass/footstep" + i + ".mp3"),
      ),
    );
    for (let f of Sound.playerGrassFootsteps) f.volume = 1.0;

    Sound.playerDirtFootsteps = new Array<HTMLAudioElement>();
    [1, 2, 3, 4, 5].forEach((i) =>
      Sound.playerDirtFootsteps.push(
        new Audio("res/SFX/footsteps/dirt/footstep" + i + ".mp3"),
      ),
    );
    for (let f of Sound.playerDirtFootsteps) f.volume = 1.0;

    Sound.enemyFootsteps = new Array<HTMLAudioElement>();
    [1, 2, 3, 4, 5].forEach((i) =>
      Sound.enemyFootsteps.push(
        new Audio("res/SFX/footsteps/enemy/enemyfootstep" + i + ".mp3"),
      ),
    );
    for (let f of Sound.enemyFootsteps) f.volume = 1.0;

    Sound.swingSounds = new Array<HTMLAudioElement>();
    [1, 2, 3, 4].forEach((i) =>
      Sound.swingSounds.push(new Audio("res/SFX/attacks/swing" + i + ".mp3")),
    );
    for (let f of Sound.swingSounds) {
      (f.volume = 0.5), f.load;
      //f.play();
    }

    Sound.hitSounds = new Array<HTMLAudioElement>();
    [1, 2].forEach((i) =>
      Sound.hitSounds.push(new Audio("res/SFX/attacks/hurt" + i + ".mp3")),
    );
    for (let f of Sound.hitSounds) {
      (f.volume = 0.5), f.load;
      //f.play();
    }
    Sound.enemySpawnSound = new Audio("res/SFX/attacks/enemyspawn.mp3");
    Sound.enemySpawnSound.volume = 0.7;

    Sound.chestSounds = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.chestSounds.push(new Audio("res/SFX/chest/chest" + i + ".mp3")),
    );
    for (let f of Sound.chestSounds) f.volume = 0.5;

    Sound.coinPickupSounds = new Array<HTMLAudioElement>();
    [1, 2, 3, 4].forEach((i) =>
      Sound.coinPickupSounds.push(
        new Audio("res/SFX/items/coins" + i + ".mp3"),
      ),
    );
    for (let f of Sound.coinPickupSounds) f.volume = 1.0;

    Sound.miningSounds = new Array<HTMLAudioElement>();
    [1, 2, 3, 4].forEach((i) =>
      Sound.miningSounds.push(
        new Audio("res/SFX/resources/Pickaxe" + i + ".mp3"),
      ),
    );
    for (let f of Sound.miningSounds) f.volume = 0.3;

    Sound.hurtSounds = new Array<HTMLAudioElement>();
    [1].forEach((i) =>
      Sound.hurtSounds.push(new Audio("res/SFX/attacks/hit.mp3")),
    );
    for (let f of Sound.hurtSounds) f.volume = 0.3;

    Sound.genericPickupSound = new Audio("res/SFX/items/pickup.mp3");
    Sound.genericPickupSound.volume = 1.0;

    Sound.breakRockSound = new Audio("res/SFX/resources/rockbreak.mp3");
    Sound.breakRockSound.volume = 1.0;

    Sound.pushSounds = new Array<HTMLAudioElement>();
    [1, 2].forEach((i) =>
      Sound.pushSounds.push(new Audio("res/SFX/pushing/push" + i + ".mp3")),
    );
    for (let f of Sound.pushSounds) f.volume = 1.0;

    Sound.healSound = new Audio("res/SFX/items/powerup1.mp3");
    Sound.healSound.volume = 0.5;

    Sound.forestMusic = new Array<HTMLAudioElement>();
    [1].forEach((i) =>
      Sound.forestMusic.push(new Audio("res/music/forest" + i + ".mp3")),
    );
    for (let f of Sound.forestMusic) f.volume = 0.25;

    Sound.graveSound = new Audio("res/SFX/attacks/skelespawn.mp3");
    Sound.ambientSound = new Audio("res/SFX/ambient/ambientDark2.mp3");
    Sound.ambientSound.volume = 1;

    Sound.goreSound = new Audio(`res/SFX/misc Unused/gore2.mp3`);
    Sound.goreSound.volume = 0.5;

    Sound.unlockSounds = new Array<HTMLAudioElement>();
    [1].forEach((i) =>
      Sound.unlockSounds.push(new Audio("res/SFX/door/unlock" + i + ".mp3")),
    );
    for (let f of Sound.unlockSounds) f.volume = 0.5;

    Sound.doorOpenSounds = new Array<HTMLAudioElement>();
    [1, 2].forEach((i) =>
      Sound.doorOpenSounds.push(new Audio("res/SFX/door/open" + i + ".mp3")),
    );
    for (let f of Sound.doorOpenSounds) f.volume = 0.5;

    Sound.keyPickupSound = new Audio("res/SFX/items/keyPickup.mp3");
    Sound.keyPickupSound.volume = 1.0;

    Sound.potSmashSounds = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.potSmashSounds.push(
        new Audio("res/SFX/objects/potSmash" + i + ".mp3"),
      ),
    );
    for (let f of Sound.potSmashSounds) f.volume = 0.5;

    Sound.magicSound = new Audio("res/SFX/attacks/magic2.mp3");
    Sound.magicSound.volume = 0.25;

    Sound.wooshSound = new Audio("res/SFX/attacks/woosh1.mp3");
    Sound.wooshSound.volume = 0.2;

    Sound.bombSounds = new Array<HTMLAudioElement>();
    [1, 2].forEach((i) =>
      Sound.bombSounds.push(new Audio("res/SFX/attacks/explode" + i + ".mp3")),
    );
    for (let f of Sound.bombSounds) f.volume = 0.7;

    Sound.fuseBurnSound = new Audio("res/SFX/attacks/fuse.mp3");
    Sound.fuseBurnSound.volume = 0.2;

    Sound.fuseLoopSound = new Audio("res/SFX/attacks/fuseLoop.mp3");
    Sound.fuseLoopSound.volume = 0.2;

    Sound.fuseStartSound = new Audio("res/SFX/attacks/fuseStart.mp3");
    Sound.fuseStartSound.volume = 0.2;

    Sound.warHammerSound = new Audio("res/SFX/attacks/warhammer.mp3");
    Sound.warHammerSound.volume = 1;

    Sound.sliceSound = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.sliceSound.push(new Audio("res/SFX/attacks/slice" + i + ".mp3")),
    );
    for (let f of Sound.sliceSound) f.volume = 0.5;

    Sound.shortSliceSound = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.shortSliceSound.push(
        new Audio("res/SFX/attacks/sliceShort" + i + ".mp3"),
      ),
    );
    for (let f of Sound.shortSliceSound) f.volume = 0.5;

    Sound.backpackSound = new Audio("res/SFX/items/backpack.mp3");
    Sound.backpackSound.volume = 0.75;

    Sound.smithSound = new Audio("res/SFX/items/smith.mp3");
    Sound.smithSound.volume = 0.5;

    Sound.bushSounds = new Array<HTMLAudioElement>();
    [1, 2].forEach((i) =>
      Sound.bushSounds.push(new Audio("res/SFX/objects/plantHit" + i + ".mp3")),
    );
    for (let f of Sound.bushSounds) f.volume = 0.75;

    Sound.parrySounds = new Array<HTMLAudioElement>();
    [1, 2].forEach((i) =>
      Sound.parrySounds.push(new Audio("res/SFX/attacks/parry" + i + ".mp3")),
    );
    for (let f of Sound.parrySounds) f.volume = 0.5;
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

    // Clean up finished sounds before adding new ones
    Sound.currentlyPlaying = Sound.currentlyPlaying.filter(
      (a) => !a.ended && !a.paused,
    );

    Sound.currentlyPlaying.push(audio);

    // Auto-remove when sound ends
    audio.addEventListener(
      "ended",
      () => {
        const index = Sound.currentlyPlaying.indexOf(audio);
        if (index > -1) Sound.currentlyPlaying.splice(index, 1);
      },
      { once: true },
    );

    ReverbEngine.applyReverb(audio);
    this.playSoundSafely(audio);
  }

  static playerStoneFootstep = async (environment: number) => {
    if (Sound.audioMuted) return;
    let sound = Sound.playerStoneFootsteps;
    if (environment === 2) sound = Sound.playerGrassFootsteps;
    if (environment === 1) sound = Sound.playerDirtFootsteps;

    let f = Game.randTable(sound, Math.random);
    f.currentTime = 0; // Set BEFORE playback
    await this.playWithReverb(f); // Only play once
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
    f.currentTime = 0; // Move BEFORE playWithReverb
    this.playWithReverb(f);
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

      music.addEventListener(
        "ended",
        () => {
          music.currentTime = 0;
          Sound.playSoundSafely(music);
        },
        { once: true },
      );
    }
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
