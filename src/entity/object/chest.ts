import { Game } from "../../game";
import { Room } from "../../room/room";
import { Entity } from "../entity";
import { EntityType } from "../entity";
import { Random } from "../../utility/random";
import { Player } from "../../player/player";
import { ChestLayer } from "./chestLayer";
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

  // Action-driven interaction. No wall-clock / render-frame timing affects state
  // transitions:
  //   hit 1 (health=3): open the chest. Auto-pickup-eligible drops are logically
  //                     picked up immediately; their reveal+fly visuals continue.
  //   hit 2 (health=2): try to pick up remaining drops.
  //                     - If at least one pickup succeeds → destroyable (h=1),
  //                       hit 3 will break the chest.
  //                     - If nothing was picked up (chest already empty, or
  //                       inventory full so none fit) → fall through and break
  //                       the chest in the same hit. Any items that couldn't fit
  //                       remain on the ground.
  //   hit 3 (health=1): destroy the chest.
  interact = (playerHitBy: Player) => {
    this.playHitFeedback(playerHitBy);

    if (this.health === 3) {
      this.health = 2;
      this.open(playerHitBy);
      return;
    }

    if (this.health === 2) {
      // Snap the open-animation to its final frame so visuals are deterministic
      // — pickup must not depend on whether the wall-clock-driven `opening` tween
      // has finished.
      if (this.opening) {
        this.opening = false;
        this.tileX = 6;
        this.tileY = 2;
      }

      // Any autopickup items still mid-reveal start their fly-to-inventory
      // animation NOW, regardless of how the remaining (non-autopickup) pickup
      // attempts below go. E.g. a chest with a potion followed by coins: hit 2
      // tries to pick up the potion, and either way the coins begin flying to
      // the inventory icon at the same hit.
      this.snapPickedUpDropsToInventoryFly();

      const remaining = this.drops.filter(
        (d) => !d.pickedUp && this.room.items.includes(d),
      );

      let pickedUpAny = false;
      for (const drop of remaining) {
        drop.inChest = false;
        drop.onPickup(playerHitBy);
        if (drop.pickedUp) pickedUpAny = true;
      }

      if (!pickedUpAny) {
        // Empty or inventory-full — skip the pickup phase and break now. Any
        // unfit items stay on the ground for the player to deal with later.
        this.destroyNow(playerHitBy);
        return;
      }

      this.health = 1;
      this.destroyable = true;
      return;
    }

    if (this.health === 1) {
      this.destroyNow(playerHitBy);
      return;
    }
  };

  private destroyNow = (playerHitBy: Player) => {
    // Snap any autopickup visuals still mid-reveal so they don't get orphaned
    // when the chest disappears.
    this.snapPickedUpDropsToInventoryFly();
    // Non-picked-up drops still in the room should settle into the same resting
    // hover state they'd reach if the reveal had completed naturally, so they
    // don't continue rising out of nothing after the chest is gone.
    this.snapUnpickedDropsToHover();
    this.createHitParticles();
    this.health = 0;
    this.kill(playerHitBy);
  };

  private snapUnpickedDropsToHover = () => {
    for (const drop of this.drops) {
      if (drop.pickedUp) continue;
      if (!this.room.items.includes(drop)) continue;
      drop.forceCompleteChestReveal();
    }
  };

  private playHitFeedback = (playerHitBy: Player) => {
    // Visual / audio feedback only — does not affect logical state, so safe to
    // run from a recorded action without divergence.
    this.startHurting();
    if (this.room === this.game.room) Sound.hit();
    playerHitBy.shakeScreen(playerHitBy.x, playerHitBy.y, this.x, this.y);
    playerHitBy.hitShake(playerHitBy.x, playerHitBy.y, this.x, this.y);
  };

  private snapPickedUpDropsToInventoryFly = () => {
    for (const drop of this.drops) {
      if (!drop.pickedUp) continue;
      if (!drop.inChest) continue;
      drop.forceBeginFlyToInventory();
    }
  };

  uniqueKillBehavior = () => {
    if (this.cloned) return;
    // If the chest is killed externally while still sealed, reveal its loot so it
    // isn't lost. No player context here, so logical autopickup is skipped.
    if (this.health === 3) {
      this.open(null);
    }
  };

  private open = (player: Player | null) => {
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
      }
    });
    this.dropLoot();
    this.drops.forEach((drop) => {
      // Coin.onDrop merges stacks and removes the orphaned coin from room.items.
      // Skip any drop that's been merged away so we don't double-count its stack
      // through a second onPickup call.
      if (!this.room.items.includes(drop)) return;
      drop.animateFromChest();
      // Auto-pickup-eligible drops are picked up logically *now* so chest state and
      // inventory effects (coin total, XP, etc.) are deterministic w.r.t. the action
      // that opened the chest. The float-up reveal then fly-to-inventory visuals
      // continue running on the item (see Item.draw / drawAboveShading), driven by
      // render delta — but they no longer drive any logical state.
      if (player && drop.animateToInventory) {
        drop.onPickup(player);
      }
    });
  };

  tick = () => {};

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (this.opening) {
      if (this.tileX <= 6) {
        this.tileX += 0.15 * delta;
      } else {
        this.opening = false;
      }
    } else if (this.health < 3) {
      // Chest is open but not animating (e.g. loaded from save where tileX/tileY weren't persisted).
      this.tileX = 6;
      this.tileY = 2;
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
