import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { GameplaySettings } from "../game/gameplaySettings";
import { Room, RoomType } from "../room/room";
import { Entity, EntityType } from "../entity/entity";
import { Wall } from "../tile/wall";
import { Player } from "../player/player";
import { LevelConstants } from "../level/levelConstants";

export class Map {
  game: Game;
  mapData: any[] = [];
  oldMapData: any[] = [];
  depth: number;
  scale: number;

  offsetX: number = 0;
  offsetY: number = 0;
  softOffsetX: number = 0;
  softOffsetY: number = 0;
  player: Player;
  // Offscreen buffer for masking minimap without affecting main canvas
  bufferCanvas: HTMLCanvasElement | null = null;
  bufferCtx: CanvasRenderingContext2D | null = null;
  mapOpen: boolean = false;
  // Animation state for full-screen map
  mapOpenProgress: number = 0; // 0 closed, 1 open
  mapAnimationSpeed: number = 0.18; // progress step per frame (scaled by delta)
  // Internal: suppress per-room fog draw; use single mask pass instead
  suppressPerRoomFog: boolean = false;
  // Per-frame caches to avoid repeated calculations
  framePlayerX: number = 0;
  framePlayerY: number = 0;
  effectiveRadius: number = 0;
  effectiveRadiusSq: number = 0;
  currentSeenTiles: Set<string> | null = null;
  frameDiscoveredBounds: { centerX: number; centerY: number } | null = null;
  // Mask bounds in world tiles (for square 50x50 mask at top-right)
  frameMaskMinX: number = 0;
  frameMaskMaxX: number = 0;
  frameMaskMinY: number = 0;
  frameMaskMaxY: number = 0;

  // Fog of war properties - now stored per mapGroup
  seenTilesByMapGroup: globalThis.Map<string, Set<string>> =
    new globalThis.Map();
  visibilityRadius: number = 4;
  drawRadius: number = 25;

  constructor(game: Game, player: Player) {
    this.game = game;
    this.scale = 1;
    this.player = player;
    //this.depth = player.game.level.depth
  }

  // Add helper method to collect down ladders from room array
  getDownLaddersFromRoom = (room: Room): any[] => {
    const downLadders: any[] = [];

    // Safely iterate through the room array to find down ladders
    if (room.roomArray) {
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          // Check bounds to avoid undefined access
          if (room.roomArray[x] && room.roomArray[x][y]) {
            const tile = room.roomArray[x][y];
            // Check if tile is a DownLadder instance
            if (
              tile &&
              tile.constructor &&
              tile.constructor.name === "DownLadder"
            ) {
              downLadders.push(tile);
            }
          }
        }
      }
    }

    return downLadders;
  };

  saveMapData = () => {
    this.clearMap();
    const currentMapGroup = this.game.room.mapGroup.toString();

    for (const room of this.game.levels[this.player.depth].rooms) {
      if (
        currentMapGroup === room.mapGroup.toString() &&
        (room.entered === true || GameConstants.DEVELOPER_MODE)
      ) {
        this.mapData.push({
          room: room,
          walls: room.innerWalls,
          doors: room.doors,
          entities: room.entities,
          items: room.items,
          players: this.game.players,
          downLadders: this.getDownLaddersFromRoom(room), // Add down ladders to map data
          seenTiles:
            this.seenTilesByMapGroup.get(currentMapGroup) || new Set<string>(), // Add seen tiles to map data
        });
      }
    }

    const enteredRooms = this.mapData
      .map((data) => data.room)
      .filter((room) => room.entered);

    if (enteredRooms.length > 0) {
      const sortedByX = [...enteredRooms].sort((a, b) => a.roomX - b.roomX);
      const sortedByY = [...enteredRooms].sort((a, b) => a.roomY - b.roomY);

      const maxX = sortedByX[sortedByX.length - 1].roomX;
      const minY = sortedByY[0].roomY;

      this.offsetX = maxX;
      this.offsetY = minY;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  };

  clearMap = () => {
    this.mapData = [];
  };

  saveOldMap = () => {
    this.oldMapData = [...this.mapData];
  };

  renderMap = (delta: number) => {
    // Update open/close animation
    this.updateMapAnimation(delta);
    // Prepare per-frame caches
    this.prepareFrameCaches();

    if (this.mapOpen) {
      // === Opening: first draw gameplay backdrop fade, then composite full map ===
      const eased = this.easeInOut(this.mapOpenProgress);
      // Backdrop behind the map should be drawn before compositing the buffer
      Game.ctx.save();
      this.drawBackdrop(eased);
      Game.ctx.restore();

      // Render full map directly (no fog)
      Game.ctx.save();
      this.setInitialCanvasSettings(1);
      const oldScale = this.scale;
      this.scale = 1 + eased; // animate to 2x scale when fully open
      this.translateCanvas(0);
      for (const data of this.mapData) this.drawRoom(data, delta);
      this.resetCanvasTransform();
      this.scale = oldScale;
      Game.ctx.restore();
    } else if (this.mapOpenProgress > 0) {
      // === In-transition: render to buffer (to keep masking off main canvas), then composite over a fading backdrop ===
      const eased = this.easeInOut(this.mapOpenProgress);
      this.ensureBufferCanvas();
      if (!this.bufferCanvas || !this.bufferCtx) return;

      const originalCtx = Game.ctx;
      const oldScale = this.scale;

      // Prepare buffer
      this.bufferCtx.save();
      this.bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.bufferCtx.clearRect(
        0,
        0,
        this.bufferCanvas.width,
        this.bufferCanvas.height,
      );
      this.bufferCtx.imageSmoothingEnabled = false;
      (Game as any).ctx = this.bufferCtx;
      this.setInitialCanvasSettings(1);
      this.scale = 1 + eased; // animate scale while drawing into buffer
      this.translateCanvas(0);
      this.suppressPerRoomFog = true;
      for (const data of this.mapData) this.drawRoom(data, delta);
      // Apply single fog-of-war mask over entire buffer
      this.applyFogOfWarAllRooms();
      this.suppressPerRoomFog = false;
      this.resetCanvasTransform();
      this.scale = oldScale;
      this.bufferCtx.restore();

      // Restore main ctx and composite buffer over gameplay (no backdrop during closing)
      (Game as any).ctx = originalCtx;
      Game.ctx.save();
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.imageSmoothingEnabled = false;
      Game.ctx.drawImage(this.bufferCanvas, 0, 0);
      Game.ctx.restore();
    } else if (!GameplaySettings.LEGACY_MINIMAP) {
      // === New behavior: render to offscreen buffer, then mask with fog and composite ===
      this.ensureBufferCanvas();
      if (!this.bufferCanvas || !this.bufferCtx) return;

      const originalCtx = Game.ctx;
      const s = this.scale;

      // Prepare buffer
      this.bufferCtx.save();
      this.bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.bufferCtx.clearRect(
        0,
        0,
        this.bufferCanvas.width,
        this.bufferCanvas.height,
      );
      this.bufferCtx.imageSmoothingEnabled = false;
      // Temporarily redirect drawing to buffer
      // All existing draw methods use Game.ctx, so swap it
      (Game as any).ctx = this.bufferCtx;
      this.setInitialCanvasSettings(1);
      this.translateCanvas(0);
      this.suppressPerRoomFog = true;
      for (const data of this.mapData) this.drawRoom(data, delta);
      this.applyFogOfWarAllRooms();
      this.suppressPerRoomFog = false;
      this.resetCanvasTransform();
      this.bufferCtx.restore();

      // Restore main ctx and composite buffer onto it
      (Game as any).ctx = originalCtx;
      Game.ctx.save();
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.imageSmoothingEnabled = false;
      Game.ctx.drawImage(this.bufferCanvas, 0, 0);
      Game.ctx.restore();
    } else {
      // === Legacy behavior with fixed 50x50px top-right mask ===
      this.ensureBufferCanvas();
      if (!this.bufferCanvas || !this.bufferCtx) return;

      const originalCtx = Game.ctx;

      // Prepare buffer
      this.bufferCtx.save();
      this.bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.bufferCtx.clearRect(
        0,
        0,
        this.bufferCanvas.width,
        this.bufferCanvas.height,
      );
      this.bufferCtx.imageSmoothingEnabled = false;
      (Game as any).ctx = this.bufferCtx;
      this.setInitialCanvasSettings(1);
      this.translateCanvas(0);
      for (const data of this.mapData) {
        this.drawRoom(data, delta);
      }
      this.resetCanvasTransform();

      // Apply square mask: keep only 50x50px at top-right
      this.bufferCtx.globalCompositeOperation = "destination-in";
      const maskWidth = 50;
      const maskHeight = 50;
      const maskX = GameConstants.WIDTH - maskWidth;
      const maskY = 0;
      this.bufferCtx.fillStyle = "rgba(0,0,0,1)";
      this.bufferCtx.fillRect(maskX, maskY, maskWidth, maskHeight);
      this.bufferCtx.globalCompositeOperation = "source-over";
      this.bufferCtx.restore();

      // Restore main ctx and composite buffer onto it
      (Game as any).ctx = originalCtx;
      Game.ctx.save();
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.imageSmoothingEnabled = false;
      Game.ctx.drawImage(this.bufferCanvas, 0, 0);
      Game.ctx.restore();
    }
  };

  prepareFrameCaches = () => {
    this.framePlayerX = Math.floor(this.player.x);
    this.framePlayerY = Math.floor(this.player.y);
    this.effectiveRadius = this.getEffectiveDrawRadius();
    this.effectiveRadiusSq = this.effectiveRadius * this.effectiveRadius;
    // seen tiles
    const currentMapGroup = this.game.room.mapGroup.toString();
    let seenTiles = this.seenTilesByMapGroup.get(currentMapGroup);
    if (this.mapData.length > 0 && this.mapData[0].seenTiles) {
      seenTiles = this.mapData[0].seenTiles;
    }
    this.currentSeenTiles = seenTiles ?? null;
    // cache bounds center for translate when needed
    const b = this.getDiscoveredBounds();
    this.frameDiscoveredBounds = { centerX: b.centerX, centerY: b.centerY };

    // Compute tile bounds for 50x50px mask for non-legacy minimap mode
    if (
      !GameplaySettings.LEGACY_MINIMAP &&
      !this.mapOpen &&
      this.mapOpenProgress === 0
    ) {
      const s = this.scale || 1;
      const maskW = 50;
      const maskH = 50;
      const maskX = GameConstants.WIDTH - maskW;
      const maskY = 0;
      const anchorX = maskX + Math.floor(maskW / 2);
      const anchorY = maskY + Math.floor(maskH / 2);
      // invert screen->world for tile bounds
      const minTileX = Math.floor(this.player.x + (maskX - anchorX) / s);
      const maxTileX = Math.floor(
        this.player.x + (maskX + maskW - 1 - anchorX) / s,
      );
      const minTileY = Math.floor(this.player.y + (maskY - anchorY) / s);
      const maxTileY = Math.floor(
        this.player.y + (maskY + maskH - 1 - anchorY) / s,
      );
      this.frameMaskMinX = Math.min(minTileX, maxTileX);
      this.frameMaskMaxX = Math.max(minTileX, maxTileX);
      this.frameMaskMinY = Math.min(minTileY, maxTileY);
      this.frameMaskMaxY = Math.max(minTileY, maxTileY);
    } else {
      // reset to wide open when not using minimap mask
      this.frameMaskMinX = Number.NEGATIVE_INFINITY;
      this.frameMaskMaxX = Number.POSITIVE_INFINITY;
      this.frameMaskMinY = Number.NEGATIVE_INFINITY;
      this.frameMaskMaxY = Number.POSITIVE_INFINITY;
    }
  };

  ensureBufferCanvas = () => {
    const width = GameConstants.WIDTH;
    const height = GameConstants.HEIGHT;
    if (!this.bufferCanvas) {
      this.bufferCanvas = document.createElement("canvas");
      this.bufferCanvas.width = width;
      this.bufferCanvas.height = height;
      this.bufferCtx = this.bufferCanvas.getContext("2d", {
        alpha: true,
      }) as CanvasRenderingContext2D;
    } else if (
      this.bufferCanvas.width !== width ||
      this.bufferCanvas.height !== height
    ) {
      this.bufferCanvas.width = width;
      this.bufferCanvas.height = height;
      this.bufferCtx = this.bufferCanvas.getContext("2d", {
        alpha: true,
      }) as CanvasRenderingContext2D;
    }
  };

  toggleMapOpen = () => {
    const opening = !this.mapOpen;
    // Prevent opening the map if the inventory UI is open
    if (opening) {
      const inventoryOpen = this.player?.inventory?.isOpen === true;
      if (inventoryOpen) return;
    }
    this.mapOpen = opening;
    if (opening) {
      // Ensure map data is up to date when opening even if disabled
      this.saveMapData();
    }
  };

  getSeenTilesForCurrentGroup = (): Set<string> => {
    const currentMapGroup = this.game.room.mapGroup.toString();
    let seenTiles = this.seenTilesByMapGroup.get(currentMapGroup);
    if (this.mapData.length > 0 && this.mapData[0].seenTiles) {
      seenTiles = this.mapData[0].seenTiles;
    }
    return seenTiles ?? new Set<string>();
  };

  getDiscoveredBounds = () => {
    const seen = this.getSeenTilesForCurrentGroup();
    if (seen.size === 0) {
      const px = Math.floor(this.player.x);
      const py = Math.floor(this.player.y);
      return {
        minX: px,
        minY: py,
        maxX: px,
        maxY: py,
        width: 1,
        height: 1,
        centerX: px,
        centerY: py,
      };
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const key of seen) {
      const [sx, sy] = key.split(",").map((v) => parseInt(v, 10));
      if (sx < minX) minX = sx;
      if (sy < minY) minY = sy;
      if (sx > maxX) maxX = sx;
      if (sy > maxY) maxY = sy;
    }
    const width = Math.max(1, maxX - minX + 1);
    const height = Math.max(1, maxY - minY + 1);
    const centerX = Math.floor(minX + width / 2);
    const centerY = Math.floor(minY + height / 2);
    return { minX, minY, maxX, maxY, width, height, centerX, centerY };
  };

  computeFullMapScale = (bounds: { width: number; height: number }) => {
    const maxWidthPixels = Math.floor(GameConstants.WIDTH * 0.9);
    const maxHeightPixels = Math.floor(GameConstants.HEIGHT * 0.9);
    const scaleX = Math.floor(maxWidthPixels / Math.max(1, bounds.width));
    const scaleY = Math.floor(maxHeightPixels / Math.max(1, bounds.height));
    const fit = Math.max(1, Math.min(scaleX, scaleY));
    return fit;
  };
  updateOffsetXY = () => {
    let diffX = this.offsetX - this.softOffsetX;
    let diffY = this.offsetY - this.softOffsetY;

    if (Math.abs(diffX) > 0.01) {
      this.softOffsetX += diffX * 0.1;
      this.softOffsetX = this.softOffsetX;
    } else this.softOffsetX = this.offsetX;
    if (Math.abs(diffY) > 0.01) {
      this.softOffsetY += diffY * 0.1;
      this.softOffsetY = this.softOffsetY;
    } else this.softOffsetY = this.offsetY;
  };

  // Fog of war methods
  updateSeenTiles = () => {
    const playerX = Math.floor(this.player.x);
    const playerY = Math.floor(this.player.y);
    const currentMapGroup = this.game.room.mapGroup.toString();

    // Get or create seen tiles set for current map group
    if (!this.seenTilesByMapGroup.has(currentMapGroup)) {
      this.seenTilesByMapGroup.set(currentMapGroup, new Set<string>());
    }
    const seenTiles = this.seenTilesByMapGroup.get(currentMapGroup)!;

    // Add tiles within circular radius around player to seen tiles
    for (let dx = -this.visibilityRadius; dx <= this.visibilityRadius; dx++) {
      for (let dy = -this.visibilityRadius; dy <= this.visibilityRadius; dy++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= this.visibilityRadius) {
          const tileKey = `${playerX + dx},${playerY + dy}`;
          seenTiles.add(tileKey);
        }
      }
    }
  };

  isTileSeen = (x: number, y: number): boolean => {
    if (!this.currentSeenTiles) return false;
    const tileKey = `${Math.floor(x)},${Math.floor(y)}`;
    return this.currentSeenTiles.has(tileKey);
  };

  draw = (delta: number) => {
    // Skip all work when map disabled and not forced open
    if (
      !GameConstants.MAP_ENABLED &&
      !this.mapOpen &&
      this.mapOpenProgress === 0
    )
      return;
    this.updateSeenTiles(); // Update fog of war
    this.updateOffsetXY();
    this.renderMap(delta);
  };

  setInitialCanvasSettings = (alpha: number) => {
    Game.ctx.globalAlpha = alpha;
    Game.ctx.globalCompositeOperation = "source-over";
  };

  translateCanvas = (offset: number) => {
    const s = this.scale;
    if (this.mapOpen || this.mapOpenProgress > 0) {
      // Interpolate from minimap anchor + player tile to screen center + discovered center
      const t = this.easeInOut(this.mapOpenProgress);
      const startAnchorX = Math.floor((5 / 6) * GameConstants.WIDTH);
      const startAnchorY = Math.floor((1 / 6) * GameConstants.HEIGHT);
      const endAnchorX = Math.floor(GameConstants.WIDTH / 2);
      const endAnchorY = Math.floor(GameConstants.HEIGHT / 2);

      const bounds = this.getDiscoveredBounds();
      const startTileX = this.player.x;
      const startTileY = this.player.y;
      const endTileX = bounds.centerX;
      const endTileY = bounds.centerY;

      const anchorX = Math.floor(
        startAnchorX + (endAnchorX - startAnchorX) * t,
      );
      const anchorY = Math.floor(
        startAnchorY + (endAnchorY - startAnchorY) * t,
      );
      const focusTileX = startTileX + (endTileX - startTileX) * t;
      const focusTileY = startTileY + (endTileY - startTileY) * t;

      Game.ctx.translate(
        anchorX - Math.floor(focusTileX * s),
        anchorY - Math.floor(focusTileY * s) - offset,
      );
    } else if (GameplaySettings.LEGACY_MINIMAP) {
      // Legacy behavior: original top-right anchored, room-offset based translation
      Game.ctx.translate(
        Math.floor(0.95 * GameConstants.WIDTH) -
          15 * s -
          Math.floor(this.softOffsetX),
        Math.floor(0.05 * GameConstants.HEIGHT) -
          1 * s -
          offset -
          Math.floor(this.softOffsetY),
      );
    } else {
      // New behavior: player-centered with the player's map position inset 1/6 from right and 1/6 from top
      const anchorX = Math.floor((5 / 6) * GameConstants.WIDTH); // 1/6 in from right
      const anchorY = Math.floor((1 / 6) * GameConstants.HEIGHT); // 1/6 in from top
      Game.ctx.translate(
        anchorX - Math.floor(this.player.x * s),
        anchorY - Math.floor(this.player.y * s) - offset,
      );
    }
  };

  drawBackdrop = (progress: number) => {
    const alpha = Math.max(0, Math.min(1, progress)) * 0.25; // 25% max opacity
    if (alpha <= 0.001) return;
    Game.ctx.save();
    Game.ctx.globalCompositeOperation = "source-over";
    Game.ctx.globalAlpha = alpha;
    Game.ctx.fillStyle = "#808080"; // 50% gray
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.restore();
  };

  updateMapAnimation = (delta: number) => {
    const target = this.mapOpen ? 1 : 0;
    const step = this.mapAnimationSpeed * (delta || 1);
    if (this.mapOpenProgress < target) {
      this.mapOpenProgress = Math.min(1, this.mapOpenProgress + step);
    } else if (this.mapOpenProgress > target) {
      this.mapOpenProgress = Math.max(0, this.mapOpenProgress - step);
    }
  };

  easeInOut = (t: number): number => {
    // Quadratic ease-in-out
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };

  drawRoom = (data, delta: number) => {
    // In legacy mode, render base room outline and fog overlay
    if (GameplaySettings.LEGACY_MINIMAP) {
      this.drawRoomOutline(data.room);
    }

    // In new mode, draw floor per-tile within radius so background isn't transparent
    if (!GameplaySettings.LEGACY_MINIMAP) {
      this.drawRoomFloorTiles(data.room);
    }

    this.drawRoomWalls(data.walls);
    this.drawRoomDoors(data.doors);
    this.drawRoomEntities(data.entities);
    this.drawRoomItems(data.items);
    this.drawRoomPlayers(data.players, delta);
    this.drawRoomDownLadders(data.downLadders);

    // Draw fog-of-war using mode-specific behavior (skip if using single mask pass)
    if (!this.suppressPerRoomFog) this.drawFogOfWar(data.room);
  };

  // Single-pass fog-of-war over all rooms to avoid intermediate unmasked states
  applyFogOfWarAllRooms = () => {
    if (this.mapOpen) return; // no fog when full map is open
    const s = this.scale;
    const currentMapGroup = this.game.room.mapGroup.toString();
    let seenTiles = this.seenTilesByMapGroup.get(currentMapGroup);
    if (this.mapData.length > 0 && this.mapData[0].seenTiles) {
      seenTiles = this.mapData[0].seenTiles;
    }
    Game.ctx.save();
    Game.ctx.globalCompositeOperation = GameplaySettings.LEGACY_MINIMAP
      ? "source-over"
      : "destination-out";
    Game.ctx.fillStyle = GameplaySettings.LEGACY_MINIMAP
      ? "#1a1a1a"
      : "rgba(0,0,0,1)";
    for (const data of this.mapData) {
      const room = data.room;
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          // In non-legacy minimap, also restrict mask to square bounds for performance
          if (!GameplaySettings.LEGACY_MINIMAP && this.mapOpenProgress === 0) {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            if (
              ix < this.frameMaskMinX ||
              ix > this.frameMaskMaxX ||
              iy < this.frameMaskMinY ||
              iy > this.frameMaskMaxY
            )
              continue;
          } else if (!GameplaySettings.LEGACY_MINIMAP) {
            // During transition, still respect expanding radius
            if (!this.isWithinDrawRadius(x, y)) continue;
          }
          const tileKey = `${Math.floor(x)},${Math.floor(y)}`;
          if (!seenTiles || !seenTiles.has(tileKey)) {
            Game.ctx.fillRect(x * s, y * s, 1 * s, 1 * s);
          }
        }
      }
    }
    Game.ctx.restore();
  };

  drawRoomFloorTiles = (room) => {
    const s = this.scale;
    Game.ctx.save();
    // Restrict iteration to bounding box around mask/radius
    const minX = Math.max(
      room.roomX,
      Math.min(this.framePlayerX - this.effectiveRadius, this.frameMaskMinX),
    );
    const maxX = Math.min(
      room.roomX + room.width - 1,
      Math.max(this.framePlayerX + this.effectiveRadius, this.frameMaskMaxX),
    );
    const minY = Math.max(
      room.roomY,
      Math.min(this.framePlayerY - this.effectiveRadius, this.frameMaskMinY),
    );
    const maxY = Math.min(
      room.roomY + room.height - 1,
      Math.max(this.framePlayerY + this.effectiveRadius, this.frameMaskMaxY),
    );
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (this.shouldDrawTile(x, y)) {
          const isPerimeter =
            x === room.roomX ||
            x === room.roomX + room.width - 1 ||
            y === room.roomY ||
            y === room.roomY + room.height - 1;
          Game.ctx.fillStyle = isPerimeter ? "#5A5A5A" : "#0a0a0a";
          Game.ctx.fillRect(x * s, y * s, 1 * s, 1 * s);
        }
      }
    }
    Game.ctx.restore();
  };

  // Helper checks for new minimap behavior
  getEffectiveDrawRadius = (): number => {
    // Always apply a circular radius; while opening, expand it up to a very large value
    const t = this.easeInOut?.(this.mapOpenProgress ?? 0) ?? 0;
    const maxRadius = 10000; // effectively infinite for our purposes
    return Math.floor(this.drawRadius + (maxRadius - this.drawRadius) * t);
  };

  isWithinDrawRadius = (x: number, y: number): boolean => {
    // In non-legacy minimap mode (not mapOpen), use square 50x50 mask bounds instead of radius
    if (
      !GameplaySettings.LEGACY_MINIMAP &&
      !this.mapOpen &&
      this.mapOpenProgress === 0
    ) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      return (
        ix >= this.frameMaskMinX &&
        ix <= this.frameMaskMaxX &&
        iy >= this.frameMaskMinY &&
        iy <= this.frameMaskMaxY
      );
    }
    const dx = Math.floor(x) - this.framePlayerX;
    const dy = Math.floor(y) - this.framePlayerY;
    return dx * dx + dy * dy <= this.effectiveRadiusSq;
  };

  shouldDrawTile = (x: number, y: number): boolean => {
    if (GameplaySettings.LEGACY_MINIMAP) return true;
    const within = this.isWithinDrawRadius(x, y);
    if (!within) return false;
    // During full-open, only draw discovered tiles; during transition and minimap, draw regardless of seen
    if (this.mapOpen) return this.isTileSeen(x, y);
    return true;
  };

  // Add fog of war overlay/erase method
  drawFogOfWar = (room) => {
    if (this.mapOpen) return; // full map: no mask; during transition, still apply mask
    const s = this.scale;
    // Use the seen tiles from the current mapData if available
    const currentMapGroup = this.game.room.mapGroup.toString();
    let seenTiles = this.seenTilesByMapGroup.get(currentMapGroup);
    if (this.mapData.length > 0 && this.mapData[0].seenTiles) {
      seenTiles = this.mapData[0].seenTiles;
    }

    if (GameplaySettings.LEGACY_MINIMAP) {
      // Legacy: paint a dark overlay on unseen tiles
      Game.ctx.save();
      Game.ctx.globalCompositeOperation = "source-over";
      Game.ctx.fillStyle = "#1a1a1a";
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          const tileKey = `${Math.floor(x)},${Math.floor(y)}`;
          if (!seenTiles || !seenTiles.has(tileKey)) {
            Game.ctx.fillRect(x * s, y * s, 1 * s, 1 * s);
          }
        }
      }
      Game.ctx.restore();
    } else {
      // New: erase unseen tiles so the game canvas shows through
      Game.ctx.save();
      Game.ctx.globalCompositeOperation = "destination-out";
      Game.ctx.fillStyle = "rgba(0,0,0,1)";
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          if (!this.isWithinDrawRadius(x, y)) continue; // uses effective radius during transition
          const tileKey = `${Math.floor(x)},${Math.floor(y)}`;
          if (!seenTiles || !seenTiles.has(tileKey)) {
            Game.ctx.fillRect(x * s, y * s, 1 * s, 1 * s);
          }
        }
      }
      Game.ctx.restore();
    }
  };

  // Minimap bounds for click/tap hit-testing (non-legacy mode)
  getMinimapAnchor = () => {
    const s = this.scale;
    if (GameplaySettings.LEGACY_MINIMAP) {
      // Approximate legacy anchor near top-right
      const x = Math.floor(0.95 * GameConstants.WIDTH);
      const y = Math.floor(0.05 * GameConstants.HEIGHT);
      return { x, y, radiusPx: this.drawRadius * s };
    }
    const x = Math.floor((5 / 6) * GameConstants.WIDTH);
    const y = Math.floor((1 / 6) * GameConstants.HEIGHT);
    return { x, y, radiusPx: this.drawRadius * s };
  };

  isPointInMinimapBounds = (screenX: number, screenY: number): boolean => {
    if (this.mapOpen) return false;
    const { x, y, radiusPx } = this.getMinimapAnchor();
    const dx = screenX - x;
    const dy = screenY - y;
    return dx * dx + dy * dy <= radiusPx * radiusPx;
  };

  drawRoomOutline = (level) => {
    const s = this.scale;
    // Use ladder presence (not RoomType) so ladder placement can vary without retyping rooms.
    let outline = "#5A5A5A";
    try {
      const hasUp = level?.hasLadder?.("up") === true;
      const hasDownMain = level?.hasMainDownLadder?.() === true;
      if (hasUp && hasDownMain) outline = "#4B1460"; // both ladders
      else if (hasUp) outline = "#101460";
      else if (hasDownMain) outline = "#601410";
    } catch {}
    Game.ctx.fillStyle = outline;
    Game.ctx.fillRect(
      level.roomX * s + 0,
      level.roomY * s + 0,
      level.width * s - 0,
      level.height * s - 0,
    );
    Game.ctx.fillStyle = "black";
    Game.ctx.fillRect(
      level.roomX * s + 1,
      level.roomY * s + 1,
      level.width * s - 2,
      level.height * s - 2,
    );
  };

  drawRoomWalls = (walls) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const wall of walls) {
      // Skip if outside mask/radius bounds to reduce work
      if (!this.shouldDrawTile(wall.x, wall.y)) continue;
      Game.ctx.fillStyle = "#404040";
      Game.ctx.fillRect(wall.x * s, wall.y * s, 1 * s, 1 * s);
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomDoors = (doors) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const door of doors) {
      if (!this.shouldDrawTile(door.x, door.y)) continue;
      if (door.opened === false) Game.ctx.fillStyle = "#5A5A5A";
      if (door.opened === true) {
        Game.ctx.fillStyle = "black";
        Game.ctx.fillRect(door.x * s, door.y * s, 1 * s, 1 * s);
      }
      Game.ctx.fillStyle = "#5A5A5A"; // Reset to default after each door
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomPlayers = (players, delta: number) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const i in players) {
      Game.ctx.fillStyle = "white";
      if (
        this.game.levels[players[i].depth].rooms[players[i].levelID]
          .mapGroup === this.game.room.mapGroup
      ) {
        if (this.shouldDrawTile(players[i].x, players[i].y)) {
          Game.ctx.fillRect(players[i].x * s, players[i].y * s, 1 * s, 1 * s);
        }
      }
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawUnderRoomPlayers = (players, delta: number) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const i in players) {
      this.game.rooms[players[i].levelID].mapGroup === this.game.room.mapGroup;
      {
        if (Math.floor(Date.now() / 300) % 2) {
          Game.ctx.fillStyle = "#4D8C8C";
          // Draw 3x3 outline box around player
          Game.ctx.fillRect(
            (players[i].x - 1) * s,
            (players[i].y - 1) * s,
            1 * s,
            1 * s,
          ); // Top left
          Game.ctx.fillRect(
            players[i].x * s,
            (players[i].y - 1) * s,
            1 * s,
            1 * s,
          ); // Top middle
          Game.ctx.fillRect(
            (players[i].x + 1) * s,
            (players[i].y - 1) * s,
            1 * s,
            1 * s,
          ); // Top right
          Game.ctx.fillRect(
            (players[i].x - 1) * s,
            players[i].y * s,
            1 * s,
            1 * s,
          ); // Middle left
          Game.ctx.fillRect(
            (players[i].x + 1) * s,
            players[i].y * s,
            1 * s,
            1 * s,
          ); // Middle right
          Game.ctx.fillRect(
            (players[i].x - 1) * s,
            (players[i].y + 1) * s,
            1 * s,
            1 * s,
          ); // Bottom left
          Game.ctx.fillRect(
            players[i].x * s,
            (players[i].y + 1) * s,
            1 * s,
            1 * s,
          ); // Bottom middle
          Game.ctx.fillRect(
            (players[i].x + 1) * s,
            (players[i].y + 1) * s,
            1 * s,
            1 * s,
          ); // Bottom right
        }
      }
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomEntities = (entities) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const enemy of entities) {
      if (!this.shouldDrawTile(enemy.x, enemy.y)) continue;
      this.setEntityColor(enemy);
      Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s);
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomDownLadders = (downLadders) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const downLadder of downLadders) {
      if (!this.shouldDrawTile(downLadder.x, downLadder.y)) continue;
      Game.ctx.fillStyle = "#00FFFF";
      Game.ctx.fillRect(downLadder.x * s, downLadder.y * s, 1 * s, 1 * s);
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  setEntityColor = (enemy) => {
    // No need to save/restore here as only fillStyle is being set
    if (enemy.type === EntityType.ENEMY) {
      Game.ctx.fillStyle = "yellow";
    }
    if (enemy.type === EntityType.PROP) {
      Game.ctx.fillStyle = "#847e87";
    }
    if (enemy.type === EntityType.RESOURCE) {
      Game.ctx.fillStyle = "#5a595b";
    }
    if (enemy.type === EntityType.FRIENDLY) {
      Game.ctx.fillStyle = "cyan";
    }
  };

  drawRoomItems = (items) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const item of items) {
      const x = item.x;
      const y = item.y;
      if (!this.shouldDrawTile(x, y)) continue;
      Game.ctx.fillStyle = "#ac3232";
      if (!item.pickedUp) {
        Game.ctx.fillRect(x * s, y * s, 1 * s, 1 * s);
      }
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  resetCanvasTransform = () => {
    Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
}
