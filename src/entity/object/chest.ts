import { Game } from "../../game";
import { Room } from "../../room/room";
import { Entity } from "../entity";
import { Coin } from "../../item/coin";
import { EntityType } from "../entity";
import { Random } from "../../utility/random";
import { Player } from "../../player/player";
import { ChestLayer } from "./chestLayer";
import { ImageParticle } from "../../particle/imageParticle";
import { Sound } from "../../sound/sound";

export class Chest extends Entity {
  static examineText = "A chest. Open it for loot.";
  frame: number;
  opening: boolean;
  dropX: number;
  dropY: number;
  layer: ChestLayer;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.tileX = 4;
    this.tileY = 0;
    this.health = 3;
    this.name = "chest";
    this.frame = 0;
    this.opening = false;
    this.dropX = 0;
    this.dropY = 0;
    this.drop = null;
    this.destroyable = false;
    this.pushable = false;
    this.chainPushable = false;
    this.interactable = true;
    this.imageParticleX = 3;
    this.imageParticleY = 26;
    /*
    this.layer = new ChestLayer(
      this.room,
      this.game,
      this.x,
      this.y,
    );
    this.room.entities.push(this.layer);
    */
  }

  get type() {
    return EntityType.CHEST;
  }

  interact = (playerHitBy: Player) => {
    if (this.health === 3 && !this.opening) {
      this.health -= 1;
      this.open();
      return;
    }

    if (this.health !== 2) return;

    // Try to pick up items
    const pickedUpDrop = this.drops.find((drop) => {
      drop.onPickup(playerHitBy);
      return drop.pickedUp;
    });

    if (pickedUpDrop) {
      this.drops = this.drops.filter((d) => d !== pickedUpDrop);
    }

    const full = playerHitBy.inventory.isFull();
    if (full) {
      this.health -= 1;
      this.destroyable = true;
      return;
    }

    // Drops can become "gone" without being marked pickedUp (e.g. Coin.onDrop merges stacks
    // and removes other Coin instances from room.items). Prune stale drop references so
    // emptiness reflects what's actually on the ground.
    this.pruneDrops();

    // If all drops are gone, immediately transition to destroyable state.
    this.refreshEmptyState();
  };
  uniqueKillBehavior = () => {
    if (this.cloned) return;
    if (this.health === 3) {
      this.open();
    }
  };

  private open = () => {
    this.tileX = 0;
    this.tileY = 2;

    this.opening = true;
    Sound.chest();

    if (this.drop === null)
      this.getDrop(
        ["consumable", "gem", "coin", "tool", "light", "weapon", "shield"],
        true,
      );

    this.drops.forEach((drop) => {
      if (drop.name === "coin") {
        let stack = Game.randTable(
          [
            1, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6,
            6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 10, 10, 11, 12, 13, 14, 15,
            100,
          ],
          Random.rand,
        );
        if (Random.rand() < 0.01) stack *= Math.ceil(Random.rand() * 10);
        drop.stackCount = stack;
        //drop.stack = stack;
      }
    });
    this.dropLoot();
    this.pruneDrops();
    this.drops.forEach((drop) => {
      drop.animateFromChest();
      if (drop instanceof Coin) {
        drop.queueAutoPickupAfterChestReveal();
      }
    });
  };

  tick = () => {
    // Chests can become empty without another explicit interact (e.g. coin auto-pickup after reveal),
    // so continuously prune picked-up drops and update destroyable state.
    if (this.health !== 2) return;
    this.pruneDrops();
    this.refreshEmptyState();
  };

  private pruneDrops = () => {
    if (!this.drops || this.drops.length === 0) return;
    // Keep only drops that still exist in the room and haven't been picked up.
    this.drops = this.drops.filter(
      (d) => !d.pickedUp && this.room.items.includes(d),
    );
  };

  private refreshEmptyState = () => {
    // When a chest is open (health===2), and there are no unpicked drops left,
    // flip it to the "destroyable" phase immediately (matching prior interact logic).
    if (this.health !== 2) return;
    if (this.destroyable) return;
    if (this.drops.length > 0) return;
    this.health -= 1;
    this.destroyable = true;
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    // The chest can become empty outside of turn-ticks (e.g. coin auto-pickup happens on a timer).
    // Since `tick()` only runs during computer turns, also refresh emptiness during rendering so
    // the chest becomes destroyable immediately when the last drop is picked up.
    if (this.health === 2) {
      this.pruneDrops();
      this.refreshEmptyState();
    }

    if (this.opening) {
      if (this.tileX <= 6) {
        this.tileX += 0.15 * delta;
      } else {
        this.opening = false;
      }
    }

    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.hasShadow) this.drawShadow(delta);

      Game.drawObj(
        Math.floor(this.tileX),
        Math.floor(this.tileY),
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y - 1;
  };
}
