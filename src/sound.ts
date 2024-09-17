import { Game } from "./game";

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

  static loadSounds = () => {
    Sound.playerStoneFootsteps = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.playerStoneFootsteps.push(
        new Audio("res/SFX/footsteps/stone/footstep" + i + ".wav")
      )
    );
    for (let f of Sound.playerStoneFootsteps) f.volume = 1.0;

    Sound.enemyFootsteps = new Array<HTMLAudioElement>();
    [1, 2, 3, 4, 5].forEach((i) =>
      Sound.enemyFootsteps.push(
        new Audio("res/SFX/footsteps/enemy/enemyfootstep" + i + ".wav")
      )
    );
    for (let f of Sound.enemyFootsteps) f.volume = 1.0;

    Sound.hitSounds = new Array<HTMLAudioElement>();
    [1, 2, 3, 4].forEach((i) =>
      Sound.hitSounds.push(new Audio("res/SFX/attacks/swing" + i + ".wav"))
    );
    for (let f of Sound.hitSounds) {
      (f.volume = 0), f.load;
      //f.play();
    }
    Sound.enemySpawnSound = new Audio("res/SFX/attacks/enemyspawn.wav");
    Sound.enemySpawnSound.volume = 0.7;

    Sound.chestSounds = new Array<HTMLAudioElement>();
    [1, 2, 3].forEach((i) =>
      Sound.chestSounds.push(new Audio("res/SFX/chest/chest" + i + ".wav"))
    );
    for (let f of Sound.chestSounds) f.volume = 0.5;

    Sound.coinPickupSounds = new Array<HTMLAudioElement>();
    [1, 2, 3, 4].forEach((i) =>
      Sound.coinPickupSounds.push(new Audio("res/SFX/items/coins" + i + ".wav"))
    );
    for (let f of Sound.coinPickupSounds) f.volume = 1.0;

    Sound.miningSounds = new Array<HTMLAudioElement>();
    [1, 2, 3, 4].forEach((i) =>
      Sound.miningSounds.push(
        new Audio("res/SFX/resources/Pickaxe" + i + ".wav")
      )
    );
    for (let f of Sound.miningSounds) f.volume = 0.3;

    Sound.hurtSounds = new Array<HTMLAudioElement>();
    [1].forEach((i) =>
      Sound.hurtSounds.push(new Audio("res/SFX/attacks/hit.wav"))
    );
    for (let f of Sound.hurtSounds) f.volume = 0.3;

    Sound.genericPickupSound = new Audio("res/SFX/items/pickup.wav");
    Sound.genericPickupSound.volume = 1.0;

    Sound.breakRockSound = new Audio("res/SFX/resources/rockbreak.wav");
    Sound.breakRockSound.volume = 1.0;

    Sound.pushSounds = new Array<HTMLAudioElement>();
    [1, 2].forEach((i) =>
      Sound.pushSounds.push(new Audio("res/SFX/pushing/push" + i + ".wav"))
    );
    for (let f of Sound.pushSounds) f.volume = 1.0;

    Sound.healSound = new Audio("res/SFX/items/powerup1.wav");
    Sound.healSound.volume = 0.5;

    Sound.music = new Audio("res/bewitched.mp3");
    Sound.graveSound = new Audio("res/SFX/attacks/skelespawn.wav")
  };

  static playerStoneFootstep = () => {
    let f = Game.randTable(Sound.playerStoneFootsteps, Math.random);
    f.play();
    f.currentTime = 0;
  };

  static enemyFootstep = () => {
    let f = Game.randTable(Sound.enemyFootsteps, Math.random);
    f.play();
    f.currentTime = 0;
  };

  static hit = () => {
    let f = Game.randTable(Sound.hitSounds, Math.random);
    f.play();
    f.currentTime = 0;
    f = Game.randTable(Sound.hurtSounds, Math.random);
    f.volume = 0.5;
    f.play();
    f.currentTime = 0;
    f.volume = 0.4;
  };

  static hurt = () => {
    let f = Game.randTable(Sound.hurtSounds, Math.random);
    f.play();
    f.currentTime = 0;
  };

  static enemySpawn = () => {
    Sound.enemySpawnSound.play();
    Sound.enemySpawnSound.currentTime = 0;
  };

  static chest = () => {
    let f = Game.randTable(Sound.chestSounds, Math.random);
    f.play();
    f.currentTime = 0;
  };

  static pickupCoin = () => {
    let f = Game.randTable(Sound.coinPickupSounds, Math.random);
    f.play();
    f.currentTime = 0;
  };

  static mine = () => {
    let f = Game.randTable(Sound.miningSounds, Math.random);
    f.play();
    f.currentTime = 0;
  };

  static breakRock = () => {
    Sound.breakRockSound.play();
    Sound.breakRockSound.currentTime = 0;
  };

  static heal = () => {
    Sound.healSound.play();
    Sound.healSound.currentTime = 0;
  };

  static genericPickup = () => {
    Sound.genericPickupSound.play();
    Sound.genericPickupSound.currentTime = 0;
  };

  static push = () => {
    let f = Game.randTable(Sound.pushSounds, Math.random);
    f.play();
    f.currentTime = 0;
  };

  static skeleSpawn = () => {
    Sound.graveSound.play();
    Sound.graveSound.currentTime = 0;
    Sound.graveSound.volume = 0.3;
  };

  static playMusic = () => {
    Sound.music.addEventListener(
      "ended",
      () => {
        Sound.music.currentTime = 0;
        Sound.music.play();
      },
      false
    );
    //Sound.music.play();
  };
}
