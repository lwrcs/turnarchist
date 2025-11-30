import { GameplaySettings } from "../game/gameplaySettings";
import { BeamEffect } from "../projectile/beamEffect";
import type { Room } from "../room/room";
import type { Door } from "../tile/door";
import type { Player } from "./player";

type EndpointAttachment = "tile" | "player";

interface SegmentEndpoint {
  room: Room;
  x: number;
  y: number;
  attachment: EndpointAttachment;
}

interface OxygenSegment {
  room: Room;
  start: SegmentEndpoint;
  end: SegmentEndpoint;
}

interface AnchorPoint {
  room: Room;
  roomGID: string;
  x: number;
  y: number;
}

interface RoomSegmentResult {
  segments: OxygenSegment[];
  length: number;
}

export class OxygenLine {
  private readonly player: Player;
  private anchor?: AnchorPoint;
  private segmentsByRoom: Map<string, OxygenSegment[]> = new Map();
  private beamsByRoom: Map<string, BeamEffect[]> = new Map();
  private beamRoomMap: Map<BeamEffect, Room> = new Map();
  private totalLength: number = 0;
  private connected: boolean = false;
  private startAnchor:
    | { mode: "player" }
    | { mode: "tile"; room: Room; x: number; y: number } = { mode: "player" };

  constructor(player: Player) {
    this.player = player;
  }

  attach(anchorRoom: Room, x: number, y: number) {
    this.anchor = {
      room: anchorRoom,
      roomGID: (anchorRoom as any)?.globalId ?? "",
      x,
      y,
    };
    this.update(true);
  }

  attachStartToPlayer() {
    this.startAnchor = { mode: "player" };
  }

  attachStartToTile(room: Room, x: number, y: number) {
    this.startAnchor = { mode: "tile", room, x, y };
  }

  detach() {
    this.anchor = undefined;
    this.totalLength = 0;
    this.connected = false;
    this.segmentsByRoom.clear();
    this.clearBeams();
  }

  isAttached(): boolean {
    return !!this.anchor;
  }

  isSupplyingAir(): boolean {
    if (!this.anchor) return false;
    if (!this.player.getRoom()?.underwater) return false;
    return this.connected;
  }

  getTotalLength(): number {
    return this.totalLength;
  }

  update(force: boolean = false) {
    if (!this.anchor || !this.startAnchor) {
      this.clearBeams();
      this.connected = false;
      return;
    }

    const currentRoom = this.player.getRoom();
    if (!currentRoom) {
      this.connected = false;
      this.clearBeams();
      return;
    }

    if (currentRoom.depth !== this.anchor.room.depth) {
      // Player left the level that the anchor belongs to.
      this.detach();
      return;
    }

    if (!currentRoom.underwater || !this.anchor.room.underwater) {
      this.connected = false;
      this.clearBeams();
      return;
    }

    const rebuildSucceeded = this.rebuildSegments(currentRoom);
    if (!rebuildSucceeded) {
      this.connected = false;
      this.clearBeams();
      return;
    }

    this.connected =
      this.anchor !== undefined &&
      this.totalLength <= GameplaySettings.OXYGEN_LINE_MAX_LENGTH;

    if (force || rebuildSucceeded) {
      this.syncBeamsWithSegments();
    }
  }

  private rebuildSegments(currentRoom: Room): boolean {
    if (!this.anchor) return false;

    const anchorRoom = this.anchor.room;
    const newSegments = new Map<string, OxygenSegment[]>();
    let totalLength = 0;

    const addSegments = (
      room: Room,
      segments: OxygenSegment[],
      length: number,
    ) => {
      if (segments.length > 0) {
        const key = (room as any)?.globalId ?? room.id?.toString() ?? "";
        const existing = newSegments.get(key) ?? [];
        existing.push(...segments);
        newSegments.set(key, existing);
      }
      totalLength += length;
    };

    const startPoint = this.resolveStartEndpoint(currentRoom);

    if (currentRoom === anchorRoom) {
      const result = this.buildRoomSegments(
        currentRoom,
        startPoint,
        this.anchorEndpoint(),
      );
      addSegments(currentRoom, result.segments, result.length);
    } else {
      const doorPath: Door[] | null =
        currentRoom.findShortestDoorPathTo(anchorRoom, true) ?? null;
      if (!doorPath) {
        return false;
      }

      let roomCursor: Room = currentRoom;
      let cursorPoint: SegmentEndpoint = startPoint;
      for (const door of doorPath) {
        const doorTarget: SegmentEndpoint = {
          room: roomCursor,
          x: door.x,
          y: door.y,
          attachment: "tile",
        };
        const chunk = this.buildRoomSegments(
          roomCursor,
          cursorPoint,
          doorTarget,
        );
        addSegments(roomCursor, chunk.segments, chunk.length);

        const linkedDoor = door.linkedDoor;
        if (!linkedDoor || !linkedDoor.room) {
          return false;
        }
        roomCursor = linkedDoor.room;
        cursorPoint = {
          room: roomCursor,
          x: linkedDoor.x,
          y: linkedDoor.y,
          attachment: "tile",
        };
      }

      const finalChunk = this.buildRoomSegments(
        roomCursor,
        cursorPoint,
        this.anchorEndpoint(),
      );
      addSegments(roomCursor, finalChunk.segments, finalChunk.length);
    }

    this.segmentsByRoom = newSegments;
    this.totalLength = totalLength;
    return true;
  }

  private resolveStartEndpoint(room: Room): SegmentEndpoint {
    if (this.startAnchor.mode === "player") {
      return {
        room,
        x: this.player.x,
        y: this.player.y,
        attachment: "player",
      };
    }
    return {
      room: this.startAnchor.room,
      x: this.startAnchor.x,
      y: this.startAnchor.y,
      attachment: "tile",
    };
  }

  private buildRoomSegments(
    room: Room,
    start: SegmentEndpoint,
    end: SegmentEndpoint,
  ): RoomSegmentResult {
    let path: Array<{ x: number; y: number }> = [];
    try {
      path = room.buildTilePathPositions(start.x, start.y, end.x, end.y) ?? [];
    } catch {
      path = [];
    }

    return {
      segments: [
        {
          room,
          start,
          end,
        },
      ],
      length: path.length,
    };
  }

  private syncBeamsWithSegments() {
    const activeRoomIds = new Set<string>();

    for (const [roomId, segments] of this.segmentsByRoom.entries()) {
      activeRoomIds.add(roomId);
      const room = segments[0]?.room;
      if (!room) continue;

      const existingBeams = this.beamsByRoom.get(roomId) ?? [];

      // Trim excess beams
      while (existingBeams.length > segments.length) {
        const beam = existingBeams.pop();
        this.disposeBeam(beam);
      }

      // Ensure we have enough beams
      while (existingBeams.length < segments.length) {
        const segment = segments[existingBeams.length];
        existingBeams.push(this.createBeamForSegment(segment));
      }

      // Update beam endpoints
      segments.forEach((segment, idx) => {
        const beam = existingBeams[idx];
        if (!beam) return;
        const start = this.resolveEndpoint(segment.start);
        const end = this.resolveEndpoint(segment.end);
        beam.setTarget(start.x, start.y, end.x, end.y);
        beam.drawableY = Math.min(start.y, end.y);
      });

      this.beamsByRoom.set(roomId, existingBeams);
    }

    // Dispose beams for rooms no longer on the path
    for (const [roomId, beams] of this.beamsByRoom.entries()) {
      if (activeRoomIds.has(roomId)) continue;
      beams.forEach((beam) => this.disposeBeam(beam));
      this.beamsByRoom.delete(roomId);
    }
  }

  private createBeamForSegment(segment: OxygenSegment): BeamEffect {
    const start = this.resolveEndpoint(segment.start);
    const end = this.resolveEndpoint(segment.end);
    const beam = new BeamEffect(
      start.x,
      start.y,
      end.x,
      end.y,
      this.player as any,
    );
    beam.type = "oxygen-line";
    beam.color = "rgba(135, 206, 235, 0.5)";
    beam.compositeOperation = "source-over";
    beam.startAttachment = segment.start.attachment;
    beam.endAttachment = segment.end.attachment;
    beam.setPhysics(
      0.15, // gravity
      0.35, // motion influence
      0.05, // turbulence
      0.2, // velocity decay
      0.0025, // angle change
      20, // max velocity
      0.9, // damping
      0.025, // spring stiffness
      0.08, // spring damping
      3, // iterations
      40, // segments
    );
    segment.room.projectiles.push(beam);
    this.beamRoomMap.set(beam, segment.room);
    return beam;
  }

  private disposeBeam(beam?: BeamEffect) {
    if (!beam) return;
    const hostRoom = this.beamRoomMap.get(beam);
    if (hostRoom) {
      hostRoom.projectiles = hostRoom.projectiles.filter((p) => p !== beam);
      this.beamRoomMap.delete(beam);
    }
    beam.dead = true;
  }

  private clearBeams() {
    for (const beams of this.beamsByRoom.values()) {
      beams.forEach((beam) => this.disposeBeam(beam));
    }
    this.beamsByRoom.clear();
  }

  private resolveEndpoint(endpoint: SegmentEndpoint): { x: number; y: number } {
    if (endpoint.attachment === "player") {
      const pos = this.player.getInterpolatedTilePosition();
      return {
        x: pos.x,
        y: pos.y - this.player.getOxygenAttachmentOffset(),
      };
    }
    return {
      x: endpoint.x,
      y: endpoint.y - this.player.getOxygenBaseOffset(),
    };
  }

  private anchorEndpoint(): SegmentEndpoint {
    if (!this.anchor) {
      throw new Error("Attempted to use anchor endpoint without an anchor.");
    }
    return {
      room: this.anchor.room,
      x: this.anchor.x,
      y: this.anchor.y,
      attachment: "tile",
    };
  }

  private samePosition(a: SegmentEndpoint, b: SegmentEndpoint): boolean {
    return a.x === b.x && a.y === b.y;
  }
}
