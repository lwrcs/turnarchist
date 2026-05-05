import { Room } from "../room/room";
import { Sound } from "../sound/sound";
import { Player } from "../player/player";
import { Usable } from "./usable/usable";
import { Game } from "../game";
import { Shadow } from "../drawable/shadow";
import { DownLadder } from "../tile/downLadder";
import { UpLadder } from "../tile/upLadder";
import { DoorType } from "../tile/door";
import { getKeyColorForId } from "../utility/keyColor";

export class Key extends Usable {
  static itemName = "key";
  static examineText = "A key. It probably fits one lock.";
  doorID: number;
  depth: number | null;
  room: Room;
  showPath: boolean;
  animateFrame: number;
  /** Optional callback invoked after a successful pickup (key already in inventory). */
  onPickupCallback?: (player: Player) => void;
  /** GID of the UpLadder this key auto-unlocks on pickup (castle exit room rope). */
  linkedRopeGid?: string;
  private _cachedColorId: number;
  private _cachedColorName: string;
  private _cachedColorHex: string;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 0;
    this.tileY = 4;
    this.name = "key";
    this.doorID = 0;
    this.depth = null;
    this.room = level;
    this.showPath = false;
    this.animateFrame = 0;
    this._cachedColorId = -1;
    this._cachedColorName = "";
    this._cachedColorHex = "#FFFFFF";
  }

  private syncColor = (): void => {
    if (this._cachedColorId === this.doorID) return;
    this._cachedColorId = this.doorID;
    if (this.doorID > 0) {
      const c = getKeyColorForId(this.doorID);
      this._cachedColorName = c.name;
      this._cachedColorHex = c.hex;
      this.name = `${c.name} key`;
    } else {
      this._cachedColorName = "";
      this._cachedColorHex = "#FFFFFF";
      this.name = "key";
    }
  };

  colorOverlay = () => {
    this.syncColor();
    if (this.doorID > 0) {
      return { color: this._cachedColorHex, opacity: 0.75, desaturate: true };
    }
    return { color: undefined, opacity: 0, desaturate: false };
  };

  private getOutlineOpacity = (): number => {
    // Always outlined; when active, flash.
    const base = 0;
    if (!this.showPath) return base;
    const t = Date.now() / 350;
    const pulse = 0 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2));
    return Math.max(0, Math.min(1, base + pulse));
  };

  private setPathGuideEnabled = (
    player: Player,
    enabled: boolean,
    opts?: { syncNow?: boolean },
  ) => {
    // Preserve "where I was found" for description/debug, but do NOT restrict usage by depth.
    if (this.depth === null) this.depth = player.depth;

    // Only one key may be active; when enabling, disable all other keys across all players.
    if (enabled) {
      for (const p of Object.values(this.room.game.players)) {
        for (const it of p.inventory.items) {
          if (it instanceof Key && it !== this) {
            it.showPath = false;
            // Keep icon stable; active state is shown via outline flash, not a different sprite.
            it.tileX = 1;
            it.tileY = 0;
          }
        }
      }
    }

    this.showPath = enabled;
    // Do NOT swap to the "active" icon frame (it has a baked-in red outline).
    // Active state is communicated via outline opacity flashing.
    this.tileX = 1;
    this.tileY = 0;

    if (opts?.syncNow === true) {
      const playerRoom = player.getRoom?.();
      if (playerRoom) {
        playerRoom.syncKeyPathParticles(this, player);
      }
    }
  };

  getDescription = (): string => {
    //const ID = this.doorID === 0 ? "" : "ID: " + this.doorID.toString();
    this.syncColor();
    const depth = this.depth !== null ? "Depth: " + this.depth.toString() : "";
    const title = this._cachedColorName
      ? `${this._cachedColorName.toUpperCase()} KEY`
      : "KEY";
    return `${title}\nA key. ${depth}`;
  };

  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) {
        this.syncColor();
        this.level.game.pushMessage(
          this._cachedColorName
            ? `You found a ${this._cachedColorName} key!`
            : "You found a key!",
        );
        this.level.game.pushMessage("Path guide enabled. Click key to toggle.");

        Sound.keyPickup();
        if (this.depth === null) this.depth = player.depth;
        console.log(this.depth);

        // Automatically enable the path guide on pickup.
        this.setPathGuideEnabled(player, true, { syncNow: true });

        this.onPickupCallback?.(player);
      }
    }
  };

  onUse = (player: Player) => {
    if (this.depth === null) this.depth = player.depth;

    // Toggle this key, and ensure all other keys are turned off
    const togglingOn = !this.showPath;
    this.setPathGuideEnabled(player, togglingOn, { syncNow: true });

    const message = this.showPath ? "Showing path" : "Path hidden";
    // Pass this key and the player context so only this key's path is considered
    this.room.syncKeyPathParticles(this, player);
    this.room.game.pushMessage(message);
  };

  tickInInventory = () => {
    //this.updatePathToDoor();
  };

  onDrop = () => {
    this.showPath = false;
    // Keep icon stable; active state is shown via outline flash.
    this.tileX = 1;

    const player = this.level?.game?.players?.[this.level.game.localPlayerID];
    const room = player?.getRoom?.() ?? this.level;
    room?.syncKeyPathParticles();
  };

  draw = (delta: number) => {
    this.syncColor();
    Game.ctx.save();
    this.animateFrame += delta / 8;
    if (this.animateFrame >= 8 || this.pickedUp) this.animateFrame = 0;
    if (!this.pickedUp) {
      Game.ctx.globalAlpha = this.alpha;
      if (this.alpha < 1) this.alpha += 0.01 * delta;
      this.drawableY = this.y;
      if (this.inChest) {
        this.chestOffsetY -= Math.abs(this.chestOffsetY + 0.5) * 0.035 * delta;

        if (this.chestOffsetY < -0.47) {
          this.chestOffsetY = -0.5;
        }
      }
      if (this.sineAnimateFactor < 1 && this.chestOffsetY < -0.45)
        this.sineAnimateFactor += 0.2 * delta;
      if (this.scaleFactor > 0) {
        this.scaleFactor *= 0.5 ** delta;
        if (this.scaleFactor < 0.01) this.scaleFactor = 0;
      }
      const scale = 1 / (this.scaleFactor + 1);
      Game.ctx.imageSmoothingEnabled = false;
      Shadow.draw(this.x, this.y, 1, 1);
      //Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
      this.frame += (delta * (Math.PI * 2)) / 60;
      Game.drawItem(
        Math.floor(this.tileX + this.animateFrame),
        this.tileY,
        1,
        2,
        this.x + this.w * (scale * -0.5 + 0.5) + this.drawOffset,
        this.y +
          this.sineAnimateFactor * Math.sin(this.frame) * 0.07 -
          1 +
          this.offsetY +
          this.h * (scale * -0.5 + 0.5) +
          this.chestOffsetY,
        this.w * scale,
        this.h * scale,
        this.level.shadeColor,
        this.shadeAmount(),
        undefined,
        this._cachedColorHex,
        this.getOutlineOpacity(),
        1,
        true,
        this._cachedColorHex,
        0.6,
        true,
      );
    }
    Game.ctx.restore();
  };

  outline = () => {
    this.syncColor();
    return {
      color: this._cachedColorHex,
      opacity: this.getOutlineOpacity(),
      offset: 1,
      manhattan: true,
    };
  };

  updatePathToDoor = (playerCtx?: Player) => {
    try {
      const player =
        playerCtx ?? this.level.game.players[this.level.game.localPlayerID];

      const playerRoom = player?.getRoom?.();
      if (!playerRoom) return;

      if (!this.showPath) {
        playerRoom.keyPathDots = undefined;
        return;
      }

      type Via = { x: number; y: number };
      type PrevEntry = { prev: Room; via: Via };
      type Target = { room: Room; x: number; y: number };

      const findTargetInRoom = (r: Room): Target | null => {
        for (let x = r.roomX; x < r.roomX + r.width; x++) {
          for (let y = r.roomY; y < r.roomY + r.height; y++) {
            const t = r.roomArray[x]?.[y];
            if (t instanceof DownLadder) {
              if (
                t.lockable?.isLocked?.() === true &&
                t.lockable.keyID === this.doorID
              ) {
                return { room: r, x: t.x, y: t.y };
              }
            } else if (t instanceof UpLadder) {
              if (
                t.lockable?.isLocked?.() === true &&
                t.lockable.keyID === this.doorID
              ) {
                return { room: r, x: t.x, y: t.y };
              }
            }
          }
        }
        return null;
      };

      const getNeighbors = (r: Room): Array<{ room: Room; via: Via }> => {
        const out: Array<{ room: Room; via: Via }> = [];

        // Doors within the same level/path graph
        for (const d of r.doors) {
          const nextRoom = d?.linkedDoor?.room;
          if (nextRoom && nextRoom !== r) {
            // Don't route through tunnel doors that are still locked
            if (d.type === DoorType.TUNNELDOOR && d.locked) continue;
            out.push({ room: nextRoom, via: { x: d.x, y: d.y } });
          }
        }

        // Ladders across depths and sidepaths
        for (let x = r.roomX; x < r.roomX + r.width; x++) {
          for (let y = r.roomY; y < r.roomY + r.height; y++) {
            const t = r.roomArray[x]?.[y];
            if (t instanceof UpLadder) {
              if (!t.linkedRoom) {
                try {
                  t.linkRoom();
                } catch {
                  // ignore
                }
              }
              if (t.linkedRoom && t.linkedRoom !== r) {
                out.push({ room: t.linkedRoom, via: { x: t.x, y: t.y } });
              }
            } else if (t instanceof DownLadder) {
              if (t.linkedRoom && t.linkedRoom !== r) {
                out.push({ room: t.linkedRoom, via: { x: t.x, y: t.y } });
              }
            }
          }
        }

        return out;
      };

      // BFS over the room graph (doors + ladders) to find the nearest matching locked passage.
      const start = playerRoom;
      const startGid = start.globalId;
      const visited = new Set<string>([startGid]);
      const prev = new Map<string, PrevEntry>();
      const queue: Room[] = [start];

      let found: Target | null = null;
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;

        const targetHere = findTargetInRoom(current);
        if (targetHere) {
          found = targetHere;
          break;
        }

        for (const n of getNeighbors(current)) {
          const gid = n.room.globalId;
          if (visited.has(gid)) continue;
          visited.add(gid);
          prev.set(gid, { prev: current, via: n.via });
          queue.push(n.room);
        }
      }

      if (!found) {
        playerRoom.keyPathDots = undefined;
        return;
      }

      // Decide which tile in THIS room we should path to:
      // - if the target is here, path directly to it
      // - otherwise, path to the first door/ladder that advances toward the target room
      let tx = found.x;
      let ty = found.y;
      if (found.room !== start) {
        let cursorGid = found.room.globalId;
        while (true) {
          const e = prev.get(cursorGid);
          if (!e) break;
          if (e.prev.globalId === startGid) {
            tx = e.via.x;
            ty = e.via.y;
            break;
          }
          cursorGid = e.prev.globalId;
        }
      }

      playerRoom.keyPathDots = playerRoom.buildTilePathPositions(
        player.x,
        player.y,
        tx,
        ty,
      );
    } catch (e) {
      // Fail quiet
    }
  };
}
