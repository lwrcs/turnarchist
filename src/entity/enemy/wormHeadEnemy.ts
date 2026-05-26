import { Game } from "../../game";
import { Room } from "../../room/room";
import { Item } from "../../item/item";
import { BeamEffect } from "../../projectile/beamEffect";
import { AbstractSnakeHeadEnemy } from "./abstractSnakeHeadEnemy";

export class WormHeadEnemy extends AbstractSnakeHeadEnemy {
  static difficulty: number = 2;
  static tileX: number = 41;
  static tileY: number = 17;
  static examineText =
    "A bloated earthworm. It burrows diagonally, skirting your guard.";

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y, drop);
    this.name = "worm";
    this.health = 4;
    this.maxHealth = 4;
    this.defaultMaxHealth = 4;
    this.baseDamage = 1;
    this.defaultSegmentCount = 5;

    // Worm moves diagonally only and attacks on diagonal adjacency.
    this.movementMode = "omni";
    this.orthogonalAttack = true;
    this.diagonalAttack = true;

    this.hasStripes = true;
  }

  protected configureBeam(b: BeamEffect): void {
    b.color = "#d4a85c";
    b.shadowBeamColor = "#c06828";
    b.lineWidth = 6;
    b.tailWidth = 3;
    b.tailTaperStart = 0.8;
    b.headTipWidth = 2;
    b.headNosePx = 8;
    b.headPeakWidth = 9;
    b.headNeckWidth = 4;
    b.headTaperLength = 0.075;
    b.shadowOffsetY = -3;
    b.beamOutlineColor = "#1f2127";
    b.useBrightnessSampling = true;
    b.renderFps = 15;
    b.eyeColor = null;
    b.showStripes = true;
    b.disableSimulation = true;
  }
}
