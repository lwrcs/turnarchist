import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import type { Player } from "../player/player";
import type { Room } from "../room/room";
import { Particle } from "./particle";

export class FloatingTextPopup extends Particle {
  room: Room;
  x: number;
  y: number;
  worldZ: number;

  private readonly anchor: Player;
  private readonly text: string;
  private readonly color: string;
  private readonly outlineColor: string;

  private frame: number = 0;
  private alpha: number = 1;
  private riseTiles: number = 0;

  private static readonly HEAD_OFFSET_TILES = 1.0;
  private static readonly RISE_TILES_PER_FRAME = 0.015;
  // Fade later + more slowly so the popup rises higher before disappearing.
  private static readonly FADE_START_FRAME = 32;
  private static readonly FADE_PER_FRAME = 0.008;

  constructor(args: {
    room: Room;
    anchor: Player;
    text: string;
    color?: string;
    outlineColor?: string;
  }) {
    super();
    this.room = args.room;
    this.anchor = args.anchor;
    this.text = args.text;
    this.color = args.color ?? "yellow";
    this.outlineColor = args.outlineColor ?? GameConstants.OUTLINE;

    // Initialize for culling/shading.
    this.x = this.anchor.x;
    this.y = this.anchor.y;
    this.worldZ = this.anchor.z ?? 0;
    this.dead = false;
  }

  drawTopLayer = (delta: number) => {
    if (this.dead) return;

    // Keep anchored to the player (and on the same z-layer).
    this.x = this.anchor.x;
    this.y = this.anchor.y;
    this.worldZ = this.anchor.z ?? 0;

    this.frame += delta;
    this.riseTiles += FloatingTextPopup.RISE_TILES_PER_FRAME * delta;

    if (this.frame > FloatingTextPopup.FADE_START_FRAME) {
      this.alpha -= FloatingTextPopup.FADE_PER_FRAME * delta;
    }
    if (this.alpha <= 0.01) {
      this.alpha = 0;
      this.dead = true;
      return;
    }

    // Draw centered above the player's head, following drawX/drawY for smooth motion.
    const drawX = this.anchor.drawX ?? 0;
    const drawY = this.anchor.drawY ?? 0;
    const px = (this.anchor.x - drawX + 0.5) * GameConstants.TILESIZE;
    const py =
      (this.anchor.y -
        drawY -
        FloatingTextPopup.HEAD_OFFSET_TILES -
        this.riseTiles) *
      GameConstants.TILESIZE;

    const w = Game.measureText(this.text).width;

    Game.ctx.save();
    Game.ctx.globalAlpha *= this.alpha;
    Game.fillTextOutline(
      this.text,
      Math.round(px - w / 2),
      Math.round(py),
      this.outlineColor,
      this.color,
    );
    Game.ctx.restore();
  };
}


