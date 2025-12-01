import { Direction } from "../game";
import { GameplaySettings } from "../game/gameplaySettings";
import { BeamAttachmentControl, BeamEffect } from "../projectile/beamEffect";
import type { Room } from "../room/room";
import { Door } from "../tile/door";
import type { Player } from "./player";

type EndpointAttachment = "tile" | "player";
type OxygenAnchorKind =
  | "player"
  | "door"
  | "upLadder"
  | "downLadder"
  | "oxygenNode";

export interface AnchorOptions {
  kind?: OxygenAnchorKind;
  angle?: number;
}

interface SegmentEndpoint {
  room: Room;
  x: number;
  y: number;
  attachment: EndpointAttachment;
  kind?: OxygenAnchorKind;
  angle?: number;
}

interface DoorTraversal {
  from: Door;
  to: Door;
  segmentIndex?: number;
}

interface OxygenSegment {
  room: Room;
  start: SegmentEndpoint;
  end: SegmentEndpoint;
  doorTraversalIndex?: number;
}

interface AnchorPoint {
  room: Room;
  roomGID: string;
  x: number;
  y: number;
  kind?: OxygenAnchorKind;
  angle?: number;
}

interface RoomSegmentResult {
  segments: OxygenSegment[];
}

export class OxygenLine {
  private readonly player: Player;
  private static readonly MIN_SEGMENT_SEPARATION = 0.2;
  private static readonly CLOSE_DISTANCE_EPSILON = 0.01;
  private anchor?: AnchorPoint;
  private segmentsByRoom: Map<string, OxygenSegment[]> = new Map();
  private beamsByRoom: Map<string, BeamEffect[]> = new Map();
  private beamRoomMap: Map<BeamEffect, Room> = new Map();
  private totalLength: number = 0;
  private connected: boolean = false;
  private doorHistory: DoorTraversal[] = [];
  private disconnected: boolean = false;
  private disconnectTile?:
    | {
        roomGID: string;
        x: number;
        y: number;
      }
    | undefined;
  private startAnchor:
    | { mode: "player"; angle?: number }
    | {
        mode: "tile";
        room: Room;
        x: number;
        y: number;
        kind?: OxygenAnchorKind;
        angle?: number;
      } = { mode: "player" };

  constructor(player: Player) {
    this.player = player;
  }

  attach(anchorRoom: Room, x: number, y: number, options?: AnchorOptions) {
    if (!this.hasEquippedHelmet()) return;
    this.resetDoorHistory();
    this.disconnected = false;
    this.disconnectTile = undefined;
    this.anchor = {
      room: anchorRoom,
      roomGID: (anchorRoom as any)?.globalId ?? "",
      x,
      y,
      kind: options?.kind,
      angle: options?.angle,
    };
    console.log(
      "[OxygenLine] attach",
      (anchorRoom as any)?.globalId,
      `(${x},${y})`,
      options?.kind ?? "unknown",
    );
    this.update(true);
  }

  attachStartToPlayer(angle?: number) {
    if (!this.hasEquippedHelmet()) return;
    this.startAnchor = {
      mode: "player",
      angle: angle ?? -Math.PI / 2,
    };
  }

  attachStartToTile(room: Room, x: number, y: number, options?: AnchorOptions) {
    this.startAnchor = {
      mode: "tile",
      room,
      x,
      y,
      kind: options?.kind,
      angle: options?.angle,
    };
  }

  detach() {
    this.anchor = undefined;
    this.totalLength = 0;
    this.connected = false;
    this.disconnected = false;
    this.disconnectTile = undefined;
    this.segmentsByRoom.clear();
    this.resetDoorHistory();
    this.clearBeams();
  }

  recordDoorTraversal(exitDoor: Door, entryDoor: Door) {
    if (!this.anchor || !exitDoor || !entryDoor) return;
    const currentRoom = this.player.getRoom();
    if (!currentRoom || !currentRoom.underwater) return;
    if (this.disconnected) return;
    const lastTraversal = this.doorHistory[this.doorHistory.length - 1];
    if (
      lastTraversal &&
      lastTraversal.from === entryDoor &&
      lastTraversal.to === exitDoor
    ) {
      this.doorHistory.pop();
      this.reindexDoorHistory();
      return;
    }
    const traversal: DoorTraversal = {
      from: exitDoor,
      to: entryDoor,
    };
    this.doorHistory.push(traversal);
    this.reindexDoorHistory();
  }

  private resetDoorHistory() {
    this.doorHistory = [];
  }

  private reindexDoorHistory() {
    this.doorHistory = this.doorHistory.map((traversal, idx) => ({
      ...traversal,
      segmentIndex: idx,
    }));
  }

  private handleDisconnection() {
    const room = this.player.getRoom();
    if (!room) return;
    const dropX = this.player.lastX ?? this.player.x;
    const dropY = this.player.lastY ?? this.player.y;
    const pos = { x: dropX, y: dropY };
    this.disconnected = true;
    this.connected = false;
    this.disconnectTile = {
      roomGID: (room as any)?.globalId ?? "",
      x: pos.x,
      y: pos.y,
    };
    this.attachStartToTile(room, pos.x, pos.y, {
      kind: "player",
      angle: Math.PI / 2,
    });

    const rebuilt = this.rebuildSegments(room);
    if (rebuilt) {
      this.syncBeamsWithSegments();
    }
    this.pushOxygenMessage("Your oxygen line disconnects.");
  }

  onHelmetEquipped() {
    if (this.anchor || this.disconnected) return;
    this.tryAttachToNearestSource();
  }

  onHelmetUnequipped() {
    if (!this.anchor) return;
    if (this.disconnected) return;
    this.handleDisconnection();
  }

  private tryReconnect(): boolean {
    if (!this.hasEquippedHelmet()) return false;
    if (!this.disconnectTile) return false;
    const room = this.player.getRoom();
    if (!room) return false;
    if ((room as any)?.globalId !== this.disconnectTile.roomGID) return false;
    if (!this.playerIsAtReconnectPosition(room)) {
      return false;
    }
    this.disconnected = false;
    this.disconnectTile = undefined;
    this.attachStartToPlayer(-Math.PI / 2);
    this.pushOxygenMessage("Your oxygen line reconnects.");
    return true;
  }

  isAttached(): boolean {
    return !!this.anchor;
  }

  isSupplyingAir(): boolean {
    if (!this.anchor) return false;
    if (!this.player.getRoom()?.underwater) return false;
    if (!this.validateDoorHistoryAgainstCurrentRoom()) {
      this.resetDoorHistory();
    }
    return this.connected;
  }

  isDisconnectedFromPlayer(): boolean {
    return this.disconnected;
  }

  getActiveTraversalIndex(): number | undefined {
    if (this.doorHistory.length === 0) return undefined;
    return this.doorHistory[this.doorHistory.length - 1]?.segmentIndex;
  }

  ensureAnchor(): boolean {
    if (this.anchor) return true;
    if (this.hasEquippedHelmet()) {
      return this.tryAttachToNearestSource();
    }
    return false;
  }

  getTotalLength(): number {
    return this.totalLength;
  }

  update(force: boolean = false) {
    if (this.disconnected) {
      if (!this.tryReconnect()) {
        this.connected = false;
        return;
      }
    }

    if (!this.anchor || !this.startAnchor) {
      if (!this.anchor && !this.disconnected && this.hasEquippedHelmet()) {
        this.tryAttachToNearestSource();
      }
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

    if (!currentRoom.underwater) {
      this.connected = false;
      this.clearBeams();
      return;
    }

    const anchorSupportsSupply =
      this.anchor.room.underwater || this.anchor.kind === "upLadder";
    if (!anchorSupportsSupply) {
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

    if (this.totalLength > GameplaySettings.OXYGEN_LINE_MAX_LENGTH) {
      this.handleDisconnection();
      return;
    }

    this.connected = true;

    if (force || rebuildSucceeded) {
      this.syncBeamsWithSegments();
    }
  }

  private rebuildSegments(currentRoom: Room): boolean {
    if (!this.anchor) return false;

    const anchorRoom = this.anchor.room;
    const newSegments = new Map<string, OxygenSegment[]>();
    this.reindexDoorHistory();

    const addSegments = (room: Room, segments: OxygenSegment[]) => {
      if (segments.length > 0) {
        const key = (room as any)?.globalId ?? room.id?.toString() ?? "";
        const existing = newSegments.get(key) ?? [];
        existing.push(...segments);
        newSegments.set(key, existing);
      }
    };

    const startPoint = this.resolveStartEndpoint(currentRoom);
    const anchorEndpoint = this.anchorEndpoint();
    let pathStackUsed: DoorTraversal[] = [];

    if (currentRoom === anchorRoom && this.doorHistory.length === 0) {
      const result = this.buildRoomSegments(
        currentRoom,
        startPoint,
        anchorEndpoint,
      );
      addSegments(currentRoom, result.segments);
    } else {
      const effectiveStack = this.getEffectiveDoorStack();
      if (effectiveStack.length === 0) return false;
      const success = this.buildSegmentsFromDoorHistory(
        currentRoom,
        anchorRoom,
        startPoint,
        addSegments,
        effectiveStack,
      );
      if (!success) return false;
      pathStackUsed = effectiveStack.map((traversal, idx) => ({
        ...traversal,
        segmentIndex: idx,
      }));
    }

    this.segmentsByRoom = newSegments;
    this.totalLength = this.computeLengthFromDoorHistory(
      startPoint,
      anchorEndpoint,
      pathStackUsed,
    );
    return true;
  }

  private resolveStartEndpoint(room: Room): SegmentEndpoint {
    if (this.startAnchor.mode === "player") {
      return {
        room,
        x: this.player.x,
        y: this.player.y,
        attachment: "player",
        kind: "player",
        angle: this.startAnchor.angle,
      };
    }
    return {
      room: this.startAnchor.room,
      x: this.startAnchor.x,
      y: this.startAnchor.y,
      attachment: "tile",
      kind: this.startAnchor.kind,
      angle: this.startAnchor.angle,
    };
  }

  private buildRoomSegments(
    room: Room,
    start: SegmentEndpoint,
    end: SegmentEndpoint,
    doorTraversalIndex?: number,
  ): RoomSegmentResult {
    return {
      segments: [
        {
          room,
          start,
          end,
          doorTraversalIndex,
        },
      ],
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
        beam.setAttachmentControls(
          this.buildAttachmentControl(segment.start),
          this.buildAttachmentControl(segment.end),
        );
        const { start, end } = this.resolveSegmentEndpoints(segment);
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
    const { start, end } = this.resolveSegmentEndpoints(segment);
    console.log("[OxygenLine] createBeamForSegment", {
      room: (segment.room as any)?.globalId ?? segment.room?.id,
      start: { x: start.x, y: start.y, kind: segment.start.kind },
      end: { x: end.x, y: end.y, kind: segment.end.kind },
    });
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
    beam.setAttachmentControls(
      this.buildAttachmentControl(segment.start),
      this.buildAttachmentControl(segment.end),
    );
    beam.oxygenTraversalIndex = segment.doorTraversalIndex;
    beam.setHostRoom(segment.room);
    beam.drawOnTop = true;
    beam.setHostRoom(segment.room);
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

  private resolveSegmentEndpoints(segment: OxygenSegment): {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } {
    const start = this.resolveEndpoint(segment.start);
    const end = this.resolveEndpoint(segment.end);

    if (this.endpointsAreTooClose(start, end)) {
      const separation = this.calculateSeparationVector(
        segment.start,
        segment.end,
      );
      start.x -= separation.x;
      start.y -= separation.y;
      end.x += separation.x;
      end.y += separation.y;
    }

    return { start, end };
  }

  private endpointsAreTooClose(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): boolean {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return (
      Math.abs(dx) < OxygenLine.CLOSE_DISTANCE_EPSILON &&
      Math.abs(dy) < OxygenLine.CLOSE_DISTANCE_EPSILON
    );
  }

  private calculateSeparationVector(
    start: SegmentEndpoint,
    end: SegmentEndpoint,
  ): { x: number; y: number } {
    const totalSeparation = OxygenLine.MIN_SEGMENT_SEPARATION;
    const halfSeparation = totalSeparation / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 1e-3) {
      return {
        x: (dx / distance) * halfSeparation,
        y: (dy / distance) * halfSeparation,
      };
    }

    const referenceAngle = end.angle ?? start.angle;
    if (referenceAngle !== undefined) {
      return {
        x: Math.cos(referenceAngle) * halfSeparation,
        y: Math.sin(referenceAngle) * halfSeparation,
      };
    }

    if (start.attachment === "player") {
      return { x: 0, y: -halfSeparation };
    }

    return { x: 0, y: halfSeparation };
  }

  private tryAttachToNearestSource(): boolean {
    if (!this.hasEquippedHelmet()) return false;
    const room = this.player.getRoom();
    if (!room || !room.underwater) return false;
    const oxygenCoords = room.findPrimaryUpLadderCoords();
    if (!oxygenCoords) return false;
    this.attachStartToPlayer(-Math.PI / 2);
    this.attach(room, oxygenCoords.x, oxygenCoords.y, {
      kind: "upLadder",
      angle: Math.PI / 2,
    });
    return true;
  }

  private playerIsAtReconnectPosition(room: Room): boolean {
    if (!this.disconnectTile) return false;
    if (
      this.player.x === this.disconnectTile.x &&
      this.player.y === this.disconnectTile.y
    ) {
      return true;
    }
    const tile =
      room.roomArray?.[this.disconnectTile.x]?.[this.disconnectTile.y];
    if (tile instanceof Door) {
      const entry = this.getDoorEntryPosition(tile);
      if (entry) {
        return this.player.x === entry.x && this.player.y === entry.y;
      }
    }
    return false;
  }

  private getDoorEntryPosition(door: Door): { x: number; y: number } | null {
    switch (door.doorDir) {
      case Direction.UP:
        return { x: door.x, y: door.y + 1 };
      case Direction.DOWN:
        return { x: door.x, y: door.y - 1 };
      case Direction.LEFT:
        return { x: door.x + 1, y: door.y };
      case Direction.RIGHT:
        return { x: door.x - 1, y: door.y };
      default:
        return null;
    }
  }

  private hasEquippedHelmet(): boolean {
    return !!this.player.getEquippedDivingHelmet();
  }

  private pushOxygenMessage(message: string) {
    try {
      this.player.game.pushMessage?.(message);
    } catch {
      // ignore if messaging unavailable
    }
  }

  private validateDoorHistoryAgainstCurrentRoom(): boolean {
    if (!this.anchor) return true;
    const currentRoom = this.player.getRoom();
    if (!currentRoom) return false;
    if (this.doorHistory.length === 0) return true;

    let roomCursor: Room | undefined = currentRoom;
    for (let i = this.doorHistory.length - 1; i >= 0; i--) {
      const traversal = this.doorHistory[i];
      if (!traversal?.to?.room || !traversal?.from?.room) {
        return false;
      }
      if (traversal.to.room !== roomCursor) {
        return false;
      }
      roomCursor = traversal.from.room;
    }

    return roomCursor === this.anchor.room;
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
      kind: this.anchor.kind,
      angle: this.anchor.angle,
    };
  }

  private buildAttachmentControl(
    endpoint: SegmentEndpoint,
  ): BeamAttachmentControl | undefined {
    if (endpoint.attachment === "player") {
      return {
        angle: endpoint.angle ?? -Math.PI / 2,
        weight: 1,
        influence: 1,
        influenceDistance: 1.5,
      };
    }
    if (endpoint.angle === undefined) return undefined;

    const defaults = this.getAttachmentDefaults(endpoint.kind);
    return {
      angle: endpoint.angle,
      weight: defaults.weight,
      influence: defaults.influence,
      influenceDistance: defaults.influenceDistance,
      lengthScale: defaults.lengthScale,
    };
  }

  private getAttachmentDefaults(kind?: OxygenAnchorKind) {
    switch (kind) {
      case "door":
        return {
          weight: 1,
          influence: 1,
          influenceDistance: 2,
          lengthScale: 1,
        };
      case "upLadder":
        return {
          weight: 1,
          influence: 3,
          influenceDistance: 5,
          lengthScale: 1,
        };
      case "downLadder":
        return {
          weight: 0.6,
          influence: 3,
          influenceDistance: 5,
          lengthScale: 1,
        };
      case "oxygenNode":
        return {
          weight: 0.55,
          influence: 2,
          influenceDistance: 5,
          lengthScale: 1,
        };
      default:
        return {
          weight: 0.5,
          influence: 2,
          influenceDistance: 2,
          lengthScale: 1,
        };
    }
  }

  private getDoorAngle(door: Door): number {
    switch (door.doorDir) {
      case Direction.UP:
        return Math.PI / 2;
      case Direction.DOWN:
        return -Math.PI / 2;
      case Direction.LEFT:
        return Math.PI;
      case Direction.RIGHT:
        return 0;
      default:
        return 0;
    }
  }

  private samePosition(a: SegmentEndpoint, b: SegmentEndpoint): boolean {
    return a.x === b.x && a.y === b.y;
  }

  private computeLengthFromDoorHistory(
    start: SegmentEndpoint,
    anchor: SegmentEndpoint,
    doorStack: DoorTraversal[],
  ): number {
    let length = 0;
    let currentX = start.x;
    let currentY = start.y;

    if (doorStack.length === 0) {
      return (
        length +
        this.distanceBetweenPoints(currentX, currentY, anchor.x, anchor.y)
      );
    }

    for (let i = doorStack.length - 1; i >= 0; i--) {
      const traversal = doorStack[i];
      const entryDoor = traversal.to;
      length += this.distanceBetweenPoints(
        currentX,
        currentY,
        entryDoor.x,
        entryDoor.y,
      );
      const exitDoor = traversal.from;
      currentX = exitDoor.x;
      currentY = exitDoor.y;
    }

    length += this.distanceBetweenPoints(
      currentX,
      currentY,
      anchor.x,
      anchor.y,
    );
    return length;
  }

  private distanceBetweenPoints(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  private normalizeDoorStack(stack: DoorTraversal[]): DoorTraversal[] {
    if (stack.length <= 1) return stack.slice();

    const playerRoom = this.player.getRoom();
    const copy = stack.slice();

    if (playerRoom && copy[copy.length - 1]?.to?.room === playerRoom) {
      return copy;
    }

    const flipped = copy
      .slice()
      .reverse()
      .map((traversal) => ({
        from: traversal.to,
        to: traversal.from,
      }));

    if (playerRoom && flipped[flipped.length - 1]?.to?.room === playerRoom) {
      return flipped;
    }

    return copy;
  }

  private getEffectiveDoorStack(): DoorTraversal[] {
    return this.doorHistory.map((traversal, idx) => ({
      ...traversal,
      segmentIndex: traversal.segmentIndex ?? idx,
    }));
  }

  private buildSegmentsFromDoorHistory(
    currentRoom: Room,
    anchorRoom: Room,
    startPoint: SegmentEndpoint,
    addSegments: (room: Room, segments: OxygenSegment[]) => void,
    doorStack: DoorTraversal[],
  ): boolean {
    if (doorStack.length === 0) return false;
    let roomCursor: Room = currentRoom;
    let cursorPoint: SegmentEndpoint = startPoint;

    for (let i = doorStack.length - 1; i >= 0; i--) {
      const traversal = doorStack[i];
      const entryDoor = traversal.to;
      if (entryDoor.room !== roomCursor) {
        return false;
      }
      const doorTarget: SegmentEndpoint = {
        room: roomCursor,
        x: entryDoor.x,
        y: entryDoor.y,
        attachment: "tile",
        kind: "door",
        angle: this.getDoorAngle(entryDoor),
      };
      const traversalIndex = traversal.segmentIndex ?? i;
      const chunk = this.buildRoomSegments(
        roomCursor,
        cursorPoint,
        doorTarget,
        traversalIndex,
      );
      addSegments(roomCursor, chunk.segments);

      const fromDoor = traversal.from;
      if (!fromDoor || !fromDoor.room) return false;
      roomCursor = fromDoor.room;
      cursorPoint = {
        room: roomCursor,
        x: fromDoor.x,
        y: fromDoor.y,
        attachment: "tile",
        kind: "door",
        angle: this.getDoorAngle(fromDoor),
      };
    }

    const anchorTarget = this.anchorEndpoint();
    if (roomCursor !== anchorTarget.room) return false;

    const finalChunk = this.buildRoomSegments(
      roomCursor,
      cursorPoint,
      anchorTarget,
    );
    addSegments(roomCursor, finalChunk.segments);
    return true;
  }

  // Removed BFS fallback: oxygen path strictly follows recorded door history.
}
