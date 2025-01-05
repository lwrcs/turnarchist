import { Game } from "./game";
import { ReverbEngine } from "./reverb";

export class Sound {
  static playerStoneFootsteps: Array<HTMLAudioElement>;
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
  static music: HTMLAudioElement;
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
  static audioMuted: boolean = false;
  static bombSounds: Array<HTMLAudioElement>;
  static fuseBurnSound: HTMLAudioElement;
  static loopHandlers: Map<HTMLAudioElement, EventListener> = new Map();
  static loadSounds = async () => {
    if (Sound.initialized) return;
    Sound.initialized = true;
    Sound.playerStoneFootsteps = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.playerStoneFootsteps.push(
        new Audio("res/SFX/footsteps/stone/footstep" + i + ".mp3"),
      ),
    );
    for (let f of Sound.playerStoneFootsteps) f.volume = 1.0;

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

    Sound.music = new Audio("res/bewitched.mp3");
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
    ReverbEngine.applyReverb(audio);
    this.playSoundSafely(audio);
  }

  static playerStoneFootstep = async () => {
    if (Sound.audioMuted) return;
    let f = Game.randTable(Sound.playerStoneFootsteps, Math.random);
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
    this.playWithReverb(f);
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

  static playMusic = () => {
    if (Sound.audioMuted) return;
    /*
    Sound.music.addEventListener(
      "ended",
      () => {
        Sound.music.currentTime = 0;
        Sound.playSoundSafely(Sound.music);
      },
      false
    );
    Sound.playSoundSafely(Sound.music);
    */
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
    Sound.fuseBurnSound.currentTime = 0;
    this.playWithReverb(Sound.fuseBurnSound);
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

  static playMagic = () => {
    if (Sound.audioMuted) return;
    let f = Sound.magicSound;
    let woosh = Sound.wooshSound;
    this.playWithReverb(f);
    this.playWithReverb(woosh);
    f.currentTime = 0;
    woosh.currentTime = 0;
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
