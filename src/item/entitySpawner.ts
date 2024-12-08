import { Item } from "./item";
import { Player, PlayerDirection } from "../player";
import { Direction, Game } from "../game";
import { Room, RoomType } from "../room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Usable } from "./usable";
import { DownLadder } from "../tile/downLadder";
import { Tile } from "../tile/tile";
import { SpawnFloor } from "../tile/spawnfloor";
import { SpikeTrap } from "../tile/spiketrap";
import { Entity } from "../entity/entity";
import { globalEventBus } from "../eventBus";
import { BishopEnemy } from "../entity/enemy/bishopEnemy";
import { Enemy } from "../entity/enemy/enemy";

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
    this.setupEventListeners();
    this.player = this.room.game.players[0];

    this.stackable = false;
  }
  onUse = (player: Player): void => {};

  spawnEntity = (entity: Entity): void => {
    Entity.add(this.room, this.player.game, this.player.x, this.player.y);
    //console.log("Entity spawned");
  };

  commandHandler = (command: string): void => {
    const player = this.room.game.players[0];
    command = command.toLowerCase();
    if (!command.startsWith("/new")) {
      return;
    }
    switch (command.split(" ")[1]) {
      case "bishop":
        this.spawnEntity(
          new BishopEnemy(
            this.room,
            this.player.game,
            this.player.x,
            this.player.y,
          ),
        );
        break;
      default:
        //console.log(`Unknown command: ${command}`);
        break;
    }
    //console.log(`Command executed: ${command}`);
  };

  private setupEventListeners(): void {
    //console.log("Setting up event listeners");
    globalEventBus.on("ChatMessage", this.commandHandler.bind(this));
    //console.log("Event listeners set up");
  }

  getDescription = (): string => {
    return "YOU SHOULD NOT HAVE THIS";
  };
}
