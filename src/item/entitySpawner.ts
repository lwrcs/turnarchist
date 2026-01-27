import { Item } from "./item";
import { Player, PlayerDirection } from "../player/player";
import { Direction, Game } from "../game";
import { Room, RoomType } from "../room/room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../game/gameConstants";
import { Usable } from "./usable/usable";
import { DownLadder } from "../tile/downLadder";
import { Tile } from "../tile/tile";
import { SpawnFloor } from "../tile/spawnfloor";
import { SpikeTrap } from "../tile/spiketrap";
import { Entity } from "../entity/entity";
import { globalEventBus } from "../event/eventBus";

export class EntitySpawner extends Usable {
  room: Room;
  count: number;
  player: Player;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.room = level;
    this.count = 0;
    this.tileX = 31;
    this.tileY = 0;
    // Intentionally do not hook chat commands here; Game owns chat commands (including spawn/new).
    this.player = this.room.game.players[0];

    this.stackable = false;
  }
  onUse = (player: Player): void => {};

  spawnEntity = (entity: Entity): void => {
    // Legacy placeholder; this item shouldn't exist in normal gameplay.
    // If you do end up with it, it does nothing rather than interfering with chat commands.
    void entity;
  };

  commandHandler = (command: string): void => {
    void command;
  };

  private setupEventListeners(): void {
    // No-op: intentionally not registering chat listeners here.
    // Keeping the method to avoid rippling changes across old references.
    void globalEventBus;
  }

  getDescription = (): string => {
    return "YOU SHOULD NOT HAVE THIS";
  };
}
