/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/astarclass.ts":
/*!***************************!*\
  !*** ./src/astarclass.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.astar = void 0;
var entity_1 = __webpack_require__(/*! ./entity/entity */ "./src/entity/entity.ts");
var astar;
(function (astar_1) {
    //================== start graph js
    /*
    graph.js http://github.com/bgrins/javascript-astar
    MIT License
    Creates a Graph class used in the astar search algorithm.
    Includes Binary Heap (with modifications) from Marijn Haverbeke
        URL: http://eloquentjavascript.net/appendix2.html
        License: http://creativecommons.org/licenses/by/3.0/
    */
    var GraphNodeType;
    (function (GraphNodeType) {
        GraphNodeType[GraphNodeType["WALL"] = 0] = "WALL";
        GraphNodeType[GraphNodeType["OPEN"] = 1] = "OPEN";
    })(GraphNodeType = astar_1.GraphNodeType || (astar_1.GraphNodeType = {}));
    var getTileCost = function (tile) {
        if (tile)
            return tile.isSolid() || tile.isDoor ? 99999999 : 1;
        else
            return 99999999;
    };
    var Graph = /** @class */ (function () {
        function Graph(grid) {
            this.elements = grid;
            var nodes = [];
            var row, rowLength, len = grid.length;
            for (var x = 0; x < len; ++x) {
                row = grid[x];
                rowLength = row.length;
                nodes[x] = new Array(rowLength); // optimum array with size
                for (var y = 0; y < rowLength; ++y) {
                    nodes[x][y] = new GraphNode(x, y, row[y]);
                }
            }
            this.nodes = nodes;
        }
        Graph.prototype.toString = function () {
            var graphString = "\n";
            var nodes = this.nodes;
            var rowDebug, row, y, l;
            for (var x = 0, len = nodes.length; x < len;) {
                rowDebug = "";
                row = nodes[x++];
                for (y = 0, l = row.length; y < l;) {
                    rowDebug += row[y++].type + " ";
                }
                graphString = graphString + rowDebug + "\n";
            }
            return graphString;
        };
        return Graph;
    }());
    astar_1.Graph = Graph;
    var GraphNode = /** @class */ (function () {
        function GraphNode(x, y, type) {
            this.data = {};
            this.x = x;
            this.y = y;
            this.pos = { x: x, y: y };
            this.type = type;
        }
        GraphNode.prototype.toString = function () {
            return "[" + this.x + " " + this.y + "]";
        };
        GraphNode.prototype.isWall = function () {
            return this.type == GraphNodeType.WALL;
        };
        return GraphNode;
    }());
    astar_1.GraphNode = GraphNode;
    var BinaryHeap = /** @class */ (function () {
        function BinaryHeap(scoreFunction) {
            this.content = [];
            this.scoreFunction = scoreFunction;
        }
        BinaryHeap.prototype.push = function (node) {
            // Add the new node to the end of the array.
            this.content.push(node);
            // Allow it to sink down.
            this.sinkDown(this.content.length - 1);
        };
        BinaryHeap.prototype.pop = function () {
            // Store the first node so we can return it later.
            var result = this.content[0];
            // Get the node at the end of the array.
            var end = this.content.pop();
            // If there are any elements left, put the end node at the
            // start, and let it bubble up.
            if (this.content.length > 0) {
                this.content[0] = end;
                this.bubbleUp(0);
            }
            return result;
        };
        BinaryHeap.prototype.remove = function (node) {
            var i = this.content.indexOf(node);
            // When it is found, the process seen in 'pop' is repeated
            // to fill up the hole.
            var end = this.content.pop();
            if (i !== this.content.length - 1) {
                this.content[i] = end;
                if (this.scoreFunction(end) < this.scoreFunction(node))
                    this.sinkDown(i);
                else
                    this.bubbleUp(i);
            }
        };
        BinaryHeap.prototype.size = function () {
            return this.content.length;
        };
        BinaryHeap.prototype.rescoreElement = function (node) {
            this.sinkDown(this.content.indexOf(node));
        };
        BinaryHeap.prototype.sinkDown = function (n) {
            // Fetch the element that has to be sunk.
            var element = this.content[n];
            // When at 0, an element can not sink any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                var parentN = ((n + 1) >> 1) - 1, parent = this.content[parentN];
                // Swap the elements if the parent is greater.
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                    this.content[parentN] = element;
                    this.content[n] = parent;
                    // Update 'n' to continue at the new position.
                    n = parentN;
                }
                else {
                    // Found a parent that is less, no need to sink any further.
                    break;
                }
            }
        };
        BinaryHeap.prototype.bubbleUp = function (n) {
            // Look up the target element and its score.
            var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);
            while (true) {
                // Compute the indices of the child elements.
                var child2N = (n + 1) << 1, child1N = child2N - 1;
                // This is used to store the new position of the element,
                // if any.
                var swap = null;
                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    var child1 = this.content[child1N], child1Score = this.scoreFunction(child1);
                    // If the score is less than our element's, we need to swap.
                    if (child1Score < elemScore)
                        swap = child1N;
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap === null ? elemScore : child1Score))
                        swap = child2N;
                }
                // If the element needs to be moved, swap it, and continue.
                if (swap !== null) {
                    this.content[n] = this.content[swap];
                    this.content[swap] = element;
                    n = swap;
                }
                else {
                    // Otherwise, we are done.
                    break;
                }
            }
        };
        return BinaryHeap;
    }());
    astar_1.BinaryHeap = BinaryHeap;
    var AStar = /** @class */ (function () {
        function AStar(grid, disablePoints, enableCost) {
            this.grid = [];
            for (var x = 0, xl = grid.length; x < xl; x++) {
                this.grid[x] = [];
                for (var y = 0, yl = grid[x].length; y < yl; y++) {
                    var cost = getTileCost(grid[x][y]);
                    this.grid[x][y] = {
                        org: grid[x][y],
                        f: 0,
                        g: 0,
                        h: 0,
                        cost: cost,
                        visited: false,
                        closed: false,
                        pos: {
                            x: x,
                            y: y,
                        },
                        parent: null,
                    };
                }
            }
            if (disablePoints !== undefined) {
                for (var i = 0; i < disablePoints.length; i++) {
                    if (disablePoints[i].x >= 0 &&
                        disablePoints[i].x < this.grid.length &&
                        disablePoints[i].y >= 0 &&
                        disablePoints[i].y < this.grid[0].length)
                        this.grid[disablePoints[i].x][disablePoints[i].y].cost = 99999999;
                }
            }
        }
        AStar.prototype.heap = function () {
            return new BinaryHeap(function (node) {
                return node.f;
            });
        };
        AStar.prototype._find = function (org) {
            for (var x = 0; x < this.grid.length; x++)
                for (var y = 0; y < this.grid[x].length; y++)
                    if (this.grid[x][y].org == org)
                        return this.grid[x][y];
        };
        AStar.prototype._search = function (start, end, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni) {
            heuristic = heuristic || this.manhattan;
            diagonal = !!diagonal;
            diagonalsOnly = !!diagonalsOnly;
            turnCostsExtra = !!turnCostsExtra;
            diagonalsOmni = !!diagonalsOmni;
            var openHeap = this.heap();
            var _start, _end;
            if (start.x !== undefined && start.y !== undefined)
                _start = this.grid[start.x][start.y];
            else
                _start = this._find(start);
            if (end.x !== undefined && end.y !== undefined)
                _end = this.grid[end.x][end.y];
            else
                _end = this._find(end);
            if (AStar.NO_CHECK_START_POINT == false && _start.cost <= 0)
                return [];
            openHeap.push(_start);
            while (openHeap.size() > 0) {
                // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
                var currentNode = openHeap.pop();
                // End case -- result has been found, return the traced path.
                if (currentNode === _end) {
                    var curr = currentNode;
                    var ret = [];
                    while (curr.parent) {
                        ret.push(curr);
                        curr = curr.parent;
                    }
                    return ret.reverse();
                }
                // Normal case -- move currentNode from open to closed, process each of its neighbors.
                currentNode.closed = true;
                // Find all neighbors for the current node. Optionally find diagonal neighbors as well (false by default).
                var neighbors = this.neighbors(currentNode, diagonal, diagonalsOnly, diagonalsOmni);
                for (var i = 0, il = neighbors.length; i < il; i++) {
                    var neighbor = neighbors[i];
                    if (neighbor.closed || neighbor.cost <= 0) {
                        // Not a valid node to process, skip to next neighbor.
                        continue;
                    }
                    // The g score is the shortest distance from start to current node.
                    // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                    var gScore = currentNode.g + neighbor.cost;
                    if (turnCostsExtra) {
                        var isTurn = false;
                        if (currentNode.parent)
                            isTurn = !((currentNode.parent.pos.x === currentNode.pos.x &&
                                currentNode.pos.x === neighbor.pos.x) ||
                                (currentNode.parent.pos.y === currentNode.pos.y &&
                                    currentNode.pos.y === neighbor.pos.y));
                        else {
                            // initial step
                            isTurn = true;
                            if (neighbor.pos.x - currentNode.pos.x === 0 &&
                                neighbor.pos.y - currentNode.pos.y === -1 &&
                                turnDirection === entity_1.EntityDirection.UP)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === 0 &&
                                neighbor.pos.y - currentNode.pos.y === 1 &&
                                turnDirection === entity_1.EntityDirection.DOWN)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === 1 &&
                                neighbor.pos.y - currentNode.pos.y === 0 &&
                                turnDirection === entity_1.EntityDirection.RIGHT)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === -1 &&
                                neighbor.pos.y - currentNode.pos.y === 0 &&
                                turnDirection === entity_1.EntityDirection.LEFT)
                                isTurn = false;
                        }
                        if (isTurn)
                            gScore++;
                    }
                    var beenVisited = neighbor.visited;
                    if (!beenVisited || gScore < neighbor.g) {
                        // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                        neighbor.visited = true;
                        neighbor.parent = currentNode;
                        neighbor.h = neighbor.h || heuristic(neighbor.pos, _end.pos);
                        neighbor.g = gScore;
                        neighbor.f = neighbor.g + neighbor.h;
                        if (!beenVisited) {
                            // Pushing to heap will put it in proper place based on the 'f' value.
                            openHeap.push(neighbor);
                        }
                        else {
                            // Already seen the node, but since it has been rescored we need to reorder it in the heap
                            openHeap.rescoreElement(neighbor);
                        }
                    }
                }
            }
            // No result was found - empty array signifies failure to find path.
            return [];
        };
        AStar.search = function (grid, start, end, disablePoints, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni) {
            var astar = new AStar(grid, disablePoints);
            return astar._search(start, end, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni);
        };
        AStar.prototype.manhattan = function (pos0, pos1) {
            // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        };
        AStar.prototype.neighbors = function (node, diagonals, diagonalsOnly, diagonalsOmni) {
            var grid = this.grid;
            var ret = [];
            var x = node.pos.x;
            var y = node.pos.y;
            if (!diagonalsOnly) {
                // West
                if (grid[x - 1] && grid[x - 1][y]) {
                    ret.push(grid[x - 1][y]);
                }
                // East
                if (grid[x + 1] && grid[x + 1][y]) {
                    ret.push(grid[x + 1][y]);
                }
                // South
                if (grid[x] && grid[x][y - 1]) {
                    ret.push(grid[x][y - 1]);
                }
                // North
                if (grid[x] && grid[x][y + 1]) {
                    ret.push(grid[x][y + 1]);
                }
            }
            if (diagonals) {
                // Southwest
                if (grid[x - 1] && grid[x - 1][y - 1]) {
                    ret.push(grid[x - 1][y - 1]);
                }
                // Southeast
                if (grid[x + 1] && grid[x + 1][y - 1]) {
                    ret.push(grid[x + 1][y - 1]);
                }
                // Northwest
                if (grid[x - 1] && grid[x - 1][y + 1]) {
                    ret.push(grid[x - 1][y + 1]);
                }
                // Northeast
                if (grid[x + 1] && grid[x + 1][y + 1]) {
                    ret.push(grid[x + 1][y + 1]);
                }
            }
            function getRandomBoolean() {
                return Math.random() < 0.5;
            }
            if (diagonalsOmni) {
                var randomBool = getRandomBoolean();
                // West
                if (grid[x - 1] && grid[x - 1][y]) {
                    // Instead of pushing West, choose between Southwest and Northwest
                    if (randomBool == true) {
                        ret.push(grid[x - 1][y - 1]);
                        return;
                    }
                    else {
                        ret.push(grid[x - 1][y + 1]);
                        return;
                    }
                }
                // East
                if (grid[x + 1] && grid[x + 1][y]) {
                    if (randomBool == true) {
                        ret.push(grid[x + 1][y - 1]);
                        return;
                    }
                    else {
                        ret.push(grid[x + 1][y + 1]);
                        return;
                    }
                }
                // South
                if (grid[x] && grid[x][y - 1]) {
                    if (randomBool == true) {
                        ret.push(grid[x - 1][y - 1]);
                        return;
                    }
                    else {
                        ret.push(grid[x + 1][y - 1]);
                        return;
                    }
                }
                // North
                if (grid[x] && grid[x][y + 1]) {
                    if (randomBool == true) {
                        ret.push(grid[x - 1][y + 1]);
                        return;
                    }
                    else {
                        ret.push(grid[x + 1][y + 1]);
                        return;
                    }
                }
                else {
                    return;
                }
            }
            return ret;
        };
        AStar.NO_CHECK_START_POINT = false;
        return AStar;
    }());
    astar_1.AStar = AStar;
})(astar = exports.astar || (exports.astar = {}));


/***/ }),

/***/ "./src/drawable.ts":
/*!*************************!*\
  !*** ./src/drawable.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Drawable = void 0;
var Drawable = /** @class */ (function () {
    function Drawable() {
        this.drawableY = 0;
        this.draw = function (delta) { };
    }
    return Drawable;
}());
exports.Drawable = Drawable;


/***/ }),

/***/ "./src/entity/enemy/armoredzombieEnemy.ts":
/*!************************************************!*\
  !*** ./src/entity/enemy/armoredzombieEnemy.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArmoredzombieEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var armor_1 = __webpack_require__(/*! ../../item/armor */ "./src/item/armor.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var ArmoredzombieEnemy = /** @class */ (function (_super) {
    __extends(ArmoredzombieEnemy, _super);
    function ArmoredzombieEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                //this.facePlayer(playerHitBy); //
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (!_this.seenPlayer)
                    _this.lookForPlayer();
                else if (_this.seenPlayer) {
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.room.roomArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        var grid = [];
                        for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                    grid[x][y] = _this.room.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction);
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var oldDir = _this.direction;
                            var player = _this.targetPlayer;
                            _this.facePlayer(player);
                            if (moveX > oldX)
                                _this.direction = entity_1.EntityDirection.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = entity_1.EntityDirection.LEFT;
                            else if (moveY > oldY)
                                _this.direction = entity_1.EntityDirection.DOWN;
                            else if (moveY < oldY)
                                _this.direction = entity_1.EntityDirection.UP;
                            if (oldDir == _this.direction) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moveX &&
                                        _this.game.players[i].y === moveY &&
                                        oldDir == _this.direction) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moveX, moveY);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                        }
                        if (_this.direction == entity_1.EntityDirection.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.UP) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        _this.makeHitWarnings();
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    _this.makeHitWarnings();
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.tileX = 27;
                _this.tileY = 8;
                if (_this.health <= 1) {
                    _this.tileX = 17;
                    _this.tileY = 8;
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 5 ? Math.floor(_this.frame) : 0), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 1;
        _this.tileX = 17;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        _this.name = "armored zombie";
        _this.forwardOnlyAttack = true;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.05)
                _this.drop = new armor_1.Armor(_this.room, 0, 0);
            else if (dropProb < 0.01)
                _this.drop = new greengem_1.GreenGem(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return ArmoredzombieEnemy;
}(enemy_1.Enemy));
exports.ArmoredzombieEnemy = ArmoredzombieEnemy;


/***/ }),

/***/ "./src/entity/enemy/bigKnightEnemy.ts":
/*!********************************************!*\
  !*** ./src/entity/enemy/bigKnightEnemy.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BigKnightEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../../hitWarning */ "./src/hitWarning.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var redgem_1 = __webpack_require__(/*! ../../item/redgem */ "./src/item/redgem.ts");
var spear_1 = __webpack_require__(/*! ../../weapon/spear */ "./src/weapon/spear.ts");
var gameConstants_1 = __webpack_require__(/*! ../../gameConstants */ "./src/gameConstants.ts");
var deathParticle_1 = __webpack_require__(/*! ../../particle/deathParticle */ "./src/particle/deathParticle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var BigKnightEnemy = /** @class */ (function (_super) {
    __extends(BigKnightEnemy, _super);
    function BigKnightEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.REGEN_TICKS = 5;
        _this.addHitWarnings = function () {
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y + 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 2, _this.y, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 2, _this.y + 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y - 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 2, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y + 2, _this.x, _this.y));
        };
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.ticksSinceFirstHit = 0;
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 1, _this.y + 1, _this.deathParticleColor);
            }
        };
        _this.killNoBones = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 1, _this.y + 1, _this.deathParticleColor);
            _this.room.particles.push(new deathParticle_1.DeathParticle(_this.x + 0.5, _this.y + 0.5));
            _this.dropLoot();
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (_this.health == 1) {
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.health++;
                        _this.ticksSinceFirstHit = 0;
                    }
                }
                else {
                    _this.ticks++;
                    if (!_this.seenPlayer) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4) {
                                _this.targetPlayer = player;
                                _this.facePlayer(player);
                                _this.seenPlayer = true;
                                if (player === _this.game.players[_this.game.localPlayerID])
                                    _this.alertTicks = 1;
                                if (_this.health >= 3)
                                    _this.addHitWarnings();
                            }
                        }
                    }
                    else if (_this.seenPlayer) {
                        if (_this.room.playerTicked === _this.targetPlayer) {
                            _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var moveX = _this.x;
                            var moveY = _this.y;
                            if (_this.ticks % 2 === 0) {
                                // horizontal preference
                                if (_this.targetPlayer.x >= _this.x + _this.w)
                                    moveX++;
                                else if (_this.targetPlayer.x < _this.x)
                                    moveX--;
                                else if (_this.targetPlayer.y >= _this.y + _this.h)
                                    moveY++;
                                else if (_this.targetPlayer.y < _this.y)
                                    moveY--;
                            }
                            else {
                                // vertical preference
                                if (_this.targetPlayer.y >= _this.y + _this.h)
                                    moveY++;
                                else if (_this.targetPlayer.y < _this.y)
                                    moveY--;
                                else if (_this.targetPlayer.x >= _this.x + _this.w)
                                    moveX++;
                                else if (_this.targetPlayer.x < _this.x)
                                    moveX--;
                            }
                            var hitPlayer = false;
                            if (_this.health >= 3) {
                                var wouldHit = function (player, moveX, moveY) {
                                    return (player.x >= moveX &&
                                        player.x < moveX + _this.w &&
                                        player.y >= moveY &&
                                        player.y < moveY + _this.h);
                                };
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        wouldHit(_this.game.players[i], moveX, moveY)) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                            }
                            if (!hitPlayer) {
                                _this.tryMove(moveX, moveY);
                                _this.drawX = _this.x - oldX;
                                _this.drawY = _this.y - oldY;
                                if (_this.x > oldX)
                                    _this.direction = entity_1.EntityDirection.RIGHT;
                                else if (_this.x < oldX)
                                    _this.direction = entity_1.EntityDirection.LEFT;
                                else if (_this.y > oldY)
                                    _this.direction = entity_1.EntityDirection.DOWN;
                                else if (_this.y < oldY)
                                    _this.direction = entity_1.EntityDirection.UP;
                            }
                            if (_this.health < _this.maxHealth) {
                                _this.ticksSinceFirstHit++;
                                if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                                    _this.health++;
                                    _this.ticksSinceFirstHit = 0;
                                }
                            }
                            if (_this.health >= 3)
                                _this.addHitWarnings();
                        }
                        var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                        if (!_this.aggro || targetPlayerOffline) {
                            var p = _this.nearestPlayer();
                            if (p !== false) {
                                var distance = p[0], player = p[1];
                                if (distance <= 4 &&
                                    (targetPlayerOffline ||
                                        distance < _this.playerDistance(_this.targetPlayer))) {
                                    if (player !== _this.targetPlayer) {
                                        _this.targetPlayer = player;
                                        _this.facePlayer(player);
                                        if (player === _this.game.players[_this.game.localPlayerID])
                                            _this.alertTicks = 1;
                                        if (_this.health >= 3)
                                            _this.addHitWarnings();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(18, 0, 2, 2, _this.x - _this.drawX, _this.y - _this.drawY, 2, 2, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(2 * Math.floor((_this.tileX + _this.frame) / 2) + 1, _this.tileY, 2, 4, _this.x - _this.drawX, _this.y - 2.5 - _this.drawY, 2, 4, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x + 0.5, _this.y, true);
            _this.updateDrawXY(delta);
        };
        _this.dropLoot = function () {
            var dropOffsets = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 1 },
            ];
            for (var i = 0; i < _this.drops.length; i++) {
                _this.drops[i].level = _this.room;
                _this.drops[i].x = _this.x + dropOffsets[i].x;
                _this.drops[i].y = _this.y + dropOffsets[i].y;
                _this.room.items.push(_this.drops[i]);
            }
        };
        _this.w = 2;
        _this.h = 2;
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 4;
        _this.maxHealth = 4;
        _this.tileX = 29;
        _this.tileY = 0;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.ticksSinceFirstHit = 0;
        _this.flashingFrame = 0;
        _this.deathParticleColor = "#ffffff";
        _this.chainPushable = false;
        _this.name = "giant knight";
        _this.drops = [];
        if (drop)
            _this.drops.push(drop);
        while (_this.drops.length < 4) {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drops.push(new spear_1.Spear(_this.room, 0, 0));
            else if (dropProb < 0.04)
                _this.drops.push(new redgem_1.RedGem(_this.room, 0, 0));
            else if (dropProb < 0.075)
                _this.drops.push(new redgem_1.RedGem(_this.room, 0, 0));
            else if (dropProb < 0.1)
                _this.drops.push(new redgem_1.RedGem(_this.room, 0, 0));
            else
                _this.drops.push(new coin_1.Coin(_this.room, 0, 0));
        }
        return _this;
    }
    return BigKnightEnemy;
}(enemy_1.Enemy));
exports.BigKnightEnemy = BigKnightEnemy;


/***/ }),

/***/ "./src/entity/enemy/bigSkullEnemy.ts":
/*!*******************************************!*\
  !*** ./src/entity/enemy/bigSkullEnemy.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BigSkullEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../../hitWarning */ "./src/hitWarning.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var redgem_1 = __webpack_require__(/*! ../../item/redgem */ "./src/item/redgem.ts");
var spear_1 = __webpack_require__(/*! ../../weapon/spear */ "./src/weapon/spear.ts");
var gameConstants_1 = __webpack_require__(/*! ../../gameConstants */ "./src/gameConstants.ts");
var deathParticle_1 = __webpack_require__(/*! ../../particle/deathParticle */ "./src/particle/deathParticle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var BigSkullEnemy = /** @class */ (function (_super) {
    __extends(BigSkullEnemy, _super);
    function BigSkullEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.REGEN_TICKS = 5;
        _this.addHitWarnings = function () {
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x - 1, _this.y + 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 2, _this.y, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 2, _this.y + 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y - 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y - 1, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x, _this.y + 2, _this.x, _this.y));
            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.x + 1, _this.y + 2, _this.x, _this.y));
        };
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.ticksSinceFirstHit = 0;
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 1, _this.y + 1, _this.deathParticleColor);
            }
        };
        _this.killNoBones = function () {
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 1, _this.y + 1, _this.deathParticleColor);
            _this.room.particles.push(new deathParticle_1.DeathParticle(_this.x + 0.5, _this.y + 0.5));
            _this.dropLoot();
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (_this.health == 1) {
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.health++;
                        _this.ticksSinceFirstHit = 0;
                    }
                }
                else {
                    _this.ticks++;
                    if (!_this.seenPlayer) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4) {
                                _this.targetPlayer = player;
                                _this.facePlayer(player);
                                _this.seenPlayer = true;
                                if (player === _this.game.players[_this.game.localPlayerID])
                                    _this.alertTicks = 1;
                                if (_this.health >= 3)
                                    _this.addHitWarnings();
                            }
                        }
                    }
                    else if (_this.seenPlayer) {
                        if (_this.room.playerTicked === _this.targetPlayer) {
                            _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var moveX = _this.x;
                            var moveY = _this.y;
                            if (_this.ticks % 2 === 0) {
                                // horizontal preference
                                if (_this.targetPlayer.x >= _this.x + _this.w)
                                    moveX++;
                                else if (_this.targetPlayer.x < _this.x)
                                    moveX--;
                                else if (_this.targetPlayer.y >= _this.y + _this.h)
                                    moveY++;
                                else if (_this.targetPlayer.y < _this.y)
                                    moveY--;
                            }
                            else {
                                // vertical preference
                                if (_this.targetPlayer.y >= _this.y + _this.h)
                                    moveY++;
                                else if (_this.targetPlayer.y < _this.y)
                                    moveY--;
                                else if (_this.targetPlayer.x >= _this.x + _this.w)
                                    moveX++;
                                else if (_this.targetPlayer.x < _this.x)
                                    moveX--;
                            }
                            var hitPlayer = false;
                            if (_this.health >= 3) {
                                var wouldHit = function (player, moveX, moveY) {
                                    return (player.x >= moveX &&
                                        player.x < moveX + _this.w &&
                                        player.y >= moveY &&
                                        player.y < moveY + _this.h);
                                };
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        wouldHit(_this.game.players[i], moveX, moveY)) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                            }
                            if (!hitPlayer) {
                                _this.tryMove(moveX, moveY);
                                _this.drawX = _this.x - oldX;
                                _this.drawY = _this.y - oldY;
                                if (_this.x > oldX)
                                    _this.direction = entity_1.EntityDirection.RIGHT;
                                else if (_this.x < oldX)
                                    _this.direction = entity_1.EntityDirection.LEFT;
                                else if (_this.y > oldY)
                                    _this.direction = entity_1.EntityDirection.DOWN;
                                else if (_this.y < oldY)
                                    _this.direction = entity_1.EntityDirection.UP;
                            }
                            if (_this.health < _this.maxHealth) {
                                _this.ticksSinceFirstHit++;
                                if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                                    _this.health++;
                                    _this.ticksSinceFirstHit = 0;
                                }
                            }
                            if (_this.health >= 3)
                                _this.addHitWarnings();
                        }
                        var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                        if (!_this.aggro || targetPlayerOffline) {
                            var p = _this.nearestPlayer();
                            if (p !== false) {
                                var distance = p[0], player = p[1];
                                if (distance <= 4 &&
                                    (targetPlayerOffline ||
                                        distance < _this.playerDistance(_this.targetPlayer))) {
                                    if (player !== _this.targetPlayer) {
                                        _this.targetPlayer = player;
                                        _this.facePlayer(player);
                                        if (player === _this.game.players[_this.game.localPlayerID])
                                            _this.alertTicks = 1;
                                        if (_this.health >= 3)
                                            _this.addHitWarnings();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.tileX = 21;
                _this.tileY = 0;
                if (_this.health === 3) {
                    _this.tileX = 21;
                    _this.tileY = 4;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileY = 0;
                        }
                    }
                }
                else if (_this.health === 2) {
                    _this.tileX = 21;
                    _this.tileY = 8;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileY = 4;
                        }
                    }
                }
                else if (_this.health === 1) {
                    _this.tileX = 21;
                    _this.tileY = 12;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileY = 8;
                        }
                    }
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(18, 0, 2, 2, _this.x - _this.drawX, _this.y - _this.drawY, 2, 2, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 20 ? Math.floor(_this.frame) * 2 : 0), _this.tileY, 2, 4, _this.x - _this.drawX, _this.y - 2.5 - _this.drawY, 2, 4, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x + 0.5, _this.y, true);
            _this.updateDrawXY(delta);
        };
        _this.dropLoot = function () {
            var dropOffsets = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 1, y: 1 },
            ];
            for (var i = 0; i < _this.drops.length; i++) {
                _this.drops[i].level = _this.room;
                _this.drops[i].x = _this.x + dropOffsets[i].x;
                _this.drops[i].y = _this.y + dropOffsets[i].y;
                _this.room.items.push(_this.drops[i]);
            }
        };
        _this.w = 2;
        _this.h = 2;
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 4;
        _this.maxHealth = 4;
        _this.tileX = 21;
        _this.tileY = 0;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.ticksSinceFirstHit = 0;
        _this.flashingFrame = 0;
        _this.deathParticleColor = "#ffffff";
        _this.chainPushable = false;
        _this.name = "giant skeleton";
        _this.drops = [];
        if (drop)
            _this.drops.push(drop);
        while (_this.drops.length < 4) {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drops.push(new spear_1.Spear(_this.room, 0, 0));
            else if (dropProb < 0.04)
                _this.drops.push(new redgem_1.RedGem(_this.room, 0, 0));
            else if (dropProb < 0.075)
                _this.drops.push(new redgem_1.RedGem(_this.room, 0, 0));
            else if (dropProb < 0.1)
                _this.drops.push(new redgem_1.RedGem(_this.room, 0, 0));
            else
                _this.drops.push(new coin_1.Coin(_this.room, 0, 0));
        }
        return _this;
    }
    return BigSkullEnemy;
}(enemy_1.Enemy));
exports.BigSkullEnemy = BigSkullEnemy;


/***/ }),

/***/ "./src/entity/enemy/bishopEnemy.ts":
/*!*****************************************!*\
  !*** ./src/entity/enemy/bishopEnemy.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BishopEnemy = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var candle_1 = __webpack_require__(/*! ../../item/candle */ "./src/item/candle.ts");
var door_1 = __webpack_require__(/*! ../../tile/door */ "./src/tile/door.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var BishopEnemy = /** @class */ (function (_super) {
    __extends(BishopEnemy, _super);
    function BishopEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.tryMove = function (x, y) {
            var pointWouldBeIn = function (someX, someY) {
                return (someX >= x && someX < x + _this.w && someY >= y && someY < y + _this.h);
            };
            var enemyCollide = function (enemy) {
                if (enemy.x >= x + _this.w || enemy.x + enemy.w <= x)
                    return false;
                if (enemy.y >= y + _this.h || enemy.y + enemy.h <= y)
                    return false;
                return true;
            };
            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && enemyCollide(e)) {
                    return;
                }
            }
            for (var i in _this.game.players) {
                if (pointWouldBeIn(_this.game.players[i].x, _this.game.players[i].y)) {
                    return;
                }
            }
            var tiles = [];
            for (var xx = 0; xx < _this.w; xx++) {
                for (var yy = 0; yy < _this.h; yy++) {
                    if (!_this.room.roomArray[x + xx][y + yy].isSolid()) {
                        tiles.push(_this.room.roomArray[x + xx][y + yy]);
                    }
                    else {
                        return;
                    }
                }
            }
            for (var _b = 0, tiles_1 = tiles; _b < tiles_1.length; _b++) {
                var tile = tiles_1[_b];
                tile.onCollideEnemy(_this);
            }
            _this.x = x;
            _this.y = y;
        };
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.behavior = function () {
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (!_this.seenPlayer)
                    _this.lookForPlayer();
                else if (_this.seenPlayer) {
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.room.roomArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                                if (_this.room.roomArray[xx][yy] instanceof door_1.Door) {
                                    // don't walk into doorways (normally wouldn't be an issue without diagonals)
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        var grid = [];
                        for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                    grid[x][y] = _this.room.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        disablePositions.push({ x: _this.x + 1, y: _this.y });
                        disablePositions.push({ x: _this.x - 1, y: _this.y });
                        disablePositions.push({ x: _this.x, y: _this.y + 1 });
                        disablePositions.push({ x: _this.x, y: _this.y - 1 });
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, true //diagonals
                        );
                        moves = moves.filter(function (move) {
                            var dx = Math.abs(move.pos.x - _this.x);
                            var dy = Math.abs(move.pos.y - _this.y);
                            return dx === 1 && dy === 1;
                        });
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var hitPlayer = false;
                            for (var i in _this.game.players) {
                                if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                    _this.game.players[i].x === moveX &&
                                    _this.game.players[i].y === moveY) {
                                    _this.game.players[i].hurt(_this.hit(), _this.name);
                                    _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                    _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                    hitPlayer = true;
                                    if (_this.game.players[i] ===
                                        _this.game.players[_this.game.localPlayerID])
                                        _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                }
                            }
                            if (!hitPlayer) {
                                _this.tryMove(moveX, moveY);
                                _this.drawX = _this.x - oldX;
                                _this.drawY = _this.y - oldY;
                            }
                        }
                        _this.makeHitWarnings();
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    _this.makeHitWarnings();
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 31;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.name = "bishop";
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drop = new candle_1.Candle(_this.room, 0, 0);
            else if (dropProb < 0.04)
                _this.drop = new greengem_1.GreenGem(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return BishopEnemy;
}(enemy_1.Enemy));
exports.BishopEnemy = BishopEnemy;


/***/ }),

/***/ "./src/entity/enemy/chargeEnemy.ts":
/*!*****************************************!*\
  !*** ./src/entity/enemy/chargeEnemy.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChargeEnemy = exports.ChargeEnemyState = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../../hitWarning */ "./src/hitWarning.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var door_1 = __webpack_require__(/*! ../../tile/door */ "./src/tile/door.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var gameConstants_1 = __webpack_require__(/*! ../../gameConstants */ "./src/gameConstants.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var pickaxe_1 = __webpack_require__(/*! ../../weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var ChargeEnemyState;
(function (ChargeEnemyState) {
    ChargeEnemyState[ChargeEnemyState["IDLE"] = 0] = "IDLE";
    ChargeEnemyState[ChargeEnemyState["ALERTED"] = 1] = "ALERTED";
    ChargeEnemyState[ChargeEnemyState["CHARGING"] = 2] = "CHARGING";
})(ChargeEnemyState = exports.ChargeEnemyState || (exports.ChargeEnemyState = {}));
var ChargeEnemy = /** @class */ (function (_super) {
    __extends(ChargeEnemy, _super);
    function ChargeEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.canMoveOver = function (x, y) {
            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && x === e.x && y === e.y)
                    return false;
            }
            var t = _this.room.roomArray[x][y];
            return !(t.isSolid() || t instanceof door_1.Door);
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (_this.state === ChargeEnemyState.IDLE) {
                    var blocked = false;
                    var dx = 0;
                    var dy = 0;
                    for (var i in _this.game.players) {
                        if (_this.x === _this.game.players[i].x) {
                            if (_this.y < _this.game.players[i].y)
                                dy = 1;
                            else
                                dy = -1;
                            for (var yy = _this.y; yy !== _this.game.players[i].y; yy += dy) {
                                if (!_this.canMoveOver(_this.x, yy))
                                    blocked = true;
                            }
                        }
                        else if (_this.y === _this.game.players[i].y) {
                            if (_this.x < _this.game.players[i].x)
                                dx = 1;
                            else
                                dx = -1;
                            for (var xx = _this.x; xx !== _this.game.players[i].x; xx += dx) {
                                if (!_this.canMoveOver(xx, _this.y))
                                    blocked = true;
                            }
                        }
                        if ((dx !== 0 || dy !== 0) && !blocked) {
                            _this.state = ChargeEnemyState.ALERTED;
                            _this.targetX = _this.x;
                            _this.targetY = _this.y;
                            while (_this.canMoveOver(_this.targetX + dx, _this.targetY + dy)) {
                                _this.targetX += dx;
                                _this.targetY += dy;
                                if ((_this.targetX === _this.game.players[i].x &&
                                    _this.targetY === _this.game.players[i].y) ||
                                    (_this.targetX === _this.game.players[i].x - 1 &&
                                        _this.targetY === _this.game.players[i].y) ||
                                    (_this.targetX === _this.game.players[i].x + 1 &&
                                        _this.targetY === _this.game.players[i].y) ||
                                    (_this.targetX === _this.game.players[i].x &&
                                        _this.targetY === _this.game.players[i].y - 1) ||
                                    (_this.targetX === _this.game.players[i].x &&
                                        _this.targetY === _this.game.players[i].y + 1))
                                    _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, _this.targetX, _this.targetY, _this.x, _this.y));
                            }
                            _this.visualTargetX = _this.targetX + 0.5 * dx;
                            _this.visualTargetY = _this.targetY + 0.5 * dy;
                            if (dy === 1)
                                _this.visualTargetY += 0.65;
                            if (dx > 0)
                                _this.direction = entity_1.EntityDirection.RIGHT;
                            else if (dx < 0)
                                _this.direction = entity_1.EntityDirection.LEFT;
                            else if (dy < 0)
                                _this.direction = entity_1.EntityDirection.UP;
                            else if (dy > 0)
                                _this.direction = entity_1.EntityDirection.DOWN;
                            break;
                        }
                    }
                }
                else if (_this.state === ChargeEnemyState.ALERTED) {
                    _this.state = ChargeEnemyState.CHARGING;
                    _this.trailFrame = 0;
                    for (var i in _this.game.players) {
                        if ((_this.y === _this.game.players[i].y &&
                            ((_this.x < _this.game.players[i].x &&
                                _this.game.players[i].x <= _this.targetX) ||
                                (_this.targetX <= _this.game.players[i].x &&
                                    _this.game.players[i].x < _this.x))) ||
                            (_this.x === _this.game.players[i].x &&
                                ((_this.y < _this.game.players[i].y &&
                                    _this.game.players[i].y <= _this.targetY) ||
                                    (_this.targetY <= _this.game.players[i].y &&
                                        _this.game.players[i].y < _this.y)))) {
                            _this.game.players[i].hurt(_this.hit(), _this.name);
                        }
                    }
                    _this.startX = _this.x;
                    _this.startY = _this.y;
                    _this.drawX = _this.targetX - _this.x;
                    _this.drawY = _this.targetY - _this.y;
                    _this.x = _this.targetX;
                    _this.y = _this.targetY;
                }
                else if (_this.state === ChargeEnemyState.CHARGING) {
                    _this.state = ChargeEnemyState.IDLE;
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if ((_this.state === ChargeEnemyState.CHARGING &&
                    Math.abs(_this.drawX) > 0.1) ||
                    Math.abs(_this.drawY) > 0.1) {
                    genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x - _this.drawX + 0.5, _this.y - _this.drawY + 0.5, "black");
                    genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x - _this.drawX + 0.5, _this.y - _this.drawY + 0.5, "white");
                }
                if (_this.state === ChargeEnemyState.CHARGING) {
                    _this.trailFrame += 0.01 * delta;
                    var t = _this.trailFrame;
                    if (t >= 0 && t <= 1) {
                        game_1.Game.ctx.strokeStyle = "white";
                        if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                            game_1.Game.ctx.globalAlpha = 1 - t;
                        game_1.Game.ctx.lineWidth = gameConstants_1.GameConstants.TILESIZE * 0.25;
                        game_1.Game.ctx.beginPath();
                        game_1.Game.ctx.moveTo((_this.startX + 0.5) * gameConstants_1.GameConstants.TILESIZE, (_this.startY + 0.5) * gameConstants_1.GameConstants.TILESIZE);
                        game_1.Game.ctx.lineCap = "round";
                        game_1.Game.ctx.lineTo((_this.x - _this.drawX + 0.5) * gameConstants_1.GameConstants.TILESIZE, (_this.y - _this.drawY + 0.5) * gameConstants_1.GameConstants.TILESIZE);
                        game_1.Game.ctx.stroke();
                        game_1.Game.ctx.globalAlpha = 1;
                    }
                }
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
                if (_this.state === ChargeEnemyState.IDLE) {
                    _this.drawSleepingZs(delta);
                }
                else if (_this.state === ChargeEnemyState.ALERTED) {
                    _this.drawExclamation(delta);
                }
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x, _this.y, true);
            _this.drawX += -0.1 * _this.drawX;
            _this.drawY += -0.1 * _this.drawY;
            if (_this.state === ChargeEnemyState.ALERTED) {
                _this.trailFrame += 0.4 * delta;
                if (Math.floor(_this.trailFrame) % 2 === 0) {
                    var startX = (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                    var startY = (_this.y - 0.25) * gameConstants_1.GameConstants.TILESIZE;
                    if (_this.direction === entity_1.EntityDirection.LEFT)
                        startX -= 3;
                    else if (_this.direction === entity_1.EntityDirection.RIGHT)
                        startX += 3;
                    else if (_this.direction === entity_1.EntityDirection.DOWN)
                        startY += 2;
                    else if (_this.direction === entity_1.EntityDirection.UP)
                        startY -= 8;
                    game_1.Game.ctx.strokeStyle = "white";
                    game_1.Game.ctx.lineWidth = gameConstants_1.GameConstants.TILESIZE * 0.25;
                    game_1.Game.ctx.beginPath();
                    game_1.Game.ctx.moveTo(Math.round(startX), Math.round(startY));
                    game_1.Game.ctx.lineCap = "round";
                    game_1.Game.ctx.lineTo(Math.round((_this.visualTargetX + 0.5) * gameConstants_1.GameConstants.TILESIZE), Math.round((_this.visualTargetY - 0.25) * gameConstants_1.GameConstants.TILESIZE));
                    game_1.Game.ctx.stroke();
                    game_1.Game.ctx.globalAlpha = 1;
                }
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 13;
        _this.tileY = 8;
        _this.trailFrame = 0;
        _this.alertTicks = 0;
        _this.deathParticleColor = "#ffffff";
        _this.lastX = _this.x;
        _this.lastY = _this.y;
        _this.name = "charge knight";
        _this.state = ChargeEnemyState.IDLE;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new pickaxe_1.Pickaxe(_this.room, 0, 0);
            else if (dropProb < 0.02)
                _this.drop = new greengem_1.GreenGem(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return ChargeEnemy;
}(enemy_1.Enemy));
exports.ChargeEnemy = ChargeEnemy;


/***/ }),

/***/ "./src/entity/enemy/crabEnemy.ts":
/*!***************************************!*\
  !*** ./src/entity/enemy/crabEnemy.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CrabEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var gameConstants_1 = __webpack_require__(/*! ../../gameConstants */ "./src/gameConstants.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var CrabEnemy = /** @class */ (function (_super) {
    __extends(CrabEnemy, _super);
    function CrabEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.healthBar.hurt();
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 24);
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.hit = function () {
            return 1;
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer)
                    _this.lookForPlayer();
                else if (_this.seenPlayer) {
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        _this.ticks++;
                        if (_this.ticks % 2 === 1) {
                            _this.rumbling = true;
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var disablePositions = Array();
                            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                                var e = _a[_i];
                                if (e !== _this) {
                                    disablePositions.push({ x: e.x, y: e.y });
                                }
                            }
                            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                    if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                        _this.room.roomArray[xx][yy].on) {
                                        // don't walk on active spiketraps
                                        disablePositions.push({ x: xx, y: yy });
                                    }
                                }
                            }
                            var grid = [];
                            for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                                grid[x] = [];
                                for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                    if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                        grid[x][y] = _this.room.roomArray[x][y];
                                    else
                                        grid[x][y] = false;
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                            if (moves.length > 0) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moves[0].pos.x &&
                                        _this.game.players[i].y === moves[0].pos.y) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                        hitPlayer = true;
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moves[0].pos.x, moves[0].pos.y);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                            _this.rumbling = false;
                        }
                        else {
                            _this.rumbling = true;
                            _this.makeHitWarnings();
                        }
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    if (_this.ticks % 2 === 0) {
                                        _this.makeHitWarnings();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                if (_this.ticks % 2 === 0) {
                    _this.tileX = 9;
                    _this.tileY = 4;
                }
                else {
                    _this.tileX = 8;
                    _this.tileY = 4;
                }
                var rumbleX = _this.rumble(_this.rumbling, _this.frame, _this.direction).x;
                var rumbleY = _this.rumble(_this.rumbling, _this.frame, _this.direction).y;
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - 0.25 - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX, _this.tileY + _this.direction, 1, 1, _this.x - _this.drawX + rumbleX, _this.y - _this.drawYOffset - _this.drawY + rumbleY + 1.25, 1 * _this.crushX, 1 * _this.crushY, _this.room.shadeColor, _this.shadeAmount());
                if (_this.crushed) {
                    _this.crushAnim(delta);
                }
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta, 0, 0.75 * gameConstants_1.GameConstants.TILESIZE);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta, 0, 0.75 * gameConstants_1.GameConstants.TILESIZE);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 8;
        _this.tileY = 4;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.name = "crab";
        _this.orthogonalAttack = true;
        if (drop)
            _this.drop = drop;
        else {
            _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    Object.defineProperty(CrabEnemy.prototype, "alertText", {
        get: function () {
            return "New Enemy Spotted: Crab \n    Health: ".concat(this.health, "\n    Attack Pattern: Omnidirectional\n    Moves every other turn");
        },
        enumerable: false,
        configurable: true
    });
    return CrabEnemy;
}(enemy_1.Enemy));
exports.CrabEnemy = CrabEnemy;


/***/ }),

/***/ "./src/entity/enemy/enemy.ts":
/*!***********************************!*\
  !*** ./src/entity/enemy/enemy.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Enemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var eventBus_1 = __webpack_require__(/*! ../../eventBus */ "./src/eventBus.ts");
var EnemyState;
(function (EnemyState) {
    EnemyState[EnemyState["SLEEP"] = 0] = "SLEEP";
    EnemyState[EnemyState["AGGRO"] = 1] = "AGGRO";
    EnemyState[EnemyState["ATTACK"] = 2] = "ATTACK";
    EnemyState[EnemyState["DEAD"] = 3] = "DEAD";
    EnemyState[EnemyState["IDLE"] = 4] = "IDLE";
})(EnemyState || (EnemyState = {}));
var Enemy = /** @class */ (function (_super) {
    __extends(Enemy, _super);
    //dir: Direction;
    function Enemy(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.tryMove = function (x, y, collide) {
            if (collide === void 0) { collide = true; }
            var pointWouldBeIn = function (someX, someY) {
                return (someX >= x && someX < x + _this.w && someY >= y && someY < y + _this.h);
            };
            var entityCollide = function (entity) {
                if (entity.x >= x + _this.w || entity.x + entity.w <= x)
                    return false;
                if (entity.y >= y + _this.h || entity.y + entity.h <= y)
                    return false;
                return true;
            };
            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this && entityCollide(e) && collide) {
                    return;
                }
            }
            for (var i in _this.game.players) {
                if (pointWouldBeIn(_this.game.players[i].x, _this.game.players[i].y)) {
                    return;
                }
            }
            var tiles = [];
            for (var xx = 0; xx < _this.w; xx++) {
                for (var yy = 0; yy < _this.h; yy++) {
                    if (!_this.room.roomArray[x + xx][y + yy].isSolid()) {
                        tiles.push(_this.room.roomArray[x + xx][y + yy]);
                    }
                    else {
                        return;
                    }
                }
            }
            for (var _b = 0, tiles_1 = tiles; _b < tiles_1.length; _b++) {
                var tile = tiles_1[_b];
                tile.onCollideEnemy(_this);
            }
            _this.x = x;
            _this.y = y;
        };
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 26);
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
            }
        };
        _this.tick = function () {
            _this.behavior();
            if (_this.x !== _this.lastX || _this.y !== _this.lastY) {
                _this.emitEntityData();
            }
        };
        _this.lookForPlayer = function () {
            var p = _this.nearestPlayer();
            if (p !== false) {
                var distance = p[0], player = p[1];
                if (distance <= 4) {
                    _this.targetPlayer = player;
                    _this.facePlayer(player);
                    _this.seenPlayer = true;
                    var type = _this.constructor;
                    eventBus_1.globalEventBus.emit("EnemySeenPlayer", {
                        enemyType: _this.constructor.name,
                        enemyName: _this.name,
                    });
                    if (player === _this.game.players[_this.game.localPlayerID])
                        _this.alertTicks = 1;
                    _this.makeHitWarnings();
                }
            }
        };
        _this.getDisablePositions = function () {
            var disablePositions = Array();
            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this) {
                    disablePositions.push({ x: e.x, y: e.y });
                }
            }
            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                    if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                        _this.room.roomArray[xx][yy].on) {
                        // Don't walk on active spike traps
                        disablePositions.push({ x: xx, y: yy });
                    }
                }
            }
            return disablePositions;
        };
        _this.findPath = function () {
            var disablePositions = Array();
            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e !== _this) {
                    disablePositions.push({ x: e.x, y: e.y });
                }
            }
            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                    if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                        _this.room.roomArray[xx][yy].on) {
                        // Don't walk on active spike traps
                        disablePositions.push({ x: xx, y: yy });
                    }
                }
            }
            // Create a grid of the room
            var grid = [];
            for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                grid[x] = [];
                for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                    if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                        grid[x][y] = _this.room.roomArray[x][y];
                    else
                        grid[x][y] = false;
                }
            }
            // Find a path to the target player
            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction);
        };
        _this.behavior = function () {
            // Store the current position
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            // If the enemy is not dead
            if (!_this.dead) {
                // Skip turns if necessary
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                // Increment the tick counter
                _this.ticks++;
                // If the enemy has not seen the player yet
                if (!_this.seenPlayer)
                    _this.lookForPlayer();
                else if (_this.seenPlayer) {
                    // If the target player has taken their turn
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        // Decrement alert ticks
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        // Store the old position
                        var oldX = _this.x;
                        var oldY = _this.y;
                        // Create a list of positions to avoid
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.room.roomArray[xx][yy].on) {
                                    // Don't walk on active spike traps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        // Create a grid of the room
                        var grid = [];
                        for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                    grid[x][y] = _this.room.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        // Find a path to the target player
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction);
                        // If there are moves available
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var oldDir = _this.direction;
                            var player = _this.targetPlayer;
                            // Face the target player
                            _this.facePlayer(player);
                            // Determine the new direction based on the move
                            if (moveX > oldX)
                                _this.direction = entity_1.EntityDirection.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = entity_1.EntityDirection.LEFT;
                            else if (moveY > oldY)
                                _this.direction = entity_1.EntityDirection.DOWN;
                            else if (moveY < oldY)
                                _this.direction = entity_1.EntityDirection.UP;
                            // If the direction hasn't changed, attempt to move or attack
                            if (oldDir == _this.direction) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moveX &&
                                        _this.game.players[i].y === moveY) {
                                        // Attack the player if they are in the way
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    // Move to the new position
                                    _this.tryMove(moveX, moveY);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                        }
                        // Add positions to avoid based on the current direction
                        if (_this.direction == entity_1.EntityDirection.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.UP) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        // Make hit warnings
                        _this.makeHitWarnings();
                    }
                    // Check if the target player is offline
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    // If the enemy is not aggro or the target player is offline, find a new target player
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    _this.makeHitWarnings();
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.updateDrawXY = function (delta) {
            if (!_this.doneMoving()) {
                _this.drawX += -0.3 * delta * _this.drawX;
                _this.drawY += -0.3 * delta * _this.drawY;
                _this.jump();
            }
        };
        _this.jump = function () {
            var j = Math.max(Math.abs(_this.drawX), Math.abs(_this.drawY));
            _this.jumpY = Math.sin(j * Math.PI) * _this.jumpHeight;
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.drawYOffset = 1.5;
        _this.name = "";
        _this.seenPlayer = false;
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 17;
        _this.tileY = 8;
        _this.aggro = false;
        _this.jumpY = 0;
        _this.jumpHeight = 0.3;
        //this.dir = Direction.South;
        _this.name = "generic enemy";
        return _this;
    }
    Object.defineProperty(Enemy.prototype, "type", {
        get: function () {
            return entity_2.EntityType.ENEMY;
        },
        enumerable: false,
        configurable: true
    });
    return Enemy;
}(entity_1.Entity));
exports.Enemy = Enemy;


/***/ }),

/***/ "./src/entity/enemy/fireWizard.ts":
/*!****************************************!*\
  !*** ./src/entity/enemy/fireWizard.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FireWizardEnemy = exports.WizardState = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var floor_1 = __webpack_require__(/*! ../../tile/floor */ "./src/tile/floor.ts");
var bones_1 = __webpack_require__(/*! ../../tile/bones */ "./src/tile/bones.ts");
var deathParticle_1 = __webpack_require__(/*! ../../particle/deathParticle */ "./src/particle/deathParticle.ts");
var wizardTeleportParticle_1 = __webpack_require__(/*! ../../particle/wizardTeleportParticle */ "./src/particle/wizardTeleportParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var wizardBomb_1 = __webpack_require__(/*! ../../projectile/wizardBomb */ "./src/projectile/wizardBomb.ts");
var WizardState;
(function (WizardState) {
    WizardState[WizardState["idle"] = 0] = "idle";
    WizardState[WizardState["attack"] = 1] = "attack";
    WizardState[WizardState["justAttacked"] = 2] = "justAttacked";
    WizardState[WizardState["teleport"] = 3] = "teleport";
})(WizardState = exports.WizardState || (exports.WizardState = {}));
var FireWizardEnemy = /** @class */ (function (_super) {
    __extends(FireWizardEnemy, _super);
    function FireWizardEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.ATTACK_RADIUS = 5;
        _this.hit = function () {
            return 1;
        };
        _this.withinAttackingRangeOfPlayer = function () {
            var withinRange = false;
            for (var i in _this.game.players) {
                if (Math.pow((_this.x - _this.game.players[i].x), 2) +
                    Math.pow((_this.y - _this.game.players[i].y), 2) <=
                    Math.pow(_this.ATTACK_RADIUS, 2)) {
                    withinRange = true;
                }
            }
            return withinRange;
        };
        _this.shuffle = function (a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(random_1.Random.rand() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer)
                    _this.lookForPlayer();
                else if (_this.seenPlayer) {
                    _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                    switch (_this.state) {
                        case WizardState.attack:
                            var nearestPlayerInfo = _this.nearestPlayer();
                            if (nearestPlayerInfo !== false) {
                                var distance = nearestPlayerInfo[0], targetPlayer = nearestPlayerInfo[1];
                                var attackLength = 20;
                                var offsets = _this.calculateProjectileOffsets(targetPlayer.x, targetPlayer.y, 10);
                                _this.attemptProjectilePlacement([
                                    { x: -1, y: 0 },
                                    { x: -2, y: 0 },
                                    { x: 1, y: 0 },
                                    { x: 2, y: 0 },
                                    { x: 0, y: -1 },
                                    { x: 0, y: -2 },
                                    { x: 0, y: 1 },
                                    { x: 0, y: 2 },
                                ], wizardBomb_1.WizardBomb, false);
                            }
                            _this.state = WizardState.justAttacked;
                            break;
                        case WizardState.justAttacked:
                            _this.state = WizardState.idle;
                            break;
                        case WizardState.teleport:
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var min = 100000;
                            var bestPos = void 0;
                            var emptyTiles = _this.shuffle(_this.room.getEmptyTiles());
                            emptyTiles = emptyTiles.filter(function (tile) {
                                return !_this.room.projectiles.some(function (projectile) {
                                    return projectile.x === tile.x && projectile.y === tile.y;
                                });
                            });
                            var optimalDist = game_1.Game.randTable([2, 2, 3, 3, 3, 3, 3], random_1.Random.rand);
                            // pick a random player to target
                            var player_ids = [];
                            for (var i in _this.game.players)
                                player_ids.push(i);
                            var target_player_id = game_1.Game.randTable(player_ids, random_1.Random.rand);
                            for (var _i = 0, emptyTiles_1 = emptyTiles; _i < emptyTiles_1.length; _i++) {
                                var t = emptyTiles_1[_i];
                                var newPos = t;
                                var dist = Math.abs(newPos.x - _this.game.players[target_player_id].x) +
                                    Math.abs(newPos.y - _this.game.players[target_player_id].y);
                                if (Math.abs(dist - optimalDist) < Math.abs(min - optimalDist)) {
                                    min = dist;
                                    bestPos = newPos;
                                }
                            }
                            _this.tryMove(bestPos.x, bestPos.y);
                            _this.drawX = _this.x - oldX;
                            _this.drawY = _this.y - oldY;
                            _this.frame = 0; // trigger teleport animation
                            _this.room.particles.push(new wizardTeleportParticle_1.WizardTeleportParticle(oldX, oldY));
                            if (_this.withinAttackingRangeOfPlayer()) {
                                _this.state = WizardState.attack;
                            }
                            else {
                                _this.state = WizardState.idle;
                            }
                            break;
                        case WizardState.idle:
                            _this.state = WizardState.teleport;
                            break;
                    }
                }
            }
        };
        _this.draw = function (delta) {
            _this.frame += 0.1 * delta;
            if (_this.frame >= 4)
                _this.frame = 0;
            if (!_this.dead) {
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                if (_this.frame >= 0) {
                    game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY, 1, 2, _this.x, _this.y - 1.3, 1, 2, _this.room.shadeColor, _this.shadeAmount());
                }
                else {
                    game_1.Game.drawMob(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1.3 - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
                }
                if (!_this.seenPlayer) {
                    _this.drawSleepingZs(delta);
                }
                if (_this.alertTicks > 0) {
                    _this.drawExclamation(delta);
                }
            }
        };
        _this.kill = function () {
            if (_this.room.roomArray[_this.x][_this.y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.room, _this.x, _this.y);
                b.skin = _this.room.roomArray[_this.x][_this.y].skin;
                _this.room.roomArray[_this.x][_this.y] = b;
            }
            _this.dead = true;
            _this.room.particles.push(new deathParticle_1.DeathParticle(_this.x, _this.y));
            _this.dropLoot();
        };
        _this.ticks = 0;
        _this.health = 1;
        _this.tileX = 35;
        _this.tileY = 8;
        _this.frame = 0;
        _this.state = WizardState.attack;
        _this.seenPlayer = false;
        _this.alertTicks = 0;
        _this.name = "fire wizard";
        if (drop)
            _this.drop = drop;
        else {
            if (random_1.Random.rand() < 0.02)
                _this.drop = new bluegem_1.BlueGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    return FireWizardEnemy;
}(enemy_1.Enemy));
exports.FireWizardEnemy = FireWizardEnemy;


/***/ }),

/***/ "./src/entity/enemy/frogEnemy.ts":
/*!***************************************!*\
  !*** ./src/entity/enemy/frogEnemy.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FrogEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var FrogEnemy = /** @class */ (function (_super) {
    __extends(FrogEnemy, _super);
    function FrogEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.healthBar.hurt();
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 30);
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.hit = function () {
            return 0.5;
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            _this.rumbling = false;
            _this.tileX = 1;
            _this.frameLength = 3;
            _this.animationSpeed = 0.1;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer) {
                    _this.tileX = 12;
                    _this.lookForPlayer();
                }
                else if (_this.seenPlayer) {
                    _this.tileX = 1;
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        _this.ticks++;
                        if (_this.ticks % 2 === 1) {
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var disablePositions = Array();
                            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                    if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                        _this.room.roomArray[xx][yy].on) {
                                        // don't walk on active spiketraps
                                        disablePositions.push({ x: xx, y: yy });
                                    }
                                }
                            }
                            var grid = [];
                            for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                                grid[x] = [];
                                for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                    if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                        grid[x][y] = _this.room.roomArray[x][y];
                                    else
                                        grid[x][y] = false;
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                            if (moves.length > 0) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moves[0].pos.x &&
                                        _this.game.players[i].y === moves[0].pos.y) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                        hitPlayer = true;
                                        break;
                                    }
                                }
                                if (!hitPlayer) {
                                    oldX = _this.x;
                                    oldY = _this.y;
                                    var tryX = _this.x;
                                    var tryY = _this.y;
                                    _this.tryMove(moves[0].pos.x, moves[0].pos.y, false);
                                    moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                                    tryX = _this.x;
                                    tryY = _this.y;
                                    _this.tryMove(moves[0].pos.x, moves[0].pos.y);
                                    /*
                                    if (this.x != oldX && this.y != oldY) {
                                      // if we've moved diagonally, we need to move back to the original position
                                      this.x = tryX;
                                      this.y = tryY;
                                    }
                    */
                                    if (Math.abs(_this.x - oldX) + Math.abs(_this.y - oldY) < 2) {
                                        _this.x = oldX;
                                        _this.y = oldY;
                                        moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                                        _this.tryMove(moves[0].pos.x, moves[0].pos.y);
                                    }
                                    if (_this.x !== oldX || _this.y !== oldY) {
                                        _this.jump();
                                        _this.drawX = _this.x - oldX;
                                        _this.drawY = _this.y - oldY;
                                        if (Math.abs(_this.x - oldX) > 1 ||
                                            Math.abs(_this.y - oldY) > 1 ||
                                            (_this.x !== oldX && _this.y !== oldY)) {
                                            _this.jumpDistance = 2;
                                        }
                                        else {
                                            _this.x = tryX;
                                            _this.y = tryY;
                                            _this.jumpDistance = 1.3;
                                        }
                                    }
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                        }
                        else {
                            _this.makeHitWarnings();
                            _this.rumbling = true;
                            _this.tileX = 3;
                            _this.frame = 0;
                            _this.frameLength = 2;
                            _this.animationSpeed = 0.2;
                        }
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    if (_this.ticks % 2 === 0) {
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.jump = function () {
            _this.frameLength = 9;
            _this.frame = 2;
            _this.animationSpeed = 0.3;
            _this.jumping = true;
            setTimeout(function () {
                _this.tileX = 1;
                _this.frameLength = 3;
                _this.animationSpeed = 0.1;
                _this.jumping = false;
            }, 300);
        };
        _this.draw = function (delta) {
            var jumpHeight = 0;
            if (_this.jumping)
                jumpHeight =
                    Math.sin(((_this.frame - 2) / ((_this.jumpDistance + 1.825) * 1.475)) * Math.PI) * 0.75;
            var rumbleX = _this.rumble(_this.rumbling, _this.frame).x;
            if (!_this.dead) {
                _this.frame += _this.animationSpeed * delta;
                if (_this.frame >= _this.frameLength) {
                    _this.frame = 0;
                }
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX +
                    (_this.tileX !== 12 && !_this.rumbling ? Math.floor(_this.frame) : 0), _this.tileY /*+ this.direction * 2,*/, 1, 2, _this.x + rumbleX - _this.drawX, _this.y - _this.drawYOffset - _this.drawY - jumpHeight, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y - _this.drawY;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x, _this.y, true);
            _this.drawX += -(0.25 / _this.jumpDistance) * _this.drawX * delta;
            _this.drawY += -(0.25 / _this.jumpDistance) * _this.drawY * delta;
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 12;
        _this.tileY = 16;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        _this.frameLength = 3;
        _this.startFrame = 0;
        _this.animationSpeed = 0.1;
        _this.tickCount = 0;
        _this.rumbling = false;
        _this.jumping = false;
        _this.jumpDistance = 1;
        _this.drop = drop ? drop : new coin_1.Coin(_this.room, 0, 0);
        _this.name = "frog";
        _this.orthogonalAttack = true;
        _this.diagonalAttack = true;
        return _this;
    }
    return FrogEnemy;
}(enemy_1.Enemy));
exports.FrogEnemy = FrogEnemy;


/***/ }),

/***/ "./src/entity/enemy/knightEnemy.ts":
/*!*****************************************!*\
  !*** ./src/entity/enemy/knightEnemy.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KnightEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var dualdagger_1 = __webpack_require__(/*! ../../weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var KnightEnemy = /** @class */ (function (_super) {
    __extends(KnightEnemy, _super);
    function KnightEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.healthBar.hurt();
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 29);
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.hit = function () {
            return 1;
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer) {
                    var result = _this.nearestPlayer();
                    if (result !== false) {
                        var distance = result[0], p = result[1];
                        if (distance < 4) {
                            _this.rumbling = true;
                            _this.seenPlayer = true;
                            _this.targetPlayer = p;
                            _this.facePlayer(p);
                            if (p === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                            _this.makeHitWarnings();
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        _this.ticks++;
                        if (_this.ticks % 2 === 1) {
                            _this.rumbling = true;
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var disablePositions = Array();
                            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                                var e = _a[_i];
                                if (e !== _this) {
                                    disablePositions.push({ x: e.x, y: e.y });
                                }
                            }
                            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                    if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                        _this.room.roomArray[xx][yy].on) {
                                        // don't walk on active spiketraps
                                        disablePositions.push({ x: xx, y: yy });
                                    }
                                }
                            }
                            var grid = [];
                            for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                                grid[x] = [];
                                for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                    if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                        grid[x][y] = _this.room.roomArray[x][y];
                                    else
                                        grid[x][y] = false;
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                            if (moves.length > 0) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moves[0].pos.x &&
                                        _this.game.players[i].y === moves[0].pos.y) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                        hitPlayer = true;
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moves[0].pos.x, moves[0].pos.y);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                            _this.rumbling = false;
                        }
                        else {
                            _this.rumbling = true;
                            _this.makeHitWarnings();
                        }
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    if (_this.ticks % 2 === 0) {
                                        _this.rumbling = true;
                                        _this.makeHitWarnings();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            var rumbleX = _this.rumble(_this.rumbling, _this.frame).x;
            var rumbleY = _this.rumble(_this.rumbling, _this.frame, _this.direction).y;
            if (!_this.dead) {
                if (_this.ticks % 2 === 0) {
                    _this.tileX = 9;
                    _this.tileY = 8;
                }
                else {
                    _this.tileX = 4;
                    _this.tileY = 0;
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 4 ? 0 : Math.floor(_this.frame)), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX + rumbleX, _this.y -
                    _this.drawYOffset -
                    _this.drawY +
                    (_this.tileX === 4 ? 0.1875 : 0), 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 9;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        _this.lastX = _this.x;
        _this.lastY = _this.y;
        _this.name = "burrow knight";
        _this.orthogonalAttack = true;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.05)
                _this.drop = new dualdagger_1.DualDagger(_this.room, 0, 0);
            else if (dropProb < 0.01)
                _this.drop = new dualdagger_1.DualDagger(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return KnightEnemy;
}(enemy_1.Enemy));
exports.KnightEnemy = KnightEnemy;


/***/ }),

/***/ "./src/entity/enemy/queenEnemy.ts":
/*!****************************************!*\
  !*** ./src/entity/enemy/queenEnemy.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueenEnemy = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var candle_1 = __webpack_require__(/*! ../../item/candle */ "./src/item/candle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var QueenEnemy = /** @class */ (function (_super) {
    __extends(QueenEnemy, _super);
    function QueenEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (!_this.seenPlayer) {
                    var p = _this.nearestPlayer();
                    if (p !== false) {
                        var distance = p[0], player = p[1];
                        if (distance <= 4) {
                            _this.targetPlayer = player;
                            _this.facePlayer(player);
                            _this.seenPlayer = true;
                            if (player === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                            _this.makeHitWarnings();
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.room.roomArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        var grid = [];
                        for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                    grid[x][y] = _this.room.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, true, //diagonals
                        false, //diagonalsOnly
                        undefined, undefined, undefined, false //diagonalsOmni
                        );
                        if (moves.length > 0) {
                            disablePositions.push({ x: oldX + 1, y: oldY });
                            disablePositions.push({ x: oldX - 1, y: oldY });
                            disablePositions.push({ x: oldX, y: oldY + 1 });
                            disablePositions.push({ x: oldX, y: oldY - 1 });
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var hitPlayer = false;
                            for (var i in _this.game.players) {
                                if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                    _this.game.players[i].x === moveX &&
                                    _this.game.players[i].y === moveY) {
                                    _this.game.players[i].hurt(_this.hit(), _this.name);
                                    _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                    _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                    if (_this.game.players[i] ===
                                        _this.game.players[_this.game.localPlayerID])
                                        _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                }
                            }
                            if (!hitPlayer) {
                                //if ()
                                _this.tryMove(moveX, moveY);
                                _this.drawX = _this.x - oldX;
                                _this.drawY = _this.y - oldY;
                            }
                        }
                        _this.makeHitWarnings();
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    _this.makeHitWarnings();
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 23;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.name = "queen";
        _this.orthogonalAttack = true;
        _this.diagonalAttack = true;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drop = new candle_1.Candle(_this.room, 0, 0);
            else if (dropProb < 0.04)
                _this.drop = new greengem_1.GreenGem(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return QueenEnemy;
}(enemy_1.Enemy));
exports.QueenEnemy = QueenEnemy;


/***/ }),

/***/ "./src/entity/enemy/skullEnemy.ts":
/*!****************************************!*\
  !*** ./src/entity/enemy/skullEnemy.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SkullEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var redgem_1 = __webpack_require__(/*! ../../item/redgem */ "./src/item/redgem.ts");
var spear_1 = __webpack_require__(/*! ../../weapon/spear */ "./src/weapon/spear.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var SkullEnemy = /** @class */ (function (_super) {
    __extends(SkullEnemy, _super);
    function SkullEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.REGEN_TICKS = 5;
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.ticksSinceFirstHit = 0;
            _this.health -= damage;
            if (_this.health == 1) {
                imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 28);
            }
            else
                _this.healthBar.hurt();
            if (_this.health <= 0) {
                imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 24);
                _this.kill();
            }
            else {
            }
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            //set last positions
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (_this.health <= 1) {
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.health = 2;
                    }
                }
                else {
                    _this.ticks++;
                    if (!_this.seenPlayer) {
                        _this.lookForPlayer();
                    }
                    else if (_this.seenPlayer) {
                        if (_this.room.playerTicked === _this.targetPlayer) {
                            _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var disablePositions = Array();
                            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                                var e = _a[_i];
                                if (e !== _this) {
                                    disablePositions.push({ x: e.x, y: e.y });
                                }
                            }
                            for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                                for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                    if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                        _this.room.roomArray[xx][yy].on) {
                                        // don't walk on active spiketraps
                                        disablePositions.push({ x: xx, y: yy });
                                    }
                                }
                            }
                            var grid = [];
                            for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                                grid[x] = [];
                                for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                    if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                        grid[x][y] = _this.room.roomArray[x][y];
                                    else
                                        grid[x][y] = false;
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions);
                            if (moves.length > 0) {
                                var moveX = moves[0].pos.x;
                                var moveY = moves[0].pos.y;
                                var hitPlayer = false;
                                var moveDirection = entity_1.EntityDirection.DOWN;
                                if (moveX !== oldX) {
                                    moveDirection =
                                        moveX > oldX ? entity_1.EntityDirection.RIGHT : entity_1.EntityDirection.LEFT;
                                }
                                else if (moveY !== oldY) {
                                    moveDirection =
                                        moveY > oldY ? entity_1.EntityDirection.DOWN : entity_1.EntityDirection.UP;
                                }
                                if (moveDirection !== _this.direction) {
                                    moveX = oldX;
                                    moveY = oldY;
                                    _this.direction = moveDirection;
                                }
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moveX &&
                                        _this.game.players[i].y === moveY) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moveX, moveY, true);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                            _this.makeHitWarnings();
                        }
                        var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !== -1;
                        if (!_this.aggro || targetPlayerOffline) {
                            var p = _this.nearestPlayer();
                            if (p !== false) {
                                var distance = p[0], player = p[1];
                                if (distance <= 4 &&
                                    (targetPlayerOffline ||
                                        distance < _this.playerDistance(_this.targetPlayer))) {
                                    if (player !== _this.targetPlayer) {
                                        _this.targetPlayer = player;
                                        _this.facePlayer(player);
                                        if (player === _this.game.players[_this.game.localPlayerID])
                                            _this.alertTicks = 1;
                                        _this.makeHitWarnings();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.tileX = 5;
                _this.tileY = 8;
                if (_this.health <= 1) {
                    _this.tileX = 3;
                    _this.tileY = 0;
                    if (_this.ticksSinceFirstHit >= 3) {
                        _this.flashingFrame += 0.1 * delta;
                        if (Math.floor(_this.flashingFrame) % 2 === 0) {
                            _this.tileX = 2;
                        }
                    }
                }
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 5 ? Math.floor(_this.frame) : 0), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 5;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.ticksSinceFirstHit = 0;
        _this.flashingFrame = 0;
        _this.deathParticleColor = "#ffffff";
        _this.name = "skeleton";
        _this.forwardOnlyAttack = true;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.05)
                _this.drop = new spear_1.Spear(_this.room, 0, 0);
            else if (dropProb < 0.01)
                _this.drop = new redgem_1.RedGem(_this.room, 0, 0);
            //else if (dropProb < 0.2) this.drop = new Candle(this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return SkullEnemy;
}(enemy_1.Enemy));
exports.SkullEnemy = SkullEnemy;


/***/ }),

/***/ "./src/entity/enemy/sniperEnemy.ts":
/*!*****************************************!*\
  !*** ./src/entity/enemy/sniperEnemy.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SniperEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var pickaxe_1 = __webpack_require__(/*! ../../weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var SniperEnemy = /** @class */ (function (_super) {
    __extends(SniperEnemy, _super);
    function SniperEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.facePlayer = function (player) {
            var dx = player.x - _this.x;
            var dy = player.y - _this.y;
            // Calculate angle to player in radians
            var angle = Math.atan2(dy, dx); // Angle in radians
            var angleStep = Math.PI / 8; // Simplified constant for angle thresholds
            // Determine direction based on angle
            if (angle >= -angleStep && angle < angleStep)
                _this.dir = game_1.Direction.East; // Right
            else if (angle >= angleStep && angle < 3 * angleStep)
                _this.dir = game_1.Direction.SouthEast; // Down-Right
            else if (angle >= 3 * angleStep && angle < 5 * angleStep)
                _this.dir = game_1.Direction.South; // Down
            else if (angle >= 5 * angleStep && angle < 7 * angleStep)
                _this.dir = game_1.Direction.SouthWest; // Down-Left
            else if (angle >= 7 * angleStep || angle < -7 * angleStep)
                _this.dir = game_1.Direction.West; // Left
            else if (angle >= -7 * angleStep && angle < -5 * angleStep)
                _this.dir = game_1.Direction.NorthWest; // Up-Left
            else if (angle >= -5 * angleStep && angle < -3 * angleStep)
                _this.dir = game_1.Direction.North; // Up
            else if (angle >= -3 * angleStep && angle < -angleStep)
                _this.dir = game_1.Direction.NorthEast; // Up-Right
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, _this.deathParticleColor);
            }
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.ticks++;
                if (!_this.seenPlayer) {
                    var p = _this.nearestPlayer();
                    if (p !== false) {
                        var distance = p[0], player = p[1];
                        if (distance <= 4) {
                            _this.targetPlayer = player;
                            _this.facePlayer(player);
                            _this.seenPlayer = true;
                            if (player === _this.game.players[_this.game.localPlayerID])
                                _this.alertTicks = 1;
                        }
                    }
                }
                else if (_this.seenPlayer) {
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        var oldX = _this.x;
                        var oldY = _this.y;
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.room.roomArray[xx][yy].on) {
                                    // don't walk on active spiketraps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        var grid = [];
                        for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                    grid[x][y] = _this.room.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction);
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var oldDir = _this.direction;
                            var player = _this.targetPlayer;
                            _this.facePlayer(player);
                            if (moveX > oldX)
                                _this.direction = entity_1.EntityDirection.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = entity_1.EntityDirection.LEFT;
                            else if (moveY > oldY)
                                _this.direction = entity_1.EntityDirection.DOWN;
                            else if (moveY < oldY)
                                _this.direction = entity_1.EntityDirection.UP;
                            if (oldDir == _this.direction) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moveX &&
                                        _this.game.players[i].y === moveY) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    _this.tryMove(moveX, moveY);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                        }
                        if (_this.direction == entity_1.EntityDirection.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.UP) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        _this.makeHitWarnings();
                    }
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    _this.makeHitWarnings();
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.tileY = 20 + _this.dir * 2;
                _this.frame += 0.1 * delta;
                if (_this.frame >= 1)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1.5 - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 1;
        _this.tileY = 22;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        _this.dir = game_1.Direction.South;
        _this.name = "sniper";
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new pickaxe_1.Pickaxe(_this.room, 0, 0);
            else if (dropProb < 0.02)
                _this.drop = new greengem_1.GreenGem(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return SniperEnemy;
}(enemy_1.Enemy));
exports.SniperEnemy = SniperEnemy;


/***/ }),

/***/ "./src/entity/enemy/spawner.ts":
/*!*************************************!*\
  !*** ./src/entity/enemy/spawner.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spawner = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../../hitWarning */ "./src/hitWarning.ts");
var skullEnemy_1 = __webpack_require__(/*! ./skullEnemy */ "./src/entity/enemy/skullEnemy.ts");
var enemySpawnAnimation_1 = __webpack_require__(/*! ../../projectile/enemySpawnAnimation */ "./src/projectile/enemySpawnAnimation.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var knightEnemy_1 = __webpack_require__(/*! ./knightEnemy */ "./src/entity/enemy/knightEnemy.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./wizardEnemy */ "./src/entity/enemy/wizardEnemy.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var Spawner = /** @class */ (function (_super) {
    __extends(Spawner, _super);
    function Spawner(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                _this.tileX = 6;
                if (_this.ticks % 8 === 0) {
                    var positions = _this.room
                        .getEmptyTiles()
                        .filter(function (t) { return Math.abs(t.x - _this.x) <= 1 && Math.abs(t.y - _this.y) <= 1; });
                    if (positions.length > 0) {
                        _this.tileX = 7;
                        var position = game_1.Game.randTable(positions, random_1.Random.rand);
                        var spawned = void 0;
                        switch (_this.enemySpawnType) {
                            case 1:
                                spawned = new knightEnemy_1.KnightEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 2:
                                spawned = new skullEnemy_1.SkullEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 3:
                                spawned = new wizardEnemy_1.WizardEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                        }
                        _this.room.projectiles.push(new enemySpawnAnimation_1.EnemySpawnAnimation(_this.room, spawned, position.x, position.y));
                        _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, position.x, position.y, _this.x, _this.y));
                    }
                }
                _this.ticks++;
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.dropLoot = function () {
            _this.room.items.push(new bluegem_1.BlueGem(_this.room, _this.x, _this.y));
        };
        _this.ticks = 0;
        _this.health = 4;
        _this.maxHealth = 4;
        _this.tileX = 6;
        _this.tileY = 4;
        _this.seenPlayer = true;
        _this.enemySpawnType = game_1.Game.randTable([1, 2, 2, 2, 2, 3], random_1.Random.rand);
        _this.name = "reaper";
        return _this;
    }
    return Spawner;
}(enemy_1.Enemy));
exports.Spawner = Spawner;


/***/ }),

/***/ "./src/entity/enemy/wizardEnemy.ts":
/*!*****************************************!*\
  !*** ./src/entity/enemy/wizardEnemy.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WizardEnemy = exports.WizardState = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var floor_1 = __webpack_require__(/*! ../../tile/floor */ "./src/tile/floor.ts");
var bones_1 = __webpack_require__(/*! ../../tile/bones */ "./src/tile/bones.ts");
var deathParticle_1 = __webpack_require__(/*! ../../particle/deathParticle */ "./src/particle/deathParticle.ts");
var wizardTeleportParticle_1 = __webpack_require__(/*! ../../particle/wizardTeleportParticle */ "./src/particle/wizardTeleportParticle.ts");
var wizardFireball_1 = __webpack_require__(/*! ../../projectile/wizardFireball */ "./src/projectile/wizardFireball.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var WizardState;
(function (WizardState) {
    WizardState[WizardState["idle"] = 0] = "idle";
    WizardState[WizardState["attack"] = 1] = "attack";
    WizardState[WizardState["justAttacked"] = 2] = "justAttacked";
    WizardState[WizardState["teleport"] = 3] = "teleport";
})(WizardState = exports.WizardState || (exports.WizardState = {}));
var WizardEnemy = /** @class */ (function (_super) {
    __extends(WizardEnemy, _super);
    function WizardEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.ATTACK_RADIUS = 5;
        _this.addLightSource = function (lightSource) {
            _this.room.lightSources.push(lightSource);
        };
        _this.removeLightSource = function (lightSource) {
            _this.room.lightSources = _this.room.lightSources.filter(function (ls) { return ls !== lightSource; });
        };
        _this.hit = function () {
            return 1;
        };
        _this.withinAttackingRangeOfPlayer = function () {
            var withinRange = false;
            for (var i in _this.game.players) {
                if (Math.pow((_this.x - _this.game.players[i].x), 2) +
                    Math.pow((_this.y - _this.game.players[i].y), 2) <=
                    Math.pow(_this.ATTACK_RADIUS, 2)) {
                    withinRange = true;
                }
            }
            return withinRange;
        };
        _this.shuffle = function (a) {
            var j, x, i;
            for (i = a.length - 1; i > 0; i--) {
                j = Math.floor(random_1.Random.rand() * (i + 1));
                x = a[i];
                a[i] = a[j];
                a[j] = x;
            }
            return a;
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                if (!_this.seenPlayer)
                    _this.lookForPlayer();
                else if (_this.seenPlayer) {
                    _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                    switch (_this.state) {
                        case WizardState.attack:
                            var nearestPlayerInfo = _this.nearestPlayer();
                            if (nearestPlayerInfo !== false) {
                                var distance = nearestPlayerInfo[0], targetPlayer = nearestPlayerInfo[1];
                                var attackLength = 20;
                                var offsets = _this.calculateProjectileOffsets(targetPlayer.x, targetPlayer.y, 10);
                                _this.attemptProjectilePlacement([
                                    { x: -1, y: 0 },
                                    { x: -2, y: 0 },
                                    { x: 1, y: 0 },
                                    { x: 2, y: 0 },
                                    { x: 0, y: -1 },
                                    { x: 0, y: -2 },
                                    { x: 0, y: 1 },
                                    { x: 0, y: 2 },
                                ], wizardFireball_1.WizardFireball, false);
                            }
                            _this.state = WizardState.justAttacked;
                            break;
                        case WizardState.justAttacked:
                            _this.state = WizardState.idle;
                            break;
                        case WizardState.teleport:
                            var oldX = _this.x;
                            var oldY = _this.y;
                            var min = 100000;
                            var bestPos = void 0;
                            var emptyTiles = _this.shuffle(_this.room.getEmptyTiles());
                            emptyTiles = emptyTiles.filter(function (tile) {
                                return !_this.room.projectiles.some(function (projectile) {
                                    return projectile.x === tile.x && projectile.y === tile.y;
                                });
                            });
                            var optimalDist = game_1.Game.randTable([2, 2, 3, 3, 3, 3, 3], random_1.Random.rand);
                            // pick a random player to target
                            var player_ids = [];
                            for (var i in _this.game.players)
                                player_ids.push(i);
                            var target_player_id = game_1.Game.randTable(player_ids, random_1.Random.rand);
                            for (var _i = 0, emptyTiles_1 = emptyTiles; _i < emptyTiles_1.length; _i++) {
                                var t = emptyTiles_1[_i];
                                var newPos = t;
                                var dist = Math.abs(newPos.x - _this.game.players[target_player_id].x) +
                                    Math.abs(newPos.y - _this.game.players[target_player_id].y);
                                if (Math.abs(dist - optimalDist) < Math.abs(min - optimalDist)) {
                                    min = dist;
                                    bestPos = newPos;
                                }
                            }
                            _this.tryMove(bestPos.x, bestPos.y);
                            _this.drawX = _this.x - oldX;
                            _this.drawY = _this.y - oldY;
                            _this.frame = 0; // trigger teleport animation
                            _this.room.particles.push(new wizardTeleportParticle_1.WizardTeleportParticle(oldX, oldY));
                            if (_this.withinAttackingRangeOfPlayer()) {
                                _this.state = WizardState.attack;
                            }
                            else {
                                _this.state = WizardState.idle;
                            }
                            break;
                        case WizardState.idle:
                            _this.state = WizardState.teleport;
                            break;
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                if (_this.state === WizardState.attack)
                    _this.tileX = 7;
                else
                    _this.tileX = 6;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                if (_this.frame >= 0) {
                    game_1.Game.drawMob(Math.floor(_this.frame) + 6, 2, 1, 2, _this.x, _this.y - 1.5, 1, 2, _this.room.shadeColor, _this.shadeAmount());
                    _this.frame += 0.4 * delta;
                    if (_this.frame > 11)
                        _this.frame = -1;
                }
                else {
                    game_1.Game.drawMob(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1.3 - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
                }
                if (!_this.seenPlayer) {
                    _this.drawSleepingZs(delta);
                }
                if (_this.alertTicks > 0) {
                    _this.drawExclamation(delta);
                }
            }
        };
        _this.kill = function () {
            if (_this.room.roomArray[_this.x][_this.y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.room, _this.x, _this.y);
                b.skin = _this.room.roomArray[_this.x][_this.y].skin;
                _this.room.roomArray[_this.x][_this.y] = b;
            }
            _this.dead = true;
            _this.room.particles.push(new deathParticle_1.DeathParticle(_this.x, _this.y));
            _this.dropLoot();
        };
        _this.ticks = 0;
        _this.health = 1;
        _this.tileX = 6;
        _this.tileY = 0;
        _this.frame = 0;
        _this.state = WizardState.attack;
        _this.seenPlayer = false;
        _this.alertTicks = 0;
        _this.name = "wizard bomber";
        if (drop)
            _this.drop = drop;
        else {
            if (random_1.Random.rand() < 0.02)
                _this.drop = new bluegem_1.BlueGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    return WizardEnemy;
}(enemy_1.Enemy));
exports.WizardEnemy = WizardEnemy;


/***/ }),

/***/ "./src/entity/enemy/zombieEnemy.ts":
/*!*****************************************!*\
  !*** ./src/entity/enemy/zombieEnemy.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZombieEnemy = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var pickaxe_1 = __webpack_require__(/*! ../../weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var ZombieEnemy = /** @class */ (function (_super) {
    __extends(ZombieEnemy, _super);
    function ZombieEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 26);
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else {
            }
        };
        _this.behavior = function () {
            // Store the current position
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            // If the enemy is not dead
            if (!_this.dead) {
                // Skip turns if necessary
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    return;
                }
                // Increment the tick counter
                _this.ticks++;
                // If the enemy has not seen the player yet
                if (!_this.seenPlayer)
                    _this.lookForPlayer();
                else if (_this.seenPlayer) {
                    // If the target player has taken their turn
                    if (_this.room.playerTicked === _this.targetPlayer) {
                        // Decrement alert ticks
                        _this.alertTicks = Math.max(0, _this.alertTicks - 1);
                        // Store the old position
                        var oldX = _this.x;
                        var oldY = _this.y;
                        // Create a list of positions to avoid
                        var disablePositions = Array();
                        for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                            var e = _a[_i];
                            if (e !== _this) {
                                disablePositions.push({ x: e.x, y: e.y });
                            }
                        }
                        for (var xx = _this.x - 1; xx <= _this.x + 1; xx++) {
                            for (var yy = _this.y - 1; yy <= _this.y + 1; yy++) {
                                if (_this.room.roomArray[xx][yy] instanceof spiketrap_1.SpikeTrap &&
                                    _this.room.roomArray[xx][yy].on) {
                                    // Don't walk on active spike traps
                                    disablePositions.push({ x: xx, y: yy });
                                }
                            }
                        }
                        // Create a grid of the room
                        var grid = [];
                        for (var x = 0; x < _this.room.roomX + _this.room.width; x++) {
                            grid[x] = [];
                            for (var y = 0; y < _this.room.roomY + _this.room.height; y++) {
                                if (_this.room.roomArray[x] && _this.room.roomArray[x][y])
                                    grid[x][y] = _this.room.roomArray[x][y];
                                else
                                    grid[x][y] = false;
                            }
                        }
                        // Find a path to the target player
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction);
                        // If there are moves available
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var oldDir = _this.direction;
                            var player = _this.targetPlayer;
                            // Face the target player
                            _this.facePlayer(player);
                            // Determine the new direction based on the move
                            if (moveX > oldX)
                                _this.direction = entity_1.EntityDirection.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = entity_1.EntityDirection.LEFT;
                            else if (moveY > oldY)
                                _this.direction = entity_1.EntityDirection.DOWN;
                            else if (moveY < oldY)
                                _this.direction = entity_1.EntityDirection.UP;
                            // If the direction hasn't changed, attempt to move or attack
                            if (oldDir == _this.direction) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moveX &&
                                        _this.game.players[i].y === moveY) {
                                        // Attack the player if they are in the way
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX = 0.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY = 0.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                    }
                                }
                                if (!hitPlayer) {
                                    // Move to the new position
                                    _this.tryMove(moveX, moveY);
                                    _this.drawX = _this.x - oldX;
                                    _this.drawY = _this.y - oldY;
                                    if (_this.x > oldX)
                                        _this.direction = entity_1.EntityDirection.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = entity_1.EntityDirection.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = entity_1.EntityDirection.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = entity_1.EntityDirection.UP;
                                }
                            }
                        }
                        // Add positions to avoid based on the current direction
                        if (_this.direction == entity_1.EntityDirection.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == entity_1.EntityDirection.UP) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        // Make hit warnings
                        _this.makeHitWarnings();
                    }
                    // Check if the target player is offline
                    var targetPlayerOffline = Object.values(_this.game.offlinePlayers).indexOf(_this.targetPlayer) !==
                        -1;
                    // If the enemy is not aggro or the target player is offline, find a new target player
                    if (!_this.aggro || targetPlayerOffline) {
                        var p = _this.nearestPlayer();
                        if (p !== false) {
                            var distance = p[0], player = p[1];
                            if (distance <= 4 &&
                                (targetPlayerOffline ||
                                    distance < _this.playerDistance(_this.targetPlayer))) {
                                if (player !== _this.targetPlayer) {
                                    _this.targetPlayer = player;
                                    _this.facePlayer(player);
                                    if (player === _this.game.players[_this.game.localPlayerID])
                                        _this.alertTicks = 1;
                                    _this.makeHitWarnings();
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY - _this.jumpY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            if (!_this.seenPlayer) {
                _this.drawSleepingZs(delta);
            }
            if (_this.alertTicks > 0) {
                _this.drawExclamation(delta);
            }
        };
        _this.ticks = 0;
        _this.frame = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 17;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.dir = game_1.Direction.South;
        _this.name = "zombie";
        _this.forwardOnlyAttack = true;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new pickaxe_1.Pickaxe(_this.room, 0, 0);
            else if (dropProb < 0.02)
                _this.drop = new greengem_1.GreenGem(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    return ZombieEnemy;
}(enemy_1.Enemy));
exports.ZombieEnemy = ZombieEnemy;


/***/ }),

/***/ "./src/entity/entity.ts":
/*!******************************!*\
  !*** ./src/entity/entity.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Entity = exports.EntityType = exports.EntityDirection = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var bones_1 = __webpack_require__(/*! ../tile/bones */ "./src/tile/bones.ts");
var floor_1 = __webpack_require__(/*! ../tile/floor */ "./src/tile/floor.ts");
var healthbar_1 = __webpack_require__(/*! ../healthbar */ "./src/healthbar.ts");
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var utils_1 = __webpack_require__(/*! ../utils */ "./src/utils.ts");
var eventBus_1 = __webpack_require__(/*! ../eventBus */ "./src/eventBus.ts");
var EntityDirection;
(function (EntityDirection) {
    EntityDirection[EntityDirection["DOWN"] = 0] = "DOWN";
    EntityDirection[EntityDirection["UP"] = 1] = "UP";
    EntityDirection[EntityDirection["RIGHT"] = 2] = "RIGHT";
    EntityDirection[EntityDirection["LEFT"] = 3] = "LEFT";
})(EntityDirection = exports.EntityDirection || (exports.EntityDirection = {}));
var EntityType;
(function (EntityType) {
    EntityType[EntityType["ENEMY"] = 0] = "ENEMY";
    EntityType[EntityType["FRIENDLY"] = 1] = "FRIENDLY";
    EntityType[EntityType["RESOURCE"] = 2] = "RESOURCE";
    EntityType[EntityType["PROP"] = 3] = "PROP";
    EntityType[EntityType["CHEST"] = 4] = "CHEST";
})(EntityType = exports.EntityType || (exports.EntityType = {}));
var Entity = /** @class */ (function (_super) {
    __extends(Entity, _super);
    function Entity(room, game, x, y) {
        var _this = _super.call(this) || this;
        _this.sleepingZFrame = 0;
        _this.behavior = function () { };
        _this.hit = function () {
            return 0;
        };
        _this.hurtCallback = function () { };
        /*
        playerKilledBy = (enemy: Entity) => {
          return enemy;
        };
      */
        _this.pointIn = function (x, y) {
            return (x >= _this.x && x < _this.x + _this.w && y >= _this.y && y < _this.y + _this.h);
        };
        _this.getPlayer = function () {
            var maxDistance = 138291380921; // pulled this straight outta my ass
            var closestDistance = maxDistance;
            var closestPlayer = null;
            for (var i in _this.game.players) {
                if (_this.game.rooms[_this.game.players[i].levelID] === _this.room) {
                    var distance = _this.playerDistance(_this.game.players[i]);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPlayer = _this.game.players[i];
                    }
                }
            }
            if (closestDistance === maxDistance)
                return false;
            else
                return closestPlayer;
        };
        /*
        readonly lastHitBy = (player: Player) => {
          this.hitBy = player;
          if (this.hitBy) this.game.pushMessage(`${this.hitBy}`);
          else this.game.pushMessage("Unknown");
        };
        */
        _this.hurt = function (playerHitBy, damage) {
            _this.healthBar.hurt();
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.interact = function (player) { };
        _this.dropLoot = function () {
            if (_this.drop) {
                _this.drop.level = _this.room;
                if (!_this.room.roomArray[_this.x][_this.y].isSolid()) {
                    _this.drop.x = _this.x;
                    _this.drop.y = _this.y;
                }
                else if (_this.room.roomArray[_this.x][_this.y].isSolid()) {
                    _this.drop.x = _this.lastX;
                    _this.drop.y = _this.lastY;
                }
                _this.room.items.push(_this.drop);
                _this.drop.onDrop();
            }
        };
        _this.kill = function () {
            if (_this.room.roomArray[_this.x][_this.y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.room, _this.x, _this.y);
                b.skin = _this.room.roomArray[_this.x][_this.y].skin;
                _this.room.roomArray[_this.x][_this.y] = b;
            }
            _this.killNoBones();
        };
        _this.killNoBones = function () {
            _this.dead = true;
            /*GenericParticle.spawnCluster(
              this.room,
              this.x + 0.5,
              this.y + 0.5,
              this.deathParticleColor
            );
            this.room.particles.push(new DeathParticle(this.x, this.y));
        */
            _this.dropLoot();
        };
        _this.shadeAmount = function () {
            return _this.room.softVis[_this.x][_this.y];
        };
        _this.doneMoving = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.drawX) < EPSILON && Math.abs(_this.drawY) < EPSILON;
        };
        _this.nearestPlayer = function () {
            var maxDistance = 138291380921; // pulled this straight outta my ass
            var closestDistance = maxDistance;
            var closestPlayer = null;
            for (var i in _this.game.players) {
                if (_this.game.rooms[_this.game.players[i].levelID] === _this.room) {
                    var distance = _this.playerDistance(_this.game.players[i]);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPlayer = _this.game.players[i];
                    }
                }
            }
            if (closestDistance === maxDistance)
                return false;
            else
                return [closestDistance, closestPlayer];
        };
        _this.playerDistance = function (player) {
            return Math.max(Math.abs(_this.x - player.x), Math.abs(_this.y - player.y));
        };
        _this.facePlayer = function (player) {
            var dx = player.x - _this.x;
            var dy = player.y - _this.y;
            if (Math.abs(dx) === Math.abs(dy)) {
                // just moved, already facing player
            }
            else if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0)
                    _this.direction = EntityDirection.RIGHT;
                if (dx < 0)
                    _this.direction = EntityDirection.LEFT;
            }
            else {
                if (dy > 0)
                    _this.direction = EntityDirection.DOWN;
                if (dy < 0)
                    _this.direction = EntityDirection.UP;
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX, _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
            /*if (this.crushed) {
              this.crushAnim(delta);
            }*/
        };
        _this.tick = function () {
            _this.behavior();
        };
        _this.emitEntityData = function () {
            eventBus_1.globalEventBus.emit("EntityData", {
                name: _this.name,
                location: { x: _this.x, y: _this.y },
            });
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y - _this.drawY;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x, _this.y, true);
            _this.updateDrawXY(delta);
        };
        _this.updateDrawXY = function (delta) {
            _this.drawX += -0.3 * delta * _this.drawX;
            _this.drawY += -0.3 * delta * _this.drawY;
        };
        _this.drawSleepingZs = function (delta, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            _this.sleepingZFrame += delta;
            var numZs = 2;
            var t = _this.sleepingZFrame * 0.01; // 0 <= t < 1
            t -= Math.floor(t);
            //let whichway = Math.floor(this.sleepingZFrame * 0.02 / numZs) % 2;
            for (var off = numZs - 1; off >= 0; off--) {
                var yoff = (t + off) * 7;
                var alpha = Math.min(1 - (t + off) / numZs, (2 * (t + off)) / numZs);
                var xoff = 0;
                if (off === 0)
                    xoff = 1;
                if (t >= 0.33 && t < 0.66)
                    xoff = off;
                if (t >= 0.33 && t < 0.66)
                    xoff = off;
                var width = game_1.Game.measureText("Z").width;
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    game_1.Game.ctx.globalAlpha = alpha;
                game_1.Game.fillTextOutline("Z", (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE - width / 2 + xoff + offsetX, (_this.y - 0.6) * gameConstants_1.GameConstants.TILESIZE - yoff + offsetY, gameConstants_1.GameConstants.OUTLINE, "white");
                game_1.Game.ctx.globalAlpha = 1;
            }
        };
        _this.drawExclamation = function (delta, offsetX, offsetY) {
            if (offsetX === void 0) { offsetX = 0; }
            if (offsetY === void 0) { offsetY = 0; }
            _this.exclamationFrame += delta;
            var yoff = 0;
            var yoffs = [0, -1, -2, -3, -5, -7, -4];
            if (_this.exclamationFrame > yoffs.length)
                yoff = yoffs[yoffs.length - 1];
            else
                yoff = yoffs[_this.exclamationFrame];
            var width = game_1.Game.measureText("!").width;
            game_1.Game.ctx.globalAlpha = 1;
            if (yoff !== false) {
                game_1.Game.fillTextOutline("!", (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE - width / 2 + offsetX, (_this.y - 0.75) * gameConstants_1.GameConstants.TILESIZE + yoff + offsetY, gameConstants_1.GameConstants.OUTLINE, gameConstants_1.GameConstants.WARNING_RED);
            }
        };
        _this.crush = function () {
            _this.crushed = true;
            var player;
            for (var i in _this.game.players) {
                player = _this.game.players[i];
            }
            if (_this.x == player.x) {
                _this.crushVertical = true;
            }
            _this.kill();
        };
        _this.crushAnim = function (delta) {
            if (_this.crushVertical && _this.crushY >= 0) {
                _this.crushY *= 0.95;
            }
            else if (_this.crushX >= 0) {
                _this.crushX *= 0.95;
            }
        };
        //set rumbling in the tick function for the enemies
        //create variables for the rumbling x and y offsets
        //return the rumbling x and y offsets
        //add the rumbling x and y offsets to the enemy's x and y in the draw function
        _this.rumble = function (rumbling, frame, direction) {
            var rumbleOffset = { x: 0, y: 0 };
            if (rumbling) {
                var isOddFrame = Math.floor(frame) % 2 === 1;
                var offset = isOddFrame ? 0.0325 : 0;
                if (direction === EntityDirection.LEFT ||
                    direction === EntityDirection.RIGHT) {
                    rumbleOffset.y = offset;
                }
                else if (direction === EntityDirection.UP ||
                    direction === EntityDirection.DOWN ||
                    !direction) {
                    rumbleOffset.x = offset;
                }
                _this.animationSpeed = 0.2;
            }
            return rumbleOffset;
        };
        _this.attemptProjectilePlacement = function (offsets, projectileClass, collide, clearPath, targetingPlayer) {
            if (collide === void 0) { collide = false; }
            if (clearPath === void 0) { clearPath = true; }
            if (targetingPlayer === void 0) { targetingPlayer = false; }
            for (var _i = 0, offsets_1 = offsets; _i < offsets_1.length; _i++) {
                var offset = offsets_1[_i];
                var targetX = _this.x + offset.x;
                var targetY = _this.y + offset.y;
                if (!_this.isValidProjectilePosition(targetX, targetY, collide, clearPath)) {
                    if (targetingPlayer)
                        break;
                    continue;
                }
                _this.placeProjectile(projectileClass, targetX, targetY);
                if (targetingPlayer)
                    break;
            }
        };
        _this.isValidProjectilePosition = function (x, y, collide, clearPath) {
            if (!_this.isWithinRoomBounds(x, y))
                return false;
            if (clearPath && !_this.isPathClear(_this.x, _this.y, x, y))
                return false;
            if (collide && _this.isEntityColliding(x, y))
                return false;
            var targetTile = _this.room.roomArray[x][y];
            return targetTile && !targetTile.isSolid() && !targetTile.isDoor;
        };
        _this.isEntityColliding = function (x, y) {
            return _this.room.entities.some(function (entity) { return entity.x === x && entity.y === y; });
        };
        _this.placeProjectile = function (projectileClass, x, y) {
            _this.room.projectiles.push(new projectileClass(_this, x, y));
        };
        _this.isPathClear = function (startX, startY, endX, endY) {
            var _a;
            var dx = Math.sign(endX - startX);
            var dy = Math.sign(endY - startY);
            var x = startX;
            var y = startY;
            while (x !== endX || y !== endY) {
                x += dx;
                y += dy;
                if (!_this.isWithinRoomBounds(x, y) ||
                    ((_a = _this.room.roomArray[x][y]) === null || _a === void 0 ? void 0 : _a.isSolid())) {
                    //console.log(`Path blocked at (${x}, ${y})`);
                    return false;
                }
            }
            return true;
        };
        _this.makeHitWarnings = function () {
            var _a;
            var cullFactor = 0.25;
            var player = _this.getPlayer();
            var orthogonal = _this.orthogonalAttack;
            var diagonal = _this.diagonalAttack;
            var forwardOnly = _this.forwardOnlyAttack;
            var direction = _this.direction;
            var orthoRange = _this.attackRange;
            var diagRange = _this.diagonalAttackRange;
            var generateOffsets = function (isOrthogonal, range) {
                var baseOffsets = isOrthogonal
                    ? [
                        [-1, 0],
                        [1, 0],
                        [0, -1],
                        [0, 1],
                    ]
                    : [
                        [-1, -1],
                        [1, 1],
                        [1, -1],
                        [-1, 1],
                    ];
                return baseOffsets.flatMap(function (_a) {
                    var dx = _a[0], dy = _a[1];
                    return Array.from({ length: range }, function (_, i) { return [(i + 1) * dx, (i + 1) * dy]; });
                });
            };
            var directionOffsets = (_a = {},
                _a[EntityDirection.LEFT] = [-1, 0],
                _a[EntityDirection.RIGHT] = [1, 0],
                _a[EntityDirection.UP] = [0, -1],
                _a[EntityDirection.DOWN] = [0, 1],
                _a);
            var offsets = [];
            if (forwardOnly) {
                var _b = directionOffsets[direction], dx_1 = _b[0], dy_1 = _b[1];
                offsets = Array.from({ length: orthoRange }, function (_, i) { return [
                    (i + 1) * dx_1,
                    (i + 1) * dy_1,
                ]; });
            }
            else {
                if (orthogonal)
                    offsets.push.apply(offsets, generateOffsets(true, orthoRange));
                if (diagonal)
                    offsets.push.apply(offsets, generateOffsets(false, diagRange));
            }
            var warningCoordinates = offsets
                .map(function (_a) {
                var dx = _a[0], dy = _a[1];
                return ({
                    x: dx,
                    y: dy,
                    distance: utils_1.Utils.distance(dx, dy, player.x - _this.x, player.y - _this.y),
                });
            })
                .sort(function (a, b) { return a.distance - b.distance; });
            var keepCount = Math.ceil(warningCoordinates.length * (1 - cullFactor));
            var culledWarnings = warningCoordinates.slice(0, keepCount);
            culledWarnings.forEach(function (_a) {
                var x = _a.x, y = _a.y;
                var targetX = _this.x + x;
                var targetY = _this.y + y;
                if (_this.isWithinRoomBounds(targetX, targetY)) {
                    _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, targetX, targetY, _this.x, _this.y));
                }
            });
        };
        _this.isWithinRoomBounds = function (x, y) {
            var xInBounds = x >= _this.room.roomX && x < _this.room.roomX + _this.room.width;
            var yInBounds = y >= _this.room.roomY && y < _this.room.roomY + _this.room.height;
            var tileExists = _this.room.roomArray[x] && _this.room.roomArray[x][y] !== undefined;
            return xInBounds && yInBounds && tileExists;
        };
        _this.room = room;
        _this.x = x;
        _this.y = y;
        _this.w = 1;
        _this.h = 1;
        _this.game = game;
        _this.drawX = 0;
        _this.drawY = 0;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.hasShadow = true;
        _this.skipNextTurns = 0;
        _this.direction = EntityDirection.DOWN;
        _this.destroyable = true;
        _this.pushable = false;
        _this.chainPushable = true;
        _this.interactable = false;
        _this.healthBar = new healthbar_1.HealthBar();
        _this.alertTicks = 0;
        _this.exclamationFrame = 0;
        _this.lastX = x;
        _this.lastY = y;
        _this.hitBy = null;
        _this.crushX = 1;
        _this.crushY = 1;
        _this.crushVertical = false;
        _this.crushed = false;
        _this.rumbling = false;
        _this.animationSpeed = 0.1;
        _this.drawYOffset = 1.175;
        _this.orthogonalAttack = false;
        _this.diagonalAttack = false;
        _this.forwardOnlyAttack = false;
        _this.attackRange = 1;
        _this.diagonalAttackRange = 1;
        return _this;
    }
    Object.defineProperty(Entity.prototype, "type", {
        get: function () {
            return EntityType.ENEMY;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Entity.prototype, "crushXoffset", {
        get: function () {
            return this.crushX;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Entity.prototype, "crushYoffset", {
        get: function () {
            return this.crushY;
        },
        enumerable: false,
        configurable: true
    });
    Entity.prototype.calculateProjectileOffsets = function (targetX, targetY, attackLength) {
        var dx = targetX - this.x;
        var dy = targetY - this.y;
        var offsets = [];
        // Normalize the direction
        var stepX = dx !== 0 ? Math.sign(dx) : 0;
        var stepY = dy !== 0 ? Math.sign(dy) : 0;
        // Generate offsets for the full attackLength
        for (var i = 1; i <= attackLength; i++) {
            offsets.push({ x: i * stepX, y: i * stepY });
        }
        return offsets;
    };
    return Entity;
}(drawable_1.Drawable));
exports.Entity = Entity;


/***/ }),

/***/ "./src/entity/object/barrel.ts":
/*!*************************************!*\
  !*** ./src/entity/object/barrel.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Barrel = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var Barrel = /** @class */ (function (_super) {
    __extends(Barrel, _super);
    function Barrel(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 25);
            _this.dead = true;
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.updateDrawXY(delta);
        };
        _this.room = room;
        _this.health = 1;
        _this.tileX = 1;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        _this.name = "barrel";
        return _this;
    }
    Object.defineProperty(Barrel.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return Barrel;
}(entity_1.Entity));
exports.Barrel = Barrel;


/***/ }),

/***/ "./src/entity/object/block.ts":
/*!************************************!*\
  !*** ./src/entity/object/block.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Block = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var Block = /** @class */ (function (_super) {
    __extends(Block, _super);
    function Block(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 29);
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.updateDrawXY(delta);
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.room = room;
        _this.health = 1;
        _this.tileX = 10;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.name = "block";
        return _this;
    }
    Object.defineProperty(Block.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return Block;
}(entity_1.Entity));
exports.Block = Block;


/***/ }),

/***/ "./src/entity/object/chest.ts":
/*!************************************!*\
  !*** ./src/entity/object/chest.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Chest = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var key_1 = __webpack_require__(/*! ../../item/key */ "./src/item/key.ts");
var heart_1 = __webpack_require__(/*! ../../item/heart */ "./src/item/heart.ts");
var armor_1 = __webpack_require__(/*! ../../item/armor */ "./src/item/armor.ts");
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var redgem_1 = __webpack_require__(/*! ../../item/redgem */ "./src/item/redgem.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var torch_1 = __webpack_require__(/*! ../../item/torch */ "./src/item/torch.ts");
var Chest = /** @class */ (function (_super) {
    __extends(Chest, _super);
    function Chest(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            //this.healthBar.hurt();
            _this.health -= 1;
            if (_this.health === 1 && !_this.opening)
                _this.open();
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.open = function () {
            _this.tileX = 0;
            _this.tileY = 2;
            _this.opening = true;
            var _a = _this.getOpenTile(), x = _a.x, y = _a.y;
            switch (_this.rollDrop()) {
                case 1:
                    _this.drop = new heart_1.Heart(_this.room, x, y);
                    break;
                case 2:
                    _this.drop = new torch_1.Torch(_this.room, x, y);
                    break;
                case 3:
                    _this.drop = new redgem_1.RedGem(_this.room, x, y);
                    break;
                case 4:
                    _this.drop = new bluegem_1.BlueGem(_this.room, x, y);
                    break;
                case 5:
                    _this.drop = new key_1.Key(_this.room, x, y);
                    break;
                case 6:
                    _this.drop = new armor_1.Armor(_this.room, x, y);
                    break;
            }
            _this.room.items.push(_this.drop);
        };
        _this.rollDrop = function () {
            return game_1.Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 2, 2], random_1.Random.rand);
        };
        _this.kill = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, "#fbf236");
            _this.dead = true;
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.getOpenTile = function () {
            var x, y;
            do {
                x = game_1.Game.rand(_this.x - 1, _this.x + 1, random_1.Random.rand);
                y = game_1.Game.rand(_this.y - 1, _this.y + 1, random_1.Random.rand);
            } while ((x === _this.x && y === _this.y) ||
                _this.room.roomArray[x][y].isSolid() ||
                _this.room.entities.some(function (e) { return e.x === x && e.y === y; }));
            return { x: x, y: y };
        };
        _this.draw = function (delta) {
            if (_this.opening) {
                if (_this.tileX <= 6) {
                    _this.tileX += 0.15 * delta;
                }
                else {
                    _this.opening = false;
                }
            }
            if (!_this.dead) {
                game_1.Game.drawObj(Math.floor(_this.tileX), Math.floor(_this.tileY), 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 4;
        _this.tileY = 0;
        _this.health = 2;
        _this.name = "chest";
        _this.frame = 0;
        _this.opening = false;
        _this.dropX = 0;
        _this.dropY = 0;
        _this.drop = null;
        return _this;
    }
    Object.defineProperty(Chest.prototype, "type", {
        get: function () {
            return entity_2.EntityType.CHEST;
        },
        enumerable: false,
        configurable: true
    });
    return Chest;
}(entity_1.Entity));
exports.Chest = Chest;


/***/ }),

/***/ "./src/entity/object/crate.ts":
/*!************************************!*\
  !*** ./src/entity/object/crate.ts ***!
  \************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Crate = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var Crate = /** @class */ (function (_super) {
    __extends(Crate, _super);
    function Crate(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 26);
            _this.dead = true;
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.updateDrawXY(delta);
        };
        _this.room = room;
        _this.health = 1;
        _this.maxHealth = 1;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        _this.name = "crate";
        return _this;
    }
    Object.defineProperty(Crate.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return Crate;
}(entity_1.Entity));
exports.Crate = Crate;


/***/ }),

/***/ "./src/entity/object/mushrooms.ts":
/*!****************************************!*\
  !*** ./src/entity/object/mushrooms.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Mushrooms = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var shrooms_1 = __webpack_require__(/*! ../../item/shrooms */ "./src/item/shrooms.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var Mushrooms = /** @class */ (function (_super) {
    __extends(Mushrooms, _super);
    function Mushrooms(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 30);
            _this.room.items.push(new shrooms_1.Shrooms(_this.room, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.updateDrawXY(delta);
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.room = room;
        _this.health = 1;
        _this.tileX = 9;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.name = "mushrooms";
        return _this;
    }
    Object.defineProperty(Mushrooms.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return Mushrooms;
}(entity_1.Entity));
exports.Mushrooms = Mushrooms;


/***/ }),

/***/ "./src/entity/object/pot.ts":
/*!**********************************!*\
  !*** ./src/entity/object/pot.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Pot = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var candle_1 = __webpack_require__(/*! ../../item/candle */ "./src/item/candle.ts");
var Pot = /** @class */ (function (_super) {
    __extends(Pot, _super);
    function Pot(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            _this.room.items.push(_this.drop);
            _this.dead = true;
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 29);
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.updateDrawXY(delta);
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.room = room;
        _this.health = 1;
        _this.tileX = 11;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.name = "pot";
        _this.drop = new candle_1.Candle(_this.room, _this.x, _this.y);
        return _this;
    }
    Object.defineProperty(Pot.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return Pot;
}(entity_1.Entity));
exports.Pot = Pot;


/***/ }),

/***/ "./src/entity/object/pottedPlant.ts":
/*!******************************************!*\
  !*** ./src/entity/object/pottedPlant.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PottedPlant = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var heart_1 = __webpack_require__(/*! ../../item/heart */ "./src/item/heart.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var PottedPlant = /** @class */ (function (_super) {
    __extends(PottedPlant, _super);
    function PottedPlant(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurtCallback = function () {
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 28);
        };
        _this.kill = function () {
            _this.dead = true;
            _this.killNoBones();
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 29);
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 28);
        };
        _this.killNoBones = function () {
            _this.dead = true;
            _this.dropLoot();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.updateDrawXY(delta);
                if (_this.health <= 1)
                    _this.tileX = 2;
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.dropLoot = function () {
            _this.drop.level = _this.room;
            _this.drop.x = _this.x;
            _this.drop.y = _this.y;
            _this.room.items.push(_this.drop);
        };
        _this.room = room;
        _this.health = 2;
        _this.tileX = 3;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.name = "plant";
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new heart_1.Heart(_this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, 0, 0);
        }
        return _this;
    }
    Object.defineProperty(PottedPlant.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return PottedPlant;
}(entity_1.Entity));
exports.PottedPlant = PottedPlant;


/***/ }),

/***/ "./src/entity/object/tombStone.ts":
/*!****************************************!*\
  !*** ./src/entity/object/tombStone.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TombStone = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var skullEnemy_1 = __webpack_require__(/*! ../enemy/skullEnemy */ "./src/entity/enemy/skullEnemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var spellbook_1 = __webpack_require__(/*! ../../weapon/spellbook */ "./src/weapon/spellbook.ts");
var sound_1 = __webpack_require__(/*! ../../sound */ "./src/sound.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var lightSource_1 = __webpack_require__(/*! ../../lightSource */ "./src/lightSource.ts");
var TombStone = /** @class */ (function (_super) {
    __extends(TombStone, _super);
    function TombStone(room, game, x, y, skinType, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            _this.dropLoot();
            _this.room.lightSources = _this.room.lightSources.filter(function (ls) { return ls !== _this.room.lightSources[_this.room.lightSources.length - 1]; });
        };
        _this.hurt = function (playerHitBy, damage) {
            _this.healthBar.hurt();
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 25);
            setTimeout(function () {
                sound_1.Sound.hurt();
            }, 100);
            _this.health -= 1;
            if (_this.health === 1) {
                var positions = _this.room
                    .getEmptyTiles()
                    .filter(function (t) { return Math.abs(t.x - _this.x) <= 1 && Math.abs(t.y - _this.y) <= 1; });
                if (positions.length > 0) {
                    for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
                        var position = positions_1[_i];
                        for (var i in _this.game.players) {
                            var playerX = _this.game.players[i].x;
                            var playerY = _this.game.players[i].y;
                            if ((playerX !== position.x && playerY === position.y) ||
                                (playerX === position.x && playerY !== position.y)) {
                                _this.room.entities.push(new skullEnemy_1.SkullEnemy(_this.room, _this.game, position.x, position.y));
                            }
                        }
                    }
                    sound_1.Sound.skeleSpawn();
                }
                _this.tileX += 2;
                //draw half broken tombstone based on skintype after it takes one damage
            }
            if (_this.health <= 0)
                _this.kill(), sound_1.Sound.breakRock();
            else
                _this.hurtCallback(), sound_1.Sound.hit();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.updateDrawXY(delta);
        };
        _this.skinType = skinType;
        _this.room = room;
        _this.health = 2;
        _this.maxHealth = 2;
        _this.tileX = 11 + _this.skinType;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.pushable = false;
        _this.destroyable = true;
        _this.skinType = skinType;
        _this.chainPushable = false;
        _this.name = "tombstone";
        var dropProb = random_1.Random.rand();
        if (dropProb < 0.05)
            _this.drop = new spellbook_1.Spellbook(_this.room, 0, 0);
        _this.room.lightSources.push(new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 1, [5, 150, 5], 1));
        return _this;
    }
    Object.defineProperty(TombStone.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return TombStone;
}(entity_1.Entity));
exports.TombStone = TombStone;


/***/ }),

/***/ "./src/entity/object/vendingMachine.ts":
/*!*********************************************!*\
  !*** ./src/entity/object/vendingMachine.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VendingMachine = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var coal_1 = __webpack_require__(/*! ../../item/coal */ "./src/item/coal.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var gameConstants_1 = __webpack_require__(/*! ../../gameConstants */ "./src/gameConstants.ts");
var shotgun_1 = __webpack_require__(/*! ../../weapon/shotgun */ "./src/weapon/shotgun.ts");
var armor_1 = __webpack_require__(/*! ../../item/armor */ "./src/item/armor.ts");
var heart_1 = __webpack_require__(/*! ../../item/heart */ "./src/item/heart.ts");
var spear_1 = __webpack_require__(/*! ../../weapon/spear */ "./src/weapon/spear.ts");
var gold_1 = __webpack_require__(/*! ../../item/gold */ "./src/item/gold.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var dualdagger_1 = __webpack_require__(/*! ../../weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var lantern_1 = __webpack_require__(/*! ../../item/lantern */ "./src/item/lantern.ts");
var redgem_1 = __webpack_require__(/*! ../../item/redgem */ "./src/item/redgem.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var OPEN_TIME = 150;
var FILL_COLOR = "#5a595b";
var OUTLINE_COLOR = "#292c36";
var FULL_OUTLINE = "white";
var VendingMachine = /** @class */ (function (_super) {
    __extends(VendingMachine, _super);
    function VendingMachine(room, game, x, y, item) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.open = false;
        _this.openTime = 0;
        _this.isInf = false;
        _this.quantity = 1;
        _this.buyAnimAmount = 0;
        _this.interact = function (player) {
            if (_this.isInf || _this.quantity > 0) {
                if (_this.open)
                    _this.playerOpened.openVendingMachine = null;
                _this.open = true;
                _this.playerOpened = player;
                _this.openTime = Date.now();
                if (_this.playerOpened.openVendingMachine &&
                    _this.playerOpened.openVendingMachine !== _this)
                    _this.playerOpened.openVendingMachine.close();
                _this.playerOpened.openVendingMachine = _this;
            }
        };
        _this.close = function () {
            _this.open = false;
            _this.playerOpened.openVendingMachine = null;
        };
        _this.space = function () {
            if (_this.open) {
                // check if player can pay
                for (var _i = 0, _a = _this.costItems; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (!_this.playerOpened.inventory.hasItemCount(i))
                        return;
                }
                for (var _b = 0, _c = _this.costItems; _b < _c.length; _b++) {
                    var i = _c[_b];
                    _this.playerOpened.inventory.subtractItemCount(i);
                }
                var x_1, y_1;
                do {
                    x_1 = game_1.Game.rand(_this.x - 1, _this.x + 1, random_1.Random.rand);
                    y_1 = game_1.Game.rand(_this.y - 1, _this.y + 1, random_1.Random.rand);
                } while ((x_1 === _this.x && y_1 === _this.y) ||
                    _this.room.roomArray[x_1][y_1].isSolid() ||
                    _this.room.entities.some(function (e) { return e.x === x_1 && e.y === y_1; }));
                var newItem = new _this.item.constructor();
                newItem = newItem.constructor(_this.room, x_1, y_1);
                _this.room.items.push(newItem);
                if (!_this.isInf) {
                    _this.quantity--;
                    if (_this.quantity <= 0)
                        _this.close();
                }
                _this.buyAnimAmount = 0.99;
                if (_this.playerOpened === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(0, 4);
            }
        };
        _this.draw = function (delta) {
            var tileX = 19;
            if (!_this.isInf && _this.quantity === 0)
                tileX = 20;
            game_1.Game.drawObj(tileX, 0, 1, 2, _this.x, _this.y - 1, 1, 2, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            if (_this.open &&
                _this.playerOpened === _this.game.players[_this.game.localPlayerID]) {
                var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
                var b = 2; // border
                var g = -2; // gap
                var hg = 3; // highlighted growth
                var ob = 1; // outer border
                var width = (_this.costItems.length + 2) * (s + 2 * b + g) - g;
                var height = s + 2 * b + g - g;
                var cx = (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE;
                var cy = (_this.y - 1.5) * gameConstants_1.GameConstants.TILESIZE;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width) - ob, Math.round(cy - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                for (var x = 0; x < _this.costItems.length + 2; x++) {
                    game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                    game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width + x * (s + 2 * b + g)), Math.round(cy - 0.5 * height), Math.round(s + 2 * b), Math.round(s + 2 * b));
                    if (x !== _this.costItems.length) {
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width + x * (s + 2 * b + g) + b), Math.round(cy - 0.5 * height + b), Math.round(s), Math.round(s));
                    }
                }
                if (Date.now() - _this.openTime >= OPEN_TIME) {
                    for (var i = 0; i < _this.costItems.length + 2; i++) {
                        var drawX = Math.round(cx -
                            0.5 * width +
                            i * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawY = Math.round(cy -
                            0.5 * height +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                        if (i < _this.costItems.length) {
                            var a = 1;
                            if (!_this.playerOpened.inventory.hasItemCount(_this.costItems[i]))
                                a = 0.15;
                            _this.costItems[i].drawIcon(delta, drawXScaled, drawYScaled, a);
                        }
                        else if (i === _this.costItems.length) {
                            game_1.Game.drawFX(2, 0, 1, 1, drawXScaled, drawYScaled, 1, 1);
                        }
                        else if (i === _this.costItems.length + 1) {
                            _this.item.drawIcon(delta, drawXScaled, drawYScaled);
                        }
                    }
                }
                _this.buyAnimAmount *= _this.buyAnimAmount;
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    game_1.Game.ctx.globalAlpha = _this.buyAnimAmount;
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                game_1.Game.ctx.fillRect(Math.round(cx - 0.5 * width) - ob, Math.round(cy - 0.5 * height) - ob, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                game_1.Game.ctx.globalAlpha = 1.0;
            }
        };
        _this.destroyable = false;
        _this.pushable = false;
        _this.chainPushable = false;
        _this.interactable = true;
        _this.costItems = [];
        _this.item = item;
        _this.name = "vending machine";
        if (_this.item instanceof shotgun_1.Shotgun) {
            var g = new bluegem_1.BlueGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof heart_1.Heart) {
            var c = new coin_1.Coin(room, 0, 0);
            c.stackCount = 10;
            _this.costItems = [c];
            _this.isInf = true;
        }
        else if (_this.item instanceof spear_1.Spear) {
            var g = new greengem_1.GreenGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof armor_1.Armor) {
            var g = new gold_1.Gold(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof dualdagger_1.DualDagger) {
            var g = new redgem_1.RedGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5, 5, 6, 7], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof lantern_1.Lantern) {
            var g = new coal_1.Coal(room, 0, 0);
            g.stackCount = game_1.Game.randTable([25, 26, 27, 28], random_1.Random.rand);
            _this.costItems = [g];
        }
        return _this;
    }
    Object.defineProperty(VendingMachine.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return VendingMachine;
}(entity_1.Entity));
exports.VendingMachine = VendingMachine;


/***/ }),

/***/ "./src/entity/resource/coalResource.ts":
/*!*********************************************!*\
  !*** ./src/entity/resource/coalResource.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoalResource = void 0;
var resource_1 = __webpack_require__(/*! ./resource */ "./src/entity/resource/resource.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var coal_1 = __webpack_require__(/*! ../../item/coal */ "./src/item/coal.ts");
var sound_1 = __webpack_require__(/*! ../../sound */ "./src/sound.ts");
var CoalResource = /** @class */ (function (_super) {
    __extends(CoalResource, _super);
    function CoalResource(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, "#ffffff");
            if (_this.room === _this.game.room)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.room === _this.game.room)
                sound_1.Sound.breakRock();
            _this.dead = true;
            _this.room.items.push(new coal_1.Coal(_this.room, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.health = 1;
        _this.name = "coal";
        return _this;
    }
    return CoalResource;
}(resource_1.Resource));
exports.CoalResource = CoalResource;


/***/ }),

/***/ "./src/entity/resource/emeraldResource.ts":
/*!************************************************!*\
  !*** ./src/entity/resource/emeraldResource.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmeraldResource = void 0;
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var resource_1 = __webpack_require__(/*! ./resource */ "./src/entity/resource/resource.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var sound_1 = __webpack_require__(/*! ../../sound */ "./src/sound.ts");
var EmeraldResource = /** @class */ (function (_super) {
    __extends(EmeraldResource, _super);
    function EmeraldResource(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurtCallback = function () {
            genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, "#fbf236");
            if (_this.room === _this.game.room)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.room === _this.game.room)
                sound_1.Sound.breakRock();
            _this.dead = true;
            _this.room.items.push(new greengem_1.GreenGem(_this.room, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 14;
        _this.tileY = 0;
        _this.health = 3;
        _this.name = "emerald";
        return _this;
    }
    return EmeraldResource;
}(resource_1.Resource));
exports.EmeraldResource = EmeraldResource;


/***/ }),

/***/ "./src/entity/resource/goldResource.ts":
/*!*********************************************!*\
  !*** ./src/entity/resource/goldResource.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoldResource = void 0;
var resource_1 = __webpack_require__(/*! ./resource */ "./src/entity/resource/resource.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var gold_1 = __webpack_require__(/*! ../../item/gold */ "./src/item/gold.ts");
var sound_1 = __webpack_require__(/*! ../../sound */ "./src/sound.ts");
var GoldResource = /** @class */ (function (_super) {
    __extends(GoldResource, _super);
    function GoldResource(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurtCallback = function () {
            if (_this.room === _this.game.room)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.room === _this.game.room)
                sound_1.Sound.breakRock();
            _this.dead = true;
            _this.room.items.push(new gold_1.Gold(_this.room, _this.x, _this.y));
            genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, "#fbf236");
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 13;
        _this.tileY = 0;
        _this.health = 2;
        _this.name = "gold";
        return _this;
    }
    return GoldResource;
}(resource_1.Resource));
exports.GoldResource = GoldResource;


/***/ }),

/***/ "./src/entity/resource/resource.ts":
/*!*****************************************!*\
  !*** ./src/entity/resource/resource.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Resource = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var Resource = /** @class */ (function (_super) {
    __extends(Resource, _super);
    function Resource(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurt = function (playerHitBy, damage) {
            if (playerHitBy.inventory.getWeapon().canMine === true) {
                _this.healthBar.hurt();
                _this.health -= damage;
                if (_this.health <= 0)
                    _this.kill();
                else {
                    _this.game.pushMessage("Your weapon fails to damage the rock.");
                    _this.hurtCallback();
                }
            }
            else
                return;
        };
        _this.kill = function () {
            _this.dead = true;
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.health = 1;
        _this.chainPushable = false;
        _this.name = "resource";
        return _this;
    }
    Object.defineProperty(Resource.prototype, "type", {
        get: function () {
            return entity_2.EntityType.RESOURCE;
        },
        enumerable: false,
        configurable: true
    });
    return Resource;
}(entity_1.Entity));
exports.Resource = Resource;


/***/ }),

/***/ "./src/entity/resource/rockResource.ts":
/*!*********************************************!*\
  !*** ./src/entity/resource/rockResource.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Rock = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../../particle/genericParticle */ "./src/particle/genericParticle.ts");
var sound_1 = __webpack_require__(/*! ../../sound */ "./src/sound.ts");
var stone_1 = __webpack_require__(/*! ../../item/stone */ "./src/item/stone.ts");
var resource_1 = __webpack_require__(/*! ./resource */ "./src/entity/resource/resource.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var Rock = /** @class */ (function (_super) {
    __extends(Rock, _super);
    function Rock(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurtCallback = function () {
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 24); //rock particle coord 0, 24
            if (_this.room === _this.game.room)
                sound_1.Sound.mine();
        };
        _this.kill = function () {
            if (_this.room === _this.game.room)
                sound_1.Sound.breakRock();
            _this.dead = true;
            genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, "#9badb7");
            _this.room.items.push(new stone_1.Stone(_this.room, _this.x, _this.y));
        };
        _this.killNoBones = function () {
            _this.kill();
        };
        _this.draw = function (delta) {
            // not inherited because it doesn't have the 0.5 offset
            if (!_this.dead) {
                _this.updateDrawXY(delta);
                game_1.Game.drawObj(_this.tileX, _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - 1 - _this.drawY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
        };
        _this.room = room;
        _this.health = 2;
        _this.tileX = 8;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.name = "rock";
        return _this;
    }
    return Rock;
}(resource_1.Resource));
exports.Rock = Rock;


/***/ }),

/***/ "./src/eventBus.ts":
/*!*************************!*\
  !*** ./src/eventBus.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.globalEventBus = void 0;
var eventEmitter_1 = __webpack_require__(/*! ./eventEmitter */ "./src/eventEmitter.ts");
var EventBus = /** @class */ (function () {
    function EventBus() {
        this.eventEmitter = new eventEmitter_1.EventEmitter();
    }
    EventBus.getInstance = function () {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    };
    EventBus.prototype.emit = function (event, data) {
        this.eventEmitter.emit(event, data);
    };
    EventBus.prototype.on = function (event, callback) {
        this.eventEmitter.on(event, callback);
    };
    EventBus.prototype.off = function (event, callback) {
        this.eventEmitter.off(event, callback);
    };
    return EventBus;
}());
exports.globalEventBus = EventBus.getInstance();


/***/ }),

/***/ "./src/eventEmitter.ts":
/*!*****************************!*\
  !*** ./src/eventEmitter.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventEmitter = void 0;
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.events = {};
    }
    EventEmitter.prototype.on = function (event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    };
    EventEmitter.prototype.off = function (event, listener) {
        if (!this.events[event])
            return;
        this.events[event] = this.events[event].filter(function (l) { return l !== listener; });
    };
    EventEmitter.prototype.emit = function (event, data) {
        if (!this.events[event])
            return;
        this.events[event].forEach(function (listener) { return listener(data); });
    };
    // New method to remove all listeners for an event
    EventEmitter.prototype.removeAllListeners = function (event) {
        delete this.events[event];
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;


/***/ }),

/***/ "./src/game.ts":
/*!*********************!*\
  !*** ./src/game.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Game = exports.ChatMessage = exports.Direction = exports.LevelState = void 0;
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var door_1 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var sound_1 = __webpack_require__(/*! ./sound */ "./src/sound.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var input_1 = __webpack_require__(/*! ./input */ "./src/input.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
var textbox_1 = __webpack_require__(/*! ./textbox */ "./src/textbox.ts");
var gameState_1 = __webpack_require__(/*! ./gameState */ "./src/gameState.ts");
var door_2 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var tutorialListener_1 = __webpack_require__(/*! ./tutorialListener */ "./src/tutorialListener.ts");
var mouseCursor_1 = __webpack_require__(/*! ./mouseCursor */ "./src/mouseCursor.ts");
var LevelState;
(function (LevelState) {
    LevelState[LevelState["IN_LEVEL"] = 0] = "IN_LEVEL";
    LevelState[LevelState["TRANSITIONING"] = 1] = "TRANSITIONING";
    LevelState[LevelState["TRANSITIONING_LADDER"] = 2] = "TRANSITIONING_LADDER";
})(LevelState = exports.LevelState || (exports.LevelState = {}));
var Direction;
(function (Direction) {
    Direction[Direction["North"] = 0] = "North";
    Direction[Direction["NorthEast"] = 1] = "NorthEast";
    Direction[Direction["East"] = 2] = "East";
    Direction[Direction["SouthEast"] = 3] = "SouthEast";
    Direction[Direction["South"] = 4] = "South";
    Direction[Direction["SouthWest"] = 5] = "SouthWest";
    Direction[Direction["West"] = 6] = "West";
    Direction[Direction["NorthWest"] = 7] = "NorthWest";
    Direction[Direction["Center"] = 8] = "Center";
})(Direction = exports.Direction || (exports.Direction = {}));
var ChatMessage = /** @class */ (function () {
    function ChatMessage(message) {
        this.message = message;
        this.timestamp = Date.now();
    }
    return ChatMessage;
}());
exports.ChatMessage = ChatMessage;
var getShadeCanvasKey = function (set, sx, sy, sw, sh, opacity) {
    return set.src + "," + sx + "," + sy + "," + sw + "," + sh + "," + opacity;
};
// fps counter
var times = [];
var fps;
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.localPlayerID = "localplayer";
        this.mostRecentInputReceived = true;
        this.loginMessage = "";
        this.newGame = function () {
            var gs = new gameState_1.GameState();
            gs.seed = (Math.random() * 4294967296) >>> 0;
            gs.randomState = (Math.random() * 4294967296) >>> 0;
            (0, gameState_1.loadGameState)(_this, [_this.localPlayerID], gs, true);
        };
        this.keyDownListener = function (key) {
            if (!_this.chatOpen) {
                switch (key.toUpperCase()) {
                    case "C":
                        _this.chatOpen = true;
                        break;
                    case "/":
                        _this.chatOpen = true;
                        _this.chatTextBox.clear();
                        _this.chatTextBox.handleKeyPress(key);
                        break;
                    case "A":
                    case "ARROWLEFT":
                        _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.LEFT);
                        break;
                    case "D":
                    case "ARROWRIGHT":
                        _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.RIGHT);
                        break;
                    case "W":
                    case "ARROWUP":
                        _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.UP);
                        break;
                    case "S":
                    case "ARROWDOWN":
                        _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.DOWN);
                        break;
                    case " ":
                        _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.SPACE);
                        break;
                    case "I":
                        _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.I);
                        break;
                    case "Q":
                        _this.players[_this.localPlayerID].inputHandler(input_1.InputEnum.Q);
                        break;
                }
            }
            else {
                _this.chatTextBox.handleKeyPress(key);
            }
        };
        this.changeLevel = function (player, newLevel) {
            player.levelID = _this.rooms.indexOf(newLevel);
            if (_this.players[_this.localPlayerID] === player) {
                //this.level.exitLevel();
                _this.room = newLevel;
            }
            newLevel.enterLevel(player);
        };
        this.changeLevelThroughLadder = function (player, ladder) {
            player.levelID = _this.rooms.indexOf(ladder.linkedLevel);
            if (ladder instanceof downLadder_1.DownLadder) {
                player.map.saveOldMap();
                ladder.generate();
                //let newLevel = new Level(1);
            }
            if (_this.players[_this.localPlayerID] === player) {
                _this.levelState = LevelState.TRANSITIONING_LADDER;
                _this.transitionStartTime = Date.now();
                _this.transitioningLadder = ladder;
            }
            else {
                ladder.linkedLevel.enterLevel(player, ladder.linkedLevel); // since it's not a local player, don't wait for transition
            }
        };
        this.changeLevelThroughDoor = function (player, door, side) {
            player.levelID = _this.rooms.indexOf(door.room);
            if (_this.players[_this.localPlayerID] === player) {
                _this.levelState = LevelState.TRANSITIONING;
                _this.transitionStartTime = Date.now();
                var oldX = _this.players[_this.localPlayerID].x;
                var oldY = _this.players[_this.localPlayerID].y;
                _this.prevLevel = _this.room;
                //this.level.exitLevel();
                _this.room = door.room;
                door.room.enterLevelThroughDoor(player, door, side);
                _this.transitionX =
                    (_this.players[_this.localPlayerID].x - oldX) * gameConstants_1.GameConstants.TILESIZE;
                _this.transitionY =
                    (_this.players[_this.localPlayerID].y - oldY) * gameConstants_1.GameConstants.TILESIZE;
                _this.upwardTransition = false;
                _this.sideTransition = false;
                _this.sideTransitionDirection = side;
                if (door instanceof door_1.Door &&
                    [door_2.DoorDir.East, door_2.DoorDir.West].includes(door.doorDir))
                    _this.sideTransition = true;
                else if (door instanceof door_1.Door && door.doorDir === door_2.DoorDir.South)
                    _this.upwardTransition = true;
            }
            else {
                door.room.enterLevelThroughDoor(player, door, side);
            }
            player.map.saveMapData();
        };
        this.run = function (timestamp) {
            if (!_this.previousFrameTimestamp)
                _this.previousFrameTimestamp = timestamp; // - 1000.0 / GameConstants.FPS;
            // normalized so 1.0 = 60fps
            var delta = ((timestamp - _this.previousFrameTimestamp) * 60) / 1000.0;
            while (times.length > 0 && times[0] <= timestamp - 1000) {
                times.shift();
            }
            times.push(timestamp);
            fps = times.length;
            _this.update();
            _this.draw(delta);
            window.requestAnimationFrame(_this.run);
            _this.previousFrameTimestamp = timestamp;
        };
        this.update = function () {
            input_1.Input.checkIsTapHold();
            if (input_1.Input.lastPressTime !== 0 &&
                Date.now() - input_1.Input.lastPressTime > gameConstants_1.GameConstants.KEY_REPEAT_TIME) {
                input_1.Input.onKeydown({
                    repeat: false,
                    key: input_1.Input.lastPressKey,
                });
            }
            if (_this.levelState === LevelState.TRANSITIONING) {
                if (Date.now() - _this.transitionStartTime >=
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME) {
                    _this.levelState = LevelState.IN_LEVEL;
                }
            }
            if (_this.levelState === LevelState.TRANSITIONING_LADDER) {
                if (Date.now() - _this.transitionStartTime >=
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME_LADDER) {
                    _this.levelState = LevelState.IN_LEVEL;
                    _this.players[_this.localPlayerID].map.saveMapData();
                }
            }
            for (var i in _this.players) {
                _this.players[i].update();
                _this.rooms[_this.players[i].levelID].update();
                if (_this.players[i].dead) {
                    for (var j in _this.players) {
                        _this.players[j].dead = true;
                    }
                }
            }
        };
        this.lerp = function (a, b, t) {
            return (1 - t) * a + t * b;
        };
        this.pushMessage = function (message) {
            _this.chat.push(new ChatMessage(message));
        };
        this.onResize = function () {
            var maxWidthScale = Math.floor(window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH);
            var maxHeightScale = Math.floor(window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT);
            var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                game.pushMessage("mobile detected");
                // Adjust scale for mobile devices
                Game.scale = 2; // Example: limit scale to 2 for mobile
            }
            else {
                Game.scale = Math.min(maxWidthScale, maxHeightScale);
            }
            Game.scale = Math.min(maxWidthScale, maxHeightScale);
            if (Game.scale === 0) {
                maxWidthScale = window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH;
                maxHeightScale = window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT;
            }
            Game.scale = Math.min(maxWidthScale, maxHeightScale);
            levelConstants_1.LevelConstants.SCREEN_W = Math.floor(window.innerWidth / Game.scale / gameConstants_1.GameConstants.TILESIZE);
            levelConstants_1.LevelConstants.SCREEN_H = Math.floor(window.innerHeight / Game.scale / gameConstants_1.GameConstants.TILESIZE);
            gameConstants_1.GameConstants.WIDTH = levelConstants_1.LevelConstants.SCREEN_W * gameConstants_1.GameConstants.TILESIZE;
            gameConstants_1.GameConstants.HEIGHT = levelConstants_1.LevelConstants.SCREEN_H * gameConstants_1.GameConstants.TILESIZE;
            Game.ctx.canvas.setAttribute("width", "".concat(gameConstants_1.GameConstants.WIDTH));
            Game.ctx.canvas.setAttribute("height", "".concat(gameConstants_1.GameConstants.HEIGHT));
            Game.ctx.canvas.setAttribute("style", "width: ".concat(gameConstants_1.GameConstants.WIDTH * Game.scale, "px; height: ").concat(gameConstants_1.GameConstants.HEIGHT * Game.scale, "px;\n    display: block;\n    margin: 0 auto;\n  \n    image-rendering: optimizeSpeed; /* Older versions of FF          */\n    image-rendering: -moz-crisp-edges; /* FF 6.0+                       */\n    image-rendering: -webkit-optimize-contrast; /* Safari                        */\n    image-rendering: -o-crisp-edges; /* OS X & Windows Opera (12.02+) */\n    image-rendering: pixelated; /* Awesome future-browsers       */\n  \n    -ms-interpolation-mode: nearest-neighbor;"));
            //Game.ctx.canvas.width = window.innerWidth;
            //Game.ctx.canvas.height = window.innerHeight;
        };
        this.shakeScreen = function (shakeX, shakeY) {
            _this.screenShakeX = shakeX;
            _this.screenShakeY = shakeY;
        };
        this.drawStuff = function (delta) {
            _this.room.drawColorLayer();
            _this.room.drawShade(delta);
            _this.room.drawOverShade(delta);
        };
        this.draw = function (delta) {
            Game.ctx.globalAlpha = 1;
            Game.ctx.fillStyle = _this.room.shadeColor;
            Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            if (_this.levelState === LevelState.TRANSITIONING) {
                var levelOffsetX = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) /
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, -_this.transitionX));
                var levelOffsetY = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) /
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, -_this.transitionY));
                var playerOffsetX = levelOffsetX - _this.transitionX;
                var playerOffsetY = levelOffsetY - _this.transitionY;
                var playerCX = (_this.players[_this.localPlayerID].x -
                    _this.players[_this.localPlayerID].drawX +
                    0.5) *
                    gameConstants_1.GameConstants.TILESIZE;
                var playerCY = (_this.players[_this.localPlayerID].y -
                    _this.players[_this.localPlayerID].drawY +
                    0.5) *
                    gameConstants_1.GameConstants.TILESIZE;
                Game.ctx.translate(-Math.round(playerCX + playerOffsetX - 0.5 * gameConstants_1.GameConstants.WIDTH), -Math.round(playerCY + playerOffsetY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                var extraTileLerp = Math.floor(_this.lerp((Date.now() - _this.transitionStartTime) /
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME, 0, gameConstants_1.GameConstants.TILESIZE));
                var newLevelOffsetX = playerOffsetX;
                var newLevelOffsetY = playerOffsetY;
                if (_this.sideTransition) {
                    if (_this.sideTransitionDirection > 0) {
                        levelOffsetX += extraTileLerp;
                        newLevelOffsetX += extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                    }
                    else {
                        levelOffsetX -= extraTileLerp;
                        newLevelOffsetX -= extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                    }
                }
                else if (_this.upwardTransition) {
                    levelOffsetY -= extraTileLerp;
                    newLevelOffsetY -= extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                }
                else {
                    levelOffsetY += extraTileLerp;
                    newLevelOffsetY += extraTileLerp + gameConstants_1.GameConstants.TILESIZE;
                }
                var ditherFrame = Math.floor((7 * (Date.now() - _this.transitionStartTime)) /
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME);
                Game.ctx.translate(levelOffsetX, levelOffsetY);
                _this.prevLevel.draw(delta);
                _this.prevLevel.drawEntities(delta);
                for (var x = _this.prevLevel.roomX - 1; x <= _this.prevLevel.roomX + _this.prevLevel.width; x++) {
                    for (var y = _this.prevLevel.roomY - 1; y <= _this.prevLevel.roomY + _this.prevLevel.height; y++) {
                        Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
                    }
                }
                Game.ctx.translate(-levelOffsetX, -levelOffsetY);
                Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);
                _this.room.draw(delta);
                _this.room.drawEntities(delta, true);
                for (var x = _this.room.roomX - 1; x <= _this.room.roomX + _this.room.width; x++) {
                    for (var y = _this.room.roomY - 1; y <= _this.room.roomY + _this.room.height; y++) {
                        Game.drawFX(ditherFrame, 10, 1, 1, x, y, 1, 1);
                    }
                }
                Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);
                Game.ctx.translate(playerOffsetX, playerOffsetY);
                _this.players[_this.localPlayerID].draw(delta);
                Game.ctx.translate(-playerOffsetX, -playerOffsetY);
                Game.ctx.translate(newLevelOffsetX, newLevelOffsetY);
                _this.drawStuff(delta);
                Game.ctx.translate(-newLevelOffsetX, -newLevelOffsetY);
                Game.ctx.translate(Math.round(playerCX + playerOffsetX - 0.5 * gameConstants_1.GameConstants.WIDTH), Math.round(playerCY + playerOffsetY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                _this.players[_this.localPlayerID].drawGUI(delta);
                for (var i in _this.players)
                    _this.players[i].updateDrawXY(delta);
            }
            else if (_this.levelState === LevelState.TRANSITIONING_LADDER) {
                var playerCX = (_this.players[_this.localPlayerID].x -
                    _this.players[_this.localPlayerID].drawX +
                    0.5) *
                    gameConstants_1.GameConstants.TILESIZE;
                var playerCY = (_this.players[_this.localPlayerID].y -
                    _this.players[_this.localPlayerID].drawY +
                    0.5) *
                    gameConstants_1.GameConstants.TILESIZE;
                Game.ctx.translate(-Math.round(playerCX - 0.5 * gameConstants_1.GameConstants.WIDTH), -Math.round(playerCY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                var deadFrames = 6;
                var ditherFrame = Math.floor(((7 * 2 + deadFrames) * (Date.now() - _this.transitionStartTime)) /
                    levelConstants_1.LevelConstants.LEVEL_TRANSITION_TIME_LADDER);
                if (ditherFrame < 7) {
                    _this.room.draw(delta);
                    _this.room.drawEntities(delta);
                    _this.drawStuff(delta);
                    for (var x = _this.room.roomX - 1; x <= _this.room.roomX + _this.room.width; x++) {
                        for (var y = _this.room.roomY - 1; y <= _this.room.roomY + _this.room.height; y++) {
                            Game.drawFX(7 - ditherFrame, 10, 1, 1, x, y, 1, 1);
                        }
                    }
                }
                else if (ditherFrame >= 7 + deadFrames) {
                    if (_this.transitioningLadder) {
                        _this.prevLevel = _this.room;
                        _this.room.exitLevel();
                        _this.room = _this.transitioningLadder.linkedLevel;
                        _this.room.enterLevel(_this.players[_this.localPlayerID]);
                        _this.transitioningLadder = null;
                    }
                    _this.room.draw(delta);
                    _this.room.drawEntities(delta);
                    _this.drawStuff(delta);
                    for (var x = _this.room.roomX - 1; x <= _this.room.roomX + _this.room.width; x++) {
                        for (var y = _this.room.roomY - 1; y <= _this.room.roomY + _this.room.height; y++) {
                            Game.drawFX(ditherFrame - (7 + deadFrames), 10, 1, 1, x, y, 1, 1);
                        }
                    }
                }
                Game.ctx.translate(Math.round(playerCX - 0.5 * gameConstants_1.GameConstants.WIDTH), Math.round(playerCY - 0.5 * gameConstants_1.GameConstants.HEIGHT));
                _this.players[_this.localPlayerID].drawGUI(delta);
                for (var i in _this.players)
                    _this.players[i].updateDrawXY(delta);
            }
            else {
                _this.screenShakeX *= -0.8;
                _this.screenShakeY *= -0.8;
                var playerDrawX = _this.players[_this.localPlayerID].drawX;
                var playerDrawY = _this.players[_this.localPlayerID].drawY;
                var cameraX = Math.round((_this.players[_this.localPlayerID].x - playerDrawX + 0.5) *
                    gameConstants_1.GameConstants.TILESIZE -
                    0.5 * gameConstants_1.GameConstants.WIDTH -
                    _this.screenShakeX);
                var cameraY = Math.round((_this.players[_this.localPlayerID].y - playerDrawY + 0.5) *
                    gameConstants_1.GameConstants.TILESIZE -
                    0.5 * gameConstants_1.GameConstants.HEIGHT -
                    _this.screenShakeY);
                Game.ctx.translate(-cameraX, -cameraY);
                _this.room.draw(delta);
                _this.room.drawEntities(delta);
                _this.drawStuff(delta);
                _this.players[_this.localPlayerID].drawTopLayer(delta);
                Game.ctx.translate(cameraX, cameraY);
                _this.room.drawTopLayer(delta);
                _this.players[_this.localPlayerID].drawGUI(delta);
                for (var i in _this.players)
                    _this.players[i].updateDrawXY(delta);
            }
            // draw chat
            var CHAT_X = 10;
            var CHAT_BOTTOM_Y = gameConstants_1.GameConstants.HEIGHT - Game.letter_height - 32;
            var CHAT_OPACITY = 0.5;
            if (_this.chatOpen) {
                Game.ctx.fillStyle = "black";
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    Game.ctx.globalAlpha = 0.75;
                Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
                Game.ctx.globalAlpha = 1;
                Game.ctx.fillStyle = "white";
                Game.fillText(_this.chatTextBox.text, CHAT_X, CHAT_BOTTOM_Y);
                var cursorX = Game.measureText(_this.chatTextBox.text.substring(0, _this.chatTextBox.cursor)).width;
                Game.ctx.fillRect(CHAT_X + cursorX, CHAT_BOTTOM_Y, 1, Game.letter_height);
            }
            for (var i = 0; i < _this.chat.length; i++) {
                Game.ctx.fillStyle = "white";
                if (_this.chat[i][0] === "/")
                    Game.ctx.fillStyle = gameConstants_1.GameConstants.GREEN;
                var y = CHAT_BOTTOM_Y - (_this.chat.length - 1 - i) * (Game.letter_height + 1);
                if (_this.chatOpen)
                    y -= Game.letter_height + 1;
                var age = Date.now() - _this.chat[i].timestamp;
                if (_this.chatOpen) {
                    Game.ctx.globalAlpha = 1;
                }
                else {
                    if (age <= gameConstants_1.GameConstants.CHAT_APPEAR_TIME) {
                        if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                            Game.ctx.globalAlpha = CHAT_OPACITY;
                    }
                    else if (age <=
                        gameConstants_1.GameConstants.CHAT_APPEAR_TIME + gameConstants_1.GameConstants.CHAT_FADE_TIME) {
                        if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                            Game.ctx.globalAlpha =
                                CHAT_OPACITY *
                                    (1 -
                                        (age - gameConstants_1.GameConstants.CHAT_APPEAR_TIME) /
                                            gameConstants_1.GameConstants.CHAT_FADE_TIME);
                    }
                    else {
                        Game.ctx.globalAlpha = 0;
                    }
                }
                Game.fillText(_this.chat[i].message, CHAT_X, y);
            }
            // game version
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                Game.ctx.globalAlpha = 0.1;
            Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            Game.fillText(gameConstants_1.GameConstants.VERSION, gameConstants_1.GameConstants.WIDTH - Game.measureText(gameConstants_1.GameConstants.VERSION).width - 1, 1);
            Game.ctx.globalAlpha = 1;
            // fps
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                Game.ctx.globalAlpha = 0.1;
            Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            Game.fillText(fps + "fps", 1, 1);
            Game.ctx.globalAlpha = 1;
            mouseCursor_1.MouseCursor.getInstance().draw();
        };
        window.addEventListener("load", function () {
            var canvas = document.getElementById("gameCanvas");
            Game.ctx = canvas.getContext("2d", {
                alpha: false,
            });
            // Create TextBox instances and associate them with HTML elements
            var usernameElement = document.createElement("input");
            usernameElement.type = "text";
            usernameElement.autocomplete = "off";
            usernameElement.autocapitalize = "off";
            usernameElement.style.position = "absolute";
            usernameElement.style.left = "-1000px"; // Position off-screen
            //const passwordElement = document.createElement("input");
            //passwordElement.type = "password";
            //passwordElement.style.position = "absolute";
            //passwordElement.style.left = "-1000px"; // Position off-screen
            var chatElement = document.createElement("input");
            chatElement.type = "text";
            chatElement.style.position = "absolute";
            chatElement.style.left = "-1000px"; // Position off-screen
            //document.body.appendChild(usernameElement);
            //document.body.appendChild(passwordElement);
            document.body.appendChild(chatElement);
            document.addEventListener("click", function () {
                usernameElement.focus();
            }, { once: true });
            _this.chat = [];
            _this.chatTextBox = new textbox_1.TextBox(chatElement);
            _this.chatTextBox.setEnterCallback(function () {
                if (_this.chatTextBox.text.length > 0) {
                    _this.chat.push(new ChatMessage(_this.chatTextBox.text));
                    _this.chatTextBox.clear();
                }
                else {
                    _this.chatOpen = false;
                }
            });
            _this.chatTextBox.setEscapeCallback(function () {
                _this.chatOpen = false;
            });
            _this.worldCodes = [];
            _this.selectedWorldCode = 0;
            Game.shade_canvases = {};
            Game.text_rendering_canvases = {};
            var resourcesLoaded = 0;
            var NUM_RESOURCES = 6;
            Game.tileset = new Image();
            Game.tileset.onload = function () {
                resourcesLoaded++;
            };
            Game.tileset.src = "res/tileset.png";
            Game.objset = new Image();
            Game.objset.onload = function () {
                resourcesLoaded++;
            };
            Game.objset.src = "res/objset.png";
            Game.mobset = new Image();
            Game.mobset.onload = function () {
                resourcesLoaded++;
            };
            Game.mobset.src = "res/mobset.png";
            Game.itemset = new Image();
            Game.itemset.onload = function () {
                resourcesLoaded++;
            };
            Game.itemset.src = "res/itemset.png";
            Game.fxset = new Image();
            Game.fxset.onload = function () {
                resourcesLoaded++;
            };
            Game.fxset.src = "res/fxset.png";
            Game.fontsheet = new Image();
            Game.fontsheet.onload = function () {
                resourcesLoaded++;
            };
            Game.fontsheet.src = "res/font.png";
            var checkResourcesLoaded = function () {
                if (resourcesLoaded < NUM_RESOURCES) {
                    window.setTimeout(checkResourcesLoaded, 500);
                }
                else {
                    console.log("loaded all images");
                    // proceed with constructor
                    Game.scale = 1;
                    sound_1.Sound.loadSounds();
                    sound_1.Sound.playMusic(); // loops forever
                    document.addEventListener("touchstart", function (e) {
                        if (e.target == canvas) {
                            e.preventDefault();
                        }
                    }, false);
                    document.addEventListener("touchend", function (e) {
                        if (e.target == canvas) {
                            e.preventDefault();
                        }
                    }, false);
                    document.addEventListener("touchmove", function (e) {
                        if (e.target == canvas) {
                            e.preventDefault();
                        }
                    }, false);
                    document.addEventListener("touchstart", input_1.Input.handleTouchStart, {
                        passive: false,
                    });
                    document.addEventListener("touchmove", input_1.Input.handleTouchMove, {
                        passive: false,
                    });
                    document.addEventListener("touchend", input_1.Input.handleTouchEnd, {
                        passive: false,
                    });
                    input_1.Input.keyDownListener = function (key) {
                        _this.keyDownListener(key);
                    };
                    window.requestAnimationFrame(_this.run);
                    _this.onResize();
                    window.addEventListener("resize", _this.onResize);
                    _this.players = {};
                    _this.offlinePlayers = {};
                    _this.chatOpen = false;
                    _this.screenShakeX = 0;
                    _this.screenShakeY = 0;
                    _this.levelState = LevelState.IN_LEVEL;
                    _this.tutorialActive = false;
                    _this.newGame();
                }
            };
            checkResourcesLoaded();
        });
        this.tutorialListener = new tutorialListener_1.TutorialListener(this);
    }
    Game.letters = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/";
    Game.letter_widths = [
        4, 4, 4, 4, 3, 3, 4, 4, 1, 4, 4, 3, 5, 5, 4, 4, 4, 4, 4, 3, 4, 5, 5, 5, 5,
        3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 1, 1, 4, 1, 1, 2, 2, 2, 2, 5, 3, 3,
    ];
    Game.letter_height = 6;
    Game.letter_positions = [];
    // [min, max] inclusive
    Game.rand = function (min, max, rand) {
        if (max < min)
            return min;
        return Math.floor(rand() * (max - min + 1) + min);
    };
    Game.randTable = function (table, rand) {
        return table[Game.rand(0, table.length - 1, rand)];
    };
    Game.measureText = function (text) {
        var w = 0;
        for (var _i = 0, _a = text.toLowerCase(); _i < _a.length; _i++) {
            var letter = _a[_i];
            if (letter === " ")
                w += 4;
            else
                for (var i = 0; i < Game.letters.length; i++) {
                    if (Game.letters[i] === letter) {
                        w += Game.letter_widths[i] + 1;
                    }
                }
        }
        return { width: w, height: Game.letter_height };
    };
    Game.fillText = function (text, x, y, maxWidth) {
        x = Math.round(x);
        y = Math.round(y);
        if (Game.letter_positions.length === 0) {
            // calculate letter positions
            for (var i = 0; i < Game.letter_widths.length; i++) {
                if (i === 0)
                    Game.letter_positions[0] = 0;
                else
                    Game.letter_positions[i] =
                        Game.letter_positions[i - 1] + Game.letter_widths[i - 1] + 2;
            }
        }
        else {
            var dimensions = Game.measureText(text);
            if (dimensions.width > 0) {
                var key = text + Game.ctx.fillStyle;
                if (!Game.text_rendering_canvases[key]) {
                    Game.text_rendering_canvases[key] = document.createElement("canvas");
                    Game.text_rendering_canvases[key].width = dimensions.width;
                    Game.text_rendering_canvases[key].height = dimensions.height;
                    var bx = Game.text_rendering_canvases[key].getContext("2d");
                    var letter_x = 0;
                    for (var _i = 0, _a = text.toLowerCase(); _i < _a.length; _i++) {
                        var letter = _a[_i];
                        if (letter === " ")
                            letter_x += 4;
                        else
                            for (var i = 0; i < Game.letters.length; i++) {
                                if (Game.letters[i] === letter) {
                                    bx.drawImage(Game.fontsheet, Game.letter_positions[i] + 1, 0, Game.letter_widths[i], Game.letter_height, letter_x, 0, Game.letter_widths[i], Game.letter_height);
                                    letter_x += Game.letter_widths[i] + 1;
                                }
                            }
                    }
                    bx.fillStyle = Game.ctx.fillStyle;
                    bx.globalCompositeOperation = "source-in";
                    bx.fillRect(0, 0, Game.text_rendering_canvases[key].width, Game.text_rendering_canvases[key].height);
                    Game.ctx.drawImage(Game.text_rendering_canvases[key], x, y);
                }
                else {
                    Game.ctx.drawImage(Game.text_rendering_canvases[key], x, y);
                }
            }
        }
    };
    Game.fillTextOutline = function (text, x, y, outlineColor, fillColor) {
        Game.ctx.fillStyle = outlineColor;
        for (var xx = -1; xx <= 1; xx++) {
            for (var yy = -1; yy <= 1; yy++) {
                Game.fillText(text, x + xx, y + yy);
            }
        }
        Game.ctx.fillStyle = fillColor;
        Game.fillText(text, x, y);
    };
    Game.drawHelper = function (set, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        // snap to nearest shading increment
        shadeOpacity =
            Math.round(shadeOpacity * gameConstants_1.GameConstants.SHADE_LEVELS) /
                gameConstants_1.GameConstants.SHADE_LEVELS;
        var key = getShadeCanvasKey(set, sX, sY, sW, sH, shadeOpacity);
        if (!Game.shade_canvases[key]) {
            Game.shade_canvases[key] = document.createElement("canvas");
            Game.shade_canvases[key].width = Math.round(sW * gameConstants_1.GameConstants.TILESIZE);
            Game.shade_canvases[key].height = Math.round(sH * gameConstants_1.GameConstants.TILESIZE);
            var shCtx = Game.shade_canvases[key].getContext("2d");
            shCtx.clearRect(0, 0, Game.shade_canvases[key].width, Game.shade_canvases[key].height);
            shCtx.globalCompositeOperation = "source-over";
            shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE));
            shCtx.globalAlpha = shadeOpacity;
            shCtx.fillStyle = shadeColor;
            shCtx.fillRect(0, 0, Game.shade_canvases[key].width, Game.shade_canvases[key].height);
            shCtx.globalAlpha = 1.0;
            shCtx.globalCompositeOperation = "destination-in";
            shCtx.drawImage(set, Math.round(sX * gameConstants_1.GameConstants.TILESIZE), Math.round(sY * gameConstants_1.GameConstants.TILESIZE), Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE), 0, 0, Math.round(sW * gameConstants_1.GameConstants.TILESIZE), Math.round(sH * gameConstants_1.GameConstants.TILESIZE));
        }
        Game.ctx.drawImage(Game.shade_canvases[key], Math.round(dX * gameConstants_1.GameConstants.TILESIZE), Math.round(dY * gameConstants_1.GameConstants.TILESIZE), Math.round(dW * gameConstants_1.GameConstants.TILESIZE), Math.round(dH * gameConstants_1.GameConstants.TILESIZE));
    };
    Game.drawTile = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.tileset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
        /*Game.ctx.drawImage(
          Game.tileset,
          Math.round(sX * GameConstants.TILESIZE),
          Math.round(sY * GameConstants.TILESIZE),
          Math.round(sW * GameConstants.TILESIZE),
          Math.round(sH * GameConstants.TILESIZE),
          Math.round(dX * GameConstants.TILESIZE),
          Math.round(dY * GameConstants.TILESIZE),
          Math.round(dW * GameConstants.TILESIZE),
          Math.round(dH * GameConstants.TILESIZE)
        );
    
        if (GameConstants.ALPHA_ENABLED) {
          Game.ctx.globalAlpha = shadeOpacity;
          Game.ctx.fillStyle = shadeColor;
          Game.ctx.fillRect(
            Math.round(dX * GameConstants.TILESIZE),
            Math.round(dY * GameConstants.TILESIZE),
            Math.round(dW * GameConstants.TILESIZE),
            Math.round(dH * GameConstants.TILESIZE)
          );
          Game.ctx.globalAlpha = 1.0;
        }*/
    };
    Game.drawObj = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.objset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawMob = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.mobset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawItem = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.itemset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    Game.drawFX = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.fxset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
    };
    return Game;
}());
exports.Game = Game;
var game = new Game();


/***/ }),

/***/ "./src/gameConstants.ts":
/*!******************************!*\
  !*** ./src/gameConstants.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameConstants = void 0;
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var GameConstants = /** @class */ (function () {
    function GameConstants() {
    }
    GameConstants.VERSION = "v0.6.3";
    GameConstants.FPS = 120;
    GameConstants.ALPHA_ENABLED = true;
    GameConstants.SHADE_LEVELS = 25;
    GameConstants.TILESIZE = 16;
    GameConstants.SCALE = 1;
    GameConstants.SWIPE_THRESH = Math.pow(25, 2); // (size of swipe threshold circle)^2
    GameConstants.KEY_REPEAT_TIME = 200; // millseconds
    GameConstants.MOVEMENT_COOLDOWN = 100; // milliseconds
    GameConstants.CHAT_APPEAR_TIME = 5000;
    GameConstants.CHAT_FADE_TIME = 1000;
    GameConstants.DEFAULTWIDTH = 6 * GameConstants.TILESIZE;
    GameConstants.DEFAULTHEIGHT = 12 * GameConstants.TILESIZE;
    GameConstants.WIDTH = levelConstants_1.LevelConstants.SCREEN_W * GameConstants.TILESIZE;
    GameConstants.HEIGHT = levelConstants_1.LevelConstants.SCREEN_H * GameConstants.TILESIZE;
    GameConstants.scrolling = true;
    GameConstants.SCRIPT_FONT_SIZE = 16;
    GameConstants.FONT_SIZE = 7;
    GameConstants.BIG_FONT_SIZE = 15;
    GameConstants.RED = "#ac3232";
    GameConstants.WARNING_RED = "#ff0000";
    GameConstants.GREEN = "#6abe30";
    GameConstants.ARMOR_GREY = "#9badb7";
    GameConstants.OUTLINE = "#222034";
    GameConstants.HIT_ENEMY_TEXT_COLOR = "#76428a";
    GameConstants.HEALTH_BUFF_COLOR = "#d77bba";
    GameConstants.MISS_COLOR = "#639bff";
    return GameConstants;
}());
exports.GameConstants = GameConstants;


/***/ }),

/***/ "./src/gameState.ts":
/*!**************************!*\
  !*** ./src/gameState.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.loadGameState = exports.createGameState = exports.GameState = exports.PlayerState = exports.InventoryState = exports.ItemState = exports.ItemType = exports.LevelState = exports.EnemyState = exports.EnemyType = exports.ProjectileState = exports.ProjectileType = exports.HitWarningState = void 0;
var barrel_1 = __webpack_require__(/*! ./entity/object/barrel */ "./src/entity/object/barrel.ts");
var bigSkullEnemy_1 = __webpack_require__(/*! ./entity/enemy/bigSkullEnemy */ "./src/entity/enemy/bigSkullEnemy.ts");
var chargeEnemy_1 = __webpack_require__(/*! ./entity/enemy/chargeEnemy */ "./src/entity/enemy/chargeEnemy.ts");
var chest_1 = __webpack_require__(/*! ./entity/object/chest */ "./src/entity/object/chest.ts");
var coalResource_1 = __webpack_require__(/*! ./entity/resource/coalResource */ "./src/entity/resource/coalResource.ts");
var crate_1 = __webpack_require__(/*! ./entity/object/crate */ "./src/entity/object/crate.ts");
var emeraldResource_1 = __webpack_require__(/*! ./entity/resource/emeraldResource */ "./src/entity/resource/emeraldResource.ts");
var goldResource_1 = __webpack_require__(/*! ./entity/resource/goldResource */ "./src/entity/resource/goldResource.ts");
var knightEnemy_1 = __webpack_require__(/*! ./entity/enemy/knightEnemy */ "./src/entity/enemy/knightEnemy.ts");
var pottedPlant_1 = __webpack_require__(/*! ./entity/object/pottedPlant */ "./src/entity/object/pottedPlant.ts");
var pot_1 = __webpack_require__(/*! ./entity/object/pot */ "./src/entity/object/pot.ts");
var skullEnemy_1 = __webpack_require__(/*! ./entity/enemy/skullEnemy */ "./src/entity/enemy/skullEnemy.ts");
var crabEnemy_1 = __webpack_require__(/*! ./entity/enemy/crabEnemy */ "./src/entity/enemy/crabEnemy.ts");
var spawner_1 = __webpack_require__(/*! ./entity/enemy/spawner */ "./src/entity/enemy/spawner.ts");
var vendingMachine_1 = __webpack_require__(/*! ./entity/object/vendingMachine */ "./src/entity/object/vendingMachine.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./entity/enemy/wizardEnemy */ "./src/entity/enemy/wizardEnemy.ts");
var zombieEnemy_1 = __webpack_require__(/*! ./entity/enemy/zombieEnemy */ "./src/entity/enemy/zombieEnemy.ts");
var hitWarning_1 = __webpack_require__(/*! ./hitWarning */ "./src/hitWarning.ts");
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var bluegem_1 = __webpack_require__(/*! ./item/bluegem */ "./src/item/bluegem.ts");
var candle_1 = __webpack_require__(/*! ./item/candle */ "./src/item/candle.ts");
var coal_1 = __webpack_require__(/*! ./item/coal */ "./src/item/coal.ts");
var coin_1 = __webpack_require__(/*! ./item/coin */ "./src/item/coin.ts");
var equippable_1 = __webpack_require__(/*! ./item/equippable */ "./src/item/equippable.ts");
var gold_1 = __webpack_require__(/*! ./item/gold */ "./src/item/gold.ts");
var goldenKey_1 = __webpack_require__(/*! ./item/goldenKey */ "./src/item/goldenKey.ts");
var greengem_1 = __webpack_require__(/*! ./item/greengem */ "./src/item/greengem.ts");
var heart_1 = __webpack_require__(/*! ./item/heart */ "./src/item/heart.ts");
var key_1 = __webpack_require__(/*! ./item/key */ "./src/item/key.ts");
var lantern_1 = __webpack_require__(/*! ./item/lantern */ "./src/item/lantern.ts");
var redgem_1 = __webpack_require__(/*! ./item/redgem */ "./src/item/redgem.ts");
var torch_1 = __webpack_require__(/*! ./item/torch */ "./src/item/torch.ts");
var levelGenerator_1 = __webpack_require__(/*! ./levelGenerator */ "./src/levelGenerator.ts");
var player_1 = __webpack_require__(/*! ./player */ "./src/player.ts");
var enemySpawnAnimation_1 = __webpack_require__(/*! ./projectile/enemySpawnAnimation */ "./src/projectile/enemySpawnAnimation.ts");
var wizardFireball_1 = __webpack_require__(/*! ./projectile/wizardFireball */ "./src/projectile/wizardFireball.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var dagger_1 = __webpack_require__(/*! ./weapon/dagger */ "./src/weapon/dagger.ts");
var dualdagger_1 = __webpack_require__(/*! ./weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var shotgun_1 = __webpack_require__(/*! ./weapon/shotgun */ "./src/weapon/shotgun.ts");
var spear_1 = __webpack_require__(/*! ./weapon/spear */ "./src/weapon/spear.ts");
var pickaxe_1 = __webpack_require__(/*! ./weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var backpack_1 = __webpack_require__(/*! ./item/backpack */ "./src/item/backpack.ts");
var block_1 = __webpack_require__(/*! ./entity/object/block */ "./src/entity/object/block.ts");
var HitWarningState = /** @class */ (function () {
    function HitWarningState(hw) {
        this.x = hw.x;
        this.y = hw.y;
        this.dead = hw.dead;
    }
    return HitWarningState;
}());
exports.HitWarningState = HitWarningState;
var loadHitWarning = function (hws, game) {
    var hw = new hitWarning_1.HitWarning(game, hws.x, hws.y, hws.x, hws.y);
    hw.dead = hws.dead;
    return hw;
};
var ProjectileType;
(function (ProjectileType) {
    ProjectileType[ProjectileType["SPAWN"] = 0] = "SPAWN";
    ProjectileType[ProjectileType["WIZARD"] = 1] = "WIZARD";
})(ProjectileType = exports.ProjectileType || (exports.ProjectileType = {}));
var ProjectileState = /** @class */ (function () {
    function ProjectileState(projectile, game) {
        this.x = projectile.x;
        this.y = projectile.y;
        this.dead = projectile.dead;
        if (projectile instanceof enemySpawnAnimation_1.EnemySpawnAnimation) {
            this.type = ProjectileType.SPAWN;
            this.levelID = game.rooms.indexOf(projectile.room);
            this.enemySpawn = new EnemyState(projectile.enemy, game);
        }
        if (projectile instanceof wizardFireball_1.WizardFireball) {
            this.type = ProjectileType.WIZARD;
            this.wizardState = projectile.state;
            this.levelID = game.rooms.indexOf(projectile.parent.room);
            this.wizardParentID = projectile.parent.room.entities.indexOf(projectile.parent);
        }
    }
    return ProjectileState;
}());
exports.ProjectileState = ProjectileState;
var loadProjectile = function (ps, game) {
    if (ps.type === ProjectileType.SPAWN) {
        var level = game.rooms[ps.levelID];
        var enemy = loadEnemy(ps.enemySpawn, game);
        var p = new enemySpawnAnimation_1.EnemySpawnAnimation(level, enemy, ps.x, ps.y);
        p.dead = ps.dead;
        return p;
    }
    if (ps.type === ProjectileType.WIZARD) {
        var wizard = game.rooms[ps.levelID].entities[ps.wizardParentID];
        var p = new wizardFireball_1.WizardFireball(wizard, ps.x, ps.y);
        p.state = ps.wizardState;
        return p;
    }
};
var EnemyType;
(function (EnemyType) {
    EnemyType[EnemyType["BARREL"] = 0] = "BARREL";
    EnemyType[EnemyType["BIGSKULL"] = 1] = "BIGSKULL";
    EnemyType[EnemyType["CHARGE"] = 2] = "CHARGE";
    EnemyType[EnemyType["CHEST"] = 3] = "CHEST";
    EnemyType[EnemyType["COAL"] = 4] = "COAL";
    EnemyType[EnemyType["CRATE"] = 5] = "CRATE";
    EnemyType[EnemyType["EMERALD"] = 6] = "EMERALD";
    EnemyType[EnemyType["GOLD"] = 7] = "GOLD";
    EnemyType[EnemyType["KNIGHT"] = 8] = "KNIGHT";
    EnemyType[EnemyType["PLANT"] = 9] = "PLANT";
    EnemyType[EnemyType["SKULL"] = 10] = "SKULL";
    EnemyType[EnemyType["CRAB"] = 11] = "CRAB";
    EnemyType[EnemyType["SPAWNER"] = 12] = "SPAWNER";
    EnemyType[EnemyType["VENDINGMACHINE"] = 13] = "VENDINGMACHINE";
    EnemyType[EnemyType["WIZARD"] = 14] = "WIZARD";
    EnemyType[EnemyType["ZOMBIE"] = 15] = "ZOMBIE";
})(EnemyType = exports.EnemyType || (exports.EnemyType = {}));
var EnemyState = /** @class */ (function () {
    function EnemyState(enemy, game) {
        this.levelID = game.rooms.indexOf(enemy.room);
        this.x = enemy.x;
        this.y = enemy.y;
        this.health = enemy.health;
        this.direction = enemy.direction;
        this.dead = enemy.dead;
        this.skipNextTurns = enemy.skipNextTurns;
        this.hasDrop = false;
        if (enemy.drop) {
            this.hasDrop = true;
            this.drop = new ItemState(enemy.drop, game);
        }
        this.alertTicks = enemy.alertTicks;
        if (enemy instanceof barrel_1.Barrel)
            this.type = EnemyType.BARREL;
        if (enemy instanceof bigSkullEnemy_1.BigSkullEnemy) {
            this.type = EnemyType.BIGSKULL;
            this.ticks = enemy.ticks;
            this.ticksSinceFirstHit = enemy.ticksSinceFirstHit;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
            this.drops = [];
            for (var _i = 0, _a = enemy.drops; _i < _a.length; _i++) {
                var d = _a[_i];
                this.drops.push(new ItemState(d, game));
            }
        }
        if (enemy instanceof chargeEnemy_1.ChargeEnemy) {
            this.type = EnemyType.CHARGE;
            this.ticks = enemy.ticks;
            this.chargeEnemyState = enemy.state;
            this.startX = enemy.startX;
            this.startY = enemy.startY;
            this.targetX = enemy.targetX;
            this.targetY = enemy.targetY;
            this.visualTargetX = enemy.visualTargetX;
            this.visualTargetY = enemy.visualTargetY;
        }
        if (enemy instanceof chest_1.Chest)
            this.type = EnemyType.CHEST;
        if (enemy instanceof coalResource_1.CoalResource)
            this.type = EnemyType.COAL;
        if (enemy instanceof crate_1.Crate)
            this.type = EnemyType.CRATE;
        if (enemy instanceof emeraldResource_1.EmeraldResource)
            this.type = EnemyType.EMERALD;
        if (enemy instanceof goldResource_1.GoldResource)
            this.type = EnemyType.GOLD;
        if (enemy instanceof knightEnemy_1.KnightEnemy) {
            this.type = EnemyType.KNIGHT;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
        if (enemy instanceof pottedPlant_1.PottedPlant)
            this.type = EnemyType.PLANT;
        if (enemy instanceof pot_1.Pot)
            this.type = EnemyType.PLANT;
        if (enemy instanceof skullEnemy_1.SkullEnemy) {
            this.type = EnemyType.SKULL;
            this.ticks = enemy.ticks;
            this.ticksSinceFirstHit = enemy.ticksSinceFirstHit;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
        if (enemy instanceof crabEnemy_1.CrabEnemy) {
            this.type = EnemyType.CRAB;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
        if (enemy instanceof spawner_1.Spawner) {
            this.type = EnemyType.SPAWNER;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            this.enemySpawnType = enemy.enemySpawnType;
        }
        if (enemy instanceof vendingMachine_1.VendingMachine) {
            this.type = EnemyType.VENDINGMACHINE;
            this.isPlayerOpened = false;
            if (enemy.playerOpened) {
                this.isPlayerOpened = true;
                this.playerOpenedID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.playerOpened; });
                if (!this.playerOpenedID)
                    this.playerOpenedID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.playerOpened; });
            }
            this.open = enemy.open;
            this.costItems = [];
            for (var _b = 0, _c = enemy.costItems; _b < _c.length; _b++) {
                var item = _c[_b];
                this.costItems.push(new ItemState(item, game));
            }
            this.item = new ItemState(enemy.item, game);
            this.isInf = enemy.isInf;
            this.quantity = enemy.quantity;
        }
        if (enemy instanceof wizardEnemy_1.WizardEnemy) {
            this.type = EnemyType.WIZARD;
            this.ticks = enemy.ticks;
            this.wizardState = enemy.state;
            this.seenPlayer = enemy.seenPlayer;
        }
        if (enemy instanceof zombieEnemy_1.ZombieEnemy) {
            this.type = EnemyType.ZOMBIE;
            this.ticks = enemy.ticks;
            this.seenPlayer = enemy.seenPlayer;
            if (enemy.seenPlayer) {
                this.targetPlayerID = Object.keys(game.players).find(function (key) { return game.players[key] === enemy.targetPlayer; });
                if (!this.targetPlayerID)
                    this.targetPlayerID = Object.keys(game.offlinePlayers).find(function (key) { return game.offlinePlayers[key] === enemy.targetPlayer; });
            }
        }
    }
    return EnemyState;
}());
exports.EnemyState = EnemyState;
var loadEnemy = function (es, game) {
    var enemy;
    var level = game.rooms[es.levelID];
    if (es.type === EnemyType.BARREL)
        enemy = new barrel_1.Barrel(level, game, es.x, es.y);
    if (es.type === EnemyType.BIGSKULL) {
        enemy = new bigSkullEnemy_1.BigSkullEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.ticksSinceFirstHit = es.ticksSinceFirstHit;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
        enemy.drops = [];
        for (var _i = 0, _a = es.drops; _i < _a.length; _i++) {
            var d = _a[_i];
            enemy.drops.push(loadItem(d, game));
        }
    }
    if (es.type === EnemyType.CHARGE) {
        enemy = new chargeEnemy_1.ChargeEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.state = es.chargeEnemyState;
        enemy.startX = es.startX;
        enemy.startY = es.startY;
        enemy.targetX = es.targetX;
        enemy.targetY = es.targetY;
        enemy.visualTargetX = es.visualTargetX;
        enemy.visualTargetY = es.visualTargetY;
    }
    if (es.type === EnemyType.CHEST)
        enemy = new chest_1.Chest(level, game, es.x, es.y);
    if (es.type === EnemyType.COAL)
        enemy = new coalResource_1.CoalResource(level, game, es.x, es.y);
    if (es.type === EnemyType.CRATE)
        enemy = new crate_1.Crate(level, game, es.x, es.y);
    if (es.type === EnemyType.EMERALD)
        enemy = new emeraldResource_1.EmeraldResource(level, game, es.x, es.y);
    if (es.type === EnemyType.GOLD)
        enemy = new goldResource_1.GoldResource(level, game, es.x, es.y);
    if (es.type === EnemyType.KNIGHT) {
        enemy = new knightEnemy_1.KnightEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    if (es.type === EnemyType.PLANT)
        enemy = new pottedPlant_1.PottedPlant(level, game, es.x, es.y);
    if (es.type === EnemyType.PLANT)
        enemy = new pot_1.Pot(level, game, es.x, es.y);
    if (es.type === EnemyType.SKULL) {
        enemy = new skullEnemy_1.SkullEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.ticksSinceFirstHit = es.ticksSinceFirstHit;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    if (es.type === EnemyType.CRAB) {
        enemy = new crabEnemy_1.CrabEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    if (es.type === EnemyType.SPAWNER) {
        enemy = new spawner_1.Spawner(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        enemy.enemySpawnType = es.enemySpawnType;
    }
    if (es.type === EnemyType.VENDINGMACHINE) {
        var item = loadItem(es.item, game);
        enemy = new vendingMachine_1.VendingMachine(level, game, es.x, es.y, item);
        if (es.isPlayerOpened) {
            enemy.playerOpened = game.players[es.playerOpenedID];
            if (!enemy.playerOpened)
                enemy.playerOpened = game.offlinePlayers[es.playerOpenedID];
        }
        enemy.open = es.open;
        enemy.costItems = [];
        for (var _b = 0, _c = es.costItems; _b < _c.length; _b++) {
            var item_1 = _c[_b];
            enemy.costItems.push(loadItem(item_1, game));
        }
        enemy.isInf = es.isInf;
        enemy.quantity = es.quantity;
    }
    if (es.type === EnemyType.WIZARD) {
        enemy = new wizardEnemy_1.WizardEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.state = es.wizardState;
        enemy.seenPlayer = es.seenPlayer;
    }
    if (es.type === EnemyType.ZOMBIE) {
        enemy = new zombieEnemy_1.ZombieEnemy(level, game, es.x, es.y);
        enemy.ticks = es.ticks;
        enemy.seenPlayer = es.seenPlayer;
        if (es.seenPlayer) {
            enemy.targetPlayer = game.players[es.targetPlayerID];
            if (!enemy.targetPlayer)
                enemy.targetPlayer = game.offlinePlayers[es.targetPlayerID];
        }
    }
    enemy.x = es.x;
    enemy.y = es.y;
    enemy.health = es.health;
    enemy.direction = es.direction;
    enemy.dead = es.dead;
    enemy.skipNextTurns = es.skipNextTurns;
    if (es.hasDrop)
        enemy.drop = loadItem(es.drop, game);
    enemy.alertTicks = es.alertTicks;
    return enemy;
};
var LevelState = /** @class */ (function () {
    function LevelState(level, game) {
        this.levelID = game.rooms.indexOf(level);
        this.entered = level.entered;
        this.enemies = [];
        this.items = [];
        this.projectiles = [];
        this.hitwarnings = [];
        for (var _i = 0, _a = level.entities; _i < _a.length; _i++) {
            var enemy = _a[_i];
            this.enemies.push(new EnemyState(enemy, game));
        }
        for (var _b = 0, _c = level.items; _b < _c.length; _b++) {
            var item = _c[_b];
            this.items.push(new ItemState(item, game));
        }
        for (var _d = 0, _e = level.projectiles; _d < _e.length; _d++) {
            var projectile = _e[_d];
            this.projectiles.push(new ProjectileState(projectile, game));
        }
        for (var _f = 0, _g = level.hitwarnings; _f < _g.length; _f++) {
            var hw = _g[_f];
            this.hitwarnings.push(new HitWarningState(hw));
        }
    }
    return LevelState;
}());
exports.LevelState = LevelState;
var loadLevel = function (level, levelState, game) {
    level.entered = levelState.entered;
    level.entities = [];
    level.items = [];
    level.projectiles = [];
    level.hitwarnings = [];
    for (var _i = 0, _a = levelState.enemies; _i < _a.length; _i++) {
        var enemy = _a[_i];
        level.entities.push(loadEnemy(enemy, game));
    }
    for (var _b = 0, _c = levelState.items; _b < _c.length; _b++) {
        var item = _c[_b];
        level.items.push(loadItem(item, game));
    }
    for (var _d = 0, _e = levelState.projectiles; _d < _e.length; _d++) {
        var projectile = _e[_d];
        level.projectiles.push(loadProjectile(projectile, game));
    }
    for (var _f = 0, _g = levelState.hitwarnings; _f < _g.length; _f++) {
        var hw = _g[_f];
        level.hitwarnings.push(loadHitWarning(hw, game));
    }
};
var ItemType;
(function (ItemType) {
    ItemType[ItemType["ARMOR"] = 0] = "ARMOR";
    ItemType[ItemType["BLUEGEM"] = 1] = "BLUEGEM";
    ItemType[ItemType["CANDLE"] = 2] = "CANDLE";
    ItemType[ItemType["COAL"] = 3] = "COAL";
    ItemType[ItemType["COIN"] = 4] = "COIN";
    ItemType[ItemType["GOLD"] = 5] = "GOLD";
    ItemType[ItemType["GOLDENKEY"] = 6] = "GOLDENKEY";
    ItemType[ItemType["GREENGEM"] = 7] = "GREENGEM";
    ItemType[ItemType["HEART"] = 8] = "HEART";
    ItemType[ItemType["KEY"] = 9] = "KEY";
    ItemType[ItemType["LANTERN"] = 10] = "LANTERN";
    ItemType[ItemType["REDGEM"] = 11] = "REDGEM";
    ItemType[ItemType["TORCH"] = 12] = "TORCH";
    ItemType[ItemType["DAGGER"] = 13] = "DAGGER";
    ItemType[ItemType["DUALDAGGER"] = 14] = "DUALDAGGER";
    ItemType[ItemType["SHOTGUN"] = 15] = "SHOTGUN";
    ItemType[ItemType["SPEAR"] = 16] = "SPEAR";
    ItemType[ItemType["PICKAXE"] = 17] = "PICKAXE";
    ItemType[ItemType["BACKPACK"] = 18] = "BACKPACK";
})(ItemType = exports.ItemType || (exports.ItemType = {}));
var ItemState = /** @class */ (function () {
    function ItemState(item, game) {
        if (item instanceof armor_1.Armor)
            this.type = ItemType.ARMOR;
        if (item instanceof bluegem_1.BlueGem)
            this.type = ItemType.BLUEGEM;
        if (item instanceof candle_1.Candle)
            this.type = ItemType.CANDLE;
        if (item instanceof coal_1.Coal)
            this.type = ItemType.COAL;
        if (item instanceof coin_1.Coin)
            this.type = ItemType.COIN;
        if (item instanceof gold_1.Gold)
            this.type = ItemType.GOLD;
        if (item instanceof goldenKey_1.GoldenKey)
            this.type = ItemType.GOLDENKEY;
        if (item instanceof greengem_1.GreenGem)
            this.type = ItemType.GREENGEM;
        if (item instanceof heart_1.Heart)
            this.type = ItemType.HEART;
        if (item instanceof key_1.Key)
            this.type = ItemType.KEY;
        if (item instanceof lantern_1.Lantern)
            this.type = ItemType.LANTERN;
        if (item instanceof redgem_1.RedGem)
            this.type = ItemType.REDGEM;
        if (item instanceof torch_1.Torch)
            this.type = ItemType.TORCH;
        if (item instanceof dagger_1.Dagger)
            this.type = ItemType.DAGGER;
        if (item instanceof dualdagger_1.DualDagger)
            this.type = ItemType.DUALDAGGER;
        if (item instanceof shotgun_1.Shotgun)
            this.type = ItemType.SHOTGUN;
        if (item instanceof spear_1.Spear)
            this.type = ItemType.SPEAR;
        if (item instanceof pickaxe_1.Pickaxe)
            this.type = ItemType.PICKAXE;
        if (item instanceof backpack_1.Backpack)
            this.type = ItemType.BACKPACK;
        this.equipped = item instanceof equippable_1.Equippable && item.equipped;
        this.x = item.x;
        this.y = item.y;
        this.levelID = game.rooms.indexOf(item.level);
        if (this.levelID === -1)
            this.levelID = 0;
        this.stackCount = item.stackCount;
        this.pickedUp = item.pickedUp;
    }
    return ItemState;
}());
exports.ItemState = ItemState;
var loadItem = function (i, game, player) {
    var level = game.rooms[i.levelID];
    var item;
    if (i.type === ItemType.ARMOR)
        item = new armor_1.Armor(level, i.x, i.y);
    if (i.type === ItemType.BLUEGEM)
        item = new bluegem_1.BlueGem(level, i.x, i.y);
    if (i.type === ItemType.CANDLE)
        item = new candle_1.Candle(level, i.x, i.y);
    if (i.type === ItemType.COAL)
        item = new coal_1.Coal(level, i.x, i.y);
    if (i.type === ItemType.COIN)
        item = new coin_1.Coin(level, i.x, i.y);
    if (i.type === ItemType.GOLD)
        item = new gold_1.Gold(level, i.x, i.y);
    if (i.type === ItemType.GOLDENKEY)
        item = new goldenKey_1.GoldenKey(level, i.x, i.y);
    if (i.type === ItemType.GREENGEM)
        item = new greengem_1.GreenGem(level, i.x, i.y);
    if (i.type === ItemType.HEART)
        item = new heart_1.Heart(level, i.x, i.y);
    if (i.type === ItemType.KEY)
        item = new key_1.Key(level, i.x, i.y);
    if (i.type === ItemType.LANTERN)
        item = new lantern_1.Lantern(level, i.x, i.y);
    if (i.type === ItemType.REDGEM)
        item = new redgem_1.RedGem(level, i.x, i.y);
    if (i.type === ItemType.TORCH)
        item = new torch_1.Torch(level, i.x, i.y);
    if (i.type === ItemType.DAGGER) {
        item = new dagger_1.Dagger(level, i.x, i.y);
    }
    if (i.type === ItemType.DUALDAGGER) {
        item = new dualdagger_1.DualDagger(level, i.x, i.y);
    }
    if (i.type === ItemType.SHOTGUN) {
        item = new shotgun_1.Shotgun(level, i.x, i.y);
    }
    if (i.type === ItemType.SPEAR) {
        item = new spear_1.Spear(level, i.x, i.y);
    }
    if (i.type === ItemType.PICKAXE) {
        item = new pickaxe_1.Pickaxe(level, i.x, i.y);
    }
    if (i.type === ItemType.BACKPACK) {
        item = new backpack_1.Backpack(level, i.x, i.y);
    }
    if (i.equipped)
        item.equipped = true;
    if (item instanceof equippable_1.Equippable)
        item.setWielder(player);
    item.stackCount = i.stackCount;
    item.pickedUp = i.pickedUp;
    return item;
};
var InventoryState = /** @class */ (function () {
    function InventoryState(inventory, game) {
        this.isOpen = inventory.isOpen;
        this.cols = inventory.cols;
        this.rows = inventory.rows;
        this.equipAnimAmount = inventory.equipAnimAmount.map(function (x) { return x; });
        this.isWeaponEquipped = false;
        if (inventory.weapon) {
            this.isWeaponEquipped = true;
            this.weaponI = inventory.items.indexOf(inventory.weapon);
        }
        this.coins = inventory.coins;
        this.selX = inventory.selX;
        this.selY = inventory.selY;
        this.items = Array();
        for (var _i = 0, _a = inventory.items; _i < _a.length; _i++) {
            var item = _a[_i];
            this.items.push(new ItemState(item, game));
        }
    }
    return InventoryState;
}());
exports.InventoryState = InventoryState;
var loadInventory = function (inventory, i, game) {
    inventory.clear();
    inventory.isOpen = i.isOpen;
    inventory.cols = i.cols;
    inventory.rows = i.rows;
    inventory.selX = i.selX;
    inventory.selY = i.selY;
    inventory.equipAnimAmount = i.equipAnimAmount.map(function (x) { return x; });
    inventory.coins = i.coins;
    for (var _i = 0, _a = i.items; _i < _a.length; _i++) {
        var item = _a[_i];
        inventory.items.push(loadItem(item, game, inventory.player));
    }
    if (i.isWeaponEquipped)
        inventory.weapon = inventory.items[i.weaponI];
};
var PlayerState = /** @class */ (function () {
    function PlayerState(player, game) {
        this.x = player.x;
        this.y = player.y;
        this.dead = player.dead;
        this.levelID = player.levelID;
        this.direction = player.direction;
        this.health = player.health;
        this.maxHealth = player.maxHealth;
        this.lastTickHealth = player.lastTickHealth;
        this.inventory = new InventoryState(player.inventory, game);
        this.hasOpenVendingMachine = false;
        if (player.openVendingMachine) {
            this.hasOpenVendingMachine = true;
            this.openVendingMachineLevelID = game.rooms.indexOf(player.openVendingMachine.room);
            this.openVendingMachineID =
                player.openVendingMachine.room.entities.indexOf(player.openVendingMachine);
        }
        this.sightRadius = player.sightRadius;
    }
    return PlayerState;
}());
exports.PlayerState = PlayerState;
var loadPlayer = function (id, p, game) {
    var player = new player_1.Player(game, p.x, p.y, id === game.localPlayerID);
    player.dead = p.dead;
    player.levelID = p.levelID;
    if (player.levelID < game.levelgen.currentFloorFirstLevelID) {
        // catch up to the current level
        player.levelID = game.levelgen.currentFloorFirstLevelID;
        player.x =
            game.rooms[player.levelID].roomX +
                Math.floor(game.rooms[player.levelID].width / 2);
        player.y =
            game.rooms[player.levelID].roomY +
                Math.floor(game.rooms[player.levelID].height / 2);
    }
    player.direction = p.direction;
    player.health = p.health;
    player.maxHealth = p.maxHealth;
    player.lastTickHealth = p.lastTickHealth;
    loadInventory(player.inventory, p.inventory, game);
    if (p.hasOpenVendingMachine) {
        player.openVendingMachine = game.rooms[p.openVendingMachineLevelID]
            .entities[p.openVendingMachineID];
    }
    player.sightRadius = p.sightRadius;
    return player;
};
var GameState = /** @class */ (function () {
    function GameState() {
        this.seed = 0;
        this.randomState = 0;
        this.depth = 0;
        this.players = {};
        this.offlinePlayers = {};
        this.levels = [];
    }
    return GameState;
}());
exports.GameState = GameState;
var createGameState = function (game) {
    var gs = new GameState();
    gs.seed = game.levelgen.seed; // random state for generating levels
    gs.randomState = random_1.Random.state; // current random state
    gs.depth = game.levelgen.depthReached;
    for (var i in game.players)
        gs.players[i] = new PlayerState(game.players[i], game);
    for (var i in game.offlinePlayers) {
        gs.offlinePlayers[i] = new PlayerState(game.offlinePlayers[i], game);
    }
    for (var _i = 0, _a = game.rooms; _i < _a.length; _i++) {
        var level = _a[_i];
        level.catchUp();
        gs.levels.push(new LevelState(level, game));
    }
    return gs;
};
exports.createGameState = createGameState;
var loadGameState = function (game, activeUsernames, gameState, newWorld) {
    game.rooms = Array();
    game.levelgen = new levelGenerator_1.LevelGenerator();
    game.levelgen.setSeed(gameState.seed);
    if (newWorld)
        gameState.depth = 0;
    game.levelgen.generateFirstNFloors(game, gameState.depth);
    if (!newWorld) {
        if (gameState.players) {
            for (var i in gameState.players) {
                if (activeUsernames.includes(i))
                    game.players[i] = loadPlayer(i, gameState.players[i], game);
                else
                    game.offlinePlayers[i] = loadPlayer(i, gameState.players[i], game);
            }
        }
        if (gameState.offlinePlayers) {
            for (var i in gameState.offlinePlayers) {
                if (i === game.localPlayerID)
                    game.players[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
                else if (activeUsernames.includes(i))
                    game.players[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
                else
                    game.offlinePlayers[i] = loadPlayer(i, gameState.offlinePlayers[i], game);
            }
        }
        for (var _i = 0, _a = gameState.levels; _i < _a.length; _i++) {
            var levelState = _a[_i];
            for (var i = 0; i < game.rooms.length; i++) {
                if (i === levelState.levelID) {
                    loadLevel(game.rooms[i], levelState, game);
                }
            }
        }
        if (!(game.localPlayerID in gameState.players) &&
            !(game.localPlayerID in gameState.offlinePlayers)) {
            // we're not in the gamestate, create a new player
            game.players[game.localPlayerID] = new player_1.Player(game, 0, 0, true);
            game.players[game.localPlayerID].levelID =
                game.levelgen.currentFloorFirstLevelID;
            game.players[game.localPlayerID].x =
                game.rooms[game.levelgen.currentFloorFirstLevelID].roomX +
                    Math.floor(game.rooms[game.levelgen.currentFloorFirstLevelID].width / 2);
            game.players[game.localPlayerID].y =
                game.rooms[game.levelgen.currentFloorFirstLevelID].roomY +
                    Math.floor(game.rooms[game.levelgen.currentFloorFirstLevelID].height / 2);
            game.room = game.rooms[game.levelgen.currentFloorFirstLevelID];
            game.room.enterLevel(game.players[game.localPlayerID]);
        }
        else {
            game.room = game.rooms[game.players[game.localPlayerID].levelID];
        }
    }
    else {
        // stub game state, start a new world
        game.players[game.localPlayerID] = new player_1.Player(game, 0, 0, true);
        game.room = game.rooms[game.players[game.localPlayerID].levelID];
        game.room.enterLevel(game.players[game.localPlayerID]);
    }
    random_1.Random.setState(gameState.randomState);
    game.room.updateLighting();
    var p = game.players[game.localPlayerID];
    game.room.items.push(new key_1.Key(game.room, p.x - 1, p.y + 1));
    game.room.items.push(new key_1.Key(game.room, p.x + 1, p.y + 1));
    game.room.items.push(new key_1.Key(game.room, p.x + 1, p.y - 2));
    game.room.items.push(new key_1.Key(game.room, p.x - 1, p.y - 2));
    game.room.entities.push(new block_1.Block(game.room, game, p.x, p.y - 2), new block_1.Block(game.room, game, p.x + 1, p.y), new block_1.Block(game.room, game, p.x - 1, p.y - 1), new block_1.Block(game.room, game, p.x + 1, p.y - 1), new block_1.Block(game.room, game, p.x - 1, p.y), new block_1.Block(game.room, game, p.x, p.y + 1));
    game.room.doors.forEach(function (door) {
        door.lock();
    });
    setTimeout(function () {
        game.pushMessage("Welcome to Turnarchist");
    }, 500);
    game.chat = [];
};
exports.loadGameState = loadGameState;


/***/ }),

/***/ "./src/healthbar.ts":
/*!**************************!*\
  !*** ./src/healthbar.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HealthBar = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var HealthBar = /** @class */ (function () {
    function HealthBar() {
        var _this = this;
        this.hurt = function () {
            _this.hurtTimer = Date.now();
        };
        this.draw = function (delta, hearts, maxHearts, x, y, flashing) {
            var t = Date.now() - _this.hurtTimer;
            if (t <= levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME) {
                var fullHearts = Math.floor(hearts);
                var halfHearts = Math.ceil(hearts - fullHearts);
                var emptyHearts = maxHearts - fullHearts - halfHearts;
                // I wouldn't normally use magic numbers here, but these are hardcoded based on the tileset
                //   (which isn't really parameterizable)
                var drawWidth = Math.round(Math.min(9, Math.min(0.05 * (levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME - t), 0.05 * t)));
                var drawHeight = Math.round(Math.min(0.5, Math.min(0.003 * (levelConstants_1.LevelConstants.HEALTH_BAR_TOTALTIME - t), 0.003 * t)) * 16) / 16.0;
                var width = (drawWidth * (maxHearts - 1) + 8) / 16.0;
                var xxStart = 0.5 + -width / 2;
                for (var i = 0; i < Math.ceil(0.5 * maxHearts); i++) {
                    var tileX = 0;
                    if (!flashing)
                        tileX = 1.5;
                    else if (i < fullHearts)
                        tileX = 0;
                    else if (i < fullHearts + halfHearts)
                        tileX = 0.5;
                    else
                        tileX = 1;
                    var xx = (drawWidth * i) / 16.0 + xxStart;
                    game_1.Game.drawFX(tileX, 8, 0.5, 0.5, x + xx, y - 1 - drawHeight / 2, 0.5, drawHeight);
                    xx += 9.0 / 16.0;
                    var j = maxHearts - i - 1;
                    if (j !== i) {
                        var tileX_1 = 0;
                        if (!flashing)
                            tileX_1 = 1.5;
                        else if (j < fullHearts)
                            tileX_1 = 0;
                        else if (j < fullHearts + halfHearts)
                            tileX_1 = 0.5;
                        else
                            tileX_1 = 1;
                        var xx_1 = (drawWidth * j) / 16.0 + xxStart;
                        game_1.Game.drawFX(tileX_1, 8, 0.5, 0.5, x + xx_1, y - 1 - drawHeight / 2, 0.5, drawHeight);
                        xx_1 += 9.0 / 16.0;
                    }
                }
            }
        };
        this.hurtTimer = 0;
    }
    return HealthBar;
}());
exports.HealthBar = HealthBar;


/***/ }),

/***/ "./src/hitWarning.ts":
/*!***************************!*\
  !*** ./src/hitWarning.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HitWarning = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var drawable_1 = __webpack_require__(/*! ./drawable */ "./src/drawable.ts");
var Direction;
(function (Direction) {
    Direction[Direction["North"] = 0] = "North";
    Direction[Direction["NorthEast"] = 1] = "NorthEast";
    Direction[Direction["East"] = 2] = "East";
    Direction[Direction["SouthEast"] = 3] = "SouthEast";
    Direction[Direction["South"] = 4] = "South";
    Direction[Direction["SouthWest"] = 5] = "SouthWest";
    Direction[Direction["West"] = 6] = "West";
    Direction[Direction["NorthWest"] = 7] = "NorthWest";
    Direction[Direction["Center"] = 8] = "Center";
})(Direction || (Direction = {}));
var HitWarning = /** @class */ (function (_super) {
    __extends(HitWarning, _super);
    function HitWarning(game, x, y, eX, eY, isEnemy, dirOnly) {
        if (dirOnly === void 0) { dirOnly = false; }
        var _this = _super.call(this) || this;
        _this._pointerDir = null;
        _this._pointerOffset = null;
        _this.tick = function () {
            _this.dead = true;
        };
        _this.removeOverlapping = function () {
            for (var _i = 0, _a = _this.game.room.entities; _i < _a.length; _i++) {
                var entity = _a[_i];
                if (entity.x === _this.x && entity.y === _this.y) {
                    _this.dead = true;
                    break;
                }
            }
            for (var _b = 0, _c = _this.game.room.doors; _b < _c.length; _b++) {
                var door = _c[_b];
                if (door.x === _this.x && door.y === _this.y) {
                    _this.dead = true;
                    break;
                }
            }
        };
        _this.draw = function (delta) {
            if (Math.abs(_this.x - _this.game.players[_this.game.localPlayerID].x) <= 1 &&
                Math.abs(_this.y - _this.game.players[_this.game.localPlayerID].y) <= 1) {
                if (_this.isEnemy) {
                    game_1.Game.drawFX(_this.tileX + Math.floor(HitWarning.frame), _this.tileY, 1, 1, _this.x + _this.pointerOffset.x, _this.y + _this.pointerOffset.y - _this.offsetY, 1, 1);
                }
                if (!_this.dirOnly) {
                    game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 5, 1, 1, _this.x, _this.y - _this.offsetY + 0, 1, 1);
                }
            }
        };
        _this.drawTopLayer = function (delta) {
            if (_this.isEnemy) {
                game_1.Game.drawFX(_this.tileX + Math.floor(HitWarning.frame), _this.tileY + 1, 1, 1, _this.x + _this.pointerOffset.x, _this.y + _this.pointerOffset.y - _this.offsetY, 1, 1);
            }
            if (Math.abs(_this.x - _this.game.players[_this.game.localPlayerID].x) <= 1 &&
                Math.abs(_this.y - _this.game.players[_this.game.localPlayerID].y) <= 1) {
                if (!_this.dirOnly) {
                    game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 6, 1, 1, _this.x, _this.y - _this.offsetY + 0, 1, 1);
                }
            }
        };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.game = game;
        _this.tileX = 0;
        _this.tileY = 22;
        _this.eX = eX;
        _this.eY = eY;
        _this.offsetY = 0.2;
        _this.dirOnly = dirOnly;
        _this.isEnemy = isEnemy !== undefined ? isEnemy : true;
        _this.pointerOffset = _this.getPointerOffset();
        _this.removeOverlapping();
        return _this;
    }
    HitWarning.prototype.getPointerDir = function () {
        if (this._pointerDir === null) {
            var dx = this.eX - this.x;
            var dy = this.eY - this.y;
            if (dx === 0 && dy === 0) {
                this._pointerDir = Direction.Center;
            }
            else if (dx === 0) {
                this._pointerDir = dy < 0 ? Direction.South : Direction.North;
            }
            else if (dy === 0) {
                this._pointerDir = dx < 0 ? Direction.East : Direction.West;
            }
            else if (dx < 0) {
                this._pointerDir = dy < 0 ? Direction.SouthEast : Direction.NorthEast;
            }
            else {
                this._pointerDir = dy < 0 ? Direction.SouthWest : Direction.NorthWest;
            }
            this.tileX = 0 + 2 * this._pointerDir;
        }
        return this._pointerDir;
    };
    HitWarning.prototype.getPointerOffset = function () {
        var _a;
        if (this._pointerOffset === null) {
            var offsets = (_a = {},
                _a[Direction.North] = { x: 0, y: 0.5 },
                _a[Direction.South] = { x: 0, y: -0.6 },
                _a[Direction.West] = { x: 0.6, y: 0 },
                _a[Direction.East] = { x: -0.6, y: 0 },
                _a[Direction.NorthEast] = { x: -0.5, y: 0.5 },
                _a[Direction.NorthWest] = { x: 0.5, y: 0.5 },
                _a[Direction.SouthEast] = { x: -0.5, y: -0.5 },
                _a[Direction.SouthWest] = { x: 0.5, y: -0.5 },
                _a[Direction.Center] = { x: 0, y: -0.25 },
                _a);
            this._pointerOffset = offsets[this.getPointerDir()];
        }
        return this._pointerOffset;
    };
    HitWarning.frame = 0;
    HitWarning.updateFrame = function (delta) {
        HitWarning.frame += 0.125 * delta;
        if (HitWarning.frame >= 2)
            HitWarning.frame = 0;
    };
    return HitWarning;
}(drawable_1.Drawable));
exports.HitWarning = HitWarning;


/***/ }),

/***/ "./src/input.ts":
/*!**********************!*\
  !*** ./src/input.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Input = exports.InputEnum = void 0;
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var InputEnum;
(function (InputEnum) {
    InputEnum[InputEnum["I"] = 0] = "I";
    InputEnum[InputEnum["M"] = 1] = "M";
    InputEnum[InputEnum["M_UP"] = 2] = "M_UP";
    InputEnum[InputEnum["Q"] = 3] = "Q";
    InputEnum[InputEnum["LEFT"] = 4] = "LEFT";
    InputEnum[InputEnum["RIGHT"] = 5] = "RIGHT";
    InputEnum[InputEnum["UP"] = 6] = "UP";
    InputEnum[InputEnum["DOWN"] = 7] = "DOWN";
    InputEnum[InputEnum["SPACE"] = 8] = "SPACE";
    InputEnum[InputEnum["COMMA"] = 9] = "COMMA";
    InputEnum[InputEnum["PERIOD"] = 10] = "PERIOD";
    InputEnum[InputEnum["LEFT_CLICK"] = 11] = "LEFT_CLICK";
    InputEnum[InputEnum["RIGHT_CLICK"] = 12] = "RIGHT_CLICK";
    InputEnum[InputEnum["MOUSE_MOVE"] = 13] = "MOUSE_MOVE";
})(InputEnum = exports.InputEnum || (exports.InputEnum = {}));
exports.Input = {
    _pressed: {},
    isTapHold: false,
    tapStartTime: null,
    IS_TAP_HOLD_THRESH: 300,
    keyDownListener: function (key) { },
    iListener: function () { },
    mListener: function () { },
    mUpListener: function () { },
    qListener: function () { },
    leftListener: function () { },
    rightListener: function () { },
    upListener: function () { },
    downListener: function () { },
    aListener: function () {
        exports.Input.leftListener();
    },
    dListener: function () {
        exports.Input.rightListener();
    },
    wListener: function () {
        exports.Input.upListener();
    },
    sListener: function () {
        exports.Input.downListener();
    },
    spaceListener: function () { },
    leftSwipeListener: function () { },
    rightSwipeListener: function () { },
    upSwipeListener: function () { },
    downSwipeListener: function () { },
    tapListener: function () { },
    commaListener: function () { },
    periodListener: function () { },
    mouseLeftClickListeners: [],
    mouseRightClickListeners: [],
    mouseMoveListeners: [],
    mouseDownListeners: [],
    mouseUpListeners: [],
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    lastPressTime: 0,
    lastPressKey: "",
    SPACE: "Space",
    LEFT: "ArrowLeft",
    UP: "ArrowUp",
    RIGHT: "ArrowRight",
    DOWN: "ArrowDown",
    W: "KeyW",
    A: "KeyA",
    S: "KeyS",
    D: "KeyD",
    M: "KeyM",
    N: "KeyN",
    I: "KeyI",
    Q: "KeyQ",
    COMMA: "Comma",
    PERIOD: "Period",
    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },
    onKeydown: function (event) {
        if (event.repeat)
            return; // ignore repeat keypresses
        if (event.key)
            exports.Input.keyDownListener(event.key);
        if (event.cancelable && event.key != "F12" && event.key != "F5")
            event.preventDefault();
        exports.Input.lastPressTime = Date.now();
        exports.Input.lastPressKey = event.key;
        exports.Input._pressed[event.code] = true;
        switch (event.code) {
            case exports.Input.LEFT:
                exports.Input.leftListener();
                break;
            case exports.Input.A:
                exports.Input.aListener();
                break;
            case exports.Input.RIGHT:
                exports.Input.rightListener();
                break;
            case exports.Input.D:
                exports.Input.dListener();
                break;
            case exports.Input.UP:
                exports.Input.upListener();
                break;
            case exports.Input.W:
                exports.Input.wListener();
                break;
            case exports.Input.DOWN:
                exports.Input.downListener();
                break;
            case exports.Input.S:
                exports.Input.sListener();
                break;
            case exports.Input.SPACE:
                exports.Input.spaceListener();
                break;
            case exports.Input.M:
                exports.Input.mListener();
                break;
            case exports.Input.I:
                exports.Input.iListener();
                break;
            case exports.Input.Q:
                exports.Input.qListener();
                break;
            case exports.Input.COMMA:
                exports.Input.commaListener();
                break;
            case exports.Input.PERIOD:
                exports.Input.periodListener();
                break;
        }
    },
    onKeyup: function (event) {
        delete this._pressed[event.code];
        if (event.key === this.lastPressKey) {
            this.lastPressTime = 0;
            this.lastPressKey = 0;
        }
        if (event.code === exports.Input.M)
            exports.Input.mUpListener();
    },
    mouseLeftClickListener: function (x, y) {
        for (var i = 0; i < exports.Input.mouseLeftClickListeners.length; i++)
            exports.Input.mouseLeftClickListeners[i](x, y);
    },
    mouseRightClickListener: function (x, y) {
        for (var i = 0; i < exports.Input.mouseRightClickListeners.length; i++)
            exports.Input.mouseRightClickListeners[i](x, y);
    },
    mouseMoveListener: function (x, y) {
        for (var i = 0; i < exports.Input.mouseMoveListeners.length; i++)
            exports.Input.mouseMoveListeners[i](x, y);
    },
    mouseDownListener: function (x, y, button) {
        for (var i = 0; i < exports.Input.mouseDownListeners.length; i++)
            exports.Input.mouseDownListeners[i](x, y, button);
    },
    mouseUpListener: function (x, y, button) {
        for (var i = 0; i < exports.Input.mouseUpListeners.length; i++)
            exports.Input.mouseUpListeners[i](x, y, button);
    },
    mouseClickListener: function (event) {
        if (event.button === 0 || event.button === 2) {
            var rect = window.document
                .getElementById("gameCanvas")
                .getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            var scaledX = Math.floor(x / game_1.Game.scale);
            var scaledY = Math.floor(y / game_1.Game.scale);
            if (event.button === 0) {
                exports.Input.mouseLeftClickListener(scaledX, scaledY);
            }
            else if (event.button === 2) {
                exports.Input.mouseRightClickListener(scaledX, scaledY);
            }
        }
    },
    updateMousePos: function (event) {
        var rect = window.document
            .getElementById("gameCanvas")
            .getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        exports.Input.mouseX = Math.floor(x / game_1.Game.scale);
        exports.Input.mouseY = Math.floor(y / game_1.Game.scale);
        exports.Input.mouseMoveListener(exports.Input.mouseX, exports.Input.mouseY);
    },
    handleMouseDown: function (event) {
        exports.Input.mouseDown = true;
        exports.Input.mouseDownListener(exports.Input.mouseX, exports.Input.mouseY, event.button);
    },
    handleMouseUp: function (event) {
        exports.Input.mouseDown = false;
        exports.Input.mouseUpListener(exports.Input.mouseX, exports.Input.mouseY, event.button);
    },
    getTouches: function (evt) {
        return (evt.touches || evt.originalEvent.touches // browser API
        ); // jQuery
    },
    xDown: null,
    yDown: null,
    currentX: 0,
    currentY: 0,
    swiped: false,
    handleTouchStart: function (evt) {
        evt.preventDefault();
        var firstTouch = exports.Input.getTouches(evt)[0];
        exports.Input.xDown = firstTouch.clientX;
        exports.Input.yDown = firstTouch.clientY;
        exports.Input.currentX = firstTouch.clientX;
        exports.Input.currentY = firstTouch.clientY;
        exports.Input.tapStartTime = Date.now();
        exports.Input.updateMousePos({
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        exports.Input.swiped = false;
    },
    handleTouchMove: function (evt) {
        evt.preventDefault();
        exports.Input.currentX = evt.touches[0].clientX;
        exports.Input.currentY = evt.touches[0].clientY;
        exports.Input.updateMousePos({
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        if (exports.Input.swiped)
            return;
        var xDiff = exports.Input.xDown - exports.Input.currentX;
        var yDiff = exports.Input.yDown - exports.Input.currentY;
        // we have not swiped yet
        // check if we've swiped
        if (Math.pow(xDiff, 2) + Math.pow(yDiff, 2) >= gameConstants_1.GameConstants.SWIPE_THRESH) {
            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                /*most significant*/
                if (xDiff > 0) {
                    exports.Input.leftSwipeListener();
                }
                else {
                    exports.Input.rightSwipeListener();
                }
                exports.Input.swiped = true;
            }
            else {
                if (yDiff > 0) {
                    exports.Input.upSwipeListener();
                }
                else {
                    exports.Input.downSwipeListener();
                }
                exports.Input.swiped = true;
            }
        }
    },
    handleTouchEnd: function (evt) {
        evt.preventDefault();
        if (!exports.Input.isTapHold && !exports.Input.swiped)
            exports.Input.tapListener();
        exports.Input.isTapHold = false;
        exports.Input.tapStartTime = null;
        // we've already swiped, don't count the click
        if (exports.Input.swiped)
            return;
        exports.Input.mouseClickListener({
            button: 0,
            clientX: exports.Input.currentX,
            clientY: exports.Input.currentY,
        });
        exports.Input.updateMousePos({
            clientX: 0,
            clientY: 0,
        });
    },
    checkIsTapHold: function () {
        if (exports.Input.tapStartTime !== null &&
            Date.now() >= exports.Input.tapStartTime + exports.Input.IS_TAP_HOLD_THRESH)
            exports.Input.isTapHold = true;
    },
};
window.addEventListener("keyup", function (event) {
    exports.Input.onKeyup(event);
}, false);
window.addEventListener("keydown", function (event) {
    exports.Input.onKeydown(event);
}, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("click", function (event) { return exports.Input.mouseClickListener(event); }, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("mousemove", function (event) { return exports.Input.updateMousePos(event); }, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("mousedown", function (event) { return exports.Input.handleMouseDown(event); }, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("mouseup", function (event) { return exports.Input.handleMouseUp(event); }, false);
window.document
    .getElementById("gameCanvas")
    .addEventListener("contextmenu", function (event) { return event.preventDefault(); }, false);


/***/ }),

/***/ "./src/inventory.ts":
/*!**************************!*\
  !*** ./src/inventory.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Inventory = void 0;
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var key_1 = __webpack_require__(/*! ./item/key */ "./src/item/key.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var equippable_1 = __webpack_require__(/*! ./item/equippable */ "./src/item/equippable.ts");
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var coin_1 = __webpack_require__(/*! ./item/coin */ "./src/item/coin.ts");
var weapon_1 = __webpack_require__(/*! ./weapon/weapon */ "./src/weapon/weapon.ts");
var dagger_1 = __webpack_require__(/*! ./weapon/dagger */ "./src/weapon/dagger.ts");
var usable_1 = __webpack_require__(/*! ./item/usable */ "./src/item/usable.ts");
var candle_1 = __webpack_require__(/*! ./item/candle */ "./src/item/candle.ts");
var torch_1 = __webpack_require__(/*! ./item/torch */ "./src/item/torch.ts");
var mouseCursor_1 = __webpack_require__(/*! ./mouseCursor */ "./src/mouseCursor.ts");
var warhammer_1 = __webpack_require__(/*! ./weapon/warhammer */ "./src/weapon/warhammer.ts");
var OPEN_TIME = 100; // milliseconds
// Dark gray color used for the background of inventory slots
var FILL_COLOR = "#5a595b";
// Very dark blue-gray color used for outlines and borders
var OUTLINE_COLOR = "#292c36";
// Light blue color used to indicate equipped items
var EQUIP_COLOR = "#85a8e6";
// White color used for the outer border of the inventory
var FULL_OUTLINE = "white";
var Inventory = /** @class */ (function () {
    function Inventory(game, player) {
        var _this = this;
        this.rows = 3;
        this.cols = 5;
        this.selX = 0;
        this.selY = 0;
        this.expansion = 0;
        this.clear = function () {
            _this.items = [];
            for (var i = 0; i < (_this.rows + _this.expansion) * _this.cols; i++)
                _this.equipAnimAmount[i] = 0;
        };
        this.open = function () {
            _this.isOpen = !_this.isOpen;
            if (_this.isOpen)
                _this.openTime = Date.now();
            if (!_this.isOpen) {
                _this.selY = 0;
            }
        };
        this.close = function () {
            _this.isOpen = false;
            if (_this.selY > 0) {
                _this.selY = 0;
            }
        };
        this.left = function () {
            _this.selX--;
            if (_this.selX < 0)
                _this.selX = 0;
        };
        this.right = function () {
            _this.selX++;
            if (_this.selX > _this.cols - 1)
                _this.selX = _this.cols - 1;
        };
        this.up = function () {
            _this.selY--;
            if (_this.selY < 0)
                _this.selY = 0;
        };
        this.down = function () {
            _this.selY++;
            if (_this.selY > _this.rows + _this.expansion - 1)
                _this.selY = _this.rows + _this.expansion - 1;
        };
        this.space = function () {
            _this.itemUse();
        };
        this.itemUse = function () {
            var i = _this.selX + _this.selY * _this.cols;
            if (_this.items[i] instanceof usable_1.Usable) {
                _this.items[i].onUse(_this.player);
                //this.items.splice(i, 0);
            }
            else if (_this.items[i] instanceof equippable_1.Equippable) {
                //dont equip on the same tick as using an item
                var e = _this.items[i];
                e.toggleEquip();
                if (e instanceof weapon_1.Weapon) {
                    if (e.equipped)
                        _this.weapon = e;
                    else
                        _this.weapon = null;
                }
                if (e.equipped) {
                    for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                        var i_1 = _a[_i];
                        if (i_1 instanceof equippable_1.Equippable && i_1 !== e && !e.coEquippable(i_1)) {
                            i_1.equipped = false; // prevent user from equipping two not coEquippable items
                        }
                    }
                }
            }
        };
        this.mouseLeftClick = function () {
            var x = mouseCursor_1.MouseCursor.getInstance().getPosition().x;
            var y = mouseCursor_1.MouseCursor.getInstance().getPosition().y;
            if (_this.isPointInInventoryBounds(x, y).inBounds) {
                _this.itemUse();
            }
        };
        this.mouseRightClick = function () {
            var x = mouseCursor_1.MouseCursor.getInstance().getPosition().x;
            var y = mouseCursor_1.MouseCursor.getInstance().getPosition().y;
            if (_this.isPointInInventoryBounds(x, y).inBounds) {
                _this.drop();
            }
        };
        this.leftQuickbar = function () {
            _this.left();
        };
        this.rightQuickbar = function () {
            _this.right();
        };
        this.spaceQuickbar = function () {
            _this.itemUse();
        };
        this.mouseMove = function () {
            var x = mouseCursor_1.MouseCursor.getInstance().getPosition().x;
            var y = mouseCursor_1.MouseCursor.getInstance().getPosition().y;
            var bounds = _this.isPointInInventoryBounds(x, y);
            if (bounds.inBounds) {
                var s = _this.isOpen
                    ? Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME)
                    : 18;
                var b = 2;
                var g = -2;
                // Calculate and clamp values
                _this.selX = Math.max(0, Math.min(Math.floor((x - bounds.startX) / (s + 2 * b + g)), _this.cols - 1));
                _this.selY = _this.isOpen
                    ? Math.max(0, Math.min(Math.floor((y - bounds.startY) / (s + 2 * b + g)), _this.rows + _this.expansion - 1))
                    : 0;
            }
        };
        this.drop = function () {
            var i = _this.selX + _this.selY * _this.cols;
            if (i < _this.items.length) {
                _this.items[i].dropFromInventory();
                _this.items[i].level = _this.game.rooms[_this.player.levelID];
                _this.items[i].x = _this.player.x;
                _this.items[i].y = _this.player.y;
                _this.items[i].pickedUp = false;
                _this.equipAnimAmount[i] = 0;
                _this.game.rooms[_this.player.levelID].items.push(_this.items[i]);
                _this.items.splice(i, 1);
            }
        };
        this.dropFromInventory = function () { };
        this.hasItem = function (itemType) {
            // itemType is class of Item we're looking for
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i instanceof itemType)
                    return i;
            }
            return null;
        };
        this.hasItemCount = function (item) {
            if (item instanceof coin_1.Coin)
                return _this.coinCount() >= item.stackCount;
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.constructor === item.constructor && i.stackCount >= item.stackCount)
                    return true;
            }
            return false;
        };
        this.subtractItemCount = function (item) {
            if (item instanceof coin_1.Coin) {
                _this.subtractCoins(item.stackCount);
                return;
            }
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.constructor === item.constructor) {
                    i.stackCount -= item.stackCount;
                    if (i.stackCount <= 0)
                        _this.items.splice(_this.items.indexOf(i), 1);
                }
            }
        };
        this.coinCount = function () {
            return _this.coins;
        };
        this.subtractCoins = function (n) {
            _this.coins -= n;
            if (_this.coins < 0)
                _this.coins = 0;
        };
        this.addCoins = function (n) {
            _this.coins += n;
        };
        this.isFull = function () {
            return _this.items.length >= (_this.rows + _this.expansion) * _this.cols;
        };
        this.addItem = function (item) {
            if (item instanceof coin_1.Coin) {
                _this.coins += item.stack;
                return true;
            }
            if (item instanceof equippable_1.Equippable) {
                item.setWielder(_this.player);
            }
            if (item.stackable) {
                for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (i.constructor === item.constructor) {
                        // we already have an item of the same type
                        i.stackCount += item.stackCount;
                        return true;
                    }
                }
            }
            if (!_this.isFull()) {
                // item is either not stackable, or it's stackable but we don't have one yet
                _this.items.push(item);
                return true;
            }
            return false;
        };
        this.removeItem = function (item) {
            var i = _this.items.indexOf(item);
            if (i !== -1) {
                _this.items.splice(i, 1);
            }
        };
        this.getArmor = function () {
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i instanceof armor_1.Armor && i.equipped)
                    return i;
            }
            return null;
        };
        this.hasWeapon = function () {
            return _this.weapon !== null;
        };
        this.getWeapon = function () {
            return _this.weapon;
        };
        this.tick = function () {
            for (var _i = 0, _a = _this.items; _i < _a.length; _i++) {
                var i = _a[_i];
                i.tickInInventory();
            }
        };
        this.textWrap = function (text, x, y, maxWidth) {
            // returns y value for next line
            var words = text.split(" ");
            var line = "";
            while (words.length > 0) {
                if (game_1.Game.measureText(line + words[0]).width > maxWidth) {
                    game_1.Game.fillText(line, x, y);
                    line = "";
                    y += 8;
                }
                else {
                    if (line !== "")
                        line += " ";
                    line += words[0];
                    words.splice(0, 1);
                }
            }
            if (line !== " ") {
                game_1.Game.fillText(line, x, y);
                y += 8;
            }
            return y;
        };
        this.drawCoins = function (delta) {
            var coinX = levelConstants_1.LevelConstants.SCREEN_W - 1;
            var coinY = levelConstants_1.LevelConstants.SCREEN_H - 1;
            game_1.Game.drawItem(19, 0, 1, 2, coinX, coinY - 1, 1, 2);
            var countText = "" + _this.coins;
            var width = game_1.Game.measureText(countText).width;
            var countX = 4 - width;
            var countY = -1;
            game_1.Game.fillTextOutline(countText, coinX * gameConstants_1.GameConstants.TILESIZE + countX, coinY * gameConstants_1.GameConstants.TILESIZE + countY, gameConstants_1.GameConstants.OUTLINE, "white");
            var turnCountText = _this.player.turnCount.toString();
            game_1.Game.fillTextOutline(turnCountText, coinX * gameConstants_1.GameConstants.TILESIZE + countX, coinY * gameConstants_1.GameConstants.TILESIZE + countY - 15, gameConstants_1.GameConstants.OUTLINE, "white");
        };
        this.pointInside = function (x, y) {
            var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
            var b = 2; // border
            var g = -2; // gap
            var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
            var ob = 1; // outer border
            var width = _this.cols * (s + 2 * b + g) - g;
            var height = (_this.rows + _this.expansion) * (s + 2 * b + g) - g;
            return (x >= Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob &&
                x <=
                    Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) -
                        ob +
                        Math.round(width + 2 * ob) &&
                y >= Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) - ob &&
                y <=
                    Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) -
                        ob +
                        Math.round(height + 2 * ob));
        };
        this.drawQuickbar = function (delta) {
            // Get current mouse position and check bounds
            var x = mouseCursor_1.MouseCursor.getInstance().getPosition().x;
            var y = mouseCursor_1.MouseCursor.getInstance().getPosition().y;
            var isInBounds = _this.isPointInInventoryBounds(x, y).inBounds;
            // Define dimensions and styling variables
            var s = 18; // size of box
            var b = 2; // border
            var g = -2; // gap
            var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
            var ob = 1; // outer border
            var width = _this.cols * (s + 2 * b + g) - g;
            var height = s + 2 * b;
            var startX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width);
            var startY = gameConstants_1.GameConstants.HEIGHT - height - 5; // 5 pixels from bottom
            // Draw main background
            game_1.Game.ctx.fillStyle = FULL_OUTLINE;
            game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob, startY - 1, width + 2, height + 2);
            // Draw highlighted background for selected item only if mouse is in bounds
            if (isInBounds) {
                game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + _this.selX * (s + 2 * b + g)) -
                    hg -
                    ob, startY - hg - ob, Math.round(s + 2 * b + 2 * hg) + 2 * ob, Math.round(s + 2 * b + 2 * hg) + 2 * ob);
            }
            // Draw individual item slots
            for (var x_1 = 0; x_1 < _this.cols; x_1++) {
                // Draw slot outline
                game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                game_1.Game.ctx.fillRect(startX + x_1 * (s + 2 * b + g), startY, s + 2 * b, s + 2 * b);
                // Draw slot background
                game_1.Game.ctx.fillStyle = FILL_COLOR;
                game_1.Game.ctx.fillRect(startX + x_1 * (s + 2 * b + g) + b, startY + b, s, s);
                // Draw equip animation (this should always show)
                var i = x_1;
                game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                var yOff = s * (1 - _this.equipAnimAmount[i]);
                game_1.Game.ctx.fillRect(startX + x_1 * (s + 2 * b + g) + b, startY + b + yOff, s, s - yOff);
                // Draw item icon if exists
                if (i < _this.items.length) {
                    var drawX = startX +
                        x_1 * (s + 2 * b + g) +
                        b +
                        Math.floor(0.5 * s) -
                        0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawY = startY + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                    var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                    _this.items[i].drawIcon(delta, drawXScaled, drawYScaled);
                }
            }
            // Draw selection box only if mouse is in bounds
            if (isInBounds) {
                var selStartX = startX + _this.selX * (s + 2 * b + g);
                var selStartY = startY;
                // Outer selection box (dark)
                game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                game_1.Game.ctx.fillRect(selStartX - hg, selStartY - hg, Math.round(s + 2 * b + 2 * hg), Math.round(s + 2 * b + 2 * hg));
                // Inner selection box (light grey)
                game_1.Game.ctx.fillStyle = FILL_COLOR;
                game_1.Game.ctx.fillRect(selStartX + b - hg, selStartY + b - hg, Math.round(s + 2 * hg), Math.round(s + 2 * hg));
                // Draw equip animation for selected slot with highlight
                var i = _this.selX;
                game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                var yOff = (s + 2 * hg) * (1 - _this.equipAnimAmount[i]);
                game_1.Game.ctx.fillRect(Math.round(startX + _this.selX * (s + 2 * b + g) + b - hg), Math.round(startY + b + yOff - hg), Math.round(s + 2 * hg), Math.round(s + 2 * hg - yOff));
                // Redraw the selected item
                if (_this.selX < _this.items.length) {
                    var drawX = selStartX + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawY = selStartY + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                    var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                    _this.items[_this.selX].drawIcon(delta, drawXScaled, drawYScaled);
                }
            }
        };
        this.updateEquipAnimAmount = function () {
            for (var i = 0; i < _this.equipAnimAmount.length; i++) {
                if (_this.items[i] instanceof equippable_1.Equippable) {
                    if (_this.items[i].equipped) {
                        _this.equipAnimAmount[i] += 0.2 * (1 - _this.equipAnimAmount[i]);
                    }
                    else {
                        _this.equipAnimAmount[i] += 0.2 * (0 - _this.equipAnimAmount[i]);
                    }
                }
                else {
                    _this.equipAnimAmount[i] = 0;
                }
            }
        };
        this.draw = function (delta) {
            // Get current mouse position and check bounds
            var x = mouseCursor_1.MouseCursor.getInstance().getPosition().x;
            var y = mouseCursor_1.MouseCursor.getInstance().getPosition().y;
            var isInBounds = _this.isPointInInventoryBounds(x, y).inBounds;
            // Draw coins and quickbar (these are always visible)
            _this.drawCoins(delta);
            _this.drawQuickbar(delta);
            _this.updateEquipAnimAmount();
            if (_this.isOpen) {
                // Update equip animation
                // Draw semi-transparent background for full inventory
                game_1.Game.ctx.fillStyle = "rgb(0, 0, 0, 0.8)";
                game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
                game_1.Game.ctx.globalAlpha = 1;
                // Define dimensions and styling variables (similar to drawQuickbar)
                var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
                var b = 2; // border
                var g = -2; // gap
                var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
                var invRows = _this.rows + _this.expansion;
                var ob = 1; // outer border
                var width = _this.cols * (s + 2 * b + g) - g;
                var height = invRows * (s + 2 * b + g) - g;
                // Draw main inventory background (similar to drawQuickbar)
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                var mainBgX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob;
                var mainBgY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) - ob;
                game_1.Game.ctx.fillRect(mainBgX, mainBgY, Math.round(width + 2 * ob), Math.round(height + 2 * ob));
                // Draw highlighted background for selected item only if mouse is in bounds
                if (isInBounds) {
                    var highlightX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                        0.5 * width +
                        _this.selX * (s + 2 * b + g)) -
                        hg -
                        ob;
                    var highlightY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        _this.selY * (s + 2 * b + g)) -
                        hg -
                        ob;
                    game_1.Game.ctx.fillRect(highlightX, highlightY, Math.round(s + 2 * b + 2 * hg) + 2 * ob, Math.round(s + 2 * b + 2 * hg) + 2 * ob);
                }
                // Draw individual inventory slots (similar to drawQuickbar, but for all rows)
                for (var x_2 = 0; x_2 < _this.cols; x_2++) {
                    for (var y_1 = 0; y_1 < _this.rows + _this.expansion; y_1++) {
                        // Draw slot outline
                        var slotX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x_2 * (s + 2 * b + g));
                        var slotY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height + y_1 * (s + 2 * b + g));
                        game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                        game_1.Game.ctx.fillRect(slotX, slotY, Math.round(s + 2 * b), Math.round(s + 2 * b));
                        // Draw slot background
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x_2 * (s + 2 * b + g) + b), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            y_1 * (s + 2 * b + g) +
                            b), Math.round(s), Math.round(s));
                        // Draw equip animation (unique to full inventory view)
                        var i_2 = x_2 + y_1 * _this.cols;
                        game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                        var yOff = s * (1 - _this.equipAnimAmount[i_2]);
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width + x_2 * (s + 2 * b + g) + b), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            y_1 * (s + 2 * b + g) +
                            b +
                            yOff), Math.round(s), Math.round(s - yOff));
                    }
                }
                // Draw item icons after animation delay (similar to drawQuickbar, but for all items)
                if (Date.now() - _this.openTime >= OPEN_TIME) {
                    for (var i_3 = 0; i_3 < _this.items.length; i_3++) {
                        var x_3 = i_3 % _this.cols;
                        var y_2 = Math.floor(i_3 / _this.cols);
                        var drawX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width +
                            x_3 * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            y_2 * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                        _this.items[i_3].drawIcon(delta, drawXScaled, drawYScaled);
                    }
                    // Draw selection box and related elements only if mouse is in bounds
                    if (isInBounds) {
                        // Draw selection box
                        game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width +
                            _this.selX * (s + 2 * b + g)) - hg, Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            _this.selY * (s + 2 * b + g)) - hg, Math.round(s + 2 * b + 2 * hg), Math.round(s + 2 * b + 2 * hg));
                        var slotX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width +
                            _this.selX * (s + 2 * b + g) +
                            b -
                            hg);
                        var slotY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            _this.selY * (s + 2 * b + g) +
                            b -
                            hg);
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(slotX, slotY, Math.round(s + 2 * hg), Math.round(s + 2 * hg));
                        // Draw equip animation for selected item (unique to full inventory view)
                        var i_4 = _this.selX + _this.selY * _this.cols;
                        game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                        var yOff = (s + 2 * hg) * (1 - _this.equipAnimAmount[i_4]);
                        game_1.Game.ctx.fillRect(Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width +
                            _this.selX * (s + 2 * b + g) +
                            b -
                            hg), Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            _this.selY * (s + 2 * b + g) +
                            b -
                            hg +
                            yOff), Math.round(s + 2 * hg), Math.round(s + 2 * hg - yOff));
                        // Redraw selected item icon (similar to drawQuickbar)
                        var drawX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width +
                            _this.selX * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height +
                            _this.selY * (s + 2 * b + g) +
                            b +
                            Math.floor(0.5 * s) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE);
                        var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                        if (i_4 < _this.items.length)
                            _this.items[i_4].drawIcon(delta, drawXScaled, drawYScaled);
                    }
                }
                // Draw item description and action text (unique to full inventory view)
                var i = _this.selX + _this.selY * _this.cols;
                if (i < _this.items.length) {
                    game_1.Game.ctx.fillStyle = "white";
                    // Determine action text
                    var topPhrase = "";
                    if (_this.items[i] instanceof equippable_1.Equippable) {
                        var e = _this.items[i];
                        topPhrase = "[SPACE] to equip";
                        if (e.equipped)
                            topPhrase = "[SPACE] to unequip";
                    }
                    if (_this.items[i] instanceof usable_1.Usable) {
                        topPhrase = "[SPACE] to use";
                    }
                    // Draw action text
                    game_1.Game.ctx.fillStyle = "white";
                    var w = game_1.Game.measureText(topPhrase).width;
                    game_1.Game.fillText(topPhrase, 0.5 * (gameConstants_1.GameConstants.WIDTH - w), 5);
                    // Draw item description
                    var lines = _this.items[i].getDescription().split("\n");
                    var nextY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height +
                        (_this.rows + _this.expansion) * (s + 2 * b + g) +
                        b +
                        5);
                    for (var j = 0; j < lines.length; j++) {
                        nextY = _this.textWrap(lines[j], 5, nextY, gameConstants_1.GameConstants.WIDTH - 10);
                    }
                }
            }
        };
        this.isPointInInventoryBounds = function (x, y) {
            var s = _this.isOpen
                ? Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME)
                : 18;
            var b = 2;
            var g = -2;
            var width = _this.cols * (s + 2 * b + g) - g;
            if (_this.isOpen) {
                // Full inventory bounds
                var height = (_this.rows + _this.expansion) * (s + 2 * b + g) - g;
                var startX = 0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width;
                var startY = 0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height;
                return {
                    inBounds: x >= startX &&
                        x <= startX + width &&
                        y >= startY &&
                        y <= startY + height,
                    startX: startX,
                    startY: startY,
                };
            }
            else {
                // Quickbar bounds
                return _this.isPointInQuickbarBounds(x, y);
            }
        };
        this.isPointInQuickbarBounds = function (x, y) {
            var s = _this.isOpen
                ? Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME)
                : 18;
            var b = 2;
            var g = -2;
            var width = _this.cols * (s + 2 * b + g) - g;
            var startX = 0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width;
            var startY = gameConstants_1.GameConstants.HEIGHT - (s + 2 * b) - 5;
            var quickbarHeight = s + 2 * b;
            return {
                inBounds: x >= startX &&
                    x <= startX + width &&
                    y >= startY &&
                    y <= startY + quickbarHeight,
                startX: startX,
                startY: startY,
            };
        };
        this.isPointInInventoryButton = function (x, y) {
            var tX = x / gameConstants_1.GameConstants.TILESIZE;
            var tY = y / gameConstants_1.GameConstants.TILESIZE;
            return (tX >= levelConstants_1.LevelConstants.SCREEN_W - 2 &&
                tX <= levelConstants_1.LevelConstants.SCREEN_W &&
                tY >= 0 &&
                tY <= 2);
        };
        this.game = game;
        this.player = player;
        this.items = new Array();
        this.equipAnimAmount = [];
        for (var i = 0; i < this.rows * this.cols; i++) {
            this.equipAnimAmount[i] = 0;
        }
        //Input.mouseLeftClickListeners.push(this.mouseLeftClickListener);
        this.coins = 0;
        this.openTime = Date.now();
        this.weapon = null;
        this.expansion = 0;
        var a = function (i) {
            if (i instanceof equippable_1.Equippable) {
                i.setWielder(_this.player);
            }
            if (i instanceof weapon_1.Weapon) {
                i.toggleEquip();
                _this.weapon = i;
                //this.player.weapon = this.weapon;
            }
            _this.addItem(i);
        };
        var startingInv = [dagger_1.Dagger, key_1.Key, candle_1.Candle, torch_1.Torch, warhammer_1.Warhammer];
        startingInv.forEach(function (item) {
            a(new item({ game: _this.game }, 0, 0));
        });
    }
    return Inventory;
}());
exports.Inventory = Inventory;


/***/ }),

/***/ "./src/item/armor.ts":
/*!***************************!*\
  !*** ./src/item/armor.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Armor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var levelConstants_1 = __webpack_require__(/*! ../levelConstants */ "./src/levelConstants.ts");
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var Armor = /** @class */ (function (_super) {
    __extends(Armor, _super);
    function Armor(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.RECHARGE_TURNS = 15;
        _this.coEquippable = function (other) {
            if (other instanceof Armor)
                return false;
            return true;
        };
        _this.getDescription = function () {
            return ("ENCHANTED ARMOR\nA magic suit of armor. Absorbs one hit and regenerates after " +
                _this.RECHARGE_TURNS +
                " turns.");
        };
        _this.tickInInventory = function () {
            if (_this.rechargeTurnCounter > 0) {
                _this.rechargeTurnCounter--;
                if (_this.rechargeTurnCounter === 0) {
                    _this.rechargeTurnCounter = -1;
                    _this.health = 1;
                }
            }
        };
        _this.hurt = function (damage) {
            if (_this.health <= 0)
                return;
            _this.health -= damage;
            _this.rechargeTurnCounter = _this.RECHARGE_TURNS + 1;
        };
        _this.drawGUI = function (delta, playerHealth) {
            if (_this.rechargeTurnCounter === -1)
                game_1.Game.drawFX(5, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
            else {
                var rechargeProportion = 1 - _this.rechargeTurnCounter / _this.RECHARGE_TURNS;
                if (rechargeProportion < 0.5)
                    game_1.Game.drawFX(7, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                else
                    game_1.Game.drawFX(8, 2, 1, 1, playerHealth, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
            }
        };
        _this.health = 1;
        _this.rechargeTurnCounter = -1;
        _this.tileX = 5;
        _this.tileY = 0;
        return _this;
    }
    return Armor;
}(equippable_1.Equippable));
exports.Armor = Armor;


/***/ }),

/***/ "./src/item/backpack.ts":
/*!******************************!*\
  !*** ./src/item/backpack.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Backpack = void 0;
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var Backpack = /** @class */ (function (_super) {
    __extends(Backpack, _super);
    function Backpack(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            if (_this.level.game.rooms[player.levelID] === _this.level.game.room)
                sound_1.Sound.heal();
            player.inventory.expansion += 1;
            //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
        };
        _this.getDescription = function () {
            return "BACKPACK\nA normal looking backpack. Increases the amount you can carry. ";
        };
        _this.tileX = 4;
        _this.tileY = 0;
        _this.offsetY = 0;
        return _this;
    }
    return Backpack;
}(usable_1.Usable));
exports.Backpack = Backpack;


/***/ }),

/***/ "./src/item/bluegem.ts":
/*!*****************************!*\
  !*** ./src/item/bluegem.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BlueGem = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var BlueGem = /** @class */ (function (_super) {
    __extends(BlueGem, _super);
    function BlueGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "ZIRCON";
        };
        _this.tileX = 13;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return BlueGem;
}(item_1.Item));
exports.BlueGem = BlueGem;


/***/ }),

/***/ "./src/item/candle.ts":
/*!****************************!*\
  !*** ./src/item/candle.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Candle = void 0;
var light_1 = __webpack_require__(/*! ./light */ "./src/item/light.ts");
var Candle = /** @class */ (function (_super) {
    __extends(Candle, _super);
    function Candle(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.fuel = 250; //how many turns before it burns out
        _this.tileX = 27;
        _this.tileY = 0;
        _this.name = "candle";
        _this.fuelCap = 250;
        _this.maxRadius = 4;
        _this.minRadius = 2;
        return _this;
    }
    return Candle;
}(light_1.Light));
exports.Candle = Candle;


/***/ }),

/***/ "./src/item/coal.ts":
/*!**************************!*\
  !*** ./src/item/coal.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Coal = void 0;
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var lantern_1 = __webpack_require__(/*! ./lantern */ "./src/item/lantern.ts");
var Coal = /** @class */ (function (_super) {
    __extends(Coal, _super);
    function Coal(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            var l = player.inventory.hasItem(lantern_1.Lantern);
            if (l instanceof lantern_1.Lantern) {
                if (l.fuel <= l.fuelCap - 50) {
                    l.addFuel(50);
                    player.game.pushMessage("You add some fuel to your lantern.");
                    _this.stackCount -= 1;
                    if (_this.stackCount <= 0) {
                        player.inventory.removeItem(_this);
                    }
                }
            }
        };
        _this.getDescription = function () {
            return "COAL\nA lump of coal.";
        };
        _this.tileX = 17;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Coal;
}(usable_1.Usable));
exports.Coal = Coal;


/***/ }),

/***/ "./src/item/coin.ts":
/*!**************************!*\
  !*** ./src/item/coin.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Coin = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var Coin = /** @class */ (function (_super) {
    __extends(Coin, _super);
    //checked: boolean;
    function Coin(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onDrop = function () {
            var coinList = []; //array to store coin objects
            for (var _i = 0, _a = _this.level.items; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item instanceof Coin)
                    coinList.push(item);
            }
            var _loop_1 = function (otherCoin) {
                if (_this !== otherCoin &&
                    _this.x === otherCoin.x &&
                    _this.y === otherCoin.y) {
                    _this.stack += otherCoin.stack;
                    _this.level.items = _this.level.items.filter(function (x) { return x !== otherCoin; });
                }
                if (_this.stack === 2)
                    _this.tileX = 20;
                else if (_this.stack >= 3)
                    _this.tileX = 21;
            };
            for (var _b = 0, coinList_1 = coinList; _b < coinList_1.length; _b++) {
                var otherCoin = coinList_1[_b];
                _loop_1(otherCoin);
            }
        };
        _this.draw = function (delta) {
            if (!_this.pickedUp) {
                _this.drawableY = _this.y;
                if (_this.scaleFactor < 1)
                    _this.scaleFactor += 0.04;
                else
                    _this.scaleFactor = 1;
                game_1.Game.drawItem(0, 0, 1, 1, _this.x, _this.y, 1, 1);
                _this.frame += (delta * (Math.PI * 2)) / 60;
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x + _this.w * (_this.scaleFactor * -0.5 + 0.5), _this.y +
                    Math.sin(_this.frame) * 0.07 -
                    1 +
                    _this.offsetY +
                    _this.h * (_this.scaleFactor * -0.5 + 0.5), _this.w * _this.scaleFactor, _this.h * _this.scaleFactor, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.pickupSound = function () {
            if (_this.level === _this.level.game.room)
                sound_1.Sound.pickupCoin();
        };
        _this.tileX = 19;
        _this.tileY = 0;
        _this.stack = 1;
        _this.stackable = true;
        return _this;
    }
    return Coin;
}(item_1.Item));
exports.Coin = Coin;


/***/ }),

/***/ "./src/item/equippable.ts":
/*!********************************!*\
  !*** ./src/item/equippable.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Equippable = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var Equippable = /** @class */ (function (_super) {
    __extends(Equippable, _super);
    function Equippable(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.setWielder = function (wielder) {
            _this.wielder = wielder;
        };
        _this.coEquippable = function (other) {
            return true;
        };
        _this.toggleEquip = function () {
            _this.equipped = !_this.equipped;
        };
        _this.drawEquipped = function (delta, x, y) {
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x, y - 1, _this.w, _this.h);
        };
        _this.onDrop = function () { };
        _this.dropFromInventory = function () {
            _this.wielder.inventory.weapon = null;
            _this.wielder = null;
            _this.equipped = false;
        };
        _this.equipped = false;
        return _this;
    }
    return Equippable;
}(item_1.Item));
exports.Equippable = Equippable;


/***/ }),

/***/ "./src/item/gold.ts":
/*!**************************!*\
  !*** ./src/item/gold.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Gold = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Gold = /** @class */ (function (_super) {
    __extends(Gold, _super);
    function Gold(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GOLD\nA nugget of gold.";
        };
        _this.tileX = 18;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Gold;
}(item_1.Item));
exports.Gold = Gold;


/***/ }),

/***/ "./src/item/goldenKey.ts":
/*!*******************************!*\
  !*** ./src/item/goldenKey.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoldenKey = void 0;
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var GoldenKey = /** @class */ (function (_super) {
    __extends(GoldenKey, _super);
    function GoldenKey(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GOLD KEY\nA heavy gold key.";
        };
        _this.tileX = 6;
        _this.tileY = 0;
        return _this;
    }
    return GoldenKey;
}(equippable_1.Equippable));
exports.GoldenKey = GoldenKey;


/***/ }),

/***/ "./src/item/greengem.ts":
/*!******************************!*\
  !*** ./src/item/greengem.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GreenGem = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var GreenGem = /** @class */ (function (_super) {
    __extends(GreenGem, _super);
    function GreenGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "PERIDOT";
        };
        _this.tileX = 11;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return GreenGem;
}(item_1.Item));
exports.GreenGem = GreenGem;


/***/ }),

/***/ "./src/item/heart.ts":
/*!***************************!*\
  !*** ./src/item/heart.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Heart = void 0;
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var Heart = /** @class */ (function (_super) {
    __extends(Heart, _super);
    function Heart(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            player.health = Math.min(player.maxHealth, player.health + 1);
            if (_this.level.game.rooms[player.levelID] === _this.level.game.room)
                sound_1.Sound.heal();
            player.inventory.removeItem(_this);
            //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
        };
        _this.getDescription = function () {
            return "HEALTH POTION\nRestores 1 heart";
        };
        _this.tileX = 8;
        _this.tileY = 0;
        _this.offsetY = -0.3;
        return _this;
    }
    return Heart;
}(usable_1.Usable));
exports.Heart = Heart;


/***/ }),

/***/ "./src/item/item.ts":
/*!**************************!*\
  !*** ./src/item/item.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Item = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
// Item class extends Drawable class and represents an item in the game
var Item = /** @class */ (function (_super) {
    __extends(Item, _super);
    // Constructor for the Item class
    function Item(level, x, y) {
        var _this = _super.call(this) || this;
        // Empty tick function to be overridden by subclasses
        _this.tick = function () { };
        // Empty tick function for inventory behavior to be overridden by subclasses
        _this.tickInInventory = function () { };
        // Function to get description of the item, to be overridden by subclasses
        _this.getDescription = function () {
            return "";
        };
        // Function to play sound when item is picked up
        _this.pickupSound = function () {
            if (_this.level === _this.level.game.room)
                sound_1.Sound.genericPickup();
        };
        // Empty function to be called when item is dropped, to be overridden by subclasses
        _this.onDrop = function () { };
        // Function to be called when item is picked up
        _this.onPickup = function (player) {
            if (!_this.pickedUp) {
                _this.pickedUp = player.inventory.addItem(_this);
                if (_this.pickedUp)
                    _this.pickupSound();
            }
        };
        _this.dropFromInventory = function () { };
        // Function to get the amount of shade at the item's location
        _this.shadeAmount = function () {
            if (!_this.x || !_this.y)
                return 0;
            else
                return _this.level.softVis[_this.x][_this.y];
        };
        // Function to draw the item
        _this.draw = function (delta) {
            if (!_this.pickedUp) {
                _this.drawableY = _this.y;
                if (_this.scaleFactor < 1)
                    _this.scaleFactor += 0.04;
                else
                    _this.scaleFactor = 1;
                game_1.Game.drawItem(0, 0, 1, 1, _this.x, _this.y, 1, 1);
                _this.frame += (delta * (Math.PI * 2)) / 60;
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x + _this.w * (_this.scaleFactor * -0.5 + 0.5), _this.y +
                    Math.sin(_this.frame) * 0.07 -
                    1 +
                    _this.offsetY +
                    _this.h * (_this.scaleFactor * -0.5 + 0.5), _this.w * _this.scaleFactor, _this.h * _this.scaleFactor, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        // Function to draw the top layer of the item
        _this.drawTopLayer = function (delta) {
            if (_this.pickedUp) {
                _this.y -= 0.125 * delta;
                _this.alpha -= 0.03 * delta;
                if (_this.y < -1)
                    _this.level.items = _this.level.items.filter(function (x) { return x !== _this; }); // removes itself from the level
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    game_1.Game.ctx.globalAlpha = Math.max(0, _this.alpha);
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x, _this.y - 1, _this.w, _this.h);
                game_1.Game.ctx.globalAlpha = 1.0;
            }
        };
        // Function to draw the item's icon
        _this.drawIcon = function (delta, x, y, opacity) {
            if (opacity === void 0) { opacity = 1; }
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                game_1.Game.ctx.globalAlpha = opacity;
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x, y - 1, _this.w, _this.h);
            game_1.Game.ctx.globalAlpha = 1;
            var countText = _this.stackCount <= 1 ? "" : "" + _this.stackCount;
            var width = game_1.Game.measureText(countText).width;
            var countX = 16 - width;
            var countY = 10;
            game_1.Game.fillTextOutline(countText, x * gameConstants_1.GameConstants.TILESIZE + countX, y * gameConstants_1.GameConstants.TILESIZE + countY, gameConstants_1.GameConstants.OUTLINE, "white");
        };
        // Initialize properties
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.drawableY = y;
        _this.w = 1;
        _this.h = 2;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.frame = 0;
        _this.stackable = false;
        _this.stackCount = 1;
        _this.pickedUp = false;
        _this.alpha = 1;
        _this.scaleFactor = 0.2;
        _this.offsetY = -0.25;
        _this.name = "";
        return _this;
    }
    return Item;
}(drawable_1.Drawable));
exports.Item = Item;


/***/ }),

/***/ "./src/item/key.ts":
/*!*************************!*\
  !*** ./src/item/key.ts ***!
  \*************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Key = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Key = /** @class */ (function (_super) {
    __extends(Key, _super);
    function Key(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "KEY\nAn iron key.";
        };
        _this.tileX = 1;
        _this.tileY = 0;
        return _this;
    }
    return Key;
}(item_1.Item));
exports.Key = Key;


/***/ }),

/***/ "./src/item/lantern.ts":
/*!*****************************!*\
  !*** ./src/item/lantern.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Lantern = void 0;
var candle_1 = __webpack_require__(/*! ./candle */ "./src/item/candle.ts");
var torch_1 = __webpack_require__(/*! ./torch */ "./src/item/torch.ts");
var light_1 = __webpack_require__(/*! ./light */ "./src/item/light.ts");
var Lantern = /** @class */ (function (_super) {
    __extends(Lantern, _super);
    function Lantern(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.addFuel = function (amount) {
            _this.fuel += amount;
        };
        _this.coEquippable = function (other) {
            return !(other instanceof candle_1.Candle ||
                other instanceof torch_1.Torch ||
                other instanceof Lantern);
        };
        _this.setRadius = function () {
            _this.wielder.sightRadius = Math.min(_this.fuel / 4 + 3, 7);
        };
        _this.toggleEquip = function () {
            if (_this.fuel > 0) {
                _this.equipped = !_this.equipped;
                if (_this.isIgnited())
                    _this.setRadius();
                else
                    _this.resetRadius();
            }
            else
                _this.wielder.game.pushMessage("I'll need some fuel before I can use this");
        };
        _this.getDescription = function () {
            var percentage = Math.round((_this.fuel / _this.fuelCap) * 100);
            return "LANTERN - Fuel: ".concat(percentage, "%, Capacity: ").concat(_this.fuelCap / 50);
        };
        _this.fuel = 0;
        _this.tileX = 29;
        _this.tileY = 0;
        _this.fuelCap = 250;
        _this.name = "lantern";
        return _this;
    }
    return Lantern;
}(light_1.Light));
exports.Lantern = Lantern;


/***/ }),

/***/ "./src/item/light.ts":
/*!***************************!*\
  !*** ./src/item/light.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Light = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var Light = /** @class */ (function (_super) {
    __extends(Light, _super);
    function Light(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.updateLighting = function () {
            _this.wielder.game.rooms[_this.wielder.levelID].updateLighting();
        };
        _this.isIgnited = function () {
            if (_this.fuel > 0 && _this.equipped) {
                return true;
            }
            return false;
        };
        _this.setRadius = function () {
            _this.wielder.sightRadius =
                _this.wielder.defaultSightRadius + _this.fuelPercentage * _this.maxRadius;
        };
        _this.toggleEquip = function () {
            _this.equipped = !_this.equipped;
            if (_this.isIgnited()) {
                _this.setRadius();
                _this.wielder.lightEquipped = true;
                //Light.warmEnabled = true;
            }
            else {
                _this.resetRadius();
                _this.wielder.lightEquipped = false;
                //Light.warmEnabled = false;
            }
            _this.updateLighting();
        };
        _this.coEquippable = function (other) {
            return !(other instanceof Light);
        };
        _this.resetRadius = function () {
            _this.wielder.sightRadius = _this.wielder.defaultSightRadius;
        };
        _this.deplete = function () {
            if (_this.fuel <= 0) {
                _this.wielder.game.pushMessage("".concat(_this.name, " depletes."));
                _this.resetRadius();
                _this.wielder.inventory.removeItem(_this);
            }
            else if (_this.isIgnited()) {
                _this.fuel--;
                _this.setRadius();
            }
        };
        _this.tickInInventory = function () {
            _this.deplete();
        };
        _this.getDescription = function () {
            return "".concat(_this.name, ": ").concat(_this.fuelPercentage * 100, "%");
        };
        _this.tileX = 28;
        _this.tileY = 0;
        _this.fuel = 0;
        _this.fuelCap = 250;
        _this.maxRadius = 6;
        _this.minRadius = 2;
        return _this;
    }
    Object.defineProperty(Light.prototype, "fuelPercentage", {
        get: function () {
            return this.fuel / this.fuelCap;
        },
        enumerable: false,
        configurable: true
    });
    Light.warmEnabled = false;
    Light.warmth = 0;
    Light.maxWarmth = 0.2;
    Light.drawTint = function (delta) {
        var warmthChange = 0.02 * delta;
        if (Light.warmth <= Light.maxWarmth && Light.warmEnabled) {
            Light.warmth += warmthChange;
        }
        if (Light.warmth > 0 && !Light.warmEnabled) {
            Light.warmth -= warmthChange;
        }
        if (Light.warmth < 0)
            Light.warmth = 0;
        if (Light.warmth > Light.maxWarmth)
            Light.warmth = Light.maxWarmth;
        game_1.Game.ctx.globalAlpha = Light.warmth;
        game_1.Game.ctx.globalCompositeOperation = "overlay";
        game_1.Game.ctx.fillStyle = "#FF8C00"; // reddish orange red
        game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
        game_1.Game.ctx.globalCompositeOperation = "source-over";
    };
    return Light;
}(equippable_1.Equippable));
exports.Light = Light;


/***/ }),

/***/ "./src/item/redgem.ts":
/*!****************************!*\
  !*** ./src/item/redgem.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedGem = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var RedGem = /** @class */ (function (_super) {
    __extends(RedGem, _super);
    function RedGem(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "GARNET";
        };
        _this.tileX = 12;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return RedGem;
}(item_1.Item));
exports.RedGem = RedGem;


/***/ }),

/***/ "./src/item/shrooms.ts":
/*!*****************************!*\
  !*** ./src/item/shrooms.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Shrooms = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Shrooms = /** @class */ (function (_super) {
    __extends(Shrooms, _super);
    function Shrooms(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "SHROOMS\nI don't think I should eat these...";
        };
        _this.tileX = 6;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Shrooms;
}(item_1.Item));
exports.Shrooms = Shrooms;


/***/ }),

/***/ "./src/item/stone.ts":
/*!***************************!*\
  !*** ./src/item/stone.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Stone = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Stone = /** @class */ (function (_super) {
    __extends(Stone, _super);
    function Stone(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "STONE\nSome fragments of stone.";
        };
        _this.tileX = 15;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return Stone;
}(item_1.Item));
exports.Stone = Stone;


/***/ }),

/***/ "./src/item/torch.ts":
/*!***************************!*\
  !*** ./src/item/torch.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Torch = void 0;
var light_1 = __webpack_require__(/*! ./light */ "./src/item/light.ts");
var Torch = /** @class */ (function (_super) {
    __extends(Torch, _super);
    function Torch(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tileX = 28;
        _this.tileY = 0;
        _this.name = "torch";
        _this.fuelCap = 500;
        _this.fuel = 500;
        _this.maxRadius = 6;
        return _this;
    }
    return Torch;
}(light_1.Light));
exports.Torch = Torch;


/***/ }),

/***/ "./src/item/usable.ts":
/*!****************************!*\
  !*** ./src/item/usable.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Usable = void 0;
var item_1 = __webpack_require__(/*! ./item */ "./src/item/item.ts");
var Usable = /** @class */ (function (_super) {
    __extends(Usable, _super);
    function Usable(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) { };
        return _this;
    }
    return Usable;
}(item_1.Item));
exports.Usable = Usable;


/***/ }),

/***/ "./src/levelConstants.ts":
/*!*******************************!*\
  !*** ./src/levelConstants.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LevelConstants = void 0;
var LevelConstants = /** @class */ (function () {
    function LevelConstants() {
    }
    LevelConstants.SCREEN_W = 1;
    LevelConstants.SCREEN_H = 1;
    LevelConstants.COMPUTER_TURN_DELAY = 300; // milliseconds
    LevelConstants.TURN_TIME = 3000; // milliseconds
    LevelConstants.LEVEL_TRANSITION_TIME = 300; // milliseconds
    LevelConstants.LEVEL_TRANSITION_TIME_LADDER = 1000; // milliseconds
    LevelConstants.ROOM_COUNT = 50;
    LevelConstants.HEALTH_BAR_FADEIN = 100;
    LevelConstants.HEALTH_BAR_FADEOUT = 100;
    LevelConstants.HEALTH_BAR_TOTALTIME = 1000;
    LevelConstants.SHADED_TILE_CUTOFF = 1;
    LevelConstants.SMOOTH_LIGHTING = false; //doesn't work
    LevelConstants.MIN_VISIBILITY = 0; // visibility level of places you've already seen
    LevelConstants.LIGHTING_ANGLE_STEP = 1; // how many degrees between each ray, previously 5
    LevelConstants.LEVEL_TEXT_COLOR = "yellow";
    LevelConstants.AMBIENT_LIGHT_COLOR = [10, 10, 10];
    return LevelConstants;
}());
exports.LevelConstants = LevelConstants;


/***/ }),

/***/ "./src/levelGenerator.ts":
/*!*******************************!*\
  !*** ./src/levelGenerator.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LevelGenerator = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var room_1 = __webpack_require__(/*! ./room */ "./src/room.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
//Goal: CRACK THE LEVEL GENERATOR
var PartitionConnection = /** @class */ (function () {
    function PartitionConnection(x, y, other) {
        this.x = x;
        this.y = y;
        this.other = other;
    }
    return PartitionConnection;
}());
var Partition = /** @class */ (function () {
    function Partition(x, y, w, h) {
        var _this = this;
        this.split = function () {
            // This function generates a random number around the center (0.5) within a certain width (0.6).
            // It uses the Random.rand() function to generate a random number between 0 and 1, subtracts 0.5 to center it around 0,
            // multiplies it by the width to scale it, and then adds the center (0.5) to shift it back to being between 0 and 1.
            var rand_mid = function () {
                var center = 0.5;
                var width = 0.6;
                return (random_1.Random.rand() - 0.5) * width + center;
            };
            var sizeRange = function () {
                var sizes = [
                    { size: 1, probability: 0.2 },
                    { size: 3, probability: 0.6 },
                    { size: 10, probability: 0.2 },
                ];
                var rand = random_1.Random.rand();
                var sum = 0;
                for (var _i = 0, sizes_1 = sizes; _i < sizes_1.length; _i++) {
                    var size = sizes_1[_i];
                    sum += size.probability;
                    if (rand <= sum)
                        return size.size;
                }
                return sizes[sizes.length - 1].size;
            };
            var MIN_SIZE = 4;
            if (_this.w > _this.h) {
                //if the partitions width is greater than its height
                var w1 = Math.floor(rand_mid() * _this.w);
                //choose a random tile within the width of the tiles
                var w2 = _this.w - w1 - 1;
                //The remaining border - 1
                if (w1 < MIN_SIZE || w2 < MIN_SIZE)
                    return [_this];
                //if either of these are less than the min size: return an array with this Partition
                return [
                    new Partition(_this.x, _this.y, w1, _this.h),
                    new Partition(_this.x + w1 + 1, _this.y, w2, _this.h),
                ];
                //return an array with two new partitions
            }
            else {
                var h1 = Math.floor(rand_mid() * _this.h);
                var h2 = _this.h - h1 - 1;
                if (h1 < MIN_SIZE || h2 < MIN_SIZE)
                    return [_this];
                return [
                    new Partition(_this.x, _this.y, _this.w, h1),
                    new Partition(_this.x, _this.y + h1 + 1, _this.w, h2),
                ];
                //identical code for case where height > width
            }
        };
        this.point_in = function (x, y) {
            //given the input argument x,y coordinates output boolean
            return (x >= _this.x && x < _this.x + _this.w && y >= _this.y && y < _this.y + _this.h);
            //only return true if both input x and input y are within the partitions x and y
        };
        this.point_next_to = function (x, y) {
            return ((x >= _this.x - 1 &&
                x < _this.x + _this.w + 1 &&
                y >= _this.y &&
                y < _this.y + _this.h) ||
                (x >= _this.x &&
                    x < _this.x + _this.w &&
                    y >= _this.y - 1 &&
                    y < _this.y + _this.h + 1));
            //return true if the input x and y are next to any point of the partition
        };
        this.area = function () {
            return _this.w * _this.h;
            //return the damn area
        };
        this.overlaps = function (other) {
            return (other.x < _this.x + _this.w + 1 &&
                other.x + other.w > _this.x - 1 &&
                other.y < _this.y + _this.h + 1 &&
                other.y + other.h > _this.y - 1);
            //takes another partition instance as argument
            //returns true if any points of each overlap
        };
        this.get_branch_point = function () {
            var points = [];
            for (var x = _this.x; x < _this.x + _this.w; x++) {
                //count up from the partitions x to it's width
                points.push({ x: x, y: _this.y - 1 /*one row above partition*/ });
                points.push({ x: x, y: _this.y + _this.h /*one row below partition*/ });
            } // pushes the points above and below the partition
            for (var y = _this.y; y < _this.y + _this.h; y++) {
                points.push({ x: _this.x - 1, y: y });
                points.push({ x: _this.x + _this.w, y: y });
            } //pushes points to left an right of the partition
            points = points.filter(function (p) {
                return !_this.connections.some(function (c) { return Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1; });
            }
            //if the sum of the distance between the input x and y values and the partitions x and y values is > 1
            //delete those from the points array
            );
            points.sort(function () { return 0.5 - random_1.Random.rand(); });
            return points[0]; //return first or last object of x y points in array points
        };
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = room_1.RoomType.DUNGEON;
        this.connections = [];
        this.distance = 1000;
    }
    return Partition;
}()); //end of Partition class
var split_partitions = function (partitions, prob) {
    var _loop_1 = function (partition) {
        if (random_1.Random.rand() < prob) {
            partitions = partitions.filter(function (p) { return p !== partition; }); // remove partition
            partitions = partitions.concat(partition.split()); // add splits
        }
    };
    for (var _i = 0, partitions_1 = partitions; _i < partitions_1.length; _i++) {
        var partition = partitions_1[_i];
        _loop_1(partition);
    }
    return partitions;
    //takes input partitions array, randomly removes partitions and adds splits, output modified partitions array
};
var remove_wall_rooms = function (partitions, w, h) {
    var _loop_2 = function (partition) {
        if (partition.x === 0 ||
            partition.y === 0 ||
            partition.x + partition.w === w ||
            partition.y + partition.h === h
        //delete any partition where the x or y is zero
        ) {
            partitions = partitions.filter(function (p) { return p != partition; });
        }
    };
    for (var _i = 0, partitions_2 = partitions; _i < partitions_2.length; _i++) {
        var partition = partitions_2[_i];
        _loop_2(partition);
    }
    return partitions;
    //return partitions array with no wall rooms
};
var populate_grid = function (partitions, grid, w, h) {
    for (var x = 0; x < w; x++) {
        //loop through the horizontal tiles
        grid[x] = []; //empty array at x index
        for (var y = 0; y < h; y++) {
            grid[x][y] = false;
            for (var _i = 0, partitions_3 = partitions; _i < partitions_3.length; _i++) {
                var partition = partitions_3[_i];
                if (partition.point_in(x, y))
                    grid[x][y] = partition;
            }
        }
    }
    return grid;
    //input grid array, partitions array and width and height
    //output grid array that indicates which cells are in which partition
};
var generate_dungeon_candidate = function (map_w, map_h) {
    var partitions = [new Partition(0, 0, map_w, map_h)];
    var grid = [];
    //add a new partition and define grid as empty array
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.75);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 1);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.25);
    //split partitions 3 times with different probabilities
    grid = populate_grid(partitions, grid, map_w, map_h);
    //remove wall rooms and populate dat grid
    partitions.sort(function (a, b) { return a.area() - b.area(); });
    //sort the partitions list by ... area? I think?
    var spawn = partitions[0];
    //spawn is the first Partition instance
    spawn.type = room_1.RoomType.START;
    //set the roomtype for the partition accordingly
    partitions[partitions.length - 1].type = room_1.RoomType.BOSS;
    //set the largest room as boss room?
    var connected = [spawn];
    var frontier = [spawn];
    var found_boss = false;
    // connect rooms until we find the boss
    while (frontier.length > 0 && !found_boss) {
        var room = frontier[0];
        frontier.splice(0, 1);
        var doors_found = 0;
        var num_doors = Math.floor(random_1.Random.rand() * 2 + 1);
        var tries = 0;
        var max_tries = 1000;
        while (doors_found < num_doors && tries < max_tries) {
            var point = room.get_branch_point();
            for (var _i = 0, partitions_4 = partitions; _i < partitions_4.length; _i++) {
                var p = partitions_4[_i];
                if (p !== room &&
                    connected.indexOf(p) === -1 &&
                    p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    frontier.push(p);
                    connected.push(p);
                    doors_found++;
                    if (p.type === room_1.RoomType.BOSS)
                        found_boss = true;
                    break;
                }
            }
            tries++;
        }
    }
    var _loop_3 = function (partition) {
        if (partition.connections.length === 0)
            partitions = partitions.filter(function (p) { return p !== partition; });
    };
    // remove rooms we haven't connected to yet
    for (var _a = 0, partitions_5 = partitions; _a < partitions_5.length; _a++) {
        var partition = partitions_5[_a];
        _loop_3(partition);
    }
    grid = populate_grid(partitions, grid, map_w, map_h); // recalculate with removed rooms
    // make sure we haven't removed all the rooms
    if (partitions.length === 0) {
        return []; // for now just return an empty list so we can retry
    }
    // make some loops
    var num_loop_doors = Math.floor(random_1.Random.rand() * 4 + 4);
    var _loop_4 = function (i) {
        var roomIndex = Math.floor(random_1.Random.rand() * partitions.length);
        var room = partitions[roomIndex];
        var found_door = false;
        var tries = 0;
        var max_tries = 10;
        var not_already_connected = partitions.filter(function (p) { return !room.connections.some(function (c) { return c.other === p; }); });
        while (!found_door && tries < max_tries) {
            var point = room.get_branch_point();
            for (var _e = 0, not_already_connected_1 = not_already_connected; _e < not_already_connected_1.length; _e++) {
                var p = not_already_connected_1[_e];
                if (p !== room && p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    found_door = true;
                    break;
                }
            }
            tries++;
        }
    };
    for (var i = 0; i < num_loop_doors; i++) {
        _loop_4(i);
    }
    // add stair room
    if (!partitions.some(function (p) { return p.type === room_1.RoomType.BOSS; }))
        return [];
    var boss = partitions.find(function (p) { return p.type === room_1.RoomType.BOSS; });
    var found_stair = false;
    var max_stair_tries = 100;
    var _loop_5 = function (stair_tries) {
        var stair = new Partition(game_1.Game.rand(boss.x - 1, boss.x + boss.w - 2, random_1.Random.rand), boss.y - 4, 3, 3);
        stair.type = room_1.RoomType.DOWNLADDER;
        if (!partitions.some(function (p) { return p.overlaps(stair); })) {
            found_stair = true;
            partitions.push(stair);
            stair.connections.push(new PartitionConnection(stair.x + 1, stair.y + 3, boss));
            boss.connections.push(new PartitionConnection(stair.x + 1, stair.y + 3, stair));
            return "break";
        }
    };
    for (var stair_tries = 0; stair_tries < max_stair_tries; stair_tries++) {
        var state_1 = _loop_5(stair_tries);
        if (state_1 === "break")
            break;
    }
    if (!found_stair)
        return [];
    // calculate room distances
    frontier = [spawn];
    var seen = [];
    spawn.distance = 0;
    while (frontier.length > 0) {
        var room = frontier[0];
        frontier.splice(0, 1);
        seen.push(room);
        for (var _b = 0, _c = room.connections; _b < _c.length; _b++) {
            var c = _c[_b];
            var other = c.other;
            other.distance = Math.min(other.distance, room.distance + 1);
            if (seen.indexOf(other) === -1)
                frontier.push(other);
        }
    }
    // add special rooms
    var added_rope_hole = false;
    for (var _d = 0, partitions_6 = partitions; _d < partitions_6.length; _d++) {
        var p = partitions_6[_d];
        if (p.type === room_1.RoomType.DUNGEON) {
            if (p.distance > 4 && p.area() <= 30 && random_1.Random.rand() < 0.1) {
                p.type = room_1.RoomType.TREASURE;
            }
            else if (!added_rope_hole &&
                p.distance > 3 &&
                p.area() <= 20 &&
                random_1.Random.rand() < 0.5) {
                p.type = room_1.RoomType.ROPEHOLE;
                added_rope_hole = true;
            }
        }
    }
    return partitions;
};
var generate_dungeon = function (map_w, map_h) {
    var passes_checks = false;
    var partitions;
    var tries = 0;
    while (!passes_checks) {
        partitions = generate_dungeon_candidate(map_w, map_h);
        passes_checks = true;
        if (partitions.length < 6)
            passes_checks = false;
        if (!partitions.some(function (p) { return p.type === room_1.RoomType.BOSS; }))
            passes_checks = false;
        else if (partitions.find(function (p) { return p.type === room_1.RoomType.BOSS; }).distance < 3)
            passes_checks = false;
        tries++;
        //if (tries > 100) break;
    }
    return partitions;
};
var generate_cave_candidate = function (map_w, map_h, num_rooms) {
    var partitions = [new Partition(0, 0, map_w, map_h)];
    var grid = [];
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.75);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 1);
    for (var i = 0; i < 3; i++)
        partitions = split_partitions(partitions, 0.5);
    grid = populate_grid(partitions, grid, map_w, map_h);
    partitions.sort(function (a, b) { return a.area() - b.area(); });
    if (partitions.length === 0) {
        throw new Error("No partitions generated."); // Throw an error if no partitions
    }
    var spawn = partitions[0];
    spawn.type = room_1.RoomType.ROPECAVE;
    for (var i = 1; i < partitions.length; i++)
        partitions[i].type = room_1.RoomType.CAVE;
    var connected = [spawn];
    var frontier = [spawn];
    // connect rooms until we hit num_rooms
    while (frontier.length > 0 && connected.length < num_rooms) {
        var room = frontier[0];
        frontier.splice(0, 1);
        var doors_found = 0;
        var num_doors = Math.floor(random_1.Random.rand() * 2 + 1);
        var tries = 0;
        var max_tries = 1000;
        while (doors_found < num_doors &&
            tries < max_tries &&
            connected.length < num_rooms) {
            var point = room.get_branch_point();
            if (!point) {
            }
            for (var _i = 0, partitions_7 = partitions; _i < partitions_7.length; _i++) {
                var p = partitions_7[_i];
                if (p !== room &&
                    connected.indexOf(p) === -1 &&
                    p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    frontier.push(p);
                    connected.push(p);
                    doors_found++;
                    break;
                }
            }
            tries++;
        }
    }
    // remove rooms we haven't connected to yet
    // remove rooms we haven't connected to yet
    partitions = partitions.filter(function (partition) { return partition.connections.length > 0; });
    grid = populate_grid(partitions, grid, map_w, map_h); // recalculate with removed rooms
    // make sure we haven't removed all the rooms
    if (partitions.length === 0) {
        throw new Error("No valid rooms after filtering."); // Throw an error if no valid rooms
    }
    // make some loops
    var num_loop_doors = Math.floor(random_1.Random.rand() * 4 + 4);
    var _loop_6 = function (i) {
        var roomIndex = Math.floor(random_1.Random.rand() * partitions.length);
        var room = partitions[roomIndex];
        var found_door = false;
        var tries = 0;
        var max_tries = 100;
        var not_already_connected = partitions.filter(function (p) { return !room.connections.some(function (c) { return c.other === p; }); });
        while (!found_door && tries < max_tries) {
            var point = room.get_branch_point();
            if (!point) {
                break; // Skip if no valid branch point found
            }
            for (var _c = 0, not_already_connected_2 = not_already_connected; _c < not_already_connected_2.length; _c++) {
                var p = not_already_connected_2[_c];
                if (p !== room && p.point_next_to(point.x, point.y)) {
                    room.connections.push(new PartitionConnection(point.x, point.y, p));
                    p.connections.push(new PartitionConnection(point.x, point.y, room));
                    found_door = true;
                    break;
                }
            }
            tries++;
        }
    };
    for (var i = 0; i < num_loop_doors; i++) {
        _loop_6(i);
    }
    // calculate room distances
    frontier = [spawn];
    var seen = [];
    spawn.distance = 0;
    while (frontier.length > 0) {
        var room = frontier[0];
        frontier.splice(0, 1);
        seen.push(room);
        for (var _a = 0, _b = room.connections; _a < _b.length; _a++) {
            var c = _b[_a];
            var other = c.other;
            other.distance = Math.min(other.distance, room.distance + 1);
            if (seen.indexOf(other) === -1)
                frontier.push(other);
        }
    }
    return partitions;
};
var generate_cave = function (mapWidth, mapHeight) {
    var partitions;
    var numberOfRooms = 5; // don't set this too high or cave generation will time out
    do {
        partitions = generate_cave_candidate(mapWidth, mapHeight, numberOfRooms);
    } while (partitions.length < numberOfRooms);
    return partitions;
};
var generate_tutorial = function (height, width) {
    if (height === void 0) { height = 7; }
    if (width === void 0) { width = 7; }
    var partitions;
    partitions = [new Partition(0, 0, height, width)];
    partitions[0].type = room_1.RoomType.TUTORIAL;
    return partitions;
};
var LevelGenerator = /** @class */ (function () {
    function LevelGenerator() {
        var _this = this;
        this.depthReached = 0;
        this.currentFloorFirstLevelID = 0;
        this.getLevels = function (partitions, depth, mapGroup) {
            var levels = [];
            for (var i = 0; i < partitions.length; i++) {
                var level = new room_1.Room(_this.game, partitions[i].x - 1, partitions[i].y - 1, partitions[i].w + 2, partitions[i].h + 2, partitions[i].type, depth, mapGroup, random_1.Random.rand);
                levels.push(level);
            }
            var doors_added = [];
            partitions.forEach(function (partition, index) {
                partition.connections.forEach(function (connection) {
                    var door = levels[index].addDoor(connection.x, connection.y);
                    var existingDoor = doors_added.find(function (existing) { return existing.x === door.x && existing.y === door.y; });
                    if (existingDoor) {
                        existingDoor.link(door);
                        door.link(existingDoor);
                    }
                    doors_added.push(door);
                });
            });
            for (var _i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
                var level = levels_1[_i];
                level.populate(random_1.Random.rand);
            }
            return levels;
        };
        this.setSeed = function (seed) {
            _this.seed = seed;
        };
        this.generate = function (game, depth, cave) {
            if (cave === void 0) { cave = false; }
            _this.depthReached = depth;
            // Set the random state based on the seed and depth
            random_1.Random.setState(_this.seed + depth);
            _this.game = game;
            // Determine the map group
            var mapGroup = _this.game.rooms.length > 0
                ? _this.game.rooms[_this.game.rooms.length - 1].mapGroup + 1
                : 0;
            // Generate partitions based on whether it's a cave or a dungeon
            var partitions = cave ? generate_cave(20, 20) : generate_dungeon(35, 35);
            // Get the levels based on the partitions
            var levels = _this.getLevels(partitions, depth, mapGroup);
            // Update the current floor first level ID if it's not a cave
            if (!cave)
                _this.currentFloorFirstLevelID = _this.game.rooms.length;
            // Add the new levels to the game rooms
            _this.game.rooms = __spreadArray(__spreadArray([], _this.game.rooms, true), levels, true);
            // Generate the rope hole if it exists
            for (var _i = 0, levels_2 = levels; _i < levels_2.length; _i++) {
                var room = levels_2[_i];
                if (room.type === room_1.RoomType.ROPEHOLE) {
                    for (var x = room.roomX; x < room.roomX + room.width; x++) {
                        for (var y = room.roomY; y < room.roomY + room.height; y++) {
                            var tile = room.roomArray[x][y];
                            if (tile instanceof downLadder_1.DownLadder && tile.isRope) {
                                tile.generate();
                                return cave
                                    ? levels.find(function (l) { return l.type === room_1.RoomType.ROPECAVE; })
                                    : levels.find(function (l) { return l.type === room_1.RoomType.START; });
                            }
                        }
                    }
                }
            }
            // Return the start room or the rope cave room
            return cave
                ? levels.find(function (l) { return l.type === room_1.RoomType.ROPECAVE; })
                : levels.find(function (l) { return l.type === room_1.RoomType.START; });
        };
        this.generateFirstNFloors = function (game, numFloors) {
            _this.generate(game, 0, false);
            for (var i = 0; i < numFloors; i++) {
                var foundRoom = _this.game.rooms
                    .slice()
                    .reverse()
                    .find(function (room) { return room.type === room_1.RoomType.DOWNLADDER; });
                if (foundRoom) {
                    for (var x = foundRoom.roomX; x < foundRoom.roomX + foundRoom.width; x++) {
                        for (var y = foundRoom.roomY; y < foundRoom.roomY + foundRoom.height; y++) {
                            var tile = foundRoom.roomArray[x][y];
                            if (tile instanceof downLadder_1.DownLadder) {
                                tile.generate();
                                break;
                            }
                        }
                    }
                }
            }
        };
    }
    return LevelGenerator;
}());
exports.LevelGenerator = LevelGenerator;


/***/ }),

/***/ "./src/lightSource.ts":
/*!****************************!*\
  !*** ./src/lightSource.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LightSource = void 0;
var LightSource = /** @class */ (function () {
    function LightSource(x, y, r, c, b) {
        if (c === void 0) { c = [180, 60, 5]; }
        if (b === void 0) { b = 1; }
        var _this = this;
        this.b = 1;
        this.updatePosition = function (x, y) {
            _this.x = x;
            _this.y = y;
        };
        this.x = x;
        this.y = y;
        this.r = r;
        this.c = c;
        this.b = b;
    }
    LightSource.add = function (room, lightSource) {
        room.lightSources.push(lightSource);
    };
    LightSource.remove = function (room, lightSource) {
        room.lightSources = room.lightSources.filter(function (ls) { return ls !== lightSource; });
    };
    return LightSource;
}());
exports.LightSource = LightSource;


/***/ }),

/***/ "./src/map.ts":
/*!********************!*\
  !*** ./src/map.ts ***!
  \********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Map = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var room_1 = __webpack_require__(/*! ./room */ "./src/room.ts");
var entity_1 = __webpack_require__(/*! ./entity/entity */ "./src/entity/entity.ts");
var Map = /** @class */ (function () {
    function Map(game, player) {
        var _this = this;
        this.mapData = [];
        this.oldMapData = [];
        this.saveMapData = function () {
            _this.clearMap();
            for (var _i = 0, _a = _this.game.rooms; _i < _a.length; _i++) {
                var level = _a[_i];
                if (_this.game.room.mapGroup === level.mapGroup && level.entered) {
                    _this.mapData.push({
                        room: level,
                        walls: level.walls,
                        doors: level.doors,
                        entities: level.entities,
                        items: level.items,
                        players: _this.game.players,
                    });
                }
            }
        };
        this.clearMap = function () {
            _this.mapData = [];
        };
        this.saveOldMap = function () {
            _this.oldMapData = __spreadArray([], _this.mapData, true);
        };
        this.renderMap = function (delta) {
            _this.setInitialCanvasSettings(1);
            _this.translateCanvas(0);
            for (var _i = 0, _a = _this.mapData; _i < _a.length; _i++) {
                var data = _a[_i];
                _this.drawRoom(data, delta);
            }
            /*for (const data of this.oldMapData) {
              this.drawRoom(data);
            }*/
            _this.resetCanvasTransform();
        };
        this.draw = function (delta) {
            _this.renderMap(delta);
        };
        this.setInitialCanvasSettings = function (alpha) {
            game_1.Game.ctx.globalAlpha = alpha;
            game_1.Game.ctx.globalCompositeOperation = "source-over";
        };
        this.translateCanvas = function (offset) {
            game_1.Game.ctx.translate(0.75 * gameConstants_1.GameConstants.WIDTH -
                _this.game.room.roomX -
                Math.floor(0.5 * _this.game.room.width) +
                20, 0.25 * gameConstants_1.GameConstants.HEIGHT -
                _this.game.room.roomY -
                Math.floor(0.5 * _this.game.room.height) -
                offset);
        };
        this.drawRoom = function (data, delta) {
            _this.drawRoomOutline(data.room);
            _this.drawRoomWalls(data.walls);
            _this.drawRoomDoors(data.doors);
            _this.drawRoomEntities(data.entities);
            _this.drawRoomItems(data.items);
            _this.drawRoomPlayers(data.players, delta);
        };
        this.drawRoomOutline = function (level) {
            var s = _this.scale;
            game_1.Game.ctx.fillStyle = "#5A5A5A";
            game_1.Game.ctx.fillRect(level.roomX * s + 0, level.roomY * s + 0, level.width * s - 0, level.height * s - 0);
            if (level.type === room_1.RoomType.UPLADDER)
                game_1.Game.ctx.fillStyle = "#101460";
            if (level.type === room_1.RoomType.DOWNLADDER)
                game_1.Game.ctx.fillStyle = "#601410";
            game_1.Game.ctx.fillStyle = "black";
            game_1.Game.ctx.fillRect(level.roomX * s + 1, level.roomY * s + 1, level.width * s - 2, level.height * s - 2);
        };
        this.drawRoomWalls = function (walls) {
            var s = _this.scale;
            for (var _i = 0, walls_1 = walls; _i < walls_1.length; _i++) {
                var wall = walls_1[_i];
                game_1.Game.ctx.fillStyle = "#404040";
                game_1.Game.ctx.fillRect(wall.x * s, wall.y * s, 1 * s, 1 * s);
            }
        };
        this.drawRoomDoors = function (doors) {
            var s = _this.scale;
            for (var _i = 0, doors_1 = doors; _i < doors_1.length; _i++) {
                var door = doors_1[_i];
                if (door.opened === false)
                    game_1.Game.ctx.fillStyle = "#5A5A5A";
                if (door.opened === true)
                    (game_1.Game.ctx.fillStyle = "black"),
                        game_1.Game.ctx.fillRect(door.x * s, door.y * s, 1 * s, 1 * s);
            }
        };
        this.drawRoomPlayers = function (players, delta) {
            var s = _this.scale;
            for (var i in players) {
                game_1.Game.ctx.fillStyle = "white";
                if (_this.game.rooms[players[i].levelID].mapGroup === _this.game.room.mapGroup) {
                    game_1.Game.ctx.fillRect(players[i].x * s, players[i].y * s, 1 * s, 1 * s);
                }
            }
        };
        this.drawRoomEntities = function (entities) {
            var s = _this.scale;
            for (var _i = 0, entities_1 = entities; _i < entities_1.length; _i++) {
                var enemy = entities_1[_i];
                _this.setEntityColor(enemy);
                game_1.Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s);
            }
        };
        this.setEntityColor = function (enemy) {
            if (enemy.type === entity_1.EntityType.ENEMY) {
                game_1.Game.ctx.fillStyle = "yellow";
            }
            if (enemy.type === entity_1.EntityType.PROP) {
                game_1.Game.ctx.fillStyle = "#847e87";
            }
            if (enemy.type === entity_1.EntityType.RESOURCE) {
                game_1.Game.ctx.fillStyle = "#5a595b";
            }
            if (enemy.type === entity_1.EntityType.FRIENDLY) {
                game_1.Game.ctx.fillStyle = "cyan";
            }
        };
        this.drawRoomItems = function (items) {
            var s = _this.scale;
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                var x = item.x;
                var y = item.y;
                game_1.Game.ctx.fillStyle = "#ac3232";
                if (!item.pickedUp) {
                    game_1.Game.ctx.fillRect(item.x * s, item.y * s, 1 * s, 1 * s);
                }
            }
        };
        this.resetCanvasTransform = function () {
            game_1.Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
        };
        this.game = game;
        this.scale = 1;
        //this.depth = player.game.level.depth
    }
    return Map;
}());
exports.Map = Map;


/***/ }),

/***/ "./src/mouseCursor.ts":
/*!****************************!*\
  !*** ./src/mouseCursor.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MouseCursor = void 0;
var input_1 = __webpack_require__(/*! ./input */ "./src/input.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var MouseCursor = /** @class */ (function () {
    function MouseCursor() {
        this.cursorSize = 5; // Size of the cursor rectangle
    }
    MouseCursor.getInstance = function () {
        if (!MouseCursor.instance) {
            MouseCursor.instance = new MouseCursor();
        }
        return MouseCursor.instance;
    };
    MouseCursor.prototype.draw = function () {
        /*
        Game.ctx.save();
        Game.ctx.fillStyle = "rgba(255, 0, 0, 0.5)"; // Semi-transparent red
        Game.ctx.fillRect(
          Input.mouseX - this.cursorSize / 2,
          Input.mouseY - this.cursorSize / 2,
          this.cursorSize,
          this.cursorSize
        );
        Game.ctx.restore();
        */
    };
    MouseCursor.prototype.getPosition = function () {
        return { x: input_1.Input.mouseX, y: input_1.Input.mouseY };
    };
    MouseCursor.prototype.getTilePosition = function () {
        return {
            x: Math.floor(input_1.Input.mouseX / gameConstants_1.GameConstants.TILESIZE),
            y: Math.floor(input_1.Input.mouseY / gameConstants_1.GameConstants.TILESIZE),
        };
    };
    MouseCursor.prototype.getInventoryPosition = function () {
        return {
            x: input_1.Input.mouseX,
            y: input_1.Input.mouseY,
        };
    };
    return MouseCursor;
}());
exports.MouseCursor = MouseCursor;


/***/ }),

/***/ "./src/particle/deathParticle.ts":
/*!***************************************!*\
  !*** ./src/particle/deathParticle.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeathParticle = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var DeathParticle = /** @class */ (function (_super) {
    __extends(DeathParticle, _super);
    function DeathParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.drawTopLayer = function (delta) {
            if (_this.dead)
                return;
            var yOffset = Math.max(0, ((_this.frame - 3) * 3) / gameConstants_1.GameConstants.TILESIZE);
            var f = Math.round(_this.frame);
            if (f == 2 || f == 4 || f == 6)
                game_1.Game.drawMob(2, 0, 1, 2, _this.x, _this.y - yOffset, 1, 2);
            else
                game_1.Game.drawFX(Math.round(_this.frame), 4, 1, 2, _this.x, _this.y - yOffset, 1, 2);
            _this.frame += 0.3 * delta;
            if (_this.frame > 10)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y - 1.5;
        _this.dead = false;
        _this.frame = 0;
        return _this;
    }
    return DeathParticle;
}(particle_1.Particle));
exports.DeathParticle = DeathParticle;


/***/ }),

/***/ "./src/particle/genericParticle.ts":
/*!*****************************************!*\
  !*** ./src/particle/genericParticle.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GenericParticle = void 0;
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var GenericParticle = /** @class */ (function (_super) {
    __extends(GenericParticle, _super);
    function GenericParticle(level, x, y, z, s, dx, dy, dz, color, delay, expirationTimer, targetX, targetY, targetZ) {
        var _this = _super.call(this) || this;
        _this.render = function () {
            var scale = gameConstants_1.GameConstants.TILESIZE;
            var scaledS = _this.s * _this.alpha; // using alpha for scaling, not alpha
            var halfS = 0.5 * scaledS;
            var oldFillStyle = game_1.Game.ctx.fillStyle;
            game_1.Game.ctx.fillStyle = _this.color;
            game_1.Game.ctx.imageSmoothingEnabled = false;
            game_1.Game.ctx.beginPath();
            game_1.Game.ctx.arc(Math.round(_this.x * scale), Math.round((_this.y - _this.z) * scale), Math.round(halfS * scale), 0, 2 * Math.PI, false);
            game_1.Game.ctx.fill();
            game_1.Game.ctx.fillStyle = oldFillStyle;
        };
        _this.draw = function (delta) {
            if (_this.targetX)
                _this.x += 0.1 * (_this.targetX - _this.x);
            else
                _this.x += _this.dx;
            if (_this.targetY)
                _this.y += 0.1 * (_this.targetY - _this.y);
            else
                _this.y += _this.dy;
            if (_this.targetZ)
                _this.z += 0.1 * (_this.targetZ - _this.z);
            else
                _this.z += _this.dz;
            _this.dx *= 0.97;
            _this.dy *= 0.97;
            if (_this.z <= 0) {
                _this.z = 0;
                _this.dz *= -0.8;
            }
            // apply gravity
            _this.dz -= 0.01;
            if (_this.alpha < 0.2)
                _this.alpha -= 0.007;
            else
                _this.alpha -= 0.02;
            if (_this.alpha <= 0.1)
                _this.dead = true;
            _this.expirationTimer--;
            if (_this.expirationTimer <= 0)
                _this.dead = true;
            if (_this.dead)
                return;
            _this.drawableY = _this.y;
            _this.render();
        };
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.z = z;
        _this.s = s;
        _this.dx = dx;
        _this.dy = dy;
        _this.dz = dz;
        _this.color = color;
        _this.alpha = 1.0;
        if (delay !== undefined)
            _this.delay = delay;
        _this.targetX = targetX;
        _this.targetY = targetY;
        _this.targetZ = targetZ;
        _this.expirationTimer = 1000000;
        if (expirationTimer !== undefined)
            _this.expirationTimer = expirationTimer;
        return _this;
    }
    GenericParticle.shotgun = function (level, cx, cy, tx, ty, color) {
        for (var i = 0; i < 4; i++) {
            level.particles.push(new GenericParticle(level, cx, cy, 0, Math.random() * 0.5 + 0.3, 0, 0, 0, color, 0, 10000000, tx + Math.random() - 0.5, ty + Math.random() - 0.5, 0));
        }
    };
    GenericParticle.spawnCluster = function (level, cx, cy, color) {
        for (var i = 0; i < 4; i++) {
            level.particles.push(new GenericParticle(level, cx + Math.random() * 0.05 - 0.025, cy + Math.random() * 0.05 - 0.025, Math.random() * 0.5, 0.0625 * (i + 8), 0.025 * (Math.random() * 2 - 1), 0.025 * (Math.random() * 2 - 1), 0.2 * (Math.random() - 1), color, 0));
        }
    };
    return GenericParticle;
}(particle_1.Particle));
exports.GenericParticle = GenericParticle;


/***/ }),

/***/ "./src/particle/imageParticle.ts":
/*!***************************************!*\
  !*** ./src/particle/imageParticle.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ImageParticle = void 0;
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var ImageParticle = /** @class */ (function (_super) {
    __extends(ImageParticle, _super);
    function ImageParticle(level, x, y, z, s, dx, dy, dz, tileX, tileY, size, delay, expirationTimer, targetX, targetY, targetZ) {
        var _this = _super.call(this) || this;
        _this.render = function () {
            var scale = gameConstants_1.GameConstants.TILESIZE;
            var yOffset = _this.z * scale;
            var frame = _this.s > 0.5 ? 1 : 0; // Placeholder frames for large and small particles
            game_1.Game.ctx.imageSmoothingEnabled = false;
            var adjustedTileX = _this.tileX + _this.size;
            game_1.Game.drawFX(adjustedTileX, _this.tileY, 1, 1, _this.x - _this.alpha / 2, _this.y - _this.z - _this.alpha / 2, _this.alpha, _this.alpha);
        };
        _this.draw = function (delta) {
            game_1.Game.ctx.imageSmoothingEnabled = false;
            if (_this.targetX)
                _this.x += 0.2 * (_this.targetX - _this.x) * delta;
            else
                _this.x += _this.dx * delta;
            if (_this.targetY)
                _this.y += 0.2 * (_this.targetY - _this.y) * delta;
            else
                _this.y += _this.dy * delta;
            if (_this.targetZ)
                _this.z += 0.2 * (_this.targetZ - _this.z) * delta;
            else
                _this.z += _this.dz * delta;
            _this.dx *= Math.pow(0.97, delta);
            _this.dy *= Math.pow(0.97, delta);
            if (_this.z <= 0) {
                _this.z = 0;
                _this.dz *= -0.8;
            }
            _this.dz -= 0.01 * delta;
            _this.expirationTimer -= delta;
            if (_this.expirationTimer <= 0)
                _this.dead = true;
            if (_this.dead)
                return;
            _this.drawableY = _this.y;
            _this.render();
        };
        _this.level = level;
        _this.x = x;
        _this.y = y;
        _this.z = z; // Use provided height
        _this.s = s;
        _this.dx = dx;
        _this.dy = dy;
        _this.dz = dz;
        _this.tileX = tileX;
        _this.tileY = tileY;
        _this.size = size;
        _this.alpha = 1.0;
        if (delay !== undefined)
            _this.delay = delay;
        _this.targetX = targetX;
        _this.targetY = targetY;
        _this.targetZ = targetZ;
        _this.expirationTimer = 100; // Increased life duration
        if (expirationTimer !== undefined)
            _this.expirationTimer = expirationTimer;
        return _this;
    }
    ImageParticle.shotgun = function (level, cx, cy, tx, ty, tileX, tileY) {
        for (var i = 0; i < 4; i++) {
            level.particles.push(new ImageParticle(level, cx, cy, 0, Math.random() * 0.5 + 0.3, 0, 0, 0, tileX, tileY, 0 //size
            ));
        }
    };
    ImageParticle.spawnCluster = function (level, cx, cy, tileX, tileY) {
        for (var i = Math.floor(Math.random() * 3); i < 5; i++) {
            level.particles.push(new ImageParticle(level, cx + Math.random() * 0.05 - 0.025, // x
            cy + Math.random() * 0.05 - 0.025, // y
            Math.random() * 0.5, // z
            0.0625 * (i + 8), // s
            0.025 * (Math.random() * 2 - 1), //dx
            0.025 * (Math.random() * 2 - 1), //dy
            0.2 * (Math.random() - 1), //dz
            tileX, tileY, [2, 1, 0, 1, 2, 2, 2][i] //size
            ));
        }
    };
    return ImageParticle;
}(particle_1.Particle));
exports.ImageParticle = ImageParticle;


/***/ }),

/***/ "./src/particle/particle.ts":
/*!**********************************!*\
  !*** ./src/particle/particle.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Particle = void 0;
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var Particle = /** @class */ (function (_super) {
    __extends(Particle, _super);
    function Particle() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.drawTopLayer = function (delta) { };
        return _this;
    }
    return Particle;
}(drawable_1.Drawable));
exports.Particle = Particle;


/***/ }),

/***/ "./src/particle/slashParticle.ts":
/*!***************************************!*\
  !*** ./src/particle/slashParticle.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SlashParticle = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var SlashParticle = /** @class */ (function (_super) {
    __extends(SlashParticle, _super);
    function SlashParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            game_1.Game.drawFX(Math.round(_this.frame), 13, 1, 1, _this.x, _this.y, 1, 1);
            _this.frame += 0.5 * delta;
            if (_this.frame > 9)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y - 0.25;
        _this.dead = false;
        _this.frame = 0;
        return _this;
    }
    return SlashParticle;
}(particle_1.Particle));
exports.SlashParticle = SlashParticle;


/***/ }),

/***/ "./src/particle/wizardTeleportParticle.ts":
/*!************************************************!*\
  !*** ./src/particle/wizardTeleportParticle.ts ***!
  \************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WizardTeleportParticle = void 0;
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var WizardTeleportParticle = /** @class */ (function (_super) {
    __extends(WizardTeleportParticle, _super);
    function WizardTeleportParticle(x, y) {
        var _this = _super.call(this) || this;
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            game_1.Game.drawFX(Math.floor(_this.frame), 3, 1, 1, _this.x, _this.y - _this.z, 1, 1);
            _this.z += _this.dz;
            _this.dz *= 0.9;
            _this.frame += 0.25 * delta;
            if (_this.frame > 6)
                _this.dead = true;
        };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.frame = 0;
        _this.z = 0;
        _this.dz = 0.1;
        return _this;
    }
    return WizardTeleportParticle;
}(particle_1.Particle));
exports.WizardTeleportParticle = WizardTeleportParticle;


/***/ }),

/***/ "./src/player.ts":
/*!***********************!*\
  !*** ./src/player.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Player = exports.PlayerDirection = void 0;
var input_1 = __webpack_require__(/*! ./input */ "./src/input.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var door_1 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var trapdoor_1 = __webpack_require__(/*! ./tile/trapdoor */ "./src/tile/trapdoor.ts");
var inventory_1 = __webpack_require__(/*! ./inventory */ "./src/inventory.ts");
var sound_1 = __webpack_require__(/*! ./sound */ "./src/sound.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var map_1 = __webpack_require__(/*! ./map */ "./src/map.ts");
var slashParticle_1 = __webpack_require__(/*! ./particle/slashParticle */ "./src/particle/slashParticle.ts");
var healthbar_1 = __webpack_require__(/*! ./healthbar */ "./src/healthbar.ts");
var drawable_1 = __webpack_require__(/*! ./drawable */ "./src/drawable.ts");
var hitWarning_1 = __webpack_require__(/*! ./hitWarning */ "./src/hitWarning.ts");
var postProcess_1 = __webpack_require__(/*! ./postProcess */ "./src/postProcess.ts");
var mouseCursor_1 = __webpack_require__(/*! ./mouseCursor */ "./src/mouseCursor.ts");
var light_1 = __webpack_require__(/*! ./item/light */ "./src/item/light.ts");
var PlayerDirection;
(function (PlayerDirection) {
    PlayerDirection[PlayerDirection["DOWN"] = 0] = "DOWN";
    PlayerDirection[PlayerDirection["UP"] = 1] = "UP";
    PlayerDirection[PlayerDirection["RIGHT"] = 2] = "RIGHT";
    PlayerDirection[PlayerDirection["LEFT"] = 3] = "LEFT";
})(PlayerDirection = exports.PlayerDirection || (exports.PlayerDirection = {}));
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player(game, x, y, isLocalPlayer) {
        var _this = _super.call(this) || this;
        _this.inputHandler = function (input) {
            switch (input) {
                case input_1.InputEnum.I:
                    _this.iListener();
                    break;
                case input_1.InputEnum.Q:
                    _this.qListener();
                    break;
                case input_1.InputEnum.LEFT:
                    if (!_this.ignoreDirectionInput())
                        _this.leftListener(false);
                    break;
                case input_1.InputEnum.RIGHT:
                    if (!_this.ignoreDirectionInput())
                        _this.rightListener(false);
                    break;
                case input_1.InputEnum.UP:
                    if (!_this.ignoreDirectionInput())
                        _this.upListener(false);
                    break;
                case input_1.InputEnum.DOWN:
                    if (!_this.ignoreDirectionInput())
                        _this.downListener(false);
                    break;
                case input_1.InputEnum.SPACE:
                    _this.spaceListener();
                    break;
                case input_1.InputEnum.COMMA:
                    _this.commaListener();
                    break;
                case input_1.InputEnum.PERIOD:
                    _this.periodListener();
                    break;
                case input_1.InputEnum.LEFT_CLICK:
                    _this.mouseLeftClick();
                    break;
                case input_1.InputEnum.RIGHT_CLICK:
                    _this.mouseRightClick();
                    break;
                case input_1.InputEnum.MOUSE_MOVE:
                    _this.mouseMove();
                    break;
            }
        };
        _this.commaListener = function () {
            _this.inventory.left();
        };
        _this.periodListener = function () {
            _this.inventory.right();
        };
        _this.tapListener = function () {
            _this.inventory.open();
        };
        _this.iListener = function () {
            _this.inventory.open();
        };
        _this.qListener = function () {
            if (_this.inventory.isOpen) {
                _this.inventory.drop();
            }
        };
        _this.ignoreDirectionInput = function () {
            return (!_this.inventory.isOpen &&
                (_this.dead || _this.game.levelState !== game_1.LevelState.IN_LEVEL));
        };
        _this.leftListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.left();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.left();
                return true;
            }
            return false;
        };
        _this.rightListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.right();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.right();
                return true;
            }
            return false;
        };
        _this.upListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.up();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.up();
                return true;
            }
            return false;
        };
        _this.downListener = function (isLocal) {
            if (_this.inventory.isOpen) {
                _this.inventory.down();
                return true;
            }
            if (!_this.dead &&
                (!isLocal || _this.game.levelState === game_1.LevelState.IN_LEVEL)) {
                _this.down();
                return true;
            }
            return false;
        };
        _this.spaceListener = function () {
            if (_this.dead) {
                _this.restart();
            }
            else if (_this.openVendingMachine) {
                _this.openVendingMachine.space();
            }
            else if (_this.inventory.isOpen ||
                _this.game.levelState === game_1.LevelState.IN_LEVEL) {
                _this.inventory.space();
                return;
            }
        };
        _this.mouseLeftClick = function () {
            if (_this.dead) {
                _this.restart();
            }
            else {
                _this.inventory.mouseLeftClick();
            }
            if (!_this.inventory.isOpen &&
                !_this.inventory.isPointInInventoryButton(mouseCursor_1.MouseCursor.getInstance().getPosition().x, mouseCursor_1.MouseCursor.getInstance().getPosition().y) &&
                !_this.inventory.isPointInQuickbarBounds(mouseCursor_1.MouseCursor.getInstance().getPosition().x, mouseCursor_1.MouseCursor.getInstance().getPosition().y).inBounds) {
                _this.moveWithMouse();
            }
            else if (_this.inventory.isPointInInventoryButton(mouseCursor_1.MouseCursor.getInstance().getPosition().x, mouseCursor_1.MouseCursor.getInstance().getPosition().y)) {
                _this.inventory.open();
            }
        };
        _this.mouseRightClick = function () {
            _this.inventory.mouseRightClick();
        };
        _this.mouseMove = function () {
            _this.inventory.mouseMove();
            //this.faceMouse();
            _this.setTileCursorPosition();
        };
        _this.moveWithMouse = function () {
            /*
            this.faceMouse();
            if (this.moveRangeCheck(this.mouseToTile().x, this.mouseToTile().y)) {
              this.tryMove(this.mouseToTile().x, this.mouseToTile().y);
            }
            */
        };
        _this.mouseToTile = function () {
            // Get screen center coordinates
            var screenCenterX = gameConstants_1.GameConstants.WIDTH / 2;
            var screenCenterY = gameConstants_1.GameConstants.HEIGHT / 2;
            // Convert pixel offset to tile offset (this part was working correctly)
            var tileOffsetX = Math.floor((input_1.Input.mouseX - screenCenterX + gameConstants_1.GameConstants.TILESIZE / 2) /
                gameConstants_1.GameConstants.TILESIZE);
            var tileOffsetY = Math.floor((input_1.Input.mouseY - screenCenterY + gameConstants_1.GameConstants.TILESIZE / 2) /
                gameConstants_1.GameConstants.TILESIZE);
            return {
                x: _this.x + tileOffsetX,
                y: _this.y + tileOffsetY,
            };
        };
        _this.moveRangeCheck = function (x, y) {
            var dx = Math.abs(_this.x - x);
            var dy = Math.abs(_this.y - y);
            return dx <= _this.moveRange && dy <= _this.moveRange && dx + dy !== 0;
        };
        _this.setTileCursorPosition = function () {
            _this.tileCursor = {
                x: Math.floor(input_1.Input.mouseX / gameConstants_1.GameConstants.TILESIZE),
                y: Math.floor(input_1.Input.mouseY / gameConstants_1.GameConstants.TILESIZE),
            };
        };
        _this.restart = function () {
            _this.dead = false;
            _this.game.newGame();
        };
        _this.left = function () {
            if (_this.canMove()) {
                _this.tryMove(_this.x - 1, _this.y);
                _this.direction = PlayerDirection.LEFT;
            }
        };
        _this.right = function () {
            if (_this.canMove()) {
                _this.tryMove(_this.x + 1, _this.y);
                _this.direction = PlayerDirection.RIGHT;
            }
        };
        _this.up = function () {
            if (_this.canMove()) {
                _this.tryMove(_this.x, _this.y - 1);
                _this.direction = PlayerDirection.UP;
            }
        };
        _this.down = function () {
            if (_this.canMove()) {
                _this.tryMove(_this.x, _this.y + 1);
                _this.direction = PlayerDirection.DOWN;
            }
        };
        _this.hit = function () {
            return 1;
        };
        _this.tryCollide = function (other, newX, newY) {
            if (newX >= other.x + other.w || newX + _this.w <= other.x)
                return false;
            if (newY >= other.y + other.h || newY + _this.h <= other.y)
                return false;
            return true;
        };
        _this.tryMove = function (x, y) {
            var newMove = { x: x, y: y };
            // TODO don't move if hit by enemy
            _this.game.rooms[_this.levelID].catchUp();
            /*
            if (!this.triedMove) {
              if (this.wouldHurt(x, y)) {
                this.drawY = 0.2 * (this.x - x);
                this.drawX = 0.2 * (this.y - y);
                this.game.pushMessage("Moving there would hurt you, are you sure?");
                this.triedMove = true;
                return;
              }
              this.triedMove = false;
            }
              */
            if (_this.dead)
                return;
            for (var i = 0; i < 2; i++)
                if (_this.inventory.hasWeapon() &&
                    !_this.inventory.getWeapon().weaponMove(x, y)) {
                    //for (let h of this.game.levels[this.levelID].hitwarnings) {
                    //if (newMove instanceof HitWarning)
                    return;
                    //}
                }
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (_this.tryCollide(e, x, y)) {
                    if (e.pushable) {
                        // pushing a crate or barrel
                        var dx = x - _this.x;
                        var dy = y - _this.y;
                        var nextX = x + dx;
                        var nextY = y + dy;
                        var foundEnd = false; // end of the train of whatever we're pushing
                        var enemyEnd = false; // end of the train is a solid enemy (i.e. potted plant)
                        var pushedEnemies = [];
                        while (true) {
                            foundEnd = true;
                            for (var _b = 0, _c = _this.game.rooms[_this.levelID].entities; _b < _c.length; _b++) {
                                var f = _c[_b];
                                if (f.pointIn(nextX, nextY)) {
                                    if (!f.chainPushable) {
                                        enemyEnd = true;
                                        foundEnd = true;
                                        break;
                                    }
                                    foundEnd = false;
                                    pushedEnemies.push(f);
                                    break;
                                }
                            }
                            if (foundEnd)
                                break;
                            nextX += dx * pushedEnemies[pushedEnemies.length - 1].w;
                            nextY += dy * pushedEnemies[pushedEnemies.length - 1].h;
                        }
                        /* if no enemies and there is a wall, no move
                        otherwise, push everything, killing last enemy if there is a wall */
                        // here, (nextX, nextY) is the position immediately after the end of the train
                        if (pushedEnemies.length === 0 &&
                            (_this.game.rooms[_this.levelID].roomArray[nextX][nextY].canCrushEnemy() ||
                                enemyEnd)) {
                            if (e.destroyable) {
                                e.kill();
                                if (_this.game.rooms[_this.levelID] === _this.game.room)
                                    sound_1.Sound.hit();
                                _this.drawX = 0.5 * (_this.x - e.x);
                                _this.drawY = 0.5 * (_this.y - e.y);
                                _this.game.rooms[_this.levelID].particles.push(new slashParticle_1.SlashParticle(e.x, e.y));
                                _this.game.rooms[_this.levelID].tick(_this);
                                _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                return;
                            }
                        }
                        else {
                            if (_this.game.rooms[_this.levelID] === _this.game.room)
                                sound_1.Sound.push();
                            // here pushedEnemies may still be []
                            for (var _d = 0, pushedEnemies_1 = pushedEnemies; _d < pushedEnemies_1.length; _d++) {
                                var f = pushedEnemies_1[_d];
                                f.x += dx;
                                f.y += dy;
                                f.drawX = dx;
                                f.drawY = dy;
                                f.skipNextTurns = 1; // skip next turn, so they don't move while we're pushing them
                            }
                            if (_this.game.rooms[_this.levelID].roomArray[nextX][nextY].canCrushEnemy() ||
                                enemyEnd) {
                                pushedEnemies[pushedEnemies.length - 1].crush();
                                if (_this.game.rooms[_this.levelID] === _this.game.room)
                                    sound_1.Sound.hit();
                            }
                            e.x += dx;
                            e.y += dy;
                            e.drawX = dx;
                            e.drawY = dy;
                            _this.move(x, y);
                            _this.game.rooms[_this.levelID].tick(_this);
                            return;
                        }
                    }
                    else {
                        // if we're trying to hit an enemy, check if it's destroyable
                        if (!e.dead) {
                            if (e.interactable)
                                e.interact(_this);
                            //this.actionTab.actionState = ActionState.ATTACK;
                            //sets the action tab state to Attack
                            return;
                        }
                    }
                }
            }
            var other = _this.game.rooms[_this.levelID].roomArray[x][y];
            if (!other.isSolid()) {
                _this.move(x, y);
                other.onCollide(_this);
                if (!(other instanceof door_1.Door || other instanceof trapdoor_1.Trapdoor))
                    _this.game.rooms[_this.levelID].tick(_this);
            }
            else {
                if (other instanceof door_1.Door) {
                    _this.drawX = (_this.x - x) * 0.5;
                    _this.drawY = (_this.y - y) * 0.5;
                    if (other.canUnlock(_this))
                        other.unlock(_this);
                }
            }
        };
        //get cancelHoldMove = () => {};
        _this.wouldHurt = function (x, y) {
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].hitwarnings; _i < _a.length; _i++) {
                var h = _a[_i];
                if (h instanceof hitWarning_1.HitWarning && h.x == x && h.y == y)
                    return true;
                else {
                    return false;
                }
            }
        };
        _this.hurt = function (damage, enemy) {
            if (_this.game.rooms[_this.levelID] === _this.game.room)
                sound_1.Sound.hurt();
            if (_this.inventory.getArmor() && _this.inventory.getArmor().health > 0) {
                _this.inventory.getArmor().hurt(damage);
            }
            else {
                _this.lastHitBy = enemy;
                //console.log("Last Hit by: ", enemy);
                _this.healthBar.hurt();
                _this.flashing = true;
                _this.health -= damage;
                if (_this.health <= 0) {
                    _this.dead = true;
                }
                /*
                if (this.health <= 0) {
                  this.health = 0;
                  
                  if (!this.game.tutorialActive) {
                    this.dead = true;
                  } else {
                    this.health = 2;
                    this.game.pushMessage("You are dead, but you can try again!");
                  }
                  */
            }
        };
        _this.dashMove = function (x, y) {
            _this.x = x;
            _this.y = y;
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.x === x && i.y === y) {
                    i.onPickup(_this);
                }
            }
            _this.game.rooms[_this.levelID].updateLighting();
        };
        _this.doneMoving = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.drawX) < EPSILON && Math.abs(_this.drawY) < EPSILON;
        };
        _this.move = function (x, y) {
            //this.actionTab.setState(ActionState.MOVE);
            if (_this.game.rooms[_this.levelID] === _this.game.room)
                sound_1.Sound.playerStoneFootstep();
            if (_this.openVendingMachine)
                _this.openVendingMachine.close();
            _this.drawX = x - _this.x;
            _this.drawY = y - _this.y;
            _this.x = x;
            _this.y = y;
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.x === x && i.y === y) {
                    i.onPickup(_this);
                }
            }
            _this.game.rooms[_this.levelID].updateLighting();
        };
        _this.moveNoSmooth = function (x, y) {
            // doesn't touch smoothing
            _this.x = x;
            _this.y = y;
        };
        _this.moveSnap = function (x, y) {
            // no smoothing
            _this.x = x;
            _this.y = y;
            _this.drawX = 0;
            _this.drawY = 0;
        };
        _this.update = function () { };
        _this.finishTick = function () {
            _this.turnCount += 1;
            _this.inventory.tick();
            _this.flashing = false;
            var totalHealthDiff = _this.health - _this.lastTickHealth;
            _this.lastTickHealth = _this.health; // update last tick health
            if (totalHealthDiff < 0) {
                _this.flashing = true;
            }
            //this.actionTab.actionState = ActionState.READY;
            //Sets the action tab state to Wait (during enemy turn)
        };
        _this.drawPlayerSprite = function (delta) {
            _this.frame += 0.1 * delta;
            if (_this.frame >= 4)
                _this.frame = 0;
            game_1.Game.drawMob(1 + Math.floor(_this.frame), 8 + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - 1.45 - _this.drawY - _this.jumpY, 1, 2);
            if (_this.inventory.getArmor() && _this.inventory.getArmor().health > 0) {
                // TODO draw armor
            }
        };
        _this.draw = function (delta) {
            _this.drawableY = _this.y;
            _this.flashingFrame += (delta * 12) / gameConstants_1.GameConstants.FPS;
            if (!_this.dead) {
                game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1);
                if (!_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0) {
                    _this.drawPlayerSprite(delta);
                }
            }
        };
        _this.faceMouse = function () {
            var mousePosition = mouseCursor_1.MouseCursor.getInstance().getPosition();
            var playerPixelPosition = {
                x: gameConstants_1.GameConstants.WIDTH / 2,
                y: gameConstants_1.GameConstants.HEIGHT / 2,
            };
            var dx = mousePosition.x - playerPixelPosition.x;
            var dy = mousePosition.y - playerPixelPosition.y;
            var angle = Math.atan2(dy, dx);
            // Convert angle to direction
            // atan2 returns angle in radians (-π to π)
            // Divide the circle into 4 sectors for the 4 directions
            if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
                _this.direction = PlayerDirection.RIGHT;
            }
            else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
                _this.direction = PlayerDirection.DOWN;
            }
            else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
                _this.direction = PlayerDirection.UP;
            }
            else {
                _this.direction = PlayerDirection.LEFT;
            }
        };
        _this.heartbeat = function () {
            _this.guiHeartFrame = 1;
        };
        _this.tapHoldHandler = function () {
            _this.mapToggled = !_this.mapToggled;
        };
        _this.drawTopLayer = function (delta) {
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x - _this.drawX, _this.y - _this.drawY, !_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0);
        };
        _this.drawGUI = function (delta, transitioning) {
            if (transitioning === void 0) { transitioning = false; }
            if (!_this.dead) {
                if (!transitioning)
                    _this.inventory.draw(delta);
                //this.actionTab.draw(delta);
                if (_this.guiHeartFrame > 0)
                    _this.guiHeartFrame += delta;
                if (_this.guiHeartFrame > 5) {
                    _this.guiHeartFrame = 0;
                }
                for (var i = 0; i < _this.maxHealth; i++) {
                    var frame = _this.guiHeartFrame > 0 ? 1 : 0;
                    if (i >= Math.floor(_this.health)) {
                        if (i == Math.floor(_this.health) && (_this.health * 2) % 2 == 1) {
                            // draw half heart
                            game_1.Game.drawFX(4, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                        }
                        else {
                            game_1.Game.drawFX(3, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                        }
                    }
                    else
                        game_1.Game.drawFX(frame, 2, 1, 1, i, levelConstants_1.LevelConstants.SCREEN_H - 1, 1, 1);
                }
                if (_this.inventory.getArmor())
                    _this.inventory.getArmor().drawGUI(delta, _this.maxHealth);
            }
            else {
                game_1.Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
                var gameOverString = "Game Over";
                if (_this.lastHitBy !== "enemy") {
                    gameOverString = "You were slain by ".concat(_this.lastHitBy, ".");
                }
                game_1.Game.fillText(gameOverString, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.measureText(gameOverString).width / 2, gameConstants_1.GameConstants.HEIGHT / 2 - game_1.Game.letter_height + 2);
                var restartButton = "Press space or click to restart";
                game_1.Game.fillText(restartButton, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.measureText(restartButton).width / 2, gameConstants_1.GameConstants.HEIGHT / 2 + game_1.Game.letter_height + 5);
            }
            postProcess_1.PostProcessor.draw(delta);
            light_1.Light.drawTint(delta);
            if (_this.mapToggled === true)
                _this.map.draw(delta);
            //this.drawTileCursor(delta);
            _this.drawInventoryButton(delta);
        };
        _this.updateDrawXY = function (delta) {
            if (!_this.doneMoving()) {
                _this.drawX += -0.3 * _this.drawX * delta;
                _this.drawY += -0.3 * _this.drawY * delta;
                _this.jump();
            }
        };
        _this.jump = function () {
            var j = Math.max(Math.abs(_this.drawX), Math.abs(_this.drawY));
            _this.jumpY = Math.sin(j * Math.PI) * 0.3;
        };
        _this.drawInventoryButton = function (delta) {
            game_1.Game.drawFX(0, 0, 2, 2, levelConstants_1.LevelConstants.SCREEN_W - 2, 0, 2, 2);
        };
        _this.drawTileCursor = function (delta) {
            var inRange = _this.moveRangeCheck(_this.mouseToTile().x, _this.mouseToTile().y);
            var tileX = inRange ? 22 : 24;
            game_1.Game.drawFX(tileX + Math.floor(hitWarning_1.HitWarning.frame), 4, 1, 2, _this.tileCursor.x, 
            //round to lower odd number
            _this.tileCursor.y - 1, 1, 2);
        };
        _this.game = game;
        _this.levelID = 0;
        _this.x = x;
        _this.y = y;
        _this.w = 1;
        _this.h = 1;
        _this.drawX = 0;
        _this.drawY = 0;
        _this.jumpY = 0;
        _this.frame = 0;
        _this.direction = PlayerDirection.UP;
        _this.isLocalPlayer = isLocalPlayer;
        if (isLocalPlayer) {
            input_1.Input.leftSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.LEFT); };
            input_1.Input.rightSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.RIGHT); };
            input_1.Input.upSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.UP); };
            input_1.Input.downSwipeListener = function () { return _this.inputHandler(input_1.InputEnum.DOWN); };
            input_1.Input.commaListener = function () { return _this.inputHandler(input_1.InputEnum.COMMA); };
            input_1.Input.periodListener = function () { return _this.inputHandler(input_1.InputEnum.PERIOD); };
            input_1.Input.tapListener = function () {
                /*
                if (this.inventory.isOpen) {
                  if (this.inventory.pointInside(Input.mouseX, Input.mouseY)) {
                    this.inputHandler(InputEnum.SPACE);
                  } else {
                    this.inputHandler(InputEnum.I);
                  }
                } else this.inputHandler(InputEnum.I);
                 */
            };
            input_1.Input.mouseMoveListener = function () { return _this.inputHandler(input_1.InputEnum.MOUSE_MOVE); };
            input_1.Input.mouseLeftClickListeners.push(function () {
                return _this.inputHandler(input_1.InputEnum.LEFT_CLICK);
            });
            input_1.Input.mouseRightClickListeners.push(function () {
                return _this.inputHandler(input_1.InputEnum.RIGHT_CLICK);
            });
        }
        _this.mapToggled = true;
        _this.health = 3;
        _this.maxHealth = 3;
        _this.healthBar = new healthbar_1.HealthBar();
        _this.dead = false;
        _this.flashing = false;
        _this.flashingFrame = 0;
        _this.lastTickHealth = _this.health;
        _this.guiHeartFrame = 0;
        _this.inventory = new inventory_1.Inventory(game, _this);
        _this.defaultSightRadius = 3;
        _this.sightRadius = _this.defaultSightRadius;
        _this.map = new map_1.Map(_this.game, _this);
        //this.actionTab = new ActionTab(this.inventory, this.game);
        _this.turnCount = 0;
        _this.triedMove = false;
        _this.tutorialRoom = false;
        _this.lastMoveTime = 0;
        _this.moveCooldown = 100; // Cooldown in milliseconds (adjust as needed)
        _this.tileCursor = { x: 0, y: 0 };
        _this.moveRange = 1;
        _this.lightEquipped = false;
        return _this;
    }
    Player.prototype.canMove = function () {
        var currentTime = Date.now();
        if (currentTime - this.lastMoveTime >= gameConstants_1.GameConstants.MOVEMENT_COOLDOWN) {
            this.lastMoveTime = currentTime;
            return true;
        }
        return false;
    };
    Player.minSightRadius = 2; //hard minimum sight radius that ignores depth
    return Player;
}(drawable_1.Drawable));
exports.Player = Player;


/***/ }),

/***/ "./src/postProcess.ts":
/*!****************************!*\
  !*** ./src/postProcess.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PostProcessor = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var PostProcessor = /** @class */ (function () {
    function PostProcessor() {
    }
    PostProcessor.draw = function (delta) {
        game_1.Game.ctx.globalAlpha = 0.2;
        game_1.Game.ctx.globalCompositeOperation = "screen";
        game_1.Game.ctx.fillStyle = "#006A6E"; //dark teal
        //Game.ctx.fillStyle = "#003B6F"; //deep underwater blue
        //Game.ctx.fillStyle = "#2F2F2F"; //smoky fog prison
        //Game.ctx.fillStyle = "#4a6c4b"; //darker muddy green
        //Game.ctx.fillStyle = "#800000"; // lighter red for dungeon hell theme
        game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
        game_1.Game.ctx.globalCompositeOperation = "source-over";
    };
    return PostProcessor;
}());
exports.PostProcessor = PostProcessor;


/***/ }),

/***/ "./src/projectile/enemySpawnAnimation.ts":
/*!***********************************************!*\
  !*** ./src/projectile/enemySpawnAnimation.ts ***!
  \***********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EnemySpawnAnimation = void 0;
var projectile_1 = __webpack_require__(/*! ./projectile */ "./src/projectile/projectile.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var EnemySpawnAnimation = /** @class */ (function (_super) {
    __extends(EnemySpawnAnimation, _super);
    function EnemySpawnAnimation(room, enemy, x, y) {
        var _this = _super.call(this, enemy, x, y) || this;
        _this.ANIM_COUNT = 3;
        _this.tick = function () {
            if (_this.room === _this.room.game.room)
                sound_1.Sound.enemySpawn();
            var hitPlayer = false;
            for (var i in _this.room.game.players) {
                if (_this.room.game.players[i].x === _this.x &&
                    _this.room.game.players[i].y === _this.y) {
                    _this.room.game.players[i].hurt(0.5, "reaper");
                    hitPlayer = true;
                }
            }
            if (!hitPlayer) {
                _this.dead = true;
                _this.enemy.skipNextTurns = 1;
                _this.room.entities.push(_this.enemy);
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, "#ffffff");
                genericParticle_1.GenericParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, "#ffffff");
            }
            else {
                _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.room.game, _this.x, _this.y, _this.x, _this.y));
            }
        };
        _this.drawTopLayer = function (delta) {
            if (_this.dead)
                return;
            _this.frame += 0.25 * delta;
            if (_this.frame >= 8)
                _this.frame = 0;
            for (var i = 0; i < _this.ANIM_COUNT; i++) {
                var offsetX = 0;
                game_1.Game.drawFX(Math.floor(_this.frame), 27, 1, 1, _this.x + Math.round(offsetX) / 16.0, _this.y - 0.5, 1, 1);
            }
            if (Math.floor(_this.frame * 4) % 2 == 0)
                _this.room.particles.push(new genericParticle_1.GenericParticle(_this.room, _this.x + 0.5 + Math.random() * 0.05 - 0.025, _this.y + Math.random() * 0.05 - 0.025, 0.25, Math.random() * 0.5, 0.025 * (Math.random() * 1 - 0.5), 0.025 * (Math.random() * 1 - 0.5), 0.2 * (Math.random() - 1), "#ffffff", 0));
        };
        _this.room = room;
        _this.enemy = enemy;
        _this.frame = 0;
        return _this;
    }
    return EnemySpawnAnimation;
}(projectile_1.Projectile));
exports.EnemySpawnAnimation = EnemySpawnAnimation;


/***/ }),

/***/ "./src/projectile/playerFireball.ts":
/*!******************************************!*\
  !*** ./src/projectile/playerFireball.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PlayerFireball = void 0;
var projectile_1 = __webpack_require__(/*! ./projectile */ "./src/projectile/projectile.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var PlayerFireball = /** @class */ (function (_super) {
    __extends(PlayerFireball, _super);
    function PlayerFireball(parent, x, y) {
        var _this = _super.call(this, parent, x, y) || this;
        _this.drawTopLayer = function (delta) {
            if (_this.dead)
                return;
            _this.frame += 0.25 * delta;
            if (_this.frame > 17)
                _this.dead = true;
            game_1.Game.drawFX(Math.floor(_this.frame), 6, 1, 2, _this.x, _this.y - 1, 1, 2);
        };
        _this.state = 0;
        _this.frame = 6;
        return _this;
    }
    return PlayerFireball;
}(projectile_1.Projectile));
exports.PlayerFireball = PlayerFireball;


/***/ }),

/***/ "./src/projectile/projectile.ts":
/*!**************************************!*\
  !*** ./src/projectile/projectile.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Projectile = void 0;
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var Projectile = /** @class */ (function (_super) {
    __extends(Projectile, _super);
    function Projectile(parent, x, y) {
        var _this = _super.call(this) || this;
        _this.hitPlayer = function (player) { };
        _this.hitEnemy = function (enemy) { };
        _this.tick = function () { };
        _this.draw = function (delta) { };
        _this.drawTopLayer = function (delta) { };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.parent = parent;
        _this.drawableY = y;
        return _this;
    }
    Object.defineProperty(Projectile.prototype, "distanceToParent", {
        get: function () {
            return Math.abs(this.x - this.parent.x) + Math.abs(this.y - this.parent.y);
        },
        enumerable: false,
        configurable: true
    });
    return Projectile;
}(drawable_1.Drawable));
exports.Projectile = Projectile;


/***/ }),

/***/ "./src/projectile/wizardBomb.ts":
/*!**************************************!*\
  !*** ./src/projectile/wizardBomb.ts ***!
  \**************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WizardBomb = void 0;
var projectile_1 = __webpack_require__(/*! ./projectile */ "./src/projectile/projectile.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var WizardBomb = /** @class */ (function (_super) {
    __extends(WizardBomb, _super);
    function WizardBomb(parent, x, y) {
        var _this = _super.call(this, parent, x, y) || this;
        _this.setMarkerFrame = function () {
            // Calculate offsetX based on direction
            _this.offsetX = Math.floor(((_this.dir + 1) % 8) / 2);
        };
        _this.tick = function () {
            if (_this.parent.dead || _this.state === 3) {
                _this.dead = true;
            }
            if (!_this.dead && _this.state === 0) {
            }
            _this.state++;
            if (!_this.dead && _this.state === 1) {
                _this.parent.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.parent.game, _this.x, _this.y, _this.parent.x, _this.parent.y, true));
            }
            if (!_this.dead && _this.state === 2) {
                _this.frame = 0;
                _this.delay = game_1.Game.rand(0, 10, Math.random);
            }
        };
        _this.hitPlayer = function (player) {
            if (!_this.dead && _this.state === 2) {
                player.hurt(1, _this.parent.name);
            }
        };
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            /*Game.drawFX(
              18 + this.offsetX, //+ Math.floor(HitWarning.frame),
              4,
              1,
              1,
              this.x,
              this.y,
              1,
              1
            );*/
            if (_this.state >= 0) {
                if (_this.state === 0) {
                    _this.frame += 0.25 * delta;
                    if (_this.frame >= 4)
                        _this.frame = 0;
                    game_1.Game.drawFX(22 + Math.floor(_this.frame), 8, 1, 1, _this.x, _this.y, 1, 1);
                }
                else if (_this.state === 1) {
                    _this.frame += 0.25 * delta;
                    if (_this.frame >= 4)
                        _this.frame = 0;
                    game_1.Game.drawFX(18 + Math.floor(_this.frame), 8, 1, 1, _this.x, _this.y - 0.2, 1, 1);
                }
                else {
                    if (_this.delay > 0) {
                        _this.delay--;
                        return;
                    }
                    _this.frame += 0.3 * delta;
                    if (_this.frame > 17)
                        _this.dead = true;
                    game_1.Game.drawFX(Math.floor(_this.frame), 6, 1, 2, _this.x, _this.y - 1, 1, 2);
                }
            }
        };
        _this.parent = parent;
        _this.frame = 0;
        _this.state = 0; //- this.distanceToParent;
        return _this;
    }
    return WizardBomb;
}(projectile_1.Projectile));
exports.WizardBomb = WizardBomb;


/***/ }),

/***/ "./src/projectile/wizardFireball.ts":
/*!******************************************!*\
  !*** ./src/projectile/wizardFireball.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WizardFireball = void 0;
var projectile_1 = __webpack_require__(/*! ./projectile */ "./src/projectile/projectile.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var lightSource_1 = __webpack_require__(/*! ../lightSource */ "./src/lightSource.ts");
var WizardFireball = /** @class */ (function (_super) {
    __extends(WizardFireball, _super);
    function WizardFireball(parent, x, y) {
        var _this = _super.call(this, parent, x, y) || this;
        _this.setMarkerFrame = function () {
            // Calculate offsetX based on direction
            _this.offsetX = Math.floor(((_this.dir + 1) % 8) / 2);
        };
        _this.tick = function () {
            if (_this.parent.dead || _this.state === 3) {
                _this.parent.removeLightSource(_this.lightSource);
                _this.dead = true;
            }
            if (!_this.dead && _this.state === 0) {
            }
            _this.state++;
            if (!_this.dead && _this.state === 1) {
                _this.parent.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.parent.game, _this.x, _this.y, _this.parent.x, _this.parent.y, true));
            }
            if (!_this.dead && _this.state === 2) {
                _this.parent.removeLightSource(_this.lightSource);
                _this.frame = 0;
                _this.delay = game_1.Game.rand(0, 10, Math.random);
            }
        };
        _this.hitPlayer = function (player) {
            if (!_this.dead && _this.state === 2) {
                player.hurt(1, _this.parent.name);
            }
        };
        _this.draw = function (delta) {
            if (_this.dead)
                return;
            /*Game.drawFX(
              18 + this.offsetX, //+ Math.floor(HitWarning.frame),
              4,
              1,
              1,
              this.x,
              this.y,
              1,
              1
            );*/
            if (_this.state >= 0) {
                if (_this.state === 0) {
                    _this.frame += 0.25 * delta;
                    if (_this.frame >= 4)
                        _this.frame = 0;
                    game_1.Game.drawFX(22 + Math.floor(_this.frame), 7, 1, 1, _this.x, _this.y, 1, 1);
                }
                else if (_this.state === 1) {
                    _this.frame += 0.25 * delta;
                    if (_this.frame >= 4)
                        _this.frame = 0;
                    game_1.Game.drawFX(18 + Math.floor(_this.frame), 7, 1, 1, _this.x, _this.y - 0.2, 1, 1);
                }
                else {
                    if (_this.delay > 0) {
                        _this.delay--;
                        return;
                    }
                    _this.frame += 0.3 * delta;
                    if (_this.frame > 17)
                        _this.dead = true;
                    game_1.Game.drawFX(Math.floor(_this.frame), 6, 1, 2, _this.x, _this.y - 1, 1, 2);
                }
            }
        };
        _this.parent = parent;
        _this.frame = 0;
        _this.state = 0; //- this.distanceToParent;
        _this.lightSource = new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 0.5, [0, 50, 150], 0.25);
        _this.parent.addLightSource(_this.lightSource);
        return _this;
    }
    return WizardFireball;
}(projectile_1.Projectile));
exports.WizardFireball = WizardFireball;


/***/ }),

/***/ "./src/random.ts":
/*!***********************!*\
  !*** ./src/random.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Random = void 0;
var Random = /** @class */ (function () {
    function Random() {
    }
    Random.setState = function (state) {
        Random.state = state;
    };
    Random.rand = function () {
        Random.state ^= (Random.state << 21);
        Random.state ^= (Random.state >>> 35);
        Random.state ^= (Random.state << 4);
        return (Random.state >>> 0) / 4294967296;
    };
    return Random;
}());
exports.Random = Random;
// copy and paste into browser console
// let state;
// let rand = () => { state ^= (state << 21); state ^= (state >>> 35); state ^= (state << 4); return (state >>> 0) / 4294967296; }


/***/ }),

/***/ "./src/room.ts":
/*!*********************!*\
  !*** ./src/room.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Room = exports.TurnState = exports.RoomType = void 0;
var wall_1 = __webpack_require__(/*! ./tile/wall */ "./src/tile/wall.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var floor_1 = __webpack_require__(/*! ./tile/floor */ "./src/tile/floor.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var door_1 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
var tile_1 = __webpack_require__(/*! ./tile/tile */ "./src/tile/tile.ts");
var knightEnemy_1 = __webpack_require__(/*! ./entity/enemy/knightEnemy */ "./src/entity/enemy/knightEnemy.ts");
var entity_1 = __webpack_require__(/*! ./entity/entity */ "./src/entity/entity.ts");
var chest_1 = __webpack_require__(/*! ./entity/object/chest */ "./src/entity/object/chest.ts");
var goldenKey_1 = __webpack_require__(/*! ./item/goldenKey */ "./src/item/goldenKey.ts");
var spawnfloor_1 = __webpack_require__(/*! ./tile/spawnfloor */ "./src/tile/spawnfloor.ts");
//import { GoldenDoor } from "./tile/goldenDoor";
var spike_1 = __webpack_require__(/*! ./tile/spike */ "./src/tile/spike.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./entity/enemy/wizardEnemy */ "./src/entity/enemy/wizardEnemy.ts");
var skullEnemy_1 = __webpack_require__(/*! ./entity/enemy/skullEnemy */ "./src/entity/enemy/skullEnemy.ts");
var barrel_1 = __webpack_require__(/*! ./entity/object/barrel */ "./src/entity/object/barrel.ts");
var crate_1 = __webpack_require__(/*! ./entity/object/crate */ "./src/entity/object/crate.ts");
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var spiketrap_1 = __webpack_require__(/*! ./tile/spiketrap */ "./src/tile/spiketrap.ts");
var fountainTile_1 = __webpack_require__(/*! ./tile/fountainTile */ "./src/tile/fountainTile.ts");
var coffinTile_1 = __webpack_require__(/*! ./tile/coffinTile */ "./src/tile/coffinTile.ts");
var pottedPlant_1 = __webpack_require__(/*! ./entity/object/pottedPlant */ "./src/entity/object/pottedPlant.ts");
var insideLevelDoor_1 = __webpack_require__(/*! ./tile/insideLevelDoor */ "./src/tile/insideLevelDoor.ts");
var button_1 = __webpack_require__(/*! ./tile/button */ "./src/tile/button.ts");
var hitWarning_1 = __webpack_require__(/*! ./hitWarning */ "./src/hitWarning.ts");
var upLadder_1 = __webpack_require__(/*! ./tile/upLadder */ "./src/tile/upLadder.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
var coalResource_1 = __webpack_require__(/*! ./entity/resource/coalResource */ "./src/entity/resource/coalResource.ts");
var goldResource_1 = __webpack_require__(/*! ./entity/resource/goldResource */ "./src/entity/resource/goldResource.ts");
var emeraldResource_1 = __webpack_require__(/*! ./entity/resource/emeraldResource */ "./src/entity/resource/emeraldResource.ts");
var chasm_1 = __webpack_require__(/*! ./tile/chasm */ "./src/tile/chasm.ts");
var spawner_1 = __webpack_require__(/*! ./entity/enemy/spawner */ "./src/entity/enemy/spawner.ts");
var vendingMachine_1 = __webpack_require__(/*! ./entity/object/vendingMachine */ "./src/entity/object/vendingMachine.ts");
var wallTorch_1 = __webpack_require__(/*! ./tile/wallTorch */ "./src/tile/wallTorch.ts");
var chargeEnemy_1 = __webpack_require__(/*! ./entity/enemy/chargeEnemy */ "./src/entity/enemy/chargeEnemy.ts");
var shotgun_1 = __webpack_require__(/*! ./weapon/shotgun */ "./src/weapon/shotgun.ts");
var heart_1 = __webpack_require__(/*! ./item/heart */ "./src/item/heart.ts");
var spear_1 = __webpack_require__(/*! ./weapon/spear */ "./src/weapon/spear.ts");
var player_1 = __webpack_require__(/*! ./player */ "./src/player.ts");
var crabEnemy_1 = __webpack_require__(/*! ./entity/enemy/crabEnemy */ "./src/entity/enemy/crabEnemy.ts");
var zombieEnemy_1 = __webpack_require__(/*! ./entity/enemy/zombieEnemy */ "./src/entity/enemy/zombieEnemy.ts");
var bigSkullEnemy_1 = __webpack_require__(/*! ./entity/enemy/bigSkullEnemy */ "./src/entity/enemy/bigSkullEnemy.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var lantern_1 = __webpack_require__(/*! ./item/lantern */ "./src/item/lantern.ts");
var dualdagger_1 = __webpack_require__(/*! ./weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var pot_1 = __webpack_require__(/*! ./entity/object/pot */ "./src/entity/object/pot.ts");
var bishopEnemy_1 = __webpack_require__(/*! ./entity/enemy/bishopEnemy */ "./src/entity/enemy/bishopEnemy.ts");
var rockResource_1 = __webpack_require__(/*! ./entity/resource/rockResource */ "./src/entity/resource/rockResource.ts");
var mushrooms_1 = __webpack_require__(/*! ./entity/object/mushrooms */ "./src/entity/object/mushrooms.ts");
var armoredzombieEnemy_1 = __webpack_require__(/*! ./entity/enemy/armoredzombieEnemy */ "./src/entity/enemy/armoredzombieEnemy.ts");
var door_2 = __webpack_require__(/*! ./tile/door */ "./src/tile/door.ts");
//import { ActionState, ActionTab } from "./actionTab";
var tombStone_1 = __webpack_require__(/*! ./entity/object/tombStone */ "./src/entity/object/tombStone.ts");
var queenEnemy_1 = __webpack_require__(/*! ./entity/enemy/queenEnemy */ "./src/entity/enemy/queenEnemy.ts");
var frogEnemy_1 = __webpack_require__(/*! ./entity/enemy/frogEnemy */ "./src/entity/enemy/frogEnemy.ts");
var bigKnightEnemy_1 = __webpack_require__(/*! ./entity/enemy/bigKnightEnemy */ "./src/entity/enemy/bigKnightEnemy.ts");
var sniperEnemy_1 = __webpack_require__(/*! ./entity/enemy/sniperEnemy */ "./src/entity/enemy/sniperEnemy.ts");
var enemy_1 = __webpack_require__(/*! ./entity/enemy/enemy */ "./src/entity/enemy/enemy.ts");
var fireWizard_1 = __webpack_require__(/*! ./entity/enemy/fireWizard */ "./src/entity/enemy/fireWizard.ts");
var RoomType;
(function (RoomType) {
    RoomType[RoomType["START"] = 0] = "START";
    RoomType[RoomType["DUNGEON"] = 1] = "DUNGEON";
    RoomType[RoomType["BOSS"] = 2] = "BOSS";
    RoomType[RoomType["BIGDUNGEON"] = 3] = "BIGDUNGEON";
    RoomType[RoomType["TREASURE"] = 4] = "TREASURE";
    RoomType[RoomType["FOUNTAIN"] = 5] = "FOUNTAIN";
    RoomType[RoomType["COFFIN"] = 6] = "COFFIN";
    RoomType[RoomType["GRASS"] = 7] = "GRASS";
    RoomType[RoomType["PUZZLE"] = 8] = "PUZZLE";
    RoomType[RoomType["KEYROOM"] = 9] = "KEYROOM";
    RoomType[RoomType["CHESSBOARD"] = 10] = "CHESSBOARD";
    RoomType[RoomType["MAZE"] = 11] = "MAZE";
    RoomType[RoomType["CORRIDOR"] = 12] = "CORRIDOR";
    RoomType[RoomType["SPIKECORRIDOR"] = 13] = "SPIKECORRIDOR";
    RoomType[RoomType["UPLADDER"] = 14] = "UPLADDER";
    RoomType[RoomType["DOWNLADDER"] = 15] = "DOWNLADDER";
    RoomType[RoomType["SHOP"] = 16] = "SHOP";
    RoomType[RoomType["BIGCAVE"] = 17] = "BIGCAVE";
    RoomType[RoomType["CAVE"] = 18] = "CAVE";
    RoomType[RoomType["SPAWNER"] = 19] = "SPAWNER";
    RoomType[RoomType["ROPEHOLE"] = 20] = "ROPEHOLE";
    RoomType[RoomType["ROPECAVE"] = 21] = "ROPECAVE";
    RoomType[RoomType["TUTORIAL"] = 22] = "TUTORIAL";
})(RoomType = exports.RoomType || (exports.RoomType = {}));
var TurnState;
(function (TurnState) {
    TurnState[TurnState["playerTurn"] = 0] = "playerTurn";
    TurnState[TurnState["computerTurn"] = 1] = "computerTurn";
})(TurnState = exports.TurnState || (exports.TurnState = {}));
var Room = /** @class */ (function () {
    function Room(game, x, y, w, h, type, depth, mapGroup, rand) {
        if (rand === void 0) { rand = random_1.Random.rand; }
        var _this = this;
        this.shadeColor = "black";
        //actionTab: ActionTab;
        this.wallInfo = new Map();
        this.tileInside = function (tileX, tileY) {
            return _this.pointInside(tileX, tileY, _this.roomX, _this.roomY, _this.width, _this.height);
        };
        this.generateLevelTable = function (rand) {
            var table = [];
            var e;
            for (var i = 0; i <= game_1.Game.rand(2, 5, rand); i++) {
                e = game_1.Game.rand(1, 2, rand);
                table.push(e);
            }
            return table;
        };
        this.createSavePoint = function () {
            //duplicate of the instance of the room exactly with json parsing but no circular references
            var saveRoom = JSON.parse(JSON.stringify(_this));
            _this.game.rooms.push(saveRoom);
            _this.savePoint = saveRoom;
        };
        this.loadSavePoint = function () {
            //load the save point
            var saveRoom = _this.game.rooms.find(function (r) { return r.savePoint; });
            if (saveRoom) {
                _this.game.changeLevel(_this.game.players[0], saveRoom);
            }
        };
        this.populateEmpty = function (rand) {
            _this.addRandomTorches("medium");
        };
        this.populateDungeon = function (rand) {
            //this.addChests(10, rand);
            var factor = game_1.Game.rand(1, 36, rand);
            if (factor < 30)
                _this.addWallBlocks(rand);
            if (factor < 26)
                _this.addFingers(rand);
            if (factor % 4 === 0)
                _this.addChasms(rand);
            _this.addRandomTorches("medium");
            if (factor > 15)
                _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numTotalObstacles = Math.floor(numEmptyTiles * 0.35 * rand());
            var numPlants = Math.ceil(numTotalObstacles * rand());
            var numObstacles = numTotalObstacles - numPlants;
            _this.addPlants(numPlants, rand);
            _this.addObstacles(numObstacles, rand);
            var numEnemies = Math.ceil((numEmptyTiles - numTotalObstacles) *
                Math.min(_this.depth * 0.1 + 0.1, 0.35) //this.depth * 0.01 is starting value
            );
            _this.addEnemies(numEnemies, rand);
            if (factor <= 6)
                _this.addVendingMachine(rand);
        };
        this.populateBoss = function (rand) {
            _this.addRandomTorches("medium");
            _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numTotalObstacles = Math.floor(numEmptyTiles * 0.2);
            var numPlants = Math.floor(numTotalObstacles * rand());
            var numObstacles = numTotalObstacles - numPlants;
            _this.addPlants(numPlants, rand);
            _this.addObstacles(numObstacles, rand);
            var numEnemies = Math.ceil((numEmptyTiles - numTotalObstacles) *
                Math.min(_this.depth * 0.05 + 0.2, 0.5));
            _this.addEnemies(numEnemies, rand);
        };
        this.populateBigDungeon = function (rand) {
            if (game_1.Game.rand(1, 4, rand) === 1)
                _this.addChasms(rand);
            _this.addRandomTorches("medium");
            if (game_1.Game.rand(1, 4, rand) === 1)
                _this.addPlants(game_1.Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
            if (game_1.Game.rand(1, 3, rand) === 1)
                _this.addSpikeTraps(game_1.Game.randTable([3, 5, 7, 8], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numEnemies = Math.ceil(numEmptyTiles *
                (_this.depth * 0.5 + 0.5) *
                game_1.Game.randTable([0.05, 0.05, 0.06, 0.07, 0.1], rand));
            _this.addEnemies(numEnemies, rand);
            if (numEnemies > 0)
                _this.addObstacles(numEnemies / game_1.Game.rand(1, 2, rand), rand);
            else
                _this.addObstacles(game_1.Game.randTable([0, 0, 1, 1, 2, 3, 5], rand), rand);
        };
        this.populateSpawner = function (rand) {
            _this.addRandomTorches("medium");
            _this.entities.push(new spawner_1.Spawner(_this, _this.game, Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2)));
        };
        this.populateKeyRoom = function (rand) {
            _this.addRandomTorches("medium");
            _this.items.push(new goldenKey_1.GoldenKey(_this, Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2)));
        };
        this.populateFountain = function (rand) {
            _this.addRandomTorches("medium");
            var centerX = Math.floor(_this.roomX + _this.width / 2);
            var centerY = Math.floor(_this.roomY + _this.height / 2);
            for (var x = centerX - 1; x <= centerX + 1; x++) {
                for (var y = centerY - 1; y <= centerY + 1; y++) {
                    _this.roomArray[x][y] = new fountainTile_1.FountainTile(_this, x, y, x - (centerX - 1), y - (centerY - 1));
                }
            }
            _this.addPlants(game_1.Game.randTable([0, 0, 1, 2], rand), rand);
        };
        this.placeCoffin = function (x, y) {
            _this.roomArray[x][y] = new coffinTile_1.CoffinTile(_this, x, y, 0);
            _this.roomArray[x][y + 1] = new coffinTile_1.CoffinTile(_this, x, y + 1, 1);
        };
        this.populateCoffin = function (rand) {
            _this.addRandomTorches("medium");
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2 - 2), Math.floor(_this.roomY + _this.height / 2));
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2));
            _this.placeCoffin(Math.floor(_this.roomX + _this.width / 2) + 2, Math.floor(_this.roomY + _this.height / 2));
        };
        this.populatePuzzle = function (rand) {
            var d;
            for (var x_1 = _this.roomX; x_1 < _this.roomX + _this.width; x_1++) {
                var y_1 = _this.roomY + Math.floor(_this.height / 2);
                if (x_1 === _this.roomX + Math.floor(_this.width / 2)) {
                    d = new insideLevelDoor_1.InsideLevelDoor(_this, _this.game, x_1, y_1 + 1);
                    _this.roomArray[x_1][y_1 + 1] = d;
                }
                else {
                    _this.roomArray[x_1][y_1] = new wall_1.Wall(_this, x_1, y_1);
                }
            }
            var x = game_1.Game.rand(_this.roomX, _this.roomX + _this.width - 1, rand);
            var y = game_1.Game.rand(_this.roomY + Math.floor(_this.height / 2) + 3, _this.roomY + _this.height - 2, rand);
            _this.roomArray[x][y] = new button_1.Button(_this, x, y, d);
            var crateTiles = _this.getEmptyTiles().filter(function (t) {
                return t.x >= _this.roomX + 1 &&
                    t.x <= _this.roomX + _this.width - 2 &&
                    t.y >= _this.roomY + Math.floor(_this.height / 2) + 3 &&
                    t.y <= _this.roomY + _this.height - 2;
            });
            var numCrates = game_1.Game.randTable([1, 2, 2, 3, 4], rand);
            for (var i = 0; i < numCrates; i++) {
                var t = crateTiles.splice(game_1.Game.rand(0, crateTiles.length - 1, rand), 1)[0];
                _this.entities.push(new crate_1.Crate(_this, _this.game, t.x, t.y));
            }
            _this.addPlants(game_1.Game.randTable([0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4], rand), rand);
        };
        this.populateSpikeCorridor = function (rand) {
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY + 1; y < _this.roomY + _this.height - 1; y++) {
                    _this.roomArray[x][y] = new spiketrap_1.SpikeTrap(_this, x, y, game_1.Game.rand(0, 3, rand));
                }
            }
            _this.addRandomTorches("medium");
        };
        this.populateTreasure = function (rand) {
            _this.addRandomTorches("medium");
            _this.addChests(game_1.Game.randTable([4, 4, 5, 5, 5, 6, 8], rand), rand);
            _this.addPlants(game_1.Game.randTable([0, 1, 2, 4, 5, 6], rand), rand);
        };
        this.populateChessboard = function (rand) { };
        this.populateCave = function (rand) {
            var factor = game_1.Game.rand(1, 36, rand);
            _this.addWallBlocks(rand);
            if (factor > 15)
                _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 5], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numEnemies = Math.ceil(numEmptyTiles * game_1.Game.randTable([0.25, 0.3, 0.35], rand));
            _this.addEnemies(numEnemies, rand);
            _this.addResources((numEmptyTiles - numEnemies) * game_1.Game.randTable([0.5, 0.6, 0.7, 0.8], rand), rand);
        };
        this.populateUpLadder = function (rand) {
            _this.addRandomTorches("medium");
            var _a = _this.getRoomCenter(), x = _a.x, y = _a.y;
            _this.roomArray[x][y] = new upLadder_1.UpLadder(_this, _this.game, x, y);
        };
        this.populateDownLadder = function (rand) {
            _this.addRandomTorches("medium");
            var _a = _this.getRoomCenter(), x = _a.x, y = _a.y;
            _this.roomArray[x][y] = new downLadder_1.DownLadder(_this, _this.game, x, y);
        };
        this.populateRopeHole = function (rand) {
            _this.addRandomTorches("medium");
            var _a = _this.getRoomCenter(), x = _a.x, y = _a.y;
            var d = new downLadder_1.DownLadder(_this, _this.game, x, y);
            d.isRope = true;
            _this.roomArray[x][y] = d;
        };
        this.populateRopeCave = function (rand) {
            var _a = _this.getRoomCenter(), x = _a.x, y = _a.y;
            var upLadder = new upLadder_1.UpLadder(_this, _this.game, x, y);
            upLadder.isRope = true;
            _this.roomArray[x][y] = upLadder;
        };
        this.populateShop = function (rand) {
            _this.addTorches(2, rand);
            var _a = _this.getRoomCenter(), x = _a.x, y = _a.y;
            _this.entities.push(new vendingMachine_1.VendingMachine(_this, _this.game, x - 2, y - 1, new shotgun_1.Shotgun(_this, 0, 0)));
            _this.entities.push(new vendingMachine_1.VendingMachine(_this, _this.game, x + 2, y - 1, new heart_1.Heart(_this, 0, 0)));
            _this.entities.push(new vendingMachine_1.VendingMachine(_this, _this.game, x - 2, y + 2, new armor_1.Armor(_this, 0, 0)));
            _this.entities.push(new vendingMachine_1.VendingMachine(_this, _this.game, x + 2, y + 2, new spear_1.Spear(_this, 0, 0)));
        };
        this.populate = function (rand) {
            _this.name = "";
            switch (_this.type) {
                case RoomType.START:
                    _this.populateEmpty(rand);
                    _this.name = "FLOOR " + -_this.depth;
                    break;
                case RoomType.BOSS:
                    _this.populateBoss(rand);
                    _this.name = "BOSS";
                    break;
                case RoomType.DUNGEON:
                    _this.populateDungeon(rand);
                    break;
                case RoomType.BIGDUNGEON:
                    _this.populateBigDungeon(rand);
                    break;
                case RoomType.FOUNTAIN:
                    _this.populateFountain(rand);
                    break;
                case RoomType.COFFIN:
                    _this.populateCoffin(rand);
                    break;
                case RoomType.PUZZLE:
                    _this.populatePuzzle(rand);
                    break;
                case RoomType.SPIKECORRIDOR:
                    _this.populateSpikeCorridor(rand);
                    break;
                case RoomType.TREASURE:
                    _this.populateTreasure(rand);
                    break;
                case RoomType.CHESSBOARD: // TODO
                    _this.populateChessboard(rand);
                    break;
                case RoomType.KEYROOM:
                    _this.populateKeyRoom(rand);
                    break;
                case RoomType.GRASS:
                    _this.populateDungeon(rand);
                    break;
                case RoomType.BIGCAVE:
                    _this.populateCave(rand);
                case RoomType.CAVE:
                    _this.populateCave(rand);
                    break;
                case RoomType.UPLADDER:
                    _this.populateUpLadder(rand);
                    _this.name = "FLOOR " + -_this.depth;
                    break;
                case RoomType.DOWNLADDER:
                    _this.populateDownLadder(rand);
                    _this.name = "FLOOR " + -_this.depth;
                    break;
                case RoomType.ROPEHOLE:
                    _this.populateRopeHole(rand);
                    break;
                case RoomType.ROPECAVE:
                    _this.populateRopeCave(rand);
                    break;
                case RoomType.SHOP:
                    /* shop rates:
                     * 10 coal for an gold coin
                     * 1 gold for 10 coins
                     * 1 emerald for 100 coins
                     *
                     * shop items:
                     * 1 empty heart   4 ^ (maxHealth + maxHealth ^ 1.05 ^ maxHealth - 2.05) coins
                     * fill all hearts  1 coin
                     * better torch    5 ^ (torchLevel + 1.05 ^ torchLevel - 2.05) coins
                     * weapons
                     */
                    _this.populateShop(rand);
                    break;
                case RoomType.SPAWNER:
                    _this.populateSpawner(rand);
                    break;
            }
            _this.message = _this.name;
        };
        this.addDoor = function (x, y) {
            var d;
            var t = door_1.DoorType.DOOR;
            if (_this.type === RoomType.BOSS)
                t = door_1.DoorType.GUARDEDDOOR;
            if (_this.type === RoomType.KEYROOM)
                t = door_1.DoorType.LOCKEDDOOR;
            if (x === _this.roomX) {
                d = new door_1.Door(_this, _this.game, x, y, 1, t);
                _this.roomArray[x + 1][y] = new spawnfloor_1.SpawnFloor(_this, x + 1, y);
            }
            else if (x === _this.roomX + _this.width - 1) {
                d = new door_1.Door(_this, _this.game, x, y, 3, t);
                _this.roomArray[x - 1][y] = new spawnfloor_1.SpawnFloor(_this, x - 1, y);
            }
            else if (y === _this.roomY) {
                d = new door_1.Door(_this, _this.game, x, y, 0, t);
                _this.roomArray[x][y + 1] = new spawnfloor_1.SpawnFloor(_this, x, y + 1);
            }
            else if (y === _this.roomY + _this.height - 1) {
                d = new door_1.Door(_this, _this.game, x, y, 2, t);
                _this.roomArray[x][y - 1] = new spawnfloor_1.SpawnFloor(_this, x, y - 1);
            }
            _this.doors.push(d);
            if (_this.roomArray[d.x] == undefined) {
            }
            _this.roomArray[d.x][d.y] = d;
            return d;
        };
        this.alertEnemiesOnEntry = function () {
            for (var _i = 0, _a = _this.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e instanceof enemy_1.Enemy)
                    e.lookForPlayer();
            }
        };
        this.exitLevel = function () {
            _this.particles.splice(0, _this.particles.length);
        };
        this.enterLevel = function (player) {
            player.moveSnap(_this.getRoomCenter().x, _this.getRoomCenter().y);
            _this.clearDeadStuff();
            _this.updateLighting();
            _this.entered = true;
            _this.calculateWallInfo();
            _this.message = _this.name;
            player.map.saveMapData();
        };
        this.enterLevelThroughDoor = function (player, door, side) {
            if (door instanceof door_1.Door && door.doorDir === door_2.DoorDir.North) {
                //if top door
                door.opened = true;
                player.moveNoSmooth(door.x, door.y + 1);
            }
            else if (door instanceof door_1.Door && door.doorDir === door_2.DoorDir.South) {
                //if bottom door
                player.moveNoSmooth(door.x, door.y - 1);
            }
            else if (door instanceof door_1.Door &&
                [door_2.DoorDir.East, door_2.DoorDir.West].includes(door.doorDir)) {
                // if side door
                player.moveNoSmooth(door.x + side, door.y);
            }
            _this.clearDeadStuff();
            _this.calculateWallInfo();
            _this.updateLighting();
            _this.entered = true;
            _this.alertEnemiesOnEntry();
            _this.message = _this.name;
            player.map.saveMapData();
        };
        this.enterLevelThroughLadder = function (player, ladder) {
            player.moveSnap(ladder.x, ladder.y + 1);
            _this.clearDeadStuff();
            _this.calculateWallInfo();
            _this.updateLighting();
            _this.entered = true;
            _this.message = _this.name;
            player.map.saveMapData();
        };
        this.getEmptyTiles = function () {
            var returnVal = [];
            for (var x = _this.roomX + 1; x < _this.roomX + _this.width - 1; x++) {
                for (var y = _this.roomY + 1; y < _this.roomY + _this.height - 1; y++) {
                    if (!_this.roomArray[x][y].isSolid() &&
                        !(_this.roomArray[x][y] instanceof spiketrap_1.SpikeTrap) &&
                        !(_this.roomArray[x][y] instanceof spawnfloor_1.SpawnFloor)) {
                        returnVal.push(_this.roomArray[x][y]);
                    }
                }
            }
            var _loop_1 = function (e) {
                returnVal = returnVal.filter(function (t) { return !e.pointIn(t.x, t.y); });
            };
            for (var _i = 0, _a = _this.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                _loop_1(e);
            }
            return returnVal;
        };
        this.getTile = function (x, y) {
            if (_this.roomArray[x])
                return _this.roomArray[x][y];
            else
                return undefined;
        };
        this.fadeLighting = function (delta) {
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    if (Math.abs(_this.softVis[x][y] - _this.vis[x][y]) >= 0.02) {
                        if (_this.softVis[x][y] < _this.vis[x][y])
                            _this.softVis[x][y] += 0.02;
                        else if (_this.softVis[x][y] > _this.vis[x][y])
                            _this.softVis[x][y] -= 0.02 * delta;
                    }
                    // if (this.softVis[x][y] < 0.01) this.softVis[x][y] = 0;
                }
            }
        };
        this.updateLighting = function () {
            var oldVis = [];
            var oldCol = [];
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                oldVis[x] = [];
                oldCol[x] = [];
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    oldVis[x][y] = _this.vis[x][y];
                    oldCol[x][y] = _this.col[x][y];
                    _this.vis[x][y] = 1;
                    _this.col[x][y] = [1, 1, 1];
                    _this.renderBuffer[x][y] = [];
                }
            }
            for (var _i = 0, _a = _this.lightSources; _i < _a.length; _i++) {
                var l = _a[_i];
                for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                    _this.castTintAtAngle(i, l.x, l.y, l.r, l.c, l.b); // RGB color in sRGB
                }
            }
            for (var p in _this.game.players) {
                if (_this === _this.game.rooms[_this.game.players[p].levelID]) {
                    for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                        var lightColor = levelConstants_1.LevelConstants.AMBIENT_LIGHT_COLOR;
                        if (_this.game.players[p].lightEquipped)
                            lightColor = [200, 25, 5];
                        _this.castTintAtAngle(i, _this.game.players[p].x + 0.5, _this.game.players[p].y + 0.5, Math.min(Math.max(_this.game.players[p].sightRadius - _this.depth + 2, player_1.Player.minSightRadius), 10), lightColor, // RGB color in sRGB
                        1 // intensity
                        );
                    }
                }
            }
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.col[x][y] = _this.blendColorsArray(_this.renderBuffer[x][y]);
                }
            }
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.vis[x][y] = _this.rgbToLuminance(_this.col[x][y]);
                }
            }
            if (levelConstants_1.LevelConstants.SMOOTH_LIGHTING)
                _this.vis = _this.blur3x3(_this.vis, [
                    [1, 2, 1],
                    [2, 8, 2],
                    [1, 2, 1],
                ]);
        };
        this.castShadowsAtAngle = function (angle, px, py, radius, oldVis) {
            var dx = Math.cos((angle * Math.PI) / 180);
            var dy = Math.sin((angle * Math.PI) / 180);
            var onOpaqueSection = false;
            for (var i = 0; i < radius + 3; i++) {
                if (!_this.isPositionInRoom(px, py))
                    return; // we're outside the level
                var tile = _this.roomArray[Math.floor(px)][Math.floor(py)];
                if (tile.isOpaque()) {
                    if (i > 0)
                        onOpaqueSection = true;
                }
                else if (onOpaqueSection) {
                    return;
                }
                _this.vis[Math.floor(px)][Math.floor(py)] = Math.min(_this.vis[Math.floor(px)][Math.floor(py)], Math.min(i / radius, 1));
                px += dx;
                py += dy;
            }
        };
        /**
         * Casts a tint from a light source at a specific angle.
         * Updates the `col` array with the light's color based on distance and tile opacity.
         *
         * @param angle - The angle in degrees at which to cast the tint.
         * @param px - The x-coordinate of the light source.
         * @param py - The y-coordinate of the light source.
         * @param radius - The radius of the light's influence.
         * @param color - The RGB color tuple representing the tint.
         */
        this.castTintAtAngle = function (angle, px, py, radius, color, brightness) {
            var dx = Math.cos((angle * Math.PI) / 180);
            var dy = Math.sin((angle * Math.PI) / 180);
            // Convert input color from sRGB to linear RGB
            var linearColor = [
                _this.sRGBToLinear(color[0]),
                _this.sRGBToLinear(color[1]),
                _this.sRGBToLinear(color[2]),
            ];
            for (var i = 0; i <= radius + 3; i++) {
                var currentX = Math.floor(px + dx * i);
                var currentY = Math.floor(py + dy * i);
                if (!_this.isPositionInRoom(currentX, currentY))
                    return; // Outside the room
                var tile = _this.roomArray[currentX][currentY];
                if (tile.isOpaque()) {
                    return; // Stop casting tint through opaque tiles
                }
                // Handle i=0 separately to avoid division by zero and ensure the light source tile is lit correctly
                var intensity = void 0;
                if (i === 0) {
                    intensity = brightness / 3; // Full intensity at the light source tile adjusted by brightness
                }
                else {
                    intensity = brightness / Math.pow(i, 2); // Exponential falloff with distance
                }
                //if (intensity < 0.001) intensity = 0;
                if (intensity <= 0)
                    continue;
                if (!_this.renderBuffer[currentX]) {
                    _this.renderBuffer[currentX] = [];
                }
                if (!_this.renderBuffer[currentX][currentY]) {
                    _this.renderBuffer[currentX][currentY] = [];
                }
                var weightedLinearColor = [
                    linearColor[0],
                    linearColor[1],
                    linearColor[2],
                    intensity,
                ];
                _this.renderBuffer[currentX][currentY].push(weightedLinearColor);
            }
        };
        this.sRGBToLinear = function (value) {
            var normalized = value / 255;
            if (normalized <= 0.04045) {
                return normalized / 12.92;
            }
            else {
                return Math.pow((normalized + 0.055) / 1.055, 2.4);
            }
        };
        this.linearToSRGB = function (value) {
            if (value <= 0.0031308) {
                return Math.round(12.92 * value * 255);
            }
            else {
                return Math.round((1.055 * Math.pow(value, 1 / 2.4 /*gamma*/) - 0.055) * 255);
            }
        };
        this.clamp = function (value, min, max) {
            if (min === void 0) { min = 0; }
            if (max === void 0) { max = 1; }
            return Math.min(Math.max(value, min), max);
        };
        /**
         * Blends an array of RGB colors into a single color without excessive darkness or clipping to white.
         *
         * @param colors - An array of RGB tuples to blend.
         * @returns A single RGB tuple representing the blended color.
         */
        this.blendColorsArray = function (colors) {
            if (colors.length === 0)
                return [0, 0, 0];
            // Sum all color channels in linear RGB
            var sum = colors.reduce(function (accumulator, color) { return [
                accumulator[0] + color[0] * color[3],
                accumulator[1] + color[1] * color[3],
                accumulator[2] + color[2] * color[3],
            ]; }, [0, 0, 0]);
            // Apply scaling factor to manage overall brightness
            var scalingFactor = 0.35; // Adjust as needed
            var scaledSum = [
                sum[0] * scalingFactor,
                sum[1] * scalingFactor,
                sum[2] * scalingFactor,
            ];
            // Clamp each channel to [0, 1] to prevent overflow
            var clampedSum = [
                _this.clamp(scaledSum[0], 0, 1),
                _this.clamp(scaledSum[1], 0, 1),
                _this.clamp(scaledSum[2], 0, 1),
            ];
            // Convert back to sRGB
            return [
                _this.linearToSRGB(clampedSum[0]),
                _this.linearToSRGB(clampedSum[1]),
                _this.linearToSRGB(clampedSum[2]),
            ];
        };
        this.blur3x3 = function (array, weights) {
            var blurredArray = [];
            for (var x = 0; x < array.length; x++) {
                blurredArray[x] = [];
                for (var y = 0; y < array[0].length; y++) {
                    if (array[x][y] === 0) {
                        blurredArray[x][y] = 0;
                        continue;
                    }
                    var total = 0;
                    var totalWeights = 0;
                    for (var xx = -1; xx <= 1; xx++) {
                        for (var yy = -1; yy <= 1; yy++) {
                            if (x + xx >= 0 &&
                                x + xx < array.length &&
                                y + yy >= 0 &&
                                y + yy < array[0].length) {
                                total += array[x + xx][y + yy] * weights[xx + 1][yy + 1];
                                totalWeights += weights[xx + 1][yy + 1];
                            }
                        }
                    }
                    blurredArray[x][y] = total / totalWeights;
                }
            }
            return blurredArray;
        };
        this.rgbToLuminance = function (color) {
            //map to 1-0 range
            return 1 - (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255;
        };
        this.catchUp = function () {
            if (_this.turn === TurnState.computerTurn)
                _this.computerTurn(); // player skipped computer's turn, catch up
        };
        this.tick = function (player) {
            _this.lastEnemyCount = _this.entities.filter(function (e) { return e instanceof enemy_1.Enemy; }).length;
            for (var _i = 0, _a = _this.hitwarnings; _i < _a.length; _i++) {
                var h = _a[_i];
                h.tick();
            }
            for (var _b = 0, _c = _this.projectiles; _b < _c.length; _b++) {
                var p = _c[_b];
                p.tick();
            }
            _this.clearDeadStuff();
            _this.calculateWallInfo();
            _this.entities = _this.entities.filter(function (e) { return !e.dead; });
            _this.updateLighting();
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.roomArray[x][y].tick();
                }
            }
            _this.turn = TurnState.computerTurn;
            //player.actionTab.setState(ActionState.WAIT);
            //sets the action tab state to Ready
            _this.playerTurnTime = Date.now();
            _this.playerTicked = player;
            player.map.saveMapData();
            _this.clearDeadStuff();
        };
        this.update = function () {
            if (_this.turn == TurnState.computerTurn) {
                if (Date.now() - _this.playerTurnTime >=
                    levelConstants_1.LevelConstants.COMPUTER_TURN_DELAY) {
                    _this.computerTurn();
                }
            }
        };
        this.clearDeadStuff = function () {
            _this.entities = _this.entities.filter(function (e) { return !e.dead; });
            _this.projectiles = _this.projectiles.filter(function (p) { return !p.dead; });
            _this.hitwarnings = _this.hitwarnings.filter(function (h) { return !h.dead; });
            _this.particles = _this.particles.filter(function (p) { return !p.dead; });
        };
        this.computerTurn = function () {
            // take computer turn
            for (var _i = 0, _a = _this.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                e.tick();
            }
            _this.entities = _this.entities.filter(function (e) { return !e.dead; });
            for (var _b = 0, _c = _this.items; _b < _c.length; _b++) {
                var i = _c[_b];
                i.tick();
            }
            for (var _d = 0, _e = _this.hitwarnings; _d < _e.length; _d++) {
                var h = _e[_d];
                if (!_this.roomArray[h.x] ||
                    !_this.roomArray[h.x][h.y] ||
                    _this.roomArray[h.x][h.y].isSolid()) {
                    h.dead = true;
                }
                h.removeOverlapping();
            }
            for (var _f = 0, _g = _this.projectiles; _f < _g.length; _f++) {
                var p = _g[_f];
                if (_this.roomArray[p.x][p.y].isSolid())
                    p.dead = true;
                for (var i in _this.game.players) {
                    if (_this.game.rooms[_this.game.players[i].levelID] === _this &&
                        p.x === _this.game.players[i].x &&
                        p.y === _this.game.players[i].y) {
                        p.hitPlayer(_this.game.players[i]);
                    }
                }
                for (var _h = 0, _j = _this.entities; _h < _j.length; _h++) {
                    var e = _j[_h];
                    if (p.x === e.x && p.y === e.y) {
                        p.hitEnemy(e);
                    }
                }
            }
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.roomArray[x][y].tickEnd();
                }
            }
            _this.entities = _this.entities.filter(function (e) { return !e.dead; }); // enemies may be killed by spiketrap
            _this.clearDeadStuff();
            _this.playerTicked.finishTick();
            _this.checkForNoEnemies();
            console.log(_this.entities.filter(function (e) { return e instanceof enemy_1.Enemy; }).length);
            _this.turn = TurnState.playerTurn;
        };
        this.checkForNoEnemies = function () {
            var enemies = _this.entities.filter(function (e) { return e instanceof enemy_1.Enemy; });
            if (enemies.length === 0 && _this.lastEnemyCount > 0) {
                // if (this.doors[0].type === DoorType.GUARDEDDOOR) {
                _this.doors.forEach(function (d) {
                    d.unGuard();
                });
                _this.game.pushMessage("The foes have been slain and the door allows you passage.");
                // }
            }
        };
        this.draw = function (delta) {
            hitWarning_1.HitWarning.updateFrame(delta);
            _this.fadeLighting(delta);
        };
        this.drawColorLayer = function () {
            game_1.Game.ctx.globalCompositeOperation = "soft-light";
            game_1.Game.ctx.globalAlpha = 0.6;
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    var _a = _this.col[x][y], r = _a[0], g = _a[1], b = _a[2];
                    if (r === 0 && g === 0 && b === 0)
                        continue; // Skip if no color
                    game_1.Game.ctx.fillStyle = "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(1 - _this.vis[x][y], ")");
                    game_1.Game.ctx.fillRect(x * gameConstants_1.GameConstants.TILESIZE, y * gameConstants_1.GameConstants.TILESIZE, gameConstants_1.GameConstants.TILESIZE, gameConstants_1.GameConstants.TILESIZE);
                }
            }
            // Set composite operation if needed
            game_1.Game.ctx.globalCompositeOperation = "source-over";
            game_1.Game.ctx.globalAlpha = 0.75;
        };
        this.drawEntities = function (delta, skipLocalPlayer) {
            var tiles = [];
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    if (_this.softVis[x][y] < 1)
                        _this.roomArray[x][y].drawUnderPlayer(delta);
                    tiles.push(_this.roomArray[x][y]);
                }
            }
            var drawables = new Array();
            drawables = drawables.concat(tiles, _this.entities, _this.hitwarnings, _this.projectiles, _this.particles, _this.items);
            for (var i in _this.game.players) {
                if (_this.game.rooms[_this.game.players[i].levelID] === _this) {
                    if (!(skipLocalPlayer &&
                        _this.game.players[i] === _this.game.players[_this.game.localPlayerID]))
                        drawables.push(_this.game.players[i]);
                }
            }
            drawables.sort(function (a, b) {
                if (a instanceof floor_1.Floor) {
                    return -1;
                }
                else if (b instanceof floor_1.Floor) {
                    return 1;
                }
                if (Math.abs(a.drawableY - b.drawableY) < 0.1) {
                    if (a instanceof player_1.Player) {
                        return 1;
                    }
                    else if (b instanceof player_1.Player) {
                        return -1;
                    }
                    else if (a instanceof entity_1.Entity) {
                        return 1;
                    }
                    else if (b instanceof entity_1.Entity) {
                        return -1;
                    }
                    else
                        return 0;
                }
                else {
                    return a.drawableY - b.drawableY;
                }
            });
            for (var _i = 0, drawables_1 = drawables; _i < drawables_1.length; _i++) {
                var d = drawables_1[_i];
                d.draw(delta);
            }
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    if (_this.softVis[x][y] < 1)
                        _this.roomArray[x][y].drawAbovePlayer(delta);
                }
            }
            for (var _a = 0, _b = _this.items; _a < _b.length; _a++) {
                var i = _b[_a];
                i.drawTopLayer(delta);
            }
        };
        this.drawShade = function (delta) {
            var bestSightRadius = 0;
            for (var p in _this.game.players) {
                game_1.Game.ctx.globalCompositeOperation = "soft-light";
                game_1.Game.ctx.globalAlpha = 0.75;
                if (_this.game.rooms[_this.game.players[p].levelID] === _this &&
                    _this.game.players[p].defaultSightRadius > bestSightRadius) {
                    bestSightRadius = _this.game.players[p].defaultSightRadius;
                }
            }
            var shadingAlpha = Math.max(0, Math.min(0.8, 2 / bestSightRadius));
            if (gameConstants_1.GameConstants.ALPHA_ENABLED) {
                game_1.Game.ctx.globalAlpha = 0.25;
                game_1.Game.ctx.fillStyle = _this.shadeColor;
                game_1.Game.ctx.fillRect((_this.roomX - levelConstants_1.LevelConstants.SCREEN_W) * gameConstants_1.GameConstants.TILESIZE, (_this.roomY - levelConstants_1.LevelConstants.SCREEN_H) * gameConstants_1.GameConstants.TILESIZE, (_this.width + 2 * levelConstants_1.LevelConstants.SCREEN_W) * gameConstants_1.GameConstants.TILESIZE, (_this.height + 2 * levelConstants_1.LevelConstants.SCREEN_H) * gameConstants_1.GameConstants.TILESIZE);
                game_1.Game.ctx.globalAlpha = 1;
                game_1.Game.ctx.globalCompositeOperation = "source-over";
            }
        };
        this.drawOverShade = function (delta) {
            for (var _i = 0, _a = _this.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                e.drawTopLayer(delta); // health bars
            }
            for (var _b = 0, _c = _this.projectiles; _b < _c.length; _b++) {
                var p = _c[_b];
                p.drawTopLayer(delta);
            }
            //Game.ctx.globalCompositeOperation = "overlay";
            for (var _d = 0, _e = _this.hitwarnings; _d < _e.length; _d++) {
                var h = _e[_d];
                h.drawTopLayer(delta);
            }
            //Game.ctx.globalCompositeOperation = "source-over";
            for (var _f = 0, _g = _this.particles; _f < _g.length; _f++) {
                var s = _g[_f];
                s.drawTopLayer(delta);
            }
            // draw over dithered shading
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    _this.roomArray[x][y].drawAboveShading(delta);
                }
            }
        };
        // for stuff rendered on top of the player
        this.drawTopLayer = function (delta) {
            // gui stuff
            // room name
            var old = game_1.Game.ctx.font;
            game_1.Game.ctx.font = gameConstants_1.GameConstants.SCRIPT_FONT_SIZE + "px Script";
            game_1.Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            game_1.Game.fillText(_this.message, gameConstants_1.GameConstants.WIDTH / 2 - game_1.Game.measureText(_this.name).width / 2, 5);
            game_1.Game.ctx.font = old;
        };
        this.game = game;
        this.roomX = x; //Math.floor(- this.width / 2);
        this.roomY = y; //Math.floor(- this.height / 2);
        this.width = w;
        this.height = h;
        this.type = type;
        this.depth = depth;
        this.mapGroup = mapGroup;
        this.entered = false;
        this.turn = TurnState.playerTurn;
        this.playerTurnTime = Date.now();
        this.items = Array();
        this.projectiles = Array();
        this.hitwarnings = Array();
        this.particles = Array();
        this.doors = Array();
        this.entities = Array();
        this.lightSources = Array();
        this.walls = Array();
        this.roomArray = [];
        for (var x_2 = this.roomX; x_2 < this.roomX + this.width; x_2++) {
            this.roomArray[x_2] = [];
        }
        this.vis = [];
        this.softVis = [];
        this.col = [];
        this.softCol = [];
        for (var x_3 = this.roomX; x_3 < this.roomX + this.width; x_3++) {
            this.vis[x_3] = [];
            this.softVis[x_3] = [];
            this.col[x_3] = [];
            this.softCol[x_3] = [];
            for (var y_2 = this.roomY; y_2 < this.roomY + this.height; y_2++) {
                this.vis[x_3][y_2] = 1;
                this.softVis[x_3][y_2] = 1;
                this.col[x_3][y_2] = [0, 0, 0];
                this.softCol[x_3][y_2] = [0, 0, 0];
            }
        }
        this.renderBuffer = [];
        for (var x_4 = this.roomX; x_4 < this.roomX + this.width; x_4++) {
            this.renderBuffer[x_4] = [];
            for (var y_3 = this.roomY; y_3 < this.roomY + this.height; y_3++) {
                this.renderBuffer[x_4][y_3] = [];
            }
        }
        this.skin = tile_1.SkinType.DUNGEON;
        if (this.type === RoomType.ROPECAVE || this.type === RoomType.CAVE)
            this.skin = tile_1.SkinType.CAVE;
        this.buildEmptyRoom();
    }
    Room.prototype.pointInside = function (x, y, rX, rY, rW, rH) {
        if (x < rX || x >= rX + rW)
            return false;
        if (y < rY || y >= rY + rH)
            return false;
        return true;
    };
    Room.prototype.buildEmptyRoom = function () {
        // fill in wall and floor
        for (var x = this.roomX; x < this.roomX + this.width; x++) {
            for (var y = this.roomY; y < this.roomY + this.height; y++) {
                if (this.pointInside(x, y, this.roomX + 1, this.roomY + 1, this.width - 2, this.height - 2)) {
                    this.roomArray[x][y] = new floor_1.Floor(this, x, y);
                }
                else {
                    this.roomArray[x][y] = new wall_1.Wall(this, x, y);
                    this.walls.push;
                }
            }
        }
    };
    Room.prototype.addWallBlocks = function (rand) {
        var numBlocks = game_1.Game.randTable([0, 0, 1, 1, 2, 2, 2, 2, 3], rand);
        if (this.width > 8 && rand() > 0.5)
            numBlocks *= 4;
        for (var i = 0; i < numBlocks; i++) {
            var blockW = Math.min(game_1.Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5], rand), this.width - 4);
            var blockH = Math.min(blockW + game_1.Game.rand(-2, 2, rand), this.height - 4);
            var x = game_1.Game.rand(this.roomX + 2, this.roomX + this.width - blockW - 2, rand);
            var y = game_1.Game.rand(this.roomY + 2, this.roomY + this.height - blockH - 2, rand);
            for (var xx = x; xx < x + blockW; xx++) {
                for (var yy = y; yy < y + blockH; yy++) {
                    var w = new wall_1.Wall(this, xx, yy);
                    this.roomArray[xx][yy] = w;
                    this.walls.push(w);
                }
            }
        }
    };
    Room.prototype.addFingers = function (rand) { };
    Room.prototype.addTorches = function (numTorches, rand) {
        var walls = [];
        for (var xx = this.roomX + 1; xx < this.roomX + this.width - 2; xx++) {
            for (var yy = this.roomY; yy < this.roomY + this.height - 1; yy++) {
                if (this.roomArray[xx][yy] instanceof wall_1.Wall &&
                    !(this.roomArray[xx][yy + 1] instanceof wall_1.Wall)) {
                    walls.push(this.roomArray[xx][yy]);
                }
            }
        }
        for (var i = 0; i < numTorches; i++) {
            var t = void 0, x = void 0, y = void 0;
            if (walls.length == 0)
                return;
            t = walls.splice(game_1.Game.rand(0, walls.length - 1, rand), 1)[0];
            x = t.x;
            y = t.y;
            this.roomArray[x][y] = new wallTorch_1.WallTorch(this, x, y);
        }
    };
    Room.prototype.addChasms = function (rand) {
        // add chasms
        var w = game_1.Game.rand(2, 4, rand);
        var h = game_1.Game.rand(2, 4, rand);
        var xmin = this.roomX + 2;
        var xmax = this.roomX + this.width - w - 2;
        var ymin = this.roomY + 2;
        var ymax = this.roomY + this.height - h - 2;
        if (xmax < xmin || ymax < ymin)
            return;
        var x = game_1.Game.rand(xmin, xmax, rand);
        var y = game_1.Game.rand(ymin, ymax, rand);
        for (var xx = x - 1; xx < x + w + 1; xx++) {
            for (var yy = y - 1; yy < y + h + 1; yy++) {
                // add a floor border
                if (xx === x - 1 || xx === x + w || yy === y - 1 || yy === y + h) {
                    if (!(this.roomArray[xx][yy] instanceof spawnfloor_1.SpawnFloor))
                        this.roomArray[xx][yy] = new floor_1.Floor(this, xx, yy);
                }
                else
                    this.roomArray[xx][yy] = new chasm_1.Chasm(this, xx, yy, xx === x, xx === x + w - 1, yy === y, yy === y + h - 1);
            }
        }
    };
    Room.prototype.addChests = function (numChests, rand) {
        // add chests
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numChests; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            this.entities.push(new chest_1.Chest(this, this.game, x, y));
        }
    };
    Room.prototype.addSpikeTraps = function (numSpikes, rand) {
        // add spikes
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numSpikes; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            this.roomArray[x][y] = new spiketrap_1.SpikeTrap(this, x, y);
        }
    };
    Room.prototype.addSpikes = function (numSpikes, rand) {
        // add spikes
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numSpikes; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            this.roomArray[x][y] = new spike_1.Spike(this, x, y);
        }
    };
    Room.prototype.hasPlayer = function (player) {
        for (var _i = 0, _a = this.roomArray; _i < _a.length; _i++) {
            var tile = _a[_i];
            if (tile instanceof player_1.Player) {
                return true;
            }
        }
        return false;
    };
    // Function to add enemies to the room
    Room.prototype.addEnemies = function (numEnemies, rand) {
        var _this = this;
        // Get all empty tiles in the room
        var tiles = this.getEmptyTiles();
        //don't put enemies near the entrances so you don't get screwed instantly
        var adjecentTiles = [];
        for (var _i = 0, _a = this.doors; _i < _a.length; _i++) {
            var door = _a[_i];
            if (door.doorDir === door_2.DoorDir.North) {
                adjecentTiles.push({ x: door.x, y: door.y - 2 }, { x: door.x - 1, y: door.y - 1 }, { x: door.x + 1, y: door.y - 1 }, { x: door.x - 1, y: door.y - 2 }, { x: door.x + 1, y: door.y - 2 });
            }
            if (door.doorDir === door_2.DoorDir.South) {
                adjecentTiles.push({ x: door.x, y: door.y + 2 }, { x: door.x - 1, y: door.y + 1 }, { x: door.x + 1, y: door.y + 1 }, { x: door.x - 1, y: door.y + 2 }, { x: door.x + 1, y: door.y + 2 });
            }
            if (door.doorDir === door_2.DoorDir.West) {
                adjecentTiles.push({ x: door.x - 2, y: door.y }, { x: door.x - 1, y: door.y - 1 }, { x: door.x - 1, y: door.y + 1 }, { x: door.x - 1, y: door.y - 2 }, { x: door.x - 1, y: door.y + 2 });
            }
            if (door.doorDir === door_2.DoorDir.East) {
                adjecentTiles.push({ x: door.x + 2, y: door.y }, { x: door.x + 1, y: door.y - 1 }, { x: door.x + 1, y: door.y + 1 }, { x: door.x + 1, y: door.y - 2 }, { x: door.x + 1, y: door.y + 2 });
            }
        }
        tiles = tiles.filter(function (tile) { return !adjecentTiles.some(function (t) { return t.x === tile.x && t.y === tile.y; }); });
        var _loop_2 = function (i) {
            var _b = this_1.getRandomEmptyPosition(tiles), x = _b.x, y = _b.y;
            // Define the enemy tables for each depth level
            var tables = {
                0: [1, 5, 3],
                1: [3, 4, 5, 9, 7],
                2: [3, 4, 5, 7, 8, 9, 12],
                3: [1, 2, 3, 5, 6, 7, 8, 9, 10],
                4: [4, 5, 6, 7, 8, 9, 10, 11, 12],
                5: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
                7: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
            };
            // Define the maximum depth level
            var max_depth_table = 7;
            // Get the current depth level, capped at the maximum
            var d = Math.min(this_1.depth, max_depth_table);
            // If there is a table for the current depth level
            if (tables[d] && tables[d].length > 0) {
                // Function to add an enemy to the room
                var addEnemy = function (enemy) {
                    var _loop_3 = function (xx) {
                        var _loop_4 = function (yy) {
                            if (!_this.getEmptyTiles().some(function (tt) { return tt.x === x + xx && tt.y === y + yy; })) {
                                // If it does, increment the enemy count and return false
                                numEnemies++;
                                return { value: false };
                            }
                        };
                        for (var yy = 0; yy < enemy.h; yy++) {
                            var state_2 = _loop_4(yy);
                            if (typeof state_2 === "object")
                                return state_2;
                        }
                    };
                    // Check if the enemy overlaps with any other enemies
                    for (var xx = 0; xx < enemy.w; xx++) {
                        var state_1 = _loop_3(xx);
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                    // If it doesn't, add the enemy to the room and return true
                    _this.entities.push(enemy);
                    return true;
                };
                // Randomly select an enemy type from the table
                var type = game_1.Game.randTable(tables[d], rand);
                // Add the selected enemy type to the room
                switch (type) {
                    case 1:
                        addEnemy(new crabEnemy_1.CrabEnemy(this_1, this_1.game, x, y));
                        break;
                    case 2:
                        addEnemy(new frogEnemy_1.FrogEnemy(this_1, this_1.game, x, y));
                        break;
                    case 3:
                        addEnemy(new zombieEnemy_1.ZombieEnemy(this_1, this_1.game, x, y));
                        break;
                    case 4:
                        addEnemy(new skullEnemy_1.SkullEnemy(this_1, this_1.game, x, y));
                        break;
                    case 5:
                        addEnemy(new wizardEnemy_1.WizardEnemy(this_1, this_1.game, x, y));
                        break;
                    case 6:
                        addEnemy(new chargeEnemy_1.ChargeEnemy(this_1, this_1.game, x, y));
                        break;
                    case 7:
                        addEnemy(new spawner_1.Spawner(this_1, this_1.game, x, y));
                        break;
                    case 8:
                        addEnemy(new bishopEnemy_1.BishopEnemy(this_1, this_1.game, x, y));
                        break;
                    case 9:
                        addEnemy(new armoredzombieEnemy_1.ArmoredzombieEnemy(this_1, this_1.game, x, y));
                        break;
                    case 10:
                        if (addEnemy(new bigSkullEnemy_1.BigSkullEnemy(this_1, this_1.game, x, y))) {
                            // clear out some space
                            for (var xx = 0; xx < 2; xx++) {
                                for (var yy = 0; yy < 2; yy++) {
                                    this_1.roomArray[x + xx][y + yy] = new floor_1.Floor(this_1, x + xx, y + yy); // remove any walls
                                }
                            }
                        }
                        break;
                    case 11:
                        addEnemy(new queenEnemy_1.QueenEnemy(this_1, this_1.game, x, y));
                        break;
                    case 12:
                        addEnemy(new knightEnemy_1.KnightEnemy(this_1, this_1.game, x, y));
                        break;
                    case 13:
                        if (addEnemy(new bigKnightEnemy_1.BigKnightEnemy(this_1, this_1.game, x, y))) {
                            // clear out some space
                            for (var xx = 0; xx < 2; xx++) {
                                for (var yy = 0; yy < 2; yy++) {
                                    this_1.roomArray[x + xx][y + yy] = new floor_1.Floor(this_1, x + xx, y + yy); // remove any walls
                                }
                            }
                        }
                        break;
                    case 14:
                        addEnemy(new sniperEnemy_1.SniperEnemy(this_1, this_1.game, x, y));
                        break;
                    case 15:
                        addEnemy(new enemy_1.Enemy(this_1, this_1.game, x, y));
                        break;
                    case 16:
                        addEnemy(new fireWizard_1.FireWizardEnemy(this_1, this_1.game, x, y));
                        break;
                }
            }
        };
        var this_1 = this;
        // Loop through the number of enemies to be added
        for (var i = 0; i < numEnemies; i++) {
            _loop_2(i);
        }
    };
    Room.prototype.addObstacles = function (numObstacles, rand) {
        // add crates/barrels
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numObstacles; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            switch (game_1.Game.randTable([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4], rand)) {
                case 1:
                    this.entities.push(new crate_1.Crate(this, this.game, x, y));
                    break;
                case 2:
                    this.entities.push(new barrel_1.Barrel(this, this.game, x, y));
                    break;
                case 3:
                    this.entities.push(new tombStone_1.TombStone(this, this.game, x, y, 1));
                    break;
                case 4:
                    this.entities.push(new tombStone_1.TombStone(this, this.game, x, y, 0));
                    break;
            }
        }
    };
    Room.prototype.addPlants = function (numPlants, rand) {
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numPlants; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            var r = rand();
            if (r <= 0.45)
                this.entities.push(new pottedPlant_1.PottedPlant(this, this.game, x, y));
            else if (r <= 0.65)
                this.entities.push(new pot_1.Pot(this, this.game, x, y));
            else if (r <= 0.75)
                this.entities.push(new rockResource_1.Rock(this, this.game, x, y));
            else if (r <= 0.97)
                this.entities.push(new mushrooms_1.Mushrooms(this, this.game, x, y));
            else
                this.entities.push(new chest_1.Chest(this, this.game, x, y));
        }
    };
    Room.prototype.addResources = function (numResources, rand) {
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numResources; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            var r = rand();
            if (r <= (10 - Math.pow(this.depth, 3)) / 10)
                this.entities.push(new coalResource_1.CoalResource(this, this.game, x, y));
            else if (r <= (10 - Math.pow((this.depth - 2), 3)) / 10)
                this.entities.push(new goldResource_1.GoldResource(this, this.game, x, y));
            else
                this.entities.push(new emeraldResource_1.EmeraldResource(this, this.game, x, y));
        }
    };
    Room.prototype.addVendingMachine = function (rand) {
        var _a = this.getRandomEmptyPosition(this.getEmptyTiles()), x = _a.x, y = _a.y;
        var type = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6], rand);
        switch (type) {
            case 1:
                this.entities.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new heart_1.Heart(this, 0, 0)));
                break;
            case 2:
                this.entities.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new lantern_1.Lantern(this, 0, 0)));
                break;
            case 3:
                this.entities.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new armor_1.Armor(this, 0, 0)));
                break;
            case 4:
                this.entities.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new dualdagger_1.DualDagger(this, 0, 0)));
                break;
            case 5:
                this.entities.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new spear_1.Spear(this, 0, 0)));
                break;
            case 6:
                this.entities.push(new vendingMachine_1.VendingMachine(this, this.game, x, y, new shotgun_1.Shotgun(this, 0, 0)));
                break;
        }
    };
    Room.prototype.calculateWallInfo = function () {
        var _a, _b, _c;
        this.wallInfo.clear();
        for (var x = this.roomX; x < this.roomX + this.width; x++) {
            for (var y = this.roomY; y < this.roomY + this.height; y++) {
                var tile = this.getTile(x, y);
                if (tile instanceof wall_1.Wall || tile instanceof wallTorch_1.WallTorch) {
                    var isTopWall = y === this.roomY;
                    var isBottomWall = y === this.roomY + this.height - 1;
                    var isLeftWall = x === this.roomX;
                    var isRightWall = x === this.roomX + this.width - 1;
                    var isInnerWall = !isTopWall && !isBottomWall && !isLeftWall && !isRightWall;
                    var isBelowDoorWall = y < this.roomY + this.height - 1 && ((_a = this.getTile(x, y + 1)) === null || _a === void 0 ? void 0 : _a.isDoor);
                    var isAboveDoorWall = y < this.roomY + this.height - 1 && ((_b = this.getTile(x, y - 1)) === null || _b === void 0 ? void 0 : _b.isDoor);
                    var isDoorWall = y < this.roomY + this.height && ((_c = this.getTile(x, y + 1)) === null || _c === void 0 ? void 0 : _c.isDoor);
                    var innerWallType = null;
                    if (isInnerWall) {
                        var hasWallAbove = this.getTile(x, y - 1) instanceof wall_1.Wall;
                        var hasWallBelow = this.getTile(x, y + 1) instanceof wall_1.Wall;
                        if (!hasWallAbove && hasWallBelow) {
                            innerWallType = "topInner";
                        }
                        else if (hasWallAbove && !hasWallBelow) {
                            innerWallType = "bottomInner";
                        }
                        else if (hasWallAbove && hasWallBelow) {
                            innerWallType = "surroundedInner";
                        }
                        else {
                            innerWallType = "isolatedInner";
                        }
                    }
                    this.wallInfo.set("".concat(x, ",").concat(y), {
                        isTopWall: isTopWall,
                        isBottomWall: isBottomWall,
                        isLeftWall: isLeftWall,
                        isRightWall: isRightWall,
                        isInnerWall: isInnerWall,
                        isBelowDoorWall: isBelowDoorWall,
                        isDoorWall: isDoorWall,
                        innerWallType: innerWallType,
                        isAboveDoorWall: isAboveDoorWall,
                        shouldDrawBottom: isDoorWall ||
                            isBelowDoorWall ||
                            (isTopWall && !isLeftWall && !isRightWall) ||
                            isInnerWall,
                    });
                }
            }
        }
    };
    // This pattern appears in multiple methods like addVendingMachine, addChests, addSpikes, etc.
    Room.prototype.getRandomEmptyPosition = function (tiles) {
        if (tiles.length === 0)
            return null;
        var tile = tiles.splice(game_1.Game.rand(0, tiles.length - 1, random_1.Random.rand), 1)[0];
        return { x: tile.x, y: tile.y };
    };
    // Used in populateUpLadder, populateDownLadder, populateRopeHole, populateRopeCave
    Room.prototype.getRoomCenter = function () {
        return {
            x: Math.floor(this.roomX + this.width / 2),
            y: Math.floor(this.roomY + this.height / 2),
        };
    };
    // Many populate methods start with adding torches using the same pattern
    Room.prototype.addRandomTorches = function (intensity) {
        if (intensity === void 0) { intensity = "medium"; }
        var torchPatterns = {
            none: [0, 0, 0],
            low: [0, 0, 0, 1, 1],
            medium: [0, 0, 0, 1, 1, 2, 2, 3, 4],
            high: [1, 1, 2, 2, 3, 4, 4],
        };
        var randTorches = game_1.Game.randTable(torchPatterns[intensity], random_1.Random.rand);
        this.addTorches(randTorches, random_1.Random.rand);
    };
    // Used in populateDungeon, populateCave, etc. NOT IN USE
    Room.prototype.populateWithEntities = function (config) {
        var numEmptyTiles = this.getEmptyTiles().length;
        var numEnemies = Math.ceil(numEmptyTiles * config.enemyDensity);
        var numObstacles = Math.ceil(numEmptyTiles * config.obstacleDensity);
        var numPlants = Math.ceil(numEmptyTiles * config.plantDensity);
        this.addEnemies(numEnemies, random_1.Random.rand);
        this.addObstacles(numObstacles, random_1.Random.rand);
        this.addPlants(numPlants, random_1.Random.rand);
    };
    // Used in multiple methods including castShadowsAtAngle
    Room.prototype.isPositionInRoom = function (x, y) {
        return !(Math.floor(x) < this.roomX ||
            Math.floor(x) >= this.roomX + this.width ||
            Math.floor(y) < this.roomY ||
            Math.floor(y) >= this.roomY + this.height);
    };
    // Could encapsulate the common drawing logic NOT IN USE
    Room.prototype.drawLayer = function (delta, condition, method) {
        for (var x = this.roomX; x < this.roomX + this.width; x++) {
            for (var y = this.roomY; y < this.roomY + this.height; y++) {
                if (condition(x, y)) {
                    this.roomArray[x][y][method](delta);
                }
            }
        }
    };
    return Room;
}());
exports.Room = Room;


/***/ }),

/***/ "./src/sound.ts":
/*!**********************!*\
  !*** ./src/sound.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sound = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var Sound = /** @class */ (function () {
    function Sound() {
    }
    Sound.loadSounds = function () {
        Sound.playerStoneFootsteps = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.playerStoneFootsteps.push(new Audio("res/SFX/footsteps/stone/footstep" + i + ".wav"));
        });
        for (var _i = 0, _a = Sound.playerStoneFootsteps; _i < _a.length; _i++) {
            var f = _a[_i];
            f.volume = 1.0;
        }
        Sound.enemyFootsteps = new Array();
        [1, 2, 3, 4, 5].forEach(function (i) {
            return Sound.enemyFootsteps.push(new Audio("res/SFX/footsteps/enemy/enemyfootstep" + i + ".wav"));
        });
        for (var _b = 0, _c = Sound.enemyFootsteps; _b < _c.length; _b++) {
            var f = _c[_b];
            f.volume = 1.0;
        }
        Sound.hitSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.hitSounds.push(new Audio("res/SFX/attacks/swing" + i + ".wav"));
        });
        for (var _d = 0, _e = Sound.hitSounds; _d < _e.length; _d++) {
            var f = _e[_d];
            (f.volume = 0), f.load;
            //f.play();
        }
        Sound.enemySpawnSound = new Audio("res/SFX/attacks/enemyspawn.wav");
        Sound.enemySpawnSound.volume = 0.7;
        Sound.chestSounds = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.chestSounds.push(new Audio("res/SFX/chest/chest" + i + ".wav"));
        });
        for (var _f = 0, _g = Sound.chestSounds; _f < _g.length; _f++) {
            var f = _g[_f];
            f.volume = 0.5;
        }
        Sound.coinPickupSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.coinPickupSounds.push(new Audio("res/SFX/items/coins" + i + ".wav"));
        });
        for (var _h = 0, _j = Sound.coinPickupSounds; _h < _j.length; _h++) {
            var f = _j[_h];
            f.volume = 1.0;
        }
        Sound.miningSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.miningSounds.push(new Audio("res/SFX/resources/Pickaxe" + i + ".wav"));
        });
        for (var _k = 0, _l = Sound.miningSounds; _k < _l.length; _k++) {
            var f = _l[_k];
            f.volume = 0.3;
        }
        Sound.hurtSounds = new Array();
        [1].forEach(function (i) {
            return Sound.hurtSounds.push(new Audio("res/SFX/attacks/hurt1.wav"));
        });
        for (var _m = 0, _o = Sound.hurtSounds; _m < _o.length; _m++) {
            var f = _o[_m];
            f.volume = 0.3;
        }
        Sound.genericPickupSound = new Audio("res/SFX/items/pickup.wav");
        Sound.genericPickupSound.volume = 1.0;
        Sound.breakRockSound = new Audio("res/SFX/resources/rockbreak.wav");
        Sound.breakRockSound.volume = 1.0;
        Sound.pushSounds = new Array();
        [1, 2].forEach(function (i) {
            return Sound.pushSounds.push(new Audio("res/SFX/pushing/push" + i + ".wav"));
        });
        for (var _p = 0, _q = Sound.pushSounds; _p < _q.length; _p++) {
            var f = _q[_p];
            f.volume = 1.0;
        }
        Sound.healSound = new Audio("res/SFX/items/powerup1.wav");
        Sound.healSound.volume = 0.5;
        Sound.music = new Audio("res/bewitched.mp3");
        Sound.graveSound = new Audio("res/SFX/attacks/skelespawn.wav");
    };
    Sound.playerStoneFootstep = function () {
        var f = game_1.Game.randTable(Sound.playerStoneFootsteps, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.enemyFootstep = function () {
        var f = game_1.Game.randTable(Sound.enemyFootsteps, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.hit = function () {
        var f = game_1.Game.randTable(Sound.hitSounds, Math.random);
        f.play();
        f.currentTime = 0;
        setTimeout(function () {
            Sound.hurt();
        }, 100);
        //f = Game.randTable(Sound.hurtSounds, Math.random);
        //f.volume = 0.1;
        //f.play();
        //f.currentTime = 0;
        f.volume = 0.4;
    };
    Sound.hurt = function () {
        var f = game_1.Game.randTable(Sound.hurtSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.enemySpawn = function () {
        Sound.enemySpawnSound.play();
        Sound.enemySpawnSound.currentTime = 0;
    };
    Sound.chest = function () {
        var f = game_1.Game.randTable(Sound.chestSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.pickupCoin = function () {
        var f = game_1.Game.randTable(Sound.coinPickupSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.mine = function () {
        var f = game_1.Game.randTable(Sound.miningSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.breakRock = function () {
        setTimeout(function () {
            Sound.breakRockSound.play();
        }, 100);
        Sound.breakRockSound.currentTime = 0;
    };
    Sound.heal = function () {
        Sound.healSound.play();
        Sound.healSound.currentTime = 0;
    };
    Sound.genericPickup = function () {
        Sound.genericPickupSound.play();
        Sound.genericPickupSound.currentTime = 0;
    };
    Sound.push = function () {
        var f = game_1.Game.randTable(Sound.pushSounds, Math.random);
        f.play();
        f.currentTime = 0;
    };
    Sound.skeleSpawn = function () {
        Sound.graveSound.play();
        Sound.graveSound.currentTime = 0;
        Sound.graveSound.volume = 0.3;
    };
    Sound.playMusic = function () {
        Sound.music.addEventListener("ended", function () {
            Sound.music.currentTime = 0;
            Sound.music.play();
        }, false);
        //Sound.music.play();
    };
    return Sound;
}());
exports.Sound = Sound;


/***/ }),

/***/ "./src/textbox.ts":
/*!************************!*\
  !*** ./src/textbox.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextBox = void 0;
var TextBox = /** @class */ (function () {
    function TextBox(element) {
        var _this = this;
        this.allowedCharacters = "all";
        this.setEnterCallback = function (callback) {
            _this.enterCallback = callback;
        };
        this.setEscapeCallback = function (callback) {
            _this.escapeCallback = callback;
        };
        this.clear = function () {
            _this.text = "";
            _this.cursor = 0;
        };
        this.handleKeyPress = function (key) {
            var fontHas = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/".split("");
            if (key.length === 1) {
                key = key.toLowerCase();
                if (fontHas.includes(key)) {
                    if (_this.allowedCharacters === "all" ||
                        _this.allowedCharacters.includes(key)) {
                        _this.text =
                            _this.text.substring(0, _this.cursor) +
                                key +
                                _this.text.substring(_this.cursor, _this.text.length);
                        _this.cursor += 1;
                    }
                }
                return;
            }
            else {
                switch (key) {
                    case "Backspace":
                        _this.text =
                            _this.text.substring(0, _this.cursor - 1) +
                                _this.text.substring(_this.cursor, _this.text.length);
                        _this.cursor = Math.max(0, _this.cursor - 1);
                        break;
                    case "Delete":
                        _this.text =
                            _this.text.substring(0, _this.cursor) +
                                _this.text.substring(_this.cursor + 1, _this.text.length);
                        break;
                    case "ArrowLeft":
                        _this.cursor = Math.max(0, _this.cursor - 1);
                        break;
                    case "ArrowRight":
                        _this.cursor = Math.min(_this.text.length, _this.cursor + 1);
                        break;
                    case "Enter":
                        _this.enterCallback();
                        break;
                    case "Escape":
                        _this.escapeCallback();
                        break;
                }
            }
        };
        this.handleTouchStart = function (e) {
            _this.focus();
            e.preventDefault();
        };
        this.focus = function () {
            // Create a temporary input element to trigger the on-screen keyboard
            var tempInput = document.createElement("input");
            tempInput.type = "text";
            tempInput.style.position = "absolute";
            tempInput.style.opacity = "0";
            tempInput.style.zIndex = "-1"; // Ensure it doesn't interfere with the game UI
            document.body.appendChild(tempInput);
            tempInput.focus();
            tempInput.addEventListener("blur", function () {
                document.body.removeChild(tempInput);
            });
        };
        this.text = "";
        this.cursor = 0;
        this.enterCallback = function () { };
        this.escapeCallback = function () { };
        this.element = element;
        this.element.addEventListener("touchstart", this.handleTouchStart);
    }
    return TextBox;
}());
exports.TextBox = TextBox;


/***/ }),

/***/ "./src/tile/bones.ts":
/*!***************************!*\
  !*** ./src/tile/bones.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Bones = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var floor_1 = __webpack_require__(/*! ./floor */ "./src/tile/floor.ts");
var Bones = /** @class */ (function (_super) {
    __extends(Bones, _super);
    function Bones() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(7, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return Bones;
}(floor_1.Floor));
exports.Bones = Bones;


/***/ }),

/***/ "./src/tile/button.ts":
/*!****************************!*\
  !*** ./src/tile/button.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Button = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button(room, x, y, linkedDoor) {
        var _this = _super.call(this, room, x, y) || this;
        _this.press = function () {
            _this.pressed = true;
            _this.linkedDoor.opened = true;
        };
        _this.unpress = function () {
            _this.pressed = false;
            _this.linkedDoor.opened = false;
        };
        /*onCollide = (player: Player) => {
          this.press();
        };
      
        onCollideEnemy = (enemy: Enemy) => {
          this.press();
        };*/
        _this.tickEnd = function () {
            _this.unpress();
            for (var i in _this.room.game.players) {
                if (_this.room.game.players[i].x === _this.x && _this.room.game.players[i].y === _this.y)
                    _this.press();
            }
            for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.x === _this.x && e.y === _this.y)
                    _this.press();
            }
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, 0, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            if (_this.pressed)
                game_1.Game.drawTile(18, 0, 1, 1, _this.x, _this.y, _this.w, _this.h, _this.room.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(17, 0, 1, 1, _this.x, _this.y, _this.w, _this.h, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.w = 1;
        _this.h = 1;
        _this.pressed = false;
        _this.turnsSincePressed = 1;
        _this.linkedDoor = linkedDoor;
        return _this;
    }
    return Button;
}(tile_1.Tile));
exports.Button = Button;


/***/ }),

/***/ "./src/tile/chasm.ts":
/*!***************************!*\
  !*** ./src/tile/chasm.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Chasm = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Chasm = /** @class */ (function (_super) {
    __extends(Chasm, _super);
    function Chasm(room, x, y, leftEdge, rightEdge, topEdge, bottomEdge) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function (delta) {
            if (_this.topEdge)
                game_1.Game.drawTile(22, 0, 1, 2, _this.x, _this.y, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(_this.tileX, _this.tileY, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.tileX = _this.skin === 1 ? 24 : 20;
        _this.tileY = 1;
        if (leftEdge)
            _this.tileX--;
        else if (rightEdge)
            _this.tileX++;
        if (topEdge)
            _this.tileY--;
        else if (bottomEdge)
            _this.tileY++;
        _this.topEdge = topEdge;
        return _this;
    }
    return Chasm;
}(tile_1.Tile));
exports.Chasm = Chasm;


/***/ }),

/***/ "./src/tile/coffinTile.ts":
/*!********************************!*\
  !*** ./src/tile/coffinTile.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoffinTile = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var CoffinTile = /** @class */ (function (_super) {
    __extends(CoffinTile, _super);
    function CoffinTile(room, x, y, subTileY) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function (delta) {
            if (_this.subTileY === 0) {
                game_1.Game.drawTile(0, 5, 1, 1, _this.x - 1, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 5, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 5, 1, 1, _this.x + 1, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(0, 6, 1, 1, _this.x - 1, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 6, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 6, 1, 1, _this.x + 1, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            }
            else {
                game_1.Game.drawTile(0, 7, 1, 1, _this.x - 1, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(1, 7, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawTile(2, 7, 1, 1, _this.x + 1, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.subTileY = subTileY;
        return _this;
    }
    return CoffinTile;
}(tile_1.Tile));
exports.CoffinTile = CoffinTile;


/***/ }),

/***/ "./src/tile/door.ts":
/*!**************************!*\
  !*** ./src/tile/door.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Door = exports.DoorType = exports.DoorDir = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var key_1 = __webpack_require__(/*! ../item/key */ "./src/item/key.ts");
var DoorDir;
(function (DoorDir) {
    DoorDir[DoorDir["North"] = 0] = "North";
    DoorDir[DoorDir["East"] = 1] = "East";
    DoorDir[DoorDir["South"] = 2] = "South";
    DoorDir[DoorDir["West"] = 3] = "West";
})(DoorDir = exports.DoorDir || (exports.DoorDir = {}));
var DoorType;
(function (DoorType) {
    DoorType[DoorType["DOOR"] = 0] = "DOOR";
    DoorType[DoorType["LOCKEDDOOR"] = 1] = "LOCKEDDOOR";
    DoorType[DoorType["GUARDEDDOOR"] = 2] = "GUARDEDDOOR";
})(DoorType = exports.DoorType || (exports.DoorType = {}));
var Door = /** @class */ (function (_super) {
    __extends(Door, _super);
    function Door(room, game, x, y, dir, doorType) {
        var _this = _super.call(this, room, x, y) || this;
        _this.guard = function () {
            _this.type = DoorType.GUARDEDDOOR;
            _this.locked = true;
            _this.iconTileX = 9;
            _this.iconXOffset = 1 / 32;
        };
        _this.lock = function () {
            _this.type = DoorType.LOCKEDDOOR;
            _this.locked = true;
            _this.iconTileX = 10;
            _this.iconXOffset = 1 / 32;
        };
        _this.removeLock = function () {
            _this.type = DoorType.DOOR;
            _this.locked = false;
            _this.iconTileX = 2;
            _this.iconXOffset = 0;
        };
        _this.canUnlock = function (player) {
            if (_this.type === DoorType.LOCKEDDOOR) {
                var k = player.inventory.hasItem(key_1.Key);
                if (k !== null) {
                    _this.game.pushMessage("You use the key to unlock the door.");
                    return true;
                }
                else
                    _this.game.pushMessage("The door is locked tightly and won't budge.");
                return false;
            }
            if (_this.type === DoorType.GUARDEDDOOR) {
                _this.game.pushMessage("There are still remaining foes guarding this door...");
                return false;
            }
        };
        _this.unlock = function (player) {
            if (_this.type === DoorType.LOCKEDDOOR) {
                var k = player.inventory.hasItem(key_1.Key);
                if (k !== null) {
                    // remove key
                    player.inventory.removeItem(k);
                    _this.removeLock();
                }
            }
        };
        _this.unGuard = function () {
            if (_this.type === DoorType.GUARDEDDOOR) {
                _this.removeLock();
                _this.game.tutorialActive = false;
            }
        };
        _this.link = function (other) {
            _this.linkedDoor = other;
        };
        _this.isSolid = function () {
            if (_this.locked) {
                return true;
            }
            else
                false;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.onCollide = function (player) {
            _this.opened = true;
            _this.linkedDoor.opened = true;
            if (_this.doorDir === DoorDir.North || _this.doorDir === DoorDir.South) {
                _this.game.changeLevelThroughDoor(player, _this.linkedDoor);
            }
            else
                _this.game.changeLevelThroughDoor(player, _this.linkedDoor, _this.linkedDoor.room.roomX - _this.room.roomX > 0 ? 1 : -1);
            _this.linkedDoor.locked = false;
            _this.linkedDoor.type = DoorType.DOOR;
        };
        _this.draw = function (delta) {
            if (_this.doorDir === DoorDir.North) {
                //if top door
                if (_this.opened)
                    game_1.Game.drawTile(6, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                else
                    game_1.Game.drawTile(3, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            }
            if (_this.doorDir !== DoorDir.North)
                //if not top door
                game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            //the following used to be in the drawaboveplayer function
            if (_this.doorDir === DoorDir.North) {
                //if top door
                if (!_this.opened)
                    game_1.Game.drawTile(13, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                else
                    game_1.Game.drawTile(14, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawAbovePlayer = function (delta) { };
        _this.drawAboveShading = function (delta) {
            if (_this.doorDir === DoorDir.North) {
                //if top door
                game_1.Game.drawFX(_this.iconTileX, 2, 1, 1, _this.x + _this.iconXOffset, _this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1);
            }
            else {
                game_1.Game.drawFX(_this.iconTileX, 2, 1, 1, _this.x + _this.iconXOffset, _this.y - 1.25 + 0.125 * Math.sin(0.006 * Date.now()), 1, 1); //if not top door
            }
        };
        _this.game = game;
        _this.opened = false;
        _this.doorDir = dir;
        _this.locked = false;
        _this.isDoor = true;
        _this.type = doorType;
        _this.iconTileX = 2;
        _this.iconXOffset = 0;
        switch (_this.type) {
            case DoorType.GUARDEDDOOR:
                _this.guard();
                break;
            case DoorType.LOCKEDDOOR:
                _this.lock();
                break;
            case DoorType.DOOR:
                _this.removeLock();
                break;
        }
        return _this;
    }
    return Door;
}(tile_1.Tile));
exports.Door = Door;


/***/ }),

/***/ "./src/tile/downLadder.ts":
/*!********************************!*\
  !*** ./src/tile/downLadder.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownLadder = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var upLadder_1 = __webpack_require__(/*! ./upLadder */ "./src/tile/upLadder.ts");
var DownLadder = /** @class */ (function (_super) {
    __extends(DownLadder, _super);
    function DownLadder(room, game, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isRope = false;
        _this.generate = function () {
            // called by Game during transition
            if (!_this.linkedLevel) {
                _this.linkedLevel = _this.game.levelgen.generate(_this.game, _this.room.depth + (_this.isRope ? 0 : 1), _this.isRope);
                for (var x = _this.linkedLevel.roomX; x < _this.linkedLevel.roomX + _this.linkedLevel.width; x++) {
                    for (var y = _this.linkedLevel.roomY; y < _this.linkedLevel.roomY + _this.linkedLevel.height; y++) {
                        var tile = _this.linkedLevel.roomArray[x][y];
                        if (tile instanceof upLadder_1.UpLadder && tile.isRope)
                            tile.linkedLevel = _this.room;
                    }
                }
            }
        };
        _this.onCollide = function (player) {
            if (_this.isRope)
                _this.game.changeLevelThroughLadder(player, _this);
            else {
                var allPlayersHere = true;
                for (var i in _this.game.players) {
                    if (_this.game.rooms[_this.game.players[i].levelID] !== _this.room || _this.game.players[i].x !== _this.x || _this.game.players[i].y !== _this.y) {
                        allPlayersHere = false;
                    }
                }
                if (allPlayersHere) {
                    _this.generate();
                    for (var i in _this.game.players) {
                        _this.game.changeLevelThroughLadder(_this.game.players[i], _this);
                    }
                }
                else {
                    if (player === _this.game.players[_this.game.localPlayerID])
                        _this.game.chat.push(new game_1.ChatMessage('all players must be present'));
                }
            }
        };
        _this.draw = function (delta) {
            var xx = 4;
            if (_this.isRope)
                xx = 16;
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(xx, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function (delta) { };
        _this.game = game;
        _this.linkedLevel = null;
        return _this;
    }
    return DownLadder;
}(tile_1.Tile));
exports.DownLadder = DownLadder;


/***/ }),

/***/ "./src/tile/floor.ts":
/*!***************************!*\
  !*** ./src/tile/floor.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Floor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Floor = /** @class */ (function (_super) {
    __extends(Floor, _super);
    function Floor(room, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(_this.variation, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.variation = 1;
        if (_this.skin == tile_1.SkinType.DUNGEON)
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        if (_this.skin == tile_1.SkinType.CAVE)
            //this.variation = Game.randTable([1, 1, 1, 1, 8, 9, 10, 12], Math.random);
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        return _this;
    }
    return Floor;
}(tile_1.Tile));
exports.Floor = Floor;


/***/ }),

/***/ "./src/tile/fountainTile.ts":
/*!**********************************!*\
  !*** ./src/tile/fountainTile.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FountainTile = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var FountainTile = /** @class */ (function (_super) {
    __extends(FountainTile, _super);
    function FountainTile(room, x, y, subTileX, subTileY) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(_this.subTileX, 2 + _this.subTileY, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.subTileX = subTileX;
        _this.subTileY = subTileY;
        return _this;
    }
    return FountainTile;
}(tile_1.Tile));
exports.FountainTile = FountainTile;


/***/ }),

/***/ "./src/tile/insideLevelDoor.ts":
/*!*************************************!*\
  !*** ./src/tile/insideLevelDoor.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InsideLevelDoor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var InsideLevelDoor = /** @class */ (function (_super) {
    __extends(InsideLevelDoor, _super);
    function InsideLevelDoor(room, game, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isSolid = function () {
            return !_this.opened;
        };
        _this.canCrushEnemy = function () {
            return !_this.opened;
        };
        _this.isOpaque = function () {
            return !_this.opened;
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, 0, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            if (_this.opened)
                game_1.Game.drawTile(15, 1, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(3, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function (delta) {
            if (!_this.opened)
                game_1.Game.drawTile(13, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            else
                game_1.Game.drawTile(14, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.game = game;
        _this.opened = false;
        return _this;
    }
    return InsideLevelDoor;
}(tile_1.Tile));
exports.InsideLevelDoor = InsideLevelDoor;


/***/ }),

/***/ "./src/tile/spawnfloor.ts":
/*!********************************!*\
  !*** ./src/tile/spawnfloor.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpawnFloor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var SpawnFloor = /** @class */ (function (_super) {
    __extends(SpawnFloor, _super);
    function SpawnFloor(room, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(_this.variation, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.variation = 1;
        if (_this.skin == tile_1.SkinType.DUNGEON)
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        if (_this.skin == tile_1.SkinType.CAVE)
            //this.variation = Game.randTable([1, 1, 1, 1, 8, 9, 10, 12], Math.random);
            _this.variation = game_1.Game.randTable([1, 1, 1, 1, 1, 1, 8, 8, 8, 9, 10, 10, 10, 10, 10, 12], Math.random);
        return _this;
    }
    return SpawnFloor;
}(tile_1.Tile));
exports.SpawnFloor = SpawnFloor;


/***/ }),

/***/ "./src/tile/spike.ts":
/*!***************************!*\
  !*** ./src/tile/spike.ts ***!
  \***************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spike = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Spike = /** @class */ (function (_super) {
    __extends(Spike, _super);
    function Spike() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onCollide = function (player) {
            player.hurt(1, "spike");
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(11, 0, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        return _this;
    }
    return Spike;
}(tile_1.Tile));
exports.Spike = Spike;


/***/ }),

/***/ "./src/tile/spiketrap.ts":
/*!*******************************!*\
  !*** ./src/tile/spiketrap.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SpikeTrap = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var crate_1 = __webpack_require__(/*! ../entity/object/crate */ "./src/entity/object/crate.ts");
var barrel_1 = __webpack_require__(/*! ../entity/object/barrel */ "./src/entity/object/barrel.ts");
var hitWarning_1 = __webpack_require__(/*! ../hitWarning */ "./src/hitWarning.ts");
var SpikeTrap = /** @class */ (function (_super) {
    __extends(SpikeTrap, _super);
    function SpikeTrap(room, x, y, tickCount) {
        var _this = _super.call(this, room, x, y) || this;
        _this.tick = function () {
            _this.tickCount++;
            if (_this.tickCount >= 4)
                _this.tickCount = 0;
            _this.on = _this.tickCount === 0;
            if (_this.on) {
                for (var i in _this.room.game.players) {
                    if (_this.room ===
                        _this.room.game.rooms[_this.room.game.players[i].levelID] &&
                        _this.room.game.players[i].x === _this.x &&
                        _this.room.game.players[i].y === _this.y)
                        _this.room.game.players[i].hurt(1, "spike trap");
                }
            }
            if (_this.tickCount === 3)
                _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.room.game, _this.x, _this.y, _this.x, _this.y, false));
        };
        _this.tickEnd = function () {
            if (_this.on) {
                for (var _i = 0, _a = _this.room.entities; _i < _a.length; _i++) {
                    var e = _a[_i];
                    if (e.x === _this.x && e.y === _this.y) {
                        e.hurt(null, 1);
                    }
                }
            }
        };
        _this.onCollideEnemy = function (enemy) {
            if (_this.on && !(enemy instanceof crate_1.Crate || enemy instanceof barrel_1.Barrel))
                enemy.hurt(null, 1);
        };
        _this.draw = function (delta) {
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            var rumbleOffsetX = 0;
            _this.t += delta;
            if (!_this.on && _this.tickCount === 3) {
                if (Math.floor(_this.t) % 4 === 1)
                    rumbleOffsetX = 0.0325;
                if (Math.floor(_this.t) % 4 === 3)
                    rumbleOffsetX = -0.0325;
            }
            var frames = [0, 1, 2, 3, 3, 4, 2, 0];
            var f = 6 + frames[Math.floor(_this.frame)];
            if (_this.tickCount === 1 ||
                (_this.tickCount === 0 && frames[Math.floor(_this.frame)] === 0)) {
                f = 5;
            }
            game_1.Game.drawObj(f, 0, 1, 2, _this.x + rumbleOffsetX, _this.y - 1, 1, 2, _this.room.shadeColor, _this.shadeAmount());
            if (_this.on && _this.frame < frames.length - 1) {
                if (frames[Math.floor(_this.frame)] < 3)
                    _this.frame += 0.4 * delta;
                else
                    _this.frame += 0.2 * delta;
            }
            if (!_this.on)
                _this.frame = 0;
        };
        if (tickCount)
            _this.tickCount = tickCount;
        else
            _this.tickCount = 0;
        _this.on = false;
        _this.frame = 0;
        _this.t = 0;
        return _this;
    }
    return SpikeTrap;
}(tile_1.Tile));
exports.SpikeTrap = SpikeTrap;


/***/ }),

/***/ "./src/tile/tile.ts":
/*!**************************!*\
  !*** ./src/tile/tile.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Tile = exports.SkinType = void 0;
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var SkinType;
(function (SkinType) {
    SkinType[SkinType["DUNGEON"] = 0] = "DUNGEON";
    SkinType[SkinType["CAVE"] = 1] = "CAVE";
})(SkinType = exports.SkinType || (exports.SkinType = {}));
var Tile = /** @class */ (function (_super) {
    __extends(Tile, _super);
    function Tile(room, x, y) {
        var _this = _super.call(this) || this;
        _this.hasPlayer = function (player) {
            if (player.x === _this.x && player.y === _this.y)
                return true;
            else
                return false;
        };
        _this.shadeAmount = function () {
            return _this.room.softVis[_this.x][_this.y];
        };
        _this.isSolid = function () {
            return false;
        };
        _this.canCrushEnemy = function () {
            return false;
        };
        _this.isOpaque = function () {
            return false;
        };
        _this.onCollide = function (player) { };
        _this.onCollideEnemy = function (enemy) { };
        _this.tick = function () { };
        _this.tickEnd = function () { };
        _this.draw = function (delta) { };
        _this.drawUnderPlayer = function (delta) { };
        _this.drawAbovePlayer = function (delta) { };
        _this.drawAboveShading = function (delta) { };
        _this.skin = room.skin;
        _this.room = room;
        _this.x = x;
        _this.y = y;
        _this.drawableY = y;
        _this.isDoor = false;
        return _this;
    }
    return Tile;
}(drawable_1.Drawable));
exports.Tile = Tile;


/***/ }),

/***/ "./src/tile/trapdoor.ts":
/*!******************************!*\
  !*** ./src/tile/trapdoor.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Trapdoor = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Trapdoor = /** @class */ (function (_super) {
    __extends(Trapdoor, _super);
    function Trapdoor(room, game, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.draw = function (delta) {
            game_1.Game.drawTile(13, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.onCollide = function (player) {
            // TODO
        };
        _this.game = game;
        return _this;
    }
    return Trapdoor;
}(tile_1.Tile));
exports.Trapdoor = Trapdoor;


/***/ }),

/***/ "./src/tile/upLadder.ts":
/*!******************************!*\
  !*** ./src/tile/upLadder.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpLadder = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var UpLadder = /** @class */ (function (_super) {
    __extends(UpLadder, _super);
    function UpLadder(room, game, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isRope = false;
        _this.onCollide = function (player) {
            _this.game.changeLevelThroughLadder(player, _this);
        };
        _this.draw = function (delta) {
            var xx = 29;
            var yy = 0;
            if (_this.isRope) {
                xx = 16;
                yy = 1;
            }
            game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            if (!_this.isRope)
                game_1.Game.drawTile(xx, yy, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(xx, yy + 1, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.drawAbovePlayer = function (delta) {
            if (_this.isRope)
                game_1.Game.drawTile(16, 1, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.game = game;
        return _this;
    }
    return UpLadder;
}(tile_1.Tile));
exports.UpLadder = UpLadder;


/***/ }),

/***/ "./src/tile/wall.ts":
/*!**************************!*\
  !*** ./src/tile/wall.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Wall = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var Wall = /** @class */ (function (_super) {
    __extends(Wall, _super);
    function Wall(room, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            var wallInfo = _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
            if (!wallInfo)
                return true;
            return (!wallInfo.isTopWall && !wallInfo.isInnerWall) || (wallInfo.isLeftWall || wallInfo.isRightWall);
        };
        _this.draw = function (delta) {
            var wallInfo = _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
            if (!wallInfo)
                return;
            // Set tileYOffset based on inner wall type
            _this.tileYOffset =
                wallInfo.innerWallType === "bottomInner" ||
                    wallInfo.innerWallType === "surroundedInner"
                    ? 0
                    : 6;
            // Only draw the bottom part of the wall if it's not at the bottom edge of the room
            if (wallInfo.isDoorWall ||
                wallInfo.isBelowDoorWall ||
                (wallInfo.isTopWall && !wallInfo.isLeftWall && !wallInfo.isRightWall) ||
                wallInfo.isInnerWall)
                game_1.Game.drawTile(0, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.room.softVis[_this.x][_this.y + 1]);
            game_1.Game.drawTile(2, _this.skin + _this.tileYOffset, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.drawAboveShading = function (delta) {
            var wallInfo = _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
            if (!wallInfo)
                return;
            if (wallInfo.isBottomWall || wallInfo.isBelowDoorWall || wallInfo.isAboveDoorWall) {
                game_1.Game.drawTile(2, _this.skin + _this.tileYOffset, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.room.softVis[_this.x][_this.y + 1]);
            }
        };
        _this.isDoor = false;
        _this.tileYOffset = 6;
        return _this;
    }
    return Wall;
}(tile_1.Tile));
exports.Wall = Wall;


/***/ }),

/***/ "./src/tile/wallTorch.ts":
/*!*******************************!*\
  !*** ./src/tile/wallTorch.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WallTorch = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var lightSource_1 = __webpack_require__(/*! ../lightSource */ "./src/lightSource.ts");
var WallTorch = /** @class */ (function (_super) {
    __extends(WallTorch, _super);
    function WallTorch(room, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            var wallInfo = _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
            if (!wallInfo)
                return true;
            return ((!wallInfo.isTopWall && !wallInfo.isInnerWall) ||
                wallInfo.isLeftWall ||
                wallInfo.isRightWall);
        };
        _this.draw = function (delta) {
            var wallInfo = _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
            if (!wallInfo)
                _this.tileYOffset = 6;
            _this.frame += 0.3 * delta;
            if (_this.frame >= 12)
                _this.frame = 0;
            _this.tileYOffset =
                wallInfo.innerWallType === "bottomInner" ||
                    wallInfo.innerWallType === "surroundedInner"
                    ? 0
                    : 6;
            game_1.Game.drawTile(0, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            game_1.Game.drawTile(2, _this.skin + _this.tileYOffset, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            game_1.Game.drawFX(Math.floor(_this.frame), 32, 1, 2, _this.x, _this.y - 1, 1, 2);
        };
        _this.room.lightSources.push(new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 1, [200, 25, 5], 0.5));
        _this.frame = Math.random() * 12;
        _this.tileYOffset = 6;
        return _this;
    }
    return WallTorch;
}(tile_1.Tile));
exports.WallTorch = WallTorch;


/***/ }),

/***/ "./src/tutorialListener.ts":
/*!*********************************!*\
  !*** ./src/tutorialListener.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TutorialListener = void 0;
var eventBus_1 = __webpack_require__(/*! ./eventBus */ "./src/eventBus.ts");
var TutorialListener = /** @class */ (function () {
    function TutorialListener(game) {
        this.seenEnemies = new Set();
        this.pendingNewEnemies = new Set();
        this.tutorialCreationTimeout = null;
        //console.log("Tutorial constructor called");
        this.setupEventListeners();
        this.game = game;
    }
    TutorialListener.prototype.setupEventListeners = function () {
        //console.log("Setting up event listeners");
        eventBus_1.globalEventBus.on("EnemySeenPlayer", this.handleEnemySeen.bind(this));
    };
    TutorialListener.prototype.handleEnemySeen = function (data) {
        if (!this.hasSeenEnemy(data.enemyType)) {
            this.game.pushMessage("New enemy encountered: ".concat(data.enemyName));
            this.addSeenEnemy(data.enemyType);
            this.pendingNewEnemies.add(data.enemyType);
            this.scheduleTutorialCreation();
        }
        else {
        }
    };
    TutorialListener.prototype.scheduleTutorialCreation = function () {
        var _this = this;
        if (this.tutorialCreationTimeout === null) {
            this.tutorialCreationTimeout = setTimeout(function () {
                _this.createTutorialRoom(Array.from(_this.pendingNewEnemies));
                _this.game.pushMessage("Defeat the enemies guarding the exits.");
                _this.pendingNewEnemies.clear();
                _this.tutorialCreationTimeout = null;
            }, 100); // Wait 100ms to collect all new enemies
        }
    };
    TutorialListener.prototype.createTutorialRoom = function (enemyTypes) {
        /*
        this.game.tutorialActive = true;
        this.game.room.doors.forEach((door: Door) => {
          door.guard();
        });
        */
    };
    // Method to check if an enemy has been seen before
    TutorialListener.prototype.hasSeenEnemy = function (enemyType) {
        //console.log(`Checking if enemy has been seen: ${enemyType}`);
        return this.seenEnemies.has(enemyType);
    };
    // Method to manually add an enemy to the seen list (useful for testing or manual control)
    TutorialListener.prototype.addSeenEnemy = function (enemyType) {
        //console.log(`Adding enemy to seen list: ${enemyType}`);
        this.seenEnemies.add(enemyType);
    };
    // Method to reset the seen enemies list (useful for testing or game resets)
    TutorialListener.prototype.resetSeenEnemies = function () {
        //console.log("Resetting seen enemies list");
        this.seenEnemies.clear();
    };
    // Method to clean up event listeners when needed
    TutorialListener.prototype.cleanup = function () {
        //console.log("Cleaning up event listeners");
        eventBus_1.globalEventBus.off("EnemySeenPlayer", this.handleEnemySeen.bind(this));
    };
    return TutorialListener;
}());
exports.TutorialListener = TutorialListener;


/***/ }),

/***/ "./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Utils = void 0;
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.distance = function (startX, startY, endX, endY) {
        return Math.sqrt(Math.pow((endX - startX), 2) + Math.pow((endY - startY), 2));
    };
    Utils.calculateExponentialFalloff = function (distance, falloffRate) {
        return Math.exp(-falloffRate * distance);
    };
    return Utils;
}());
exports.Utils = Utils;


/***/ }),

/***/ "./src/weapon/dagger.ts":
/*!******************************!*\
  !*** ./src/weapon/dagger.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Dagger = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var Dagger = /** @class */ (function (_super) {
    __extends(Dagger, _super);
    function Dagger(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tileX = 22;
        _this.tileY = 0;
        _this.name = "Dagger";
        return _this;
    }
    return Dagger;
}(weapon_1.Weapon));
exports.Dagger = Dagger;


/***/ }),

/***/ "./src/weapon/dualdagger.ts":
/*!**********************************!*\
  !*** ./src/weapon/dualdagger.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DualDagger = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var DualDagger = /** @class */ (function (_super) {
    __extends(DualDagger, _super);
    function DualDagger(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tickInInventory = function () {
            _this.firstAttack = true;
        };
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
                    e.hurt(_this.wielder, 1);
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.room)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                if (_this.firstAttack)
                    _this.game.rooms[_this.wielder.levelID].entities = _this.game.rooms[_this.wielder.levelID].entities.filter(function (e) { return !e.dead; });
                else
                    _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
                if (_this.firstAttack)
                    _this.firstAttack = false;
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "Dual Daggers\nOne extra attack per turn";
        };
        _this.tileX = 23;
        _this.tileY = 0;
        _this.firstAttack = true;
        _this.name = "Dual Dagger";
        return _this;
    }
    return DualDagger;
}(weapon_1.Weapon));
exports.DualDagger = DualDagger;


/***/ }),

/***/ "./src/weapon/pickaxe.ts":
/*!*******************************!*\
  !*** ./src/weapon/pickaxe.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Pickaxe = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var Pickaxe = /** @class */ (function (_super) {
    __extends(Pickaxe, _super);
    function Pickaxe(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tileX = 30;
        _this.tileY = 0;
        _this.canMine = true;
        return _this;
    }
    return Pickaxe;
}(weapon_1.Weapon));
exports.Pickaxe = Pickaxe;


/***/ }),

/***/ "./src/weapon/shotgun.ts":
/*!*******************************!*\
  !*** ./src/weapon/shotgun.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Shotgun = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var genericParticle_1 = __webpack_require__(/*! ../particle/genericParticle */ "./src/particle/genericParticle.ts");
var Shotgun = /** @class */ (function (_super) {
    __extends(Shotgun, _super);
    function Shotgun(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var newX2 = 2 * newX - _this.wielder.x;
            var newY2 = 2 * newY - _this.wielder.y;
            var newX3 = 3 * newX - 2 * _this.wielder.x;
            var newY3 = 3 * newY - 2 * _this.wielder.y;
            var range = 3;
            if (!_this.game.rooms[_this.wielder.levelID].tileInside(newX, newY) ||
                _this.game.rooms[_this.wielder.levelID].roomArray[newX][newY].isSolid())
                //if current position is inside new position OR is solid
                return true;
            else if (!_this.game.rooms[_this.wielder.levelID].tileInside(newX2, newY2) ||
                _this.game.rooms[_this.wielder.levelID].roomArray[newX2][newY2].isSolid())
                //if current position is inside new position 2 OR is solid
                //set range as one
                range = 1;
            else if (!_this.game.rooms[_this.wielder.levelID].tileInside(newX3, newY3) ||
                _this.game.rooms[_this.wielder.levelID].roomArray[newX3][newY3].isSolid())
                //if current position is inside new position 3 OR is solid
                //set range as two
                range = 2;
            var enemyHitCandidates = [];
            var firstPushable = 4;
            var firstNonPushable = 5;
            var firstNonDestroyable = 5;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].entities; _i < _a.length; _i++) {
                var e = _a[_i];
                //loop through enemies in this weapons wielders level
                if (e.pushable) {
                    //case for pushables
                    if (e.pointIn(newX, newY))
                        return true;
                    //if pushable is in new position return true
                    if (e.pointIn(newX2, newY2) && range >= 2) {
                        enemyHitCandidates.push({ enemy: e, dist: 2 });
                        firstPushable = 2;
                        //if pushable is in position 2 set firstPushable var
                    }
                    if (e.pointIn(newX3, newY3) && range >= 3) {
                        enemyHitCandidates.push({ enemy: e, dist: 3 });
                        firstPushable = Math.min(firstPushable, 3);
                        //if pushable is in position 3 set firstPushable to min of firstPushable and 3
                    }
                }
                else if (e.destroyable) {
                    //case for destroyables
                    if (e.pointIn(newX, newY) && range >= 1) {
                        firstNonPushable = 1;
                        enemyHitCandidates.push({ enemy: e, dist: 1 });
                    }
                    //if enemy is in new position and range is enough push enemy to hit candidate array
                    if (e.pointIn(newX2, newY2) && range >= 2) {
                        firstNonPushable = Math.min(firstNonPushable, 2);
                        enemyHitCandidates.push({ enemy: e, dist: 2 });
                    }
                    //if enemy is in new position 2 and range is enough push enemy to hit candidate array
                    if (e.pointIn(newX3, newY3) && range >= 3) {
                        firstNonPushable = Math.min(firstNonPushable, 3);
                        enemyHitCandidates.push({ enemy: e, dist: 3 });
                    }
                    //if enemy is in new position 3 and range is enough push enemy to hit candidate array
                }
                else {
                    if (e.pointIn(newX, newY) && range >= 1) {
                        firstNonDestroyable = 1;
                    }
                    //if enemy is in new position and range is enough set first non destroyable to 1
                    if (e.pointIn(newX2, newY2) && range >= 2) {
                        firstNonDestroyable = Math.min(firstNonDestroyable, 2);
                    }
                    //if enemy is in new position and range is enough set first non destroyable to 2
                    if (e.pointIn(newX3, newY3) && range >= 3) {
                        firstNonDestroyable = Math.min(firstNonDestroyable, 3);
                    }
                    //if enemy is in new position and range is enough set first non destroyable to 3
                }
            }
            var targetX = newX3;
            var targetY = newY3;
            if (firstNonDestroyable < firstNonPushable &&
                firstNonDestroyable < firstPushable
            //if a non destroyable comes before the first non pushable and before the first pushable
            ) {
                return true;
                //return true and exit the function
            }
            if (firstNonPushable <= firstPushable) {
                for (var _b = 0, enemyHitCandidates_1 = enemyHitCandidates; _b < enemyHitCandidates_1.length; _b++) {
                    var c = enemyHitCandidates_1[_b];
                    var e = c.enemy;
                    var d = c.dist;
                    if (d === 3)
                        e.hurt(_this.wielder, 0.5);
                    else
                        e.hurt(_this.wielder, 1);
                }
                //finally bro
                //for the array c of enemyHitCandidates if the enemy distance is 3 only do .5 damage
                //if they're closer do the usual damage
                //hits all candidates in enemyHitCandidates
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.room)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                genericParticle_1.GenericParticle.shotgun(_this.game.rooms[_this.wielder.levelID], _this.wielder.x + 0.5, _this.wielder.y, targetX + 0.5, targetY, "black");
                genericParticle_1.GenericParticle.shotgun(_this.game.rooms[_this.wielder.levelID], _this.wielder.x + 0.5, _this.wielder.y, targetX + 0.5, targetY, "#ffddff");
                var gp = new genericParticle_1.GenericParticle(_this.game.rooms[_this.wielder.levelID], 0.5 * (newX + _this.wielder.x) + 0.5, 0.5 * (newY + _this.wielder.y), 0, 1, 0, 0, 0, "white", 0);
                gp.expirationTimer = 10;
                _this.game.rooms[_this.wielder.levelID].particles.push(gp);
                //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX, newY));
                //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX2, newY2));
                //this.game.levels[this.wielder.levelID].particles.push(new SlashParticle(newX3, newY3));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
                return false;
            }
            return true;
        };
        _this.tileX = 26;
        _this.tileY = 0;
        _this.name = "Shotgun";
        return _this;
    }
    return Shotgun;
}(weapon_1.Weapon));
exports.Shotgun = Shotgun;


/***/ }),

/***/ "./src/weapon/spear.ts":
/*!*****************************!*\
  !*** ./src/weapon/spear.ts ***!
  \*****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spear = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var Spear = /** @class */ (function (_super) {
    __extends(Spear, _super);
    function Spear(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var newX2 = 2 * newX - _this.wielder.x;
            var newY2 = 2 * newY - _this.wielder.y;
            var flag = false;
            var enemyHitCandidates = [];
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable) {
                    if (e.pointIn(newX, newY)) {
                        if (e.pushable)
                            return true;
                        else {
                            e.hurt(_this.wielder, 1);
                            flag = true;
                        }
                    }
                    if (e.pointIn(newX2, newY2) &&
                        !_this.game.rooms[_this.wielder.levelID].roomArray[newX][newY].isSolid()) {
                        if (!e.pushable)
                            enemyHitCandidates.push(e);
                    }
                }
            }
            if (!flag && enemyHitCandidates.length > 0) {
                for (var _b = 0, enemyHitCandidates_1 = enemyHitCandidates; _b < enemyHitCandidates_1.length; _b++) {
                    var e = enemyHitCandidates_1[_b];
                    e.hurt(_this.wielder, 1);
                }
                if (_this.wielder.game.room === _this.wielder.game.rooms[_this.wielder.levelID])
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX2, newY2));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
                return false;
            }
            if (flag) {
                if (_this.wielder.game.room === _this.wielder.game.rooms[_this.wielder.levelID])
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
            }
            return !flag;
        };
        _this.tileX = 24;
        _this.tileY = 0;
        _this.name = "Spear";
        return _this;
    }
    return Spear;
}(weapon_1.Weapon));
exports.Spear = Spear;


/***/ }),

/***/ "./src/weapon/spellbook.ts":
/*!*********************************!*\
  !*** ./src/weapon/spellbook.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Spellbook = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var playerFireball_1 = __webpack_require__(/*! ../projectile/playerFireball */ "./src/projectile/playerFireball.ts");
var Spellbook = /** @class */ (function (_super) {
    __extends(Spellbook, _super);
    function Spellbook(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            var difX = newX - _this.x;
            var difY = newY - _this.y;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if ((e.destroyable || e.pushable) &&
                    e.pointIn(newX, newY) &&
                    !_this.game.rooms[_this.wielder.levelID].roomArray[e.x][e.y].isSolid()) {
                    e.hurt(_this.wielder, 1);
                    _this.game.rooms[_this.wielder.levelID].particles.push(new playerFireball_1.PlayerFireball(_this.wielder, e.x, e.y));
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.room)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
            }
            return !flag;
        };
        _this.tileX = 25;
        _this.tileY = 0;
        _this.canMine = true;
        _this.name = "Spellbook";
        return _this;
    }
    return Spellbook;
}(weapon_1.Weapon));
exports.Spellbook = Spellbook;


/***/ }),

/***/ "./src/weapon/warhammer.ts":
/*!*********************************!*\
  !*** ./src/weapon/warhammer.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Warhammer = void 0;
var weapon_1 = __webpack_require__(/*! ./weapon */ "./src/weapon/weapon.ts");
var Warhammer = /** @class */ (function (_super) {
    __extends(Warhammer, _super);
    function Warhammer(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.tileX = 22;
        _this.tileY = 2;
        _this.damage = 2;
        _this.name = "Warhammer";
        return _this;
    }
    return Warhammer;
}(weapon_1.Weapon));
exports.Warhammer = Warhammer;


/***/ }),

/***/ "./src/weapon/weapon.ts":
/*!******************************!*\
  !*** ./src/weapon/weapon.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Weapon = void 0;
var equippable_1 = __webpack_require__(/*! ../item/equippable */ "./src/item/equippable.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var Weapon = /** @class */ (function (_super) {
    __extends(Weapon, _super);
    function Weapon(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.coEquippable = function (other) {
            if (other instanceof Weapon)
                return false;
            return true;
        };
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
                    e.hurt(_this.wielder, _this.damage);
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.room)
                    sound_1.Sound.hit();
                _this.wielder.drawX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.drawY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.drawX, 10 * _this.wielder.drawY);
            }
            return !flag;
        };
        _this.getDescription = function () {
            return "".concat(_this.name, "\nDamage ").concat(_this.damage);
        };
        _this.tick = function () { };
        if (level)
            _this.game = level.game;
        _this.canMine = false;
        _this.range = 1;
        _this.damage = 1;
        return _this;
    }
    return Weapon;
}(equippable_1.Equippable));
exports.Weapon = Weapon;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/game.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=bundle.js.map