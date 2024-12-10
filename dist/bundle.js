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
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
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
            return tile.isSolid() || tile.isDoor ? 99999999 : 300;
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
        function AStar(grid, disablePoints, lastPlayerPosition, enableCost) {
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
            if (lastPlayerPosition) {
                if (lastPlayerPosition.x >= 0 &&
                    lastPlayerPosition.x < this.grid.length &&
                    lastPlayerPosition.y >= 0 &&
                    lastPlayerPosition.y < this.grid[0].length)
                    this.grid[lastPlayerPosition.x][lastPlayerPosition.y].cost = 0.5;
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
        AStar.prototype._search = function (start, end, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni, lastPlayerPosition) {
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
                                turnDirection === game_1.Direction.UP)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === 0 &&
                                neighbor.pos.y - currentNode.pos.y === 1 &&
                                turnDirection === game_1.Direction.DOWN)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === 1 &&
                                neighbor.pos.y - currentNode.pos.y === 0 &&
                                turnDirection === game_1.Direction.RIGHT)
                                isTurn = false;
                            if (neighbor.pos.x - currentNode.pos.x === -1 &&
                                neighbor.pos.y - currentNode.pos.y === 0 &&
                                turnDirection === game_1.Direction.LEFT)
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
                        neighbor.h =
                            neighbor.h ||
                                heuristic(neighbor.pos, _end.pos, lastPlayerPosition);
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
        AStar.search = function (grid, start, end, disablePoints, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni, lastPlayerPosition) {
            var astar = new AStar(grid, disablePoints, lastPlayerPosition);
            return astar._search(start, end, diagonal, diagonalsOnly, turnCostsExtra, turnDirection, heuristic, diagonalsOmni);
        };
        AStar.prototype.manhattan = function (pos0, pos1) {
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            var heuristic = d1 + d2;
            return heuristic;
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

/***/ "./src/beamEffect.ts":
/*!***************************!*\
  !*** ./src/beamEffect.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BeamEffect = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var BeamEffect = /** @class */ (function () {
    function BeamEffect(x1, y1, x2, y2) {
        this.active = true;
        this.time = 0;
        var startX = x1 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var startY = y1 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var endX = x2 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var endY = y2 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        this.points = this.initializePoints(startX, startY, endX, endY);
        this.prevStartX = startX;
        this.prevStartY = startY;
        this.prevEndX = endX;
        this.prevEndY = endY;
    }
    BeamEffect.prototype.render = function (x1, y1, x2, y2, color, lineWidth, delta) {
        if (color === void 0) { color = "cyan"; }
        if (lineWidth === void 0) { lineWidth = 2; }
        if (delta === void 0) { delta = 1 / 60; }
        var startX = x1 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var startY = y1 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var endX = x2 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var endY = y2 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var startForceX = (startX - this.prevStartX) * BeamEffect.MOTION_INFLUENCE * delta;
        var startForceY = (startY - this.prevStartY) * BeamEffect.MOTION_INFLUENCE * delta;
        var endForceX = (endX - this.prevEndX) * BeamEffect.MOTION_INFLUENCE * delta;
        var endForceY = (endY - this.prevEndY) * BeamEffect.MOTION_INFLUENCE * delta;
        for (var i = 1; i < 4; i++) {
            var influence = 1 - i / 4;
            this.points[i].x += startForceX * influence;
            this.points[i].y += startForceY * influence;
        }
        for (var i = this.points.length - 4; i < this.points.length - 1; i++) {
            var influence = 1 - (this.points.length - i) / 4;
            this.points[i].x += endForceX * influence;
            this.points[i].y += endForceY * influence;
        }
        this.simulateRope(startX, startY, endX, endY, delta);
        var ctx = game_1.Game.ctx;
        ctx.save();
        for (var i = 0; i < this.points.length - 1; i++) {
            var p1 = this.points[i];
            var p2 = this.points[i + 1];
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            var steps = Math.max(Math.abs(dx), Math.abs(dy));
            var xIncrement = dx / steps;
            var yIncrement = dy / steps;
            var x = p1.x;
            var y = p1.y;
            for (var step = 0; step <= steps; step++) {
                for (var w = 0; w < lineWidth; w++) {
                    for (var h = 0; h < lineWidth; h++) {
                        ctx.fillStyle = color;
                        ctx.fillRect(Math.round(x + w), Math.round(y + h), 1, 1);
                    }
                }
                x += xIncrement;
                y += yIncrement;
            }
        }
        ctx.restore();
        this.prevStartX = startX;
        this.prevStartY = startY;
        this.prevEndX = endX;
        this.prevEndY = endY;
    };
    BeamEffect.prototype.initializePoints = function (startX, startY, endX, endY) {
        var points = [];
        for (var i = 0; i < BeamEffect.SEGMENTS; i++) {
            var t = i / (BeamEffect.SEGMENTS - 1);
            points.push({
                x: startX + (endX - startX) * t,
                y: startY + (endY - startY) * t,
                oldX: startX + (endX - startX) * t,
                oldY: startY + (endY - startY) * t,
                velocityX: 0,
                velocityY: 0,
                angle: Math.random() * Math.PI * 2,
            });
        }
        return points;
    };
    BeamEffect.prototype.applyTurbulence = function (point, index) {
        point.angle +=
            Math.sin(this.time * 0.1 + index * 0.5) * BeamEffect.ANGLE_CHANGE;
        var turbulenceX = Math.cos(point.angle) * BeamEffect.TURBULENCE;
        var turbulenceY = Math.sin(point.angle) * BeamEffect.TURBULENCE;
        point.velocityX += turbulenceX;
        point.velocityY += turbulenceY;
        point.velocityX = Math.min(Math.max(point.velocityX, -BeamEffect.MAX_VELOCITY), BeamEffect.MAX_VELOCITY);
        point.velocityY = Math.min(Math.max(point.velocityY, -BeamEffect.MAX_VELOCITY), BeamEffect.MAX_VELOCITY);
    };
    BeamEffect.prototype.simulateRope = function (startX, startY, endX, endY, delta) {
        var iterationsThisFrame = Math.ceil(BeamEffect.ITERATIONS * delta);
        for (var iteration = 0; iteration < iterationsThisFrame; iteration++) {
            for (var i = 1; i < this.points.length - 1; i++) {
                var point = this.points[i];
                var prevPoint = this.points[i - 1];
                var nextPoint = this.points[i + 1];
                var springForceXPrev = (prevPoint.x - point.x) * BeamEffect.SPRING_STIFFNESS * delta;
                var springForceYPrev = (prevPoint.y - point.y) * BeamEffect.SPRING_STIFFNESS * delta;
                var springForceXNext = (nextPoint.x - point.x) * BeamEffect.SPRING_STIFFNESS * delta;
                var springForceYNext = (nextPoint.y - point.y) * BeamEffect.SPRING_STIFFNESS * delta;
                this.applyTurbulence(point, i);
                point.velocityX =
                    (point.velocityX + springForceXPrev + springForceXNext) *
                        Math.pow(BeamEffect.DAMPING, delta);
                point.velocityY =
                    (point.velocityY + springForceYPrev + springForceYNext) *
                        Math.pow(BeamEffect.DAMPING, delta);
                var relativeVXPrev = (prevPoint.velocityX - point.velocityX) * delta;
                var relativeVYPrev = (prevPoint.velocityY - point.velocityY) * delta;
                var relativeVXNext = (nextPoint.velocityX - point.velocityX) * delta;
                var relativeVYNext = (nextPoint.velocityY - point.velocityY) * delta;
                point.velocityX +=
                    (relativeVXPrev + relativeVXNext) * BeamEffect.SPRING_DAMPING;
                point.velocityY +=
                    (relativeVYPrev + relativeVYNext) * BeamEffect.SPRING_DAMPING;
                point.oldX = point.x;
                point.oldY = point.y;
                point.x += point.velocityX * delta;
                point.y += point.velocityY * delta + BeamEffect.GRAVITY * delta * delta;
            }
            var segmentLength = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) /
                (BeamEffect.SEGMENTS - 1);
            for (var constraintIteration = 0; constraintIteration < 2; constraintIteration++) {
                for (var i = 0; i < this.points.length - 1; i++) {
                    var p1 = this.points[i];
                    var p2 = this.points[i + 1];
                    var dx = p2.x - p1.x;
                    var dy = p2.y - p1.y;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    var difference = segmentLength - distance;
                    var percent = difference / distance / 2;
                    var offsetX = dx * percent;
                    var offsetY = dy * percent;
                    if (i > 0) {
                        p1.x -= offsetX * 1.5;
                        p1.y -= offsetY * 1.5;
                    }
                    if (i < this.points.length - 2) {
                        p2.x += offsetX * 1.5;
                        p2.y += offsetY * 1.5;
                    }
                }
            }
        }
        this.points[0].x = startX;
        this.points[0].y = startY;
        this.points[0].oldX = startX;
        this.points[0].oldY = startY;
        this.points[this.points.length - 1].x = endX;
        this.points[this.points.length - 1].y = endY;
        this.points[this.points.length - 1].oldX = endX;
        this.points[this.points.length - 1].oldY = endY;
    };
    BeamEffect.renderBeam = function (x1, y1, x2, y2, color, lineWidth) {
        if (color === void 0) { color = "cyan"; }
        if (lineWidth === void 0) { lineWidth = 2; }
        var ctx = game_1.Game.ctx;
        var startX = x1 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var startY = y1 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var endX = x2 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        var endY = y2 * gameConstants_1.GameConstants.TILESIZE + 0.5 * gameConstants_1.GameConstants.TILESIZE;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.restore();
    };
    BeamEffect.prototype.destroy = function () {
        this.active = false;
        this.points = [];
    };
    BeamEffect.prototype.isActive = function () {
        return this.active;
    };
    // Number of points that make up the beam (higher = smoother but more expensive)
    // Range: 10-100, recommended: 30
    BeamEffect.SEGMENTS = 30;
    // Downward force applied to each point (0 = no gravity)
    // Range: 0-10, recommended: 2
    BeamEffect.GRAVITY = 2;
    // Physics simulation steps per frame (higher = more accurate but more expensive)
    // Range: 1-10, recommended: 1
    BeamEffect.ITERATIONS = 5;
    // How much the beam reacts to movement of start/end points
    // Range: 0-5, recommended: 1
    BeamEffect.MOTION_INFLUENCE = 1;
    // Amount of random movement applied to points (0 = straight beam)
    // Range: 0-1, recommended: 0.5
    BeamEffect.TURBULENCE = 0.5;
    // How quickly velocity decreases over time
    // Range: 0-1, recommended: 0.5
    BeamEffect.VELOCITY_DECAY = 0.1;
    // How quickly the turbulence angle changes
    // Range: 0-2, recommended: 0.9
    BeamEffect.ANGLE_CHANGE = 0.01; // for turbulence specifically
    // Maximum speed any point can move per frame
    // Range: 10-1000, recommended: 100
    BeamEffect.MAX_VELOCITY = 100;
    // General movement resistance (1 = no damping, 0 = full stop)
    // Range: 0.9-0.999, recommended: 0.8
    BeamEffect.DAMPING = 0.8;
    // How strongly points pull toward their neighbors
    // Range: 0.01-1, recommended: 0.01
    BeamEffect.SPRING_STIFFNESS = 0.01;
    // How quickly spring oscillations settle
    // Range: 0.001-0.1, recommended: 0.1
    BeamEffect.SPRING_DAMPING = 0.1;
    return BeamEffect;
}());
exports.BeamEffect = BeamEffect;


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
                                _this.direction = game_1.Direction.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = game_1.Direction.LEFT;
                            else if (moveY > oldY)
                                _this.direction = game_1.Direction.DOWN;
                            else if (moveY < oldY)
                                _this.direction = game_1.Direction.UP;
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
                                    _this.setDrawXY(oldX, oldY);
                                    if (_this.x > oldX)
                                        _this.direction = game_1.Direction.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = game_1.Direction.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = game_1.Direction.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = game_1.Direction.UP;
                                }
                            }
                        }
                        if (_this.direction == game_1.Direction.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == game_1.Direction.UP) {
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
                _this.updateDrawXY(delta);
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
                _this.drop = new armor_1.Armor(_this.room, _this.x, _this.y);
            else if (dropProb < 0.01)
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    ArmoredzombieEnemy.difficulty = 2;
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
        _this.hurt = function (playerHitBy, damage, type) {
            if (type === void 0) { type = "none"; }
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.ticksSinceFirstHit = 0;
            _this.health -= damage;
            _this.createDamageNumber(damage, type);
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
                                    _this.direction = game_1.Direction.RIGHT;
                                else if (_this.x < oldX)
                                    _this.direction = game_1.Direction.LEFT;
                                else if (_this.y > oldY)
                                    _this.direction = game_1.Direction.DOWN;
                                else if (_this.y < oldY)
                                    _this.direction = game_1.Direction.UP;
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
                _this.updateDrawXY(delta);
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(18, 0, 2, 2, _this.x - _this.drawX, _this.y - _this.drawY, 2, 2, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(2 * Math.floor((_this.tileX + _this.frame) / 2) + 1, _this.tileY, 2, 4, _this.x - _this.drawX, _this.y - 2.5 - _this.drawY, 2, 4, _this.room.shadeColor, _this.shadeAmount());
                if (!_this.seenPlayer) {
                    _this.drawSleepingZs(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
                }
                if (_this.alertTicks > 0) {
                    _this.drawExclamation(delta, gameConstants_1.GameConstants.TILESIZE * 0.5, gameConstants_1.GameConstants.TILESIZE * -1);
                }
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.drawableY = _this.y;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x + 0.5, _this.y, true);
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
                _this.drops.push(new spear_1.Spear(_this.room, _this.x, _this.y));
            else if (dropProb < 0.04)
                _this.drops.push(new redgem_1.RedGem(_this.room, _this.x, _this.y));
            else if (dropProb < 0.075)
                _this.drops.push(new redgem_1.RedGem(_this.room, _this.x, _this.y));
            else if (dropProb < 0.1)
                _this.drops.push(new redgem_1.RedGem(_this.room, _this.x, _this.y));
            else
                _this.drops.push(new coin_1.Coin(_this.room, _this.x, _this.y));
        }
        return _this;
    }
    BigKnightEnemy.difficulty = 4;
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
                if (_this.health <= 2) {
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.health++;
                        _this.ticksSinceFirstHit = 0;
                    }
                    _this.ticks++;
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
                            if (_this.health >= 2.5) {
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
                                    _this.direction = game_1.Direction.RIGHT;
                                else if (_this.x < oldX)
                                    _this.direction = game_1.Direction.LEFT;
                                else if (_this.y > oldY)
                                    _this.direction = game_1.Direction.DOWN;
                                else if (_this.y < oldY)
                                    _this.direction = game_1.Direction.UP;
                            }
                            if (_this.health < _this.maxHealth) {
                                _this.ticksSinceFirstHit++;
                                if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                                    _this.health++;
                                    _this.ticksSinceFirstHit = 0;
                                }
                            }
                            if (_this.health >= 2.5)
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
                _this.updateDrawXY(delta);
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
                _this.drops.push(new spear_1.Spear(_this.room, _this.x, _this.y));
            else if (dropProb < 0.04)
                _this.drops.push(new redgem_1.RedGem(_this.room, _this.x, _this.y));
            else if (dropProb < 0.075)
                _this.drops.push(new redgem_1.RedGem(_this.room, _this.x, _this.y));
            else if (dropProb < 0.1)
                _this.drops.push(new redgem_1.RedGem(_this.room, _this.x, _this.y));
            else
                _this.drops.push(new coin_1.Coin(_this.room, _this.x, _this.y));
        }
        return _this;
    }
    BigSkullEnemy.difficulty = 4;
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
        _this.jump = function (delta) {
            var j = Math.max(Math.abs(_this.drawX), Math.abs(_this.drawY));
            console.log(j);
            var jumpY = Math.abs(Math.sin(j * Math.PI)) * _this.jumpHeight;
            if (jumpY < 0.01)
                jumpY = 0;
            if (jumpY > _this.jumpHeight)
                jumpY = _this.jumpHeight;
            _this.jumpY = jumpY;
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
                        disablePositions.push({ x: _this.x, y: _this.y });
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, true);
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
                                _this.setDrawXY(oldX, oldY);
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
                _this.updateDrawXY(delta);
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY - _this.jumpY, 1, 2, _this.room.shadeColor, _this.shadeAmount() * (1 + (_this.jumpY * delta) / 3));
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
        _this.jumpHeight = 1;
        _this.drawMoveSpeed = 0.2;
        _this.diagonalAttackRange = 1;
        _this.diagonalAttack = true;
        _this.orthogonalAttack = false;
        _this.imageParticleX = 0;
        _this.imageParticleY = 26;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drop = new candle_1.Candle(_this.room, _this.x, _this.y);
            else if (dropProb < 0.04)
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    BishopEnemy.difficulty = 2;
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
                                _this.direction = game_1.Direction.RIGHT;
                            else if (dx < 0)
                                _this.direction = game_1.Direction.LEFT;
                            else if (dy < 0)
                                _this.direction = game_1.Direction.UP;
                            else if (dy > 0)
                                _this.direction = game_1.Direction.DOWN;
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
                _this.updateDrawXY(delta);
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
                    if (_this.direction === game_1.Direction.LEFT)
                        startX -= 3;
                    else if (_this.direction === game_1.Direction.RIGHT)
                        startX += 3;
                    else if (_this.direction === game_1.Direction.DOWN)
                        startY += 2;
                    else if (_this.direction === game_1.Direction.UP)
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
                _this.drop = new pickaxe_1.Pickaxe(_this.room, _this.x, _this.y);
            else if (dropProb < 0.02)
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    ChargeEnemy.difficulty = 3;
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
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var gameConstants_1 = __webpack_require__(/*! ../../gameConstants */ "./src/gameConstants.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var CrabEnemy = /** @class */ (function (_super) {
    __extends(CrabEnemy, _super);
    function CrabEnemy(room, game, x, y, drop) {
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
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, undefined, undefined, undefined, undefined, undefined, undefined, _this.lastPlayerPos);
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
                                    _this.setDrawXY(oldX, oldY);
                                    if (_this.x > oldX)
                                        _this.direction = game_1.Direction.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = game_1.Direction.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = game_1.Direction.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = game_1.Direction.UP;
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
                _this.updateDrawXY(delta);
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
        _this.imageParticleX = 3;
        _this.imageParticleY = 24;
        if (drop)
            _this.drop = drop;
        else {
            _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
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
    CrabEnemy.difficulty = 1;
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
        _this.hurt = function (playerHitBy, damage, type) {
            if (type === void 0) { type = "none"; }
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.health -= damage;
            _this.createDamageNumber(damage, type);
            if (type === "none" || _this.health <= 0) {
                imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, _this.imageParticleX, _this.imageParticleY);
            }
            _this.healthBar.hurt();
            if (_this.health <= 0) {
                _this.kill();
            }
            else
                _this.hurtCallback();
        };
        _this.poison = function () {
            if (!_this.status.poison) {
                _this.status.poison = true;
                _this.effectStartTick = _this.ticks % 3;
                _this.startTick = _this.ticks;
            }
        };
        _this.bleed = function () {
            if (!_this.status.bleed) {
                _this.status.bleed = true;
                _this.effectStartTick = _this.ticks % 3;
                _this.startTick = _this.ticks;
            }
        };
        _this.tickPoison = function () {
            if (_this.status.poison) {
                if (_this.ticks % 3 === _this.effectStartTick &&
                    _this.ticks !== _this.startTick) {
                    _this.hurt(_this.targetPlayer, 0.5, "poison");
                }
            }
        };
        _this.tickBleed = function () {
            if (_this.status.bleed) {
                if (_this.ticks % 3 === _this.effectStartTick &&
                    _this.ticks !== _this.startTick) {
                    _this.hurt(_this.targetPlayer, 0.5, "blood");
                }
                if (_this.targetPlayer)
                    _this.targetPlayer.heal(0.5);
            }
        };
        _this.tick = function () {
            _this.tickPoison();
            _this.tickBleed();
            _this.behavior();
            if (_this.x !== _this.lastX || _this.y !== _this.lastY) {
                _this.emitEntityData();
            }
        };
        _this.lookForPlayer = function () {
            if (_this.seenPlayer)
                return;
            var p = _this.nearestPlayer();
            if (p !== false) {
                var distance = p[0], player = p[1];
                if (distance <= 4) {
                    _this.targetPlayer = player;
                    //this.facePlayer(player);
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
                                _this.direction = game_1.Direction.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = game_1.Direction.LEFT;
                            else if (moveY > oldY)
                                _this.direction = game_1.Direction.DOWN;
                            else if (moveY < oldY)
                                _this.direction = game_1.Direction.UP;
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
                                    _this.setDrawXY(moveX, moveY);
                                    if (_this.x > moveX)
                                        _this.direction = game_1.Direction.RIGHT;
                                    else if (_this.x < moveX)
                                        _this.direction = game_1.Direction.LEFT;
                                    else if (_this.y > moveY)
                                        _this.direction = game_1.Direction.DOWN;
                                    else if (_this.y < moveY)
                                        _this.direction = game_1.Direction.UP;
                                }
                            }
                        }
                        // Add positions to avoid based on the current direction
                        if (_this.direction == game_1.Direction.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == game_1.Direction.UP) {
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
        _this.jump = function (delta) {
            var j = Math.max(Math.abs(_this.drawX), Math.abs(_this.drawY));
            _this.jumpY = Math.abs(Math.sin(j * Math.PI)) * _this.jumpHeight;
            if (_this.jumpY < 0.01)
                _this.jumpY = 0;
            if (_this.jumpY > _this.jumpHeight)
                _this.jumpY = _this.jumpHeight;
        };
        _this.updateDrawXY = function (delta) {
            if (!_this.doneMoving()) {
                _this.drawX *= Math.pow(0.85, delta);
                _this.drawY *= Math.pow(0.85, delta);
                _this.drawX = Math.abs(_this.drawX) < 0.01 ? 0 : _this.drawX;
                _this.drawY = Math.abs(_this.drawY) < 0.01 ? 0 : _this.drawY;
                _this.jump(delta);
            }
        };
        _this.setDrawXY = function (x, y) {
            _this.drawX += _this.x - x;
            _this.drawY += _this.y - y;
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.updateDrawXY(delta);
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
        _this.status = { poison: false, bleed: false };
        _this.effectStartTick = 1;
        _this.startTick = 1;
        return _this;
    }
    Object.defineProperty(Enemy.prototype, "lastPlayerPos", {
        get: function () {
            return {
                x: this.targetPlayer.lastX,
                y: this.targetPlayer.lastY,
            };
        },
        enumerable: false,
        configurable: true
    });
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

/***/ "./src/entity/enemy/energyWizard.ts":
/*!******************************************!*\
  !*** ./src/entity/enemy/energyWizard.ts ***!
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
exports.EnergyWizardEnemy = exports.WizardState = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var floor_1 = __webpack_require__(/*! ../../tile/floor */ "./src/tile/floor.ts");
var bones_1 = __webpack_require__(/*! ../../tile/bones */ "./src/tile/bones.ts");
var deathParticle_1 = __webpack_require__(/*! ../../particle/deathParticle */ "./src/particle/deathParticle.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./wizardEnemy */ "./src/entity/enemy/wizardEnemy.ts");
var WizardState;
(function (WizardState) {
    WizardState[WizardState["idle"] = 0] = "idle";
    WizardState[WizardState["attack"] = 1] = "attack";
    WizardState[WizardState["justAttacked"] = 2] = "justAttacked";
    WizardState[WizardState["teleport"] = 3] = "teleport";
})(WizardState = exports.WizardState || (exports.WizardState = {}));
var EnergyWizardEnemy = /** @class */ (function (_super) {
    __extends(EnergyWizardEnemy, _super);
    function EnergyWizardEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.updateDrawXY(delta);
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
        _this.projectileColor = [0, 50, 150];
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
    EnergyWizardEnemy.difficulty = 3;
    return EnergyWizardEnemy;
}(wizardEnemy_1.WizardEnemy));
exports.EnergyWizardEnemy = EnergyWizardEnemy;


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
var wizardFireball_1 = __webpack_require__(/*! ../../projectile/wizardFireball */ "./src/projectile/wizardFireball.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var wizardEnemy_1 = __webpack_require__(/*! ./wizardEnemy */ "./src/entity/enemy/wizardEnemy.ts");
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
            _this.frame += 0.1 * delta;
            if (_this.frame >= 4)
                _this.frame = 0;
            if (!_this.dead) {
                _this.updateDrawXY(delta);
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
        _this.projectileColor = [200, 20, 0];
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
    FireWizardEnemy.difficulty = 3;
    return FireWizardEnemy;
}(wizardEnemy_1.WizardEnemy));
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
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var hitWarning_1 = __webpack_require__(/*! ../../hitWarning */ "./src/hitWarning.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var utils_1 = __webpack_require__(/*! ../../utils */ "./src/utils.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var weaponPoision_1 = __webpack_require__(/*! ../../item/weaponPoision */ "./src/item/weaponPoision.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var FrogEnemy = /** @class */ (function (_super) {
    __extends(FrogEnemy, _super);
    function FrogEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 0.5;
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
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
                            var targetPosition = {
                                x: _this.targetPlayer.x,
                                y: _this.targetPlayer.y,
                            };
                            var dx = _this.targetPlayer.x - _this.x;
                            var dy = _this.targetPlayer.y - _this.y;
                            if ((dx === 0 && dy <= 1) ||
                                (dx <= 1 && dy === 0) ||
                                (dx === 0 && dy >= -1) ||
                                (dx >= -1 && dy === 0)) {
                                var jumpOverX = _this.targetPlayer.x + dx;
                                var jumpOverY = _this.targetPlayer.y + dy;
                                if (_this.room.roomArray[jumpOverX] &&
                                    _this.room.roomArray[jumpOverX][jumpOverY]) {
                                    if (!_this.room.roomArray[jumpOverX][jumpOverY].isSolid()) {
                                        targetPosition = {
                                            x: jumpOverX,
                                            y: jumpOverY,
                                        };
                                    }
                                }
                            }
                            var moves = astarclass_1.astar.AStar.search(grid, _this, targetPosition, disablePositions, false, false, false, undefined, undefined, false, _this.lastPlayerPos);
                            //console.log(moves); //DON'T REMOVE THIS
                            if (moves[1]) {
                                var hitPlayer = false;
                                for (var i in _this.game.players) {
                                    if (_this.game.rooms[_this.game.players[i].levelID] === _this.room &&
                                        _this.game.players[i].x === moves[1].pos.x &&
                                        _this.game.players[i].y === moves[1].pos.y) {
                                        _this.game.players[i].hurt(_this.hit(), _this.name);
                                        _this.drawX += 1.5 * (_this.x - _this.game.players[i].x);
                                        _this.drawY += 1.5 * (_this.y - _this.game.players[i].y);
                                        if (_this.game.players[i] ===
                                            _this.game.players[_this.game.localPlayerID])
                                            _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                        hitPlayer = true;
                                    }
                                }
                                if (!hitPlayer) {
                                    if (moves.length > 1) {
                                        var moveX = moves[1].pos.x;
                                        var moveY = moves[1].pos.y;
                                        _this.tryMove(moveX, moveY);
                                        _this.setDrawXY(_this.lastX, _this.lastY);
                                        if (_this.jumping) {
                                            _this.frame = 8;
                                            _this.animationSpeed = 1;
                                        }
                                        if (_this.x > moveX)
                                            _this.direction = game_1.Direction.RIGHT;
                                        else if (_this.x < moveX)
                                            _this.direction = game_1.Direction.LEFT;
                                        else if (_this.y > moveY)
                                            _this.direction = game_1.Direction.DOWN;
                                        else if (_this.y < moveY)
                                            _this.direction = game_1.Direction.UP;
                                    }
                                }
                            }
                            _this.rumbling = false;
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
                                        _this.makeHitWarnings();
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        _this.jump = function (delta) {
            //console.log(`this.drawX, this.drawY: ${this.drawX}, ${this.drawY}`);
            if (_this.jumping) {
                var j = Math.max(Math.abs(_this.drawX), Math.abs(_this.drawY));
                if (j > 1) {
                    _this.jumpDistance = 2;
                    _this.drawMoveSpeed = 0.2;
                }
                _this.jumpY =
                    Math.sin((j / _this.jumpDistance) * Math.PI) * _this.jumpHeight;
                if (_this.jumpY < 0.01 && _this.jumpY > -0.01) {
                    _this.jumpY = 0;
                    _this.jumpDistance = 1;
                    _this.drawMoveSpeed = 0.2;
                }
                if (_this.jumpY > _this.jumpHeight)
                    _this.jumpY = _this.jumpHeight;
            }
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
                        [-2, 0],
                        [2, 0],
                        [0, -2],
                        [0, 2],
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
                _a[game_1.Direction.LEFT] = [-1, 0],
                _a[game_1.Direction.RIGHT] = [1, 0],
                _a[game_1.Direction.UP] = [0, -1],
                _a[game_1.Direction.DOWN] = [0, 1],
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
                    var hitWarning = new hitWarning_1.HitWarning(_this.game, targetX, targetY, _this.x, _this.y, true, false, _this);
                    _this.room.hitwarnings.push(hitWarning);
                    //this.hitWarnings.push(hitWarning);
                }
            });
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.updateDrawXY(delta);
                _this.frame += _this.animationSpeed * delta;
                if (_this.frame >= _this.frameLength) {
                    _this.frame = 0;
                }
                var rumbleX = _this.rumble(_this.rumbling, _this.frame).x;
                var rumbleY = _this.rumble(_this.rumbling, _this.frame).y;
                if (_this.drawX !== 0 || _this.drawY !== 0) {
                    _this.jumping = true;
                }
                else {
                    _this.jumping = false;
                }
                if (_this.jumping) {
                    _this.frameLength = 10;
                    _this.animationSpeed = 0.4;
                }
                else {
                    _this.frameLength = 3;
                    _this.animationSpeed = 0.1;
                }
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX +
                    (_this.tileX !== 12 && !_this.rumbling ? Math.floor(_this.frame) : 0), _this.tileY /*+ this.direction * 2,*/, 1, 2, _this.x + rumbleX - _this.drawX, _this.y - _this.drawYOffset - _this.drawY - _this.jumpY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
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
        _this.tileX = 12;
        _this.tileY = 16;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.deathParticleColor = "#ffffff";
        _this.frameLength = 3;
        _this.startFrame = 0;
        _this.animationSpeed = 0.1;
        _this.tickCount = 0;
        _this.jumping = false;
        _this.jumpDistance = 1;
        _this.drop = drop ? drop : new coin_1.Coin(_this.room, _this.x, _this.y);
        _this.name = "frog";
        _this.orthogonalAttack = true;
        _this.diagonalAttack = true;
        _this.jumpHeight = 1;
        _this.drawMoveSpeed = 0.2;
        _this.imageParticleX = 3;
        _this.imageParticleY = 30;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.05)
                _this.drop = new weaponPoision_1.WeaponPoison(_this.room, _this.x, _this.y);
            else if (dropProb < 0.01)
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    FrogEnemy.difficulty = 1;
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
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var dualdagger_1 = __webpack_require__(/*! ../../weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var KnightEnemy = /** @class */ (function (_super) {
    __extends(KnightEnemy, _super);
    function KnightEnemy(room, game, x, y, drop) {
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
                            var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, undefined, undefined, undefined, undefined, undefined, undefined, _this.lastPlayerPos);
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
                                    _this.setDrawXY(oldX, oldY);
                                    if (_this.x > oldX)
                                        _this.direction = game_1.Direction.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = game_1.Direction.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = game_1.Direction.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = game_1.Direction.UP;
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
                _this.updateDrawXY(delta);
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
        _this.imageParticleX = 3;
        _this.imageParticleY = 29;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.05)
                _this.drop = new dualdagger_1.DualDagger(_this.room, _this.x, _this.y);
            else if (dropProb < 0.01)
                _this.drop = new dualdagger_1.DualDagger(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    KnightEnemy.difficulty = 2;
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
                        undefined, undefined, undefined, false);
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
                                _this.setDrawXY(oldX, oldY);
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
        _this.jump = function (delta) {
            var j = Math.max(Math.abs(_this.drawX), Math.abs(_this.drawY));
            console.log(j);
            var jumpY = Math.abs(Math.sin(j * Math.PI)) * _this.jumpHeight;
            if (jumpY < 0.01)
                jumpY = 0;
            if (jumpY > _this.jumpHeight)
                jumpY = _this.jumpHeight;
            _this.jumpY = jumpY;
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.updateDrawXY(delta);
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY - _this.jumpY, 1, 2, _this.room.shadeColor, _this.shadeAmount() * (1 + _this.jumpY / 3));
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
        _this.jumpHeight = 1;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drop = new candle_1.Candle(_this.room, _this.x, _this.y);
            else if (dropProb < 0.04)
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    QueenEnemy.difficulty = 4;
    return QueenEnemy;
}(enemy_1.Enemy));
exports.QueenEnemy = QueenEnemy;


/***/ }),

/***/ "./src/entity/enemy/rookEnemy.ts":
/*!***************************************!*\
  !*** ./src/entity/enemy/rookEnemy.ts ***!
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
exports.RookEnemy = void 0;
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var candle_1 = __webpack_require__(/*! ../../item/candle */ "./src/item/candle.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var RookEnemy = /** @class */ (function (_super) {
    __extends(RookEnemy, _super);
    function RookEnemy(room, game, x, y, drop) {
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
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, //diagonals
                        false, //diagonalsOnly
                        undefined, undefined, undefined, false, //diagonalsOmni
                        _this.lastPlayerPos);
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
                                    if (_this.game.players[i] ===
                                        _this.game.players[_this.game.localPlayerID])
                                        _this.game.shakeScreen(10 * _this.drawX, 10 * _this.drawY);
                                }
                            }
                            if (!hitPlayer) {
                                _this.tryMove(moveX, moveY);
                                _this.setDrawXY(oldX, oldY);
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
                _this.updateDrawXY(delta);
                _this.frame += 0.1 * delta;
                if (_this.frame >= 4)
                    _this.frame = 0;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                game_1.Game.drawMob(_this.tileX + Math.floor(_this.frame), _this.tileY, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY - _this.jumpY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
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
        _this.tileX = 23 + 28;
        _this.tileY = 8;
        _this.seenPlayer = false;
        _this.aggro = false;
        _this.name = "rook";
        _this.orthogonalAttack = true;
        _this.diagonalAttack = false;
        _this.jumpHeight = 0.5;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.005)
                _this.drop = new candle_1.Candle(_this.room, _this.x, _this.y);
            else if (dropProb < 0.04)
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    RookEnemy.difficulty = 4;
    return RookEnemy;
}(enemy_1.Enemy));
exports.RookEnemy = RookEnemy;


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
        _this.hurt = function (playerHitBy, damage, type) {
            if (type === void 0) { type = "none"; }
            if (playerHitBy) {
                _this.aggro = true;
                _this.targetPlayer = playerHitBy;
                _this.facePlayer(playerHitBy);
                if (playerHitBy === _this.game.players[_this.game.localPlayerID])
                    _this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
            }
            _this.ticksSinceFirstHit = 0;
            if (_this.health == 2)
                _this.unconscious = false;
            _this.health -= damage;
            _this.healthBar.hurt();
            _this.createDamageNumber(damage, type);
            if (_this.health == 1) {
                _this.unconscious = true;
                imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 28);
            }
            else {
                _this.healthBar.hurt();
            }
            if (_this.health <= 0) {
                imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 24);
                _this.kill();
            }
            else
                _this.hurtCallback();
        };
        _this.behavior = function () {
            _this.lastX = _this.x;
            _this.lastY = _this.y;
            if (!_this.dead) {
                if (_this.skipNextTurns > 0) {
                    _this.skipNextTurns--;
                    _this.ticks++;
                    return;
                }
                if (_this.health <= 1) {
                    _this.unconscious = true;
                    _this.ticksSinceFirstHit++;
                    if (_this.ticksSinceFirstHit >= _this.REGEN_TICKS) {
                        _this.healthBar.hurt();
                        _this.health = 2;
                        _this.unconscious = false;
                    }
                    _this.ticks++;
                    return;
                }
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
                        var moves = astarclass_1.astar.AStar.search(grid, _this, _this.targetPlayer, disablePositions, false, false, true, _this.direction, undefined, undefined);
                        if (moves.length > 0) {
                            var moveX = moves[0].pos.x;
                            var moveY = moves[0].pos.y;
                            var oldDir = _this.direction;
                            var player = _this.targetPlayer;
                            _this.facePlayer(player);
                            if (moveX > oldX)
                                _this.direction = game_1.Direction.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = game_1.Direction.LEFT;
                            else if (moveY > oldY)
                                _this.direction = game_1.Direction.DOWN;
                            else if (moveY < oldY)
                                _this.direction = game_1.Direction.UP;
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
                                    _this.setDrawXY(oldX, oldY);
                                    if (_this.x > oldX)
                                        _this.direction = game_1.Direction.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = game_1.Direction.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = game_1.Direction.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = game_1.Direction.UP;
                                }
                            }
                        }
                        if (_this.direction == game_1.Direction.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == game_1.Direction.UP) {
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
                _this.updateDrawXY(delta);
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
                game_1.Game.drawMob(_this.tileX + (_this.tileX === 5 ? Math.floor(_this.frame) : 0), _this.tileY + _this.direction * 2, 1, 2, _this.x - _this.drawX, _this.y - _this.drawYOffset - _this.drawY - _this.jumpY, 1, 2, _this.room.shadeColor, _this.shadeAmount());
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
            if (dropProb < 0.03)
                _this.drop = new spear_1.Spear(_this.room, _this.x, _this.y);
            else if (dropProb < 0.01)
                _this.drop = new redgem_1.RedGem(_this.room, _this.x, _this.y);
            //else if (dropProb < 0.2) this.drop = new Candle(this.room, 0, 0);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    SkullEnemy.difficulty = 2;
    return SkullEnemy;
}(enemy_1.Enemy));
exports.SkullEnemy = SkullEnemy;


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
var floor_1 = __webpack_require__(/*! ../../tile/floor */ "./src/tile/floor.ts");
var hitWarning_1 = __webpack_require__(/*! ../../hitWarning */ "./src/hitWarning.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var skullEnemy_1 = __webpack_require__(/*! ./skullEnemy */ "./src/entity/enemy/skullEnemy.ts");
var enemySpawnAnimation_1 = __webpack_require__(/*! ../../projectile/enemySpawnAnimation */ "./src/projectile/enemySpawnAnimation.ts");
var redgem_1 = __webpack_require__(/*! ../../item/redgem */ "./src/item/redgem.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var knightEnemy_1 = __webpack_require__(/*! ./knightEnemy */ "./src/entity/enemy/knightEnemy.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var energyWizard_1 = __webpack_require__(/*! ./energyWizard */ "./src/entity/enemy/energyWizard.ts");
var zombieEnemy_1 = __webpack_require__(/*! ./zombieEnemy */ "./src/entity/enemy/zombieEnemy.ts");
var bishopEnemy_1 = __webpack_require__(/*! ./bishopEnemy */ "./src/entity/enemy/bishopEnemy.ts");
var crabEnemy_1 = __webpack_require__(/*! ./crabEnemy */ "./src/entity/enemy/crabEnemy.ts");
var chargeEnemy_1 = __webpack_require__(/*! ./chargeEnemy */ "./src/entity/enemy/chargeEnemy.ts");
var bigKnightEnemy_1 = __webpack_require__(/*! ./bigKnightEnemy */ "./src/entity/enemy/bigKnightEnemy.ts");
var bigSkullEnemy_1 = __webpack_require__(/*! ./bigSkullEnemy */ "./src/entity/enemy/bigSkullEnemy.ts");
var frogEnemy_1 = __webpack_require__(/*! ./frogEnemy */ "./src/entity/enemy/frogEnemy.ts");
var fireWizard_1 = __webpack_require__(/*! ./fireWizard */ "./src/entity/enemy/fireWizard.ts");
var queenEnemy_1 = __webpack_require__(/*! ./queenEnemy */ "./src/entity/enemy/queenEnemy.ts");
var armoredzombieEnemy_1 = __webpack_require__(/*! ./armoredzombieEnemy */ "./src/entity/enemy/armoredzombieEnemy.ts");
var rookEnemy_1 = __webpack_require__(/*! ./rookEnemy */ "./src/entity/enemy/rookEnemy.ts");
var Spawner = /** @class */ (function (_super) {
    __extends(Spawner, _super);
    function Spawner(room, game, x, y, enemyTable) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
        };
        _this.behavior = function () {
            var shouldSpawn = true;
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
                    if (_this.enemySpawnType === 8) {
                        var offLimits_1 = [
                            { x: _this.x, y: _this.y },
                            { x: _this.x + 1, y: _this.y + 1 },
                            { x: _this.x - 1, y: _this.y - 1 },
                            { x: _this.x + 1, y: _this.y - 1 },
                            { x: _this.x - 1, y: _this.y + 1 },
                        ];
                        positions = positions.filter(function (t) { return !offLimits_1.some(function (o) { return o.x === t.x && o.y === t.y; }); });
                    }
                    if (positions.length > 0) {
                        _this.tileX = 7;
                        var position = game_1.Game.randTable(positions, random_1.Random.rand);
                        var spawned_1;
                        switch (_this.enemySpawnType) {
                            case 1:
                                spawned_1 = new crabEnemy_1.CrabEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 2:
                                spawned_1 = new frogEnemy_1.FrogEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 3:
                                spawned_1 = new zombieEnemy_1.ZombieEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 4:
                                spawned_1 = new skullEnemy_1.SkullEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 5:
                                spawned_1 = new energyWizard_1.EnergyWizardEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 6:
                                spawned_1 = new chargeEnemy_1.ChargeEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 7:
                                spawned_1 = new rookEnemy_1.RookEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 8:
                                spawned_1 = new bishopEnemy_1.BishopEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 9:
                                spawned_1 = new armoredzombieEnemy_1.ArmoredzombieEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 10:
                                spawned_1 = new bigSkullEnemy_1.BigSkullEnemy(_this.room, _this.game, position.x, position.y);
                                for (var xx = 0; xx < 2; xx++) {
                                    for (var yy = 0; yy < 2; yy++) {
                                        _this.room.roomArray[position.x + xx][position.y + yy] =
                                            new floor_1.Floor(_this.room, position.x + xx, position.y + yy); // remove any walls
                                    }
                                }
                                break;
                            case 11:
                                spawned_1 = new queenEnemy_1.QueenEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 12:
                                spawned_1 = new knightEnemy_1.KnightEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 13:
                                spawned_1 = new bigKnightEnemy_1.BigKnightEnemy(_this.room, _this.game, position.x, position.y);
                                for (var xx = 0; xx < 2; xx++) {
                                    for (var yy = 0; yy < 2; yy++) {
                                        _this.room.roomArray[position.x + xx][position.y + yy] =
                                            new floor_1.Floor(_this.room, position.x + xx, position.y + yy); // remove any walls
                                    }
                                }
                                break;
                            case 14:
                                spawned_1 = new zombieEnemy_1.ZombieEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                            case 15:
                                spawned_1 = new fireWizard_1.FireWizardEnemy(_this.room, _this.game, position.x, position.y);
                                break;
                        }
                        var roomArea = _this.room.width * _this.room.height;
                        var enemies = _this.room.entities.filter(function (e) { return e instanceof enemy_1.Enemy; });
                        var maxIndividualCount = Math.round((_this.room.width + _this.room.height) /
                            Math.pow(spawned_1.constructor.difficulty, 2));
                        var enemySpawnTypeCount = _this.room.entities.filter(function (e) { return e instanceof spawned_1.constructor; }).length;
                        console.log("Count in room of ".concat(spawned_1.constructor.name, ": ").concat(enemySpawnTypeCount));
                        console.log("maxIndividualCount of ".concat(spawned_1.constructor.name, ": ").concat(maxIndividualCount));
                        if (enemies.length >= Math.round(roomArea / 4) ||
                            enemySpawnTypeCount >= maxIndividualCount) {
                            shouldSpawn = false;
                        }
                        if (shouldSpawn) {
                            _this.room.projectiles.push(new enemySpawnAnimation_1.EnemySpawnAnimation(_this.room, spawned_1, position.x, position.y));
                            _this.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.game, position.x, position.y, _this.x, _this.y));
                        }
                    }
                }
                if (shouldSpawn)
                    _this.ticks++;
            }
        };
        _this.draw = function (delta) {
            if (!_this.dead) {
                _this.updateDrawXY(delta);
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
            _this.room.items.push(_this.drop);
        };
        _this.ticks = 0;
        _this.health = 4;
        _this.maxHealth = 4;
        _this.tileX = 6;
        _this.tileY = 4;
        _this.seenPlayer = true;
        var drop = game_1.Game.randTable([1, 2, 3], random_1.Random.rand);
        switch (drop) {
            case 1:
                _this.drop = new bluegem_1.BlueGem(_this.room, _this.x, _this.y);
                break;
            case 2:
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
                break;
            case 3:
                _this.drop = new redgem_1.RedGem(_this.room, _this.x, _this.y);
                break;
        }
        _this.enemyTable = enemyTable.filter(function (t) { return t !== 7; });
        var randSpawnType = game_1.Game.randTable(_this.enemyTable, random_1.Random.rand);
        _this.enemySpawnType = randSpawnType;
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
var lightSource_1 = __webpack_require__(/*! ../../lightSource */ "./src/lightSource.ts");
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
        _this.newLightSource = function (x, y, radius, color, brightness) {
            _this.lightSource = new lightSource_1.LightSource(x, y, radius, color, brightness);
        };
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
                            if (bestPos) {
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
                _this.updateDrawXY(delta);
                if (_this.state === WizardState.attack)
                    _this.tileX = 7;
                else
                    _this.tileX = 6;
                if (_this.hasShadow)
                    game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                if (_this.frame >= 0) {
                    game_1.Game.drawMob(Math.floor(_this.frame) + 6, 2, 1, 2, _this.x, _this.y - 1.5, 1, 2, _this.room.shadeColor, _this.shadeAmount());
                    _this.frame += 0.2 * delta;
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
    WizardEnemy.difficulty = 3;
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
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var astarclass_1 = __webpack_require__(/*! ../../astarclass */ "./src/astarclass.ts");
var spiketrap_1 = __webpack_require__(/*! ../../tile/spiketrap */ "./src/tile/spiketrap.ts");
var pickaxe_1 = __webpack_require__(/*! ../../weapon/pickaxe */ "./src/weapon/pickaxe.ts");
var enemy_1 = __webpack_require__(/*! ./enemy */ "./src/entity/enemy/enemy.ts");
var ZombieEnemy = /** @class */ (function (_super) {
    __extends(ZombieEnemy, _super);
    function ZombieEnemy(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hit = function () {
            return 1;
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
                                _this.direction = game_1.Direction.RIGHT;
                            else if (moveX < oldX)
                                _this.direction = game_1.Direction.LEFT;
                            else if (moveY > oldY)
                                _this.direction = game_1.Direction.DOWN;
                            else if (moveY < oldY)
                                _this.direction = game_1.Direction.UP;
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
                                    _this.setDrawXY(oldX, oldY);
                                    if (_this.x > oldX)
                                        _this.direction = game_1.Direction.RIGHT;
                                    else if (_this.x < oldX)
                                        _this.direction = game_1.Direction.LEFT;
                                    else if (_this.y > oldY)
                                        _this.direction = game_1.Direction.DOWN;
                                    else if (_this.y < oldY)
                                        _this.direction = game_1.Direction.UP;
                                }
                            }
                        }
                        // Add positions to avoid based on the current direction
                        if (_this.direction == game_1.Direction.LEFT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.RIGHT) {
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y + 1,
                            });
                            disablePositions.push({
                                x: _this.x,
                                y: _this.y - 1,
                            });
                        }
                        if (_this.direction == game_1.Direction.DOWN) {
                            disablePositions.push({
                                x: _this.x + 1,
                                y: _this.y,
                            });
                            disablePositions.push({
                                x: _this.x - 1,
                                y: _this.y,
                            });
                        }
                        if (_this.direction == game_1.Direction.UP) {
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
                _this.updateDrawXY(delta);
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
        _this.dir = game_1.Direction.DOWN;
        _this.name = "zombie";
        _this.forwardOnlyAttack = true;
        _this.drawMoveSpeed = 0.2;
        _this.jumpHeight = 0.35;
        if (drop)
            _this.drop = drop;
        else {
            var dropProb = random_1.Random.rand();
            if (dropProb < 0.025)
                _this.drop = new pickaxe_1.Pickaxe(_this.room, _this.x, _this.y);
            else if (dropProb < 0.05)
                _this.drop = new greengem_1.GreenGem(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
        return _this;
    }
    ZombieEnemy.difficulty = 1;
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
var events_1 = __webpack_require__(/*! ../events */ "./src/events.ts");
var damageNumber_1 = __webpack_require__(/*! ../particle/damageNumber */ "./src/particle/damageNumber.ts");
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
        _this.imageParticleX = 0;
        _this.imageParticleY = 26;
        _this.addLightSource = function (lightSource) {
            _this.room.lightSources.push(lightSource);
        };
        _this.removeLightSource = function (lightSource) {
            _this.room.lightSources = _this.room.lightSources.filter(function (ls) { return ls !== lightSource; });
        };
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
        _this.createDamageNumber = function (damage, type) {
            if (type === void 0) { type = "none"; }
            var color = "red";
            var outlineColor = gameConstants_1.GameConstants.OUTLINE;
            if (type === "poison")
                color = "green";
            if (type === "blood") {
                color = "#8B0000";
                outlineColor = "red";
            }
            if (type === "heal") {
                color = "#B8A4FF";
                outlineColor = gameConstants_1.GameConstants.OUTLINE;
            }
            _this.room.particles.push(new damageNumber_1.DamageNumber(_this.room, _this.x, _this.y, damage, color, outlineColor));
        };
        _this.updateDrawXY = function (delta) {
            if (!_this.doneMoving()) {
                _this.drawX *= Math.pow(0.9, delta);
                _this.drawY *= Math.pow(0.9, delta);
                _this.drawX = Math.abs(_this.drawX) < 0.01 ? 0 : _this.drawX;
                _this.drawY = Math.abs(_this.drawY) < 0.01 ? 0 : _this.drawY;
            }
        };
        _this.setDrawXY = function (x, y) {
            _this.drawX += _this.x - x;
            _this.drawY += _this.y - y;
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
            _this.createDamageNumber(damage);
            _this.health -= damage;
            if (_this.health <= 0)
                _this.kill();
            else
                _this.hurtCallback();
        };
        _this.interact = function (player) { };
        _this.dropLoot = function () {
            var coordX;
            var coordY;
            if (_this.crushed) {
                coordX = _this.lastX;
                coordY = _this.lastY;
            }
            else {
                coordX = _this.x;
                coordY = _this.y;
            }
            if (_this.drop) {
                _this.drop.level = _this.room;
                if (!_this.room.roomArray[coordX][coordY].isSolid()) {
                    _this.drop.x = coordX;
                    _this.drop.y = coordY;
                }
                _this.room.items.push(_this.drop);
                _this.drop.onDrop();
            }
        };
        _this.kill = function () {
            var x = _this.x;
            var y = _this.y;
            if (_this.crushed) {
                x = _this.lastX;
                y = _this.lastY;
            }
            if (_this.room.roomArray[x][y] instanceof floor_1.Floor) {
                var b = new bones_1.Bones(_this.room, x, y);
                b.skin = _this.room.roomArray[x][y].skin;
                _this.room.roomArray[x][y] = b;
            }
            _this.emitEnemyKilled();
            _this.dead = true;
            _this.dropLoot();
        };
        _this.killNoBones = function () {
            _this.dead = true;
            _this.dropLoot();
        };
        _this.shadeAmount = function () {
            return _this.room.softVis[_this.x][_this.y];
        };
        _this.emitEnemyKilled = function () {
            eventBus_1.globalEventBus.emit(events_1.EVENTS.ENEMY_KILLED, {
                enemyId: _this.name,
            });
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
                    _this.direction = game_1.Direction.RIGHT;
                if (dx < 0)
                    _this.direction = game_1.Direction.LEFT;
            }
            else {
                if (dy > 0)
                    _this.direction = game_1.Direction.DOWN;
                if (dy < 0)
                    _this.direction = game_1.Direction.UP;
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
            //this.updateDrawXY(delta);
            _this.drawableY = _this.y - _this.drawY;
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x, _this.y, true);
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
                if (direction === game_1.Direction.LEFT || direction === game_1.Direction.RIGHT) {
                    rumbleOffset.y = offset;
                }
                else if (direction === game_1.Direction.UP ||
                    direction === game_1.Direction.DOWN ||
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
        _this.placeProjectile = function (projectileClass, x, y, color) {
            _this.room.projectiles.push(new projectileClass(_this, x, y, color));
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
        _this.getLuminance = function () {
            if (_this.room.roomArray[_this.x][_this.y]) {
                return _this.room.vis[_this.x][_this.y];
            }
            return null;
        };
        _this.getAverageLuminance = function () {
            var total = 0;
            var count = 0;
            for (var x = _this.x - 2; x <= _this.x + 2; x++) {
                for (var y = _this.y - 2; y <= _this.y + 2; y++) {
                    if (_this.room.vis[x][y]) {
                        total += _this.room.vis[x][y];
                        count++;
                    }
                }
            }
            return total / count;
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
                _a[game_1.Direction.LEFT] = [-1, 0],
                _a[game_1.Direction.RIGHT] = [1, 0],
                _a[game_1.Direction.UP] = [0, -1],
                _a[game_1.Direction.DOWN] = [0, 1],
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
                    var hitWarning = new hitWarning_1.HitWarning(_this.game, targetX, targetY, _this.x, _this.y, true, false, _this);
                    _this.room.hitwarnings.push(hitWarning);
                    //this.hitWarnings.push(hitWarning);
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
        _this.direction = game_1.Direction.DOWN;
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
        _this.hitWarnings = [];
        _this.orthogonalAttack = false;
        _this.diagonalAttack = false;
        _this.forwardOnlyAttack = false;
        _this.attackRange = 1;
        _this.diagonalAttackRange = 1;
        _this.drawMoveSpeed = 0.3;
        _this.unconscious = false;
        return _this;
    }
    Entity.add = function (room, game, x, y) {
        var rest = [];
        for (var _i = 4; _i < arguments.length; _i++) {
            rest[_i - 4] = arguments[_i];
        }
        room.entities.push(new (this.bind.apply(this, __spreadArray([void 0, room, game, x, y], rest, false)))());
    };
    Object.defineProperty(Entity.prototype, "type", {
        get: function () {
            return EntityType.ENEMY;
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
var weaponFragments_1 = __webpack_require__(/*! ../../item/weaponFragments */ "./src/item/weaponFragments.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var Barrel = /** @class */ (function (_super) {
    __extends(Barrel, _super);
    function Barrel(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 25);
            _this.dropLoot();
            _this.dead = true;
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
        _this.tileX = 1;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        _this.name = "barrel";
        if (Math.random() < 0.1) {
            _this.drop = new weaponFragments_1.WeaponFragments(_this.room, _this.x, _this.y);
        }
        else {
            _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
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
var weaponFragments_1 = __webpack_require__(/*! ../../item/weaponFragments */ "./src/item/weaponFragments.ts");
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
                case 7:
                    _this.drop = new weaponFragments_1.WeaponFragments(_this.room, x, y, 100);
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
                _this.updateDrawXY(delta);
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
var weaponFragments_1 = __webpack_require__(/*! ../../item/weaponFragments */ "./src/item/weaponFragments.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var Crate = /** @class */ (function (_super) {
    __extends(Crate, _super);
    function Crate(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 3, 26);
            _this.dropLoot();
            _this.dead = true;
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
        _this.maxHealth = 1;
        _this.tileX = 0;
        _this.tileY = 0;
        _this.hasShadow = false;
        _this.pushable = true;
        _this.name = "crate";
        if (Math.random() < 0.1) {
            _this.drop = new weaponFragments_1.WeaponFragments(_this.room, _this.x, _this.y, 100);
        }
        else {
            _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
        }
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
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var Mushrooms = /** @class */ (function (_super) {
    __extends(Mushrooms, _super);
    function Mushrooms(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            _this.dead = true;
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 30);
            //this.room.items.push(new Shrooms(this.room, this.x, this.y));
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
var heart_1 = __webpack_require__(/*! ../../item/heart */ "./src/item/heart.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var coin_1 = __webpack_require__(/*! ../../item/coin */ "./src/item/coin.ts");
var sound_1 = __webpack_require__(/*! ../../sound */ "./src/sound.ts");
var Pot = /** @class */ (function (_super) {
    __extends(Pot, _super);
    function Pot(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            _this.dropLoot();
            _this.dead = true;
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 29);
            sound_1.Sound.delayPlay(sound_1.Sound.potSmash, 250);
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
        var dropProb = random_1.Random.rand();
        if (dropProb < 0.025)
            _this.drop = new heart_1.Heart(_this.room, _this.x, _this.y);
        else
            _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
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
var sound_1 = __webpack_require__(/*! ../../sound */ "./src/sound.ts");
var PottedPlant = /** @class */ (function (_super) {
    __extends(PottedPlant, _super);
    function PottedPlant(room, game, x, y, drop) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.hurtCallback = function () {
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 28);
        };
        _this.kill = function () {
            _this.dead = true;
            _this.dropLoot();
            sound_1.Sound.delayPlay(sound_1.Sound.potSmash, 250);
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 29);
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 28);
        };
        _this.killNoBones = function () {
            _this.dead = true;
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
                _this.drop = new heart_1.Heart(_this.room, _this.x, _this.y);
            else
                _this.drop = new coin_1.Coin(_this.room, _this.x, _this.y);
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

/***/ "./src/entity/object/pumpkin.ts":
/*!**************************************!*\
  !*** ./src/entity/object/pumpkin.ts ***!
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
exports.Pumpkin = void 0;
var entity_1 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var game_1 = __webpack_require__(/*! ../../game */ "./src/game.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var lightSource_1 = __webpack_require__(/*! ../../lightSource */ "./src/lightSource.ts");
var candle_1 = __webpack_require__(/*! ../../item/candle */ "./src/item/candle.ts");
var imageParticle_1 = __webpack_require__(/*! ../../particle/imageParticle */ "./src/particle/imageParticle.ts");
var Pumpkin = /** @class */ (function (_super) {
    __extends(Pumpkin, _super);
    function Pumpkin(room, game, x, y) {
        var _this = _super.call(this, room, game, x, y) || this;
        _this.kill = function () {
            _this.removeLightSource(_this.lightSource);
            _this.dead = true;
            _this.dropLoot();
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 25);
            //this.room.items.push(new Shrooms(this.room, this.x, this.y));
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
        _this.tileX = 15;
        _this.tileY = 2;
        _this.hasShadow = false;
        _this.chainPushable = false;
        _this.name = "pumpkin";
        _this.drop = new candle_1.Candle(_this.room, _this.x, _this.y);
        _this.lightSource = new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 5, [200, 30, 1], 3);
        _this.addLightSource(_this.lightSource);
        return _this;
    }
    Object.defineProperty(Pumpkin.prototype, "type", {
        get: function () {
            return entity_2.EntityType.PROP;
        },
        enumerable: false,
        configurable: true
    });
    return Pumpkin;
}(entity_1.Entity));
exports.Pumpkin = Pumpkin;


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
            _this.removeLightSource(_this.lightSource);
            _this.dead = true;
            _this.dropLoot();
        };
        _this.hurt = function (playerHitBy, damage) {
            _this.healthBar.hurt();
            imageParticle_1.ImageParticle.spawnCluster(_this.room, _this.x + 0.5, _this.y + 0.5, 0, 25);
            sound_1.Sound.delayPlay(sound_1.Sound.hurt, 0);
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
                    sound_1.Sound.delayPlay(sound_1.Sound.skeleSpawn, 50);
                }
                _this.tileX += 2;
                //draw half broken tombstone based on skintype after it takes one damage
            }
            if (_this.health <= 0) {
                _this.kill();
                sound_1.Sound.delayPlay(sound_1.Sound.breakRock, 50);
            }
            else {
                _this.hurtCallback();
                //Sound.delayPlay(Sound.hit, 0);
            }
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
            _this.drop = new spellbook_1.Spellbook(_this.room, _this.x, _this.y);
        _this.lightSource = new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 7, [5, 150, 5], 1);
        _this.addLightSource(_this.lightSource);
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
var greengem_1 = __webpack_require__(/*! ../../item/greengem */ "./src/item/greengem.ts");
var gameConstants_1 = __webpack_require__(/*! ../../gameConstants */ "./src/gameConstants.ts");
var shotgun_1 = __webpack_require__(/*! ../../weapon/shotgun */ "./src/weapon/shotgun.ts");
var armor_1 = __webpack_require__(/*! ../../item/armor */ "./src/item/armor.ts");
var heart_1 = __webpack_require__(/*! ../../item/heart */ "./src/item/heart.ts");
var spear_1 = __webpack_require__(/*! ../../weapon/spear */ "./src/weapon/spear.ts");
var bluegem_1 = __webpack_require__(/*! ../../item/bluegem */ "./src/item/bluegem.ts");
var dualdagger_1 = __webpack_require__(/*! ../../weapon/dualdagger */ "./src/weapon/dualdagger.ts");
var lantern_1 = __webpack_require__(/*! ../../item/lantern */ "./src/item/lantern.ts");
var redgem_1 = __webpack_require__(/*! ../../item/redgem */ "./src/item/redgem.ts");
var entity_2 = __webpack_require__(/*! ../entity */ "./src/entity/entity.ts");
var random_1 = __webpack_require__(/*! ../../random */ "./src/random.ts");
var warhammer_1 = __webpack_require__(/*! ../../weapon/warhammer */ "./src/weapon/warhammer.ts");
var torch_1 = __webpack_require__(/*! ../../item/torch */ "./src/item/torch.ts");
var spellbook_1 = __webpack_require__(/*! ../../weapon/spellbook */ "./src/weapon/spellbook.ts");
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
        _this.isPointInVendingMachineBounds = function (x, y) {
            var _a;
            // First check if this is the currently open vending machine
            if (!_this.open || _this !== ((_a = _this.playerOpened) === null || _a === void 0 ? void 0 : _a.openVendingMachine))
                return false;
            var OPEN_TIME = 200; // Match the constant from drawTopLayer
            var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
            var b = 2; // border
            var g = -2; // gap
            var ob = 1; // outer border
            // Calculate total width and height of the UI
            var width = (_this.costItems.length + 2) * (s + 2 * b + g) - g;
            var height = s + 2 * b + g - g;
            // Calculate center position (matches drawTopLayer positioning)
            var cx = (_this.x + 0.5) * gameConstants_1.GameConstants.TILESIZE;
            var cy = (_this.y - 1.5) * gameConstants_1.GameConstants.TILESIZE;
            // Calculate bounds
            var left = Math.round(cx - 0.5 * width) - ob;
            var right = Math.round(cx - 0.5 * width) - ob + Math.round(width + 2 * ob);
            var top = Math.round(cy - 0.5 * height) - ob;
            var bottom = Math.round(cy - 0.5 * height) - ob + Math.round(height + 2 * ob);
            // Check if point is within bounds
            return x >= left && x <= right && y >= top && y <= bottom;
        };
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
                var _loop_1 = function (i) {
                    if (!_this.playerOpened.inventory.hasItemCount(i)) {
                        var numOfItem_1 = 0;
                        _this.playerOpened.inventory.items.forEach(function (item) {
                            if (item instanceof i.constructor)
                                numOfItem_1++;
                        });
                        var difference = _this.costItems[0].stackCount - numOfItem_1;
                        var pluralLetter_1 = _this.costItems[0].stackCount > 1 ? "s" : "";
                        _this.game.pushMessage("You need ".concat(difference, " more ").concat(_this.costItems[0].constructor.itemName).concat(pluralLetter_1, " to buy that. "));
                        return { value: void 0 };
                    }
                };
                // check if player can pay
                for (var _i = 0, _a = _this.costItems; _i < _a.length; _i++) {
                    var i = _a[_i];
                    var state_1 = _loop_1(i);
                    if (typeof state_1 === "object")
                        return state_1.value;
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
                newItem.onPickup(_this.playerOpened);
                var cost = _this.costItems[0].stackCount;
                var pluralLetter = cost > 1 ? "s" : "";
                if (!_this.isInf) {
                    _this.quantity--;
                    if (_this.quantity <= 0)
                        _this.close();
                }
                _this.game.pushMessage("Purchased ".concat(newItem.constructor.itemName, " for ").concat(cost, " ").concat(_this.costItems[0].constructor.itemName).concat(pluralLetter));
                _this.game.pushMessage("".concat(_this.quantity, " available to buy."));
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
                            _this.item.drawIcon(delta, drawXScaled, drawYScaled, 1, _this.quantity);
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
            g.stackCount = game_1.Game.randTable([7], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof heart_1.Heart) {
            var c = new coin_1.Coin(room, 0, 0);
            c.stackCount = 10;
            _this.costItems = [c];
            _this.quantity = 3;
        }
        else if (_this.item instanceof spear_1.Spear) {
            var g = new greengem_1.GreenGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof armor_1.Armor) {
            var g = new greengem_1.GreenGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof dualdagger_1.DualDagger) {
            var g = new bluegem_1.BlueGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof lantern_1.Lantern) {
            var c = new coin_1.Coin(room, 0, 0);
            c.stackCount = game_1.Game.randTable([50], random_1.Random.rand);
            _this.costItems = [c];
        }
        else if (_this.item instanceof warhammer_1.Warhammer) {
            var g = new redgem_1.RedGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([5], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof spellbook_1.Spellbook) {
            var g = new redgem_1.RedGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([7], random_1.Random.rand);
            _this.costItems = [g];
        }
        else if (_this.item instanceof torch_1.Torch) {
            var g = new redgem_1.RedGem(room, 0, 0);
            g.stackCount = game_1.Game.randTable([1], random_1.Random.rand);
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

/***/ "./src/events.ts":
/*!***********************!*\
  !*** ./src/events.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EVENTS = void 0;
exports.EVENTS = {
    KEY_DOWN: "KEY_DOWN",
    KEY_UP: "KEY_UP",
    MOUSE_LEFT_CLICK: "MOUSE_LEFT_CLICK",
    MOUSE_RIGHT_CLICK: "MOUSE_RIGHT_CLICK",
    MOUSE_MOVE: "MOUSE_MOVE",
    TOUCH_START: "TOUCH_START",
    TOUCH_MOVE: "TOUCH_MOVE",
    TOUCH_END: "TOUCH_END",
    TAP: "TAP",
    TAP_HOLD: "TAP_HOLD",
    MOUSE_DOWN: "MOUSE_DOWN",
    MOUSE_UP: "MOUSE_UP",
    // **Additional Custom Events:**
    CHAT_MESSAGE: "ChatMessage",
    ENEMY_SEEN_PLAYER: "EnemySeenPlayer",
    ENEMY_KILLED: "ENEMY_KILLED",
    DAMAGE_DONE: "DAMAGE_DONE",
    DAMAGE_TAKEN: "DAMAGE_TAKEN",
    TURN_PASSED: "TURN_PASSED",
    COIN_COLLECTED: "COIN_COLLECTED",
    ITEM_COLLECTED: "ITEM_COLLECTED",
    LEVEL_GENERATION_STARTED: "LEVEL_GENERATION_STARTED",
    LEVEL_GENERATION_COMPLETED: "LEVEL_GENERATION_COMPLETED",
    // Add other custom events as needed
};


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
var levelGenerator_1 = __webpack_require__(/*! ./levelGenerator */ "./src/levelGenerator.ts");
var input_1 = __webpack_require__(/*! ./input */ "./src/input.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
var textbox_1 = __webpack_require__(/*! ./textbox */ "./src/textbox.ts");
var gameState_1 = __webpack_require__(/*! ./gameState */ "./src/gameState.ts");
var tutorialListener_1 = __webpack_require__(/*! ./tutorialListener */ "./src/tutorialListener.ts");
var mouseCursor_1 = __webpack_require__(/*! ./mouseCursor */ "./src/mouseCursor.ts");
var eventBus_1 = __webpack_require__(/*! ./eventBus */ "./src/eventBus.ts");
var reverb_1 = __webpack_require__(/*! ./reverb */ "./src/reverb.ts");
var stats_1 = __webpack_require__(/*! ./stats */ "./src/stats.ts");
var events_1 = __webpack_require__(/*! ./events */ "./src/events.ts");
var LevelState;
(function (LevelState) {
    LevelState[LevelState["IN_LEVEL"] = 0] = "IN_LEVEL";
    LevelState[LevelState["TRANSITIONING"] = 1] = "TRANSITIONING";
    LevelState[LevelState["TRANSITIONING_LADDER"] = 2] = "TRANSITIONING_LADDER";
    LevelState[LevelState["LEVEL_GENERATION"] = 3] = "LEVEL_GENERATION";
})(LevelState = exports.LevelState || (exports.LevelState = {}));
var Direction;
(function (Direction) {
    Direction[Direction["DOWN"] = 0] = "DOWN";
    Direction[Direction["UP"] = 1] = "UP";
    Direction[Direction["RIGHT"] = 2] = "RIGHT";
    Direction[Direction["LEFT"] = 3] = "LEFT";
    Direction[Direction["DOWN_RIGHT"] = 4] = "DOWN_RIGHT";
    Direction[Direction["UP_LEFT"] = 5] = "UP_LEFT";
    Direction[Direction["UP_RIGHT"] = 6] = "UP_RIGHT";
    Direction[Direction["DOWN_LEFT"] = 7] = "DOWN_LEFT";
    Direction[Direction["CENTER"] = 8] = "CENTER";
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
var fps = 60;
var Game = /** @class */ (function () {
    function Game() {
        var _this = this;
        this.localPlayerID = "localplayer";
        this.mostRecentInputReceived = true;
        this.loginMessage = "";
        this.startScreenAlpha = 1;
        this.newGame = function () {
            stats_1.statsTracker.resetStats();
            _this.encounteredEnemies = [];
            _this.levels = [];
            var gs = new gameState_1.GameState();
            gs.seed = (Math.random() * 4294967296) >>> 0;
            gs.randomState = (Math.random() * 4294967296) >>> 0;
            (0, gameState_1.loadGameState)(_this, [_this.localPlayerID], gs, true);
            _this.levelState = LevelState.LEVEL_GENERATION;
        };
        this.startGame = function () {
            _this.started = true;
            sound_1.Sound.ambientSound.play();
        };
        this.keyDownListener = function (key) {
            if (!_this.started) {
                _this.startedFadeOut = true;
                return;
            }
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
                    case "1":
                        levelGenerator_1.LevelGenerator.ANIMATION_CONSTANT = 1;
                        break;
                    case "2":
                        levelGenerator_1.LevelGenerator.ANIMATION_CONSTANT = 2;
                        break;
                    case "3":
                        levelGenerator_1.LevelGenerator.ANIMATION_CONSTANT = 5;
                        break;
                    case "4":
                        levelGenerator_1.LevelGenerator.ANIMATION_CONSTANT = 10000;
                        break;
                    case "0":
                        levelGenerator_1.LevelGenerator.ANIMATION_CONSTANT = 0;
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
                    [Direction.RIGHT, Direction.LEFT].includes(door.doorDir))
                    _this.sideTransition = true;
                else if (door instanceof door_1.Door && door.doorDir === Direction.DOWN)
                    _this.upwardTransition = true;
            }
            else {
                door.room.enterLevelThroughDoor(player, door, side);
            }
            player.map.saveMapData();
        };
        this.run = function (timestamp) {
            if (_this.paused)
                return;
            if (!_this.previousFrameTimestamp) {
                _this.previousFrameTimestamp = timestamp;
                window.requestAnimationFrame(_this.run);
                return;
            }
            var maxFPS = 60;
            // Calculate elapsed time in milliseconds
            var elapsed = timestamp - _this.previousFrameTimestamp;
            // Normalize delta to 60 FPS
            var delta = (elapsed * maxFPS) / 1000.0;
            // Define minimum and maximum delta values
            var deltaMin = maxFPS / 1000; // Approximately 1 ms
            var deltaMax = (maxFPS / 1000) * 8; // Approximately 33.33 ms
            // Cap delta within [deltaMin, deltaMax]
            if (delta < deltaMin) {
                delta = deltaMin;
            }
            else if (delta > deltaMax) {
                delta = deltaMax;
            }
            // Update FPS tracking
            while (times.length > 0 && times[0] <= timestamp - 1000) {
                times.shift();
            }
            times.push(timestamp);
            fps = times.length;
            // Update game logic
            if (Math.floor(timestamp / (1000 / maxFPS)) >
                Math.floor(_this.previousFrameTimestamp / (1000 / maxFPS))) {
                _this.update();
            }
            // Render the frame with capped delta
            _this.draw(delta * gameConstants_1.GameConstants.ANIMATION_SPEED * 2.2);
            // Request the next frame
            window.requestAnimationFrame(_this.run);
            // Update the previous frame timestamp
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
            if (_this.levelState !== LevelState.LEVEL_GENERATION) {
                for (var i in _this.players) {
                    _this.players[i].update();
                    _this.rooms[_this.players[i].levelID].update();
                    if (_this.players[i].dead) {
                        for (var j in _this.players) {
                            _this.players[j].dead = true;
                        }
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
        this.commandHandler = function (command) {
            var player = _this.room.game.players[0];
            command = command.toLowerCase();
            switch (command) {
                case "devmode":
                    gameConstants_1.GameConstants.DEVELOPER_MODE = !gameConstants_1.GameConstants.DEVELOPER_MODE;
                    console.log("Developer mode is now ".concat(gameConstants_1.GameConstants.DEVELOPER_MODE));
                    break;
                case "new":
                    _this.newGame();
                    break;
                case "dev":
                    gameConstants_1.GameConstants.DEVELOPER_MODE = !gameConstants_1.GameConstants.DEVELOPER_MODE;
                    console.log("Developer mode is now ".concat(gameConstants_1.GameConstants.DEVELOPER_MODE));
                    _this.newGame();
                    break;
                case "kill":
                    for (var i in _this.players) {
                        _this.players[i].dead = true;
                    }
                    break;
                case "killall":
                    for (var i in _this.players) {
                        _this.players[i].game.room.entities.forEach(function (e) {
                            e.kill();
                        });
                    }
                    break;
                default:
                    if (command.startsWith("new ")) {
                        _this.room.addNewEnemy(command.slice(4));
                    }
                    break;
            }
        };
        this.onResize = function () {
            var maxWidthScale = Math.floor(window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH);
            var maxHeightScale = Math.floor(window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT);
            _this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (_this.isMobile) {
                gameConstants_1.GameConstants.isMobile = true;
                _this.pushMessage("mobile detected");
                // Use smaller scale for mobile devices based on screen size
                Game.scale = Math.min(maxWidthScale, maxHeightScale, 2); // Cap at 2x for mobile
            }
            else {
                gameConstants_1.GameConstants.isMobile = false;
                // For desktop, use standard scaling logic
                Game.scale = Math.min(maxWidthScale, maxHeightScale, gameConstants_1.GameConstants.SCALE);
            }
            // Handle case where scale would be 0
            if (Game.scale === 0) {
                maxWidthScale = window.innerWidth / gameConstants_1.GameConstants.DEFAULTWIDTH;
                maxHeightScale = window.innerHeight / gameConstants_1.GameConstants.DEFAULTHEIGHT;
                Game.scale = Math.min(maxWidthScale, maxHeightScale, 1); // Ensure minimum scale of 1
            }
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
            _this.screenShakeX = 0;
            _this.screenShakeY = 0;
            _this.shakeAmountX = 0;
            _this.shakeAmountY = 0;
            _this.screenShakeActive = true;
            _this.screenShakeX = shakeX;
            _this.screenShakeY = shakeY;
            _this.shakeAmountX = Math.abs(shakeX);
            _this.shakeAmountY = Math.abs(shakeY);
            if (shakeX < 0 || shakeY < 0)
                _this.shakeFrame = (3 * Math.PI) / 2;
            if (shakeX > 0 || shakeY > 0)
                _this.shakeFrame = Math.PI / 2;
            _this.screenShakeCutoff = Date.now();
        };
        this.drawStuff = function (delta) {
            _this.room.drawColorLayer();
            _this.room.drawShade(delta);
            _this.room.drawOverShade(delta);
        };
        this.drawStartScreen = function (delta) {
            var startString = "Welcome to Turnarchist";
            Game.ctx.globalAlpha = _this.startScreenAlpha;
            if (!_this.started && !_this.startedFadeOut) {
                _this.startScreenAlpha = 1;
                if (_this.startScreenAlpha <= 0)
                    _this.startScreenAlpha = 0;
            }
            else if (!_this.started && _this.startedFadeOut) {
                _this.startScreenAlpha -= delta * 0.025;
                if (_this.startScreenAlpha <= 0) {
                    _this.startScreenAlpha = 0;
                    _this.started = true;
                    sound_1.Sound.playAmbient();
                }
            }
            Game.ctx.fillStyle = "black";
            Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
            Game.fillText(startString, gameConstants_1.GameConstants.WIDTH / 2 - Game.measureText(startString).width / 2, gameConstants_1.GameConstants.HEIGHT / 2 - Game.letter_height + 2);
            var restartButton = "Press space or click to start";
            if (_this.isMobile)
                restartButton = "Tap to start";
            Game.fillText(restartButton, gameConstants_1.GameConstants.WIDTH / 2 - Game.measureText(restartButton).width / 2, gameConstants_1.GameConstants.HEIGHT / 2 + Game.letter_height + 5);
            Game.ctx.globalAlpha = 1;
        };
        this.draw = function (delta) {
            Game.ctx.save(); // Save the current canvas state
            Game.ctx.globalAlpha = 1;
            if (_this.room)
                Game.ctx.fillStyle = _this.room.shadeColor;
            else
                Game.ctx.fillStyle = "black";
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
                //for (const i in this.players) this.players[i].updateDrawXY(delta);
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
                //for (const i in this.players) this.players[i].updateDrawXY(delta);
            }
            else if (_this.levelState === LevelState.LEVEL_GENERATION) {
                _this.levelgen.draw(delta);
            }
            else if (_this.levelState === LevelState.IN_LEVEL) {
                // Start of Selection
                _this.drawScreenShake(delta);
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
                //for (const i in this.players) this.players[i].updateDrawXY(delta);
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
            if (!_this.started && _this.levelState !== LevelState.LEVEL_GENERATION) {
                _this.drawStartScreen(delta * 10);
            }
            mouseCursor_1.MouseCursor.getInstance().draw();
            Game.ctx.restore(); // Restore the canvas state
        };
        this.drawScreenShake = function (delta) {
            if (!_this.screenShakeActive) {
                _this.resetScreenShake();
                return;
            }
            //const decayFactor = 1 - 0.15 * delta;
            var decayFactor = 3 / Math.sqrt((Date.now() + 30 - _this.screenShakeCutoff) * delta);
            _this.shakeAmountX *= Math.pow(0.9, delta);
            _this.shakeAmountY *= Math.pow(0.9, delta);
            _this.screenShakeX =
                Math.sin(_this.shakeFrame * Math.PI) * _this.shakeAmountX * decayFactor;
            _this.screenShakeY =
                Math.sin(_this.shakeFrame * Math.PI) * _this.shakeAmountY * decayFactor;
            _this.shakeFrame += 0.3 * delta;
            if (Math.abs(decayFactor) < 0.001) {
                _this.resetScreenShake();
            }
        };
        this.resetScreenShake = function () {
            _this.shakeAmountX = 0;
            _this.shakeAmountY = 0;
            _this.shakeFrame = 0;
            _this.screenShakeX = 0;
            _this.screenShakeY = 0;
            _this.screenShakeActive = false;
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
            _this.levelState = LevelState.LEVEL_GENERATION;
            var checkResourcesLoaded = function () {
                if (resourcesLoaded < NUM_RESOURCES) {
                    window.setTimeout(checkResourcesLoaded, 500);
                }
                else {
                    console.log("loaded all images");
                    // proceed with constructor
                    Game.scale = gameConstants_1.GameConstants.SCALE;
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
                    _this.shakeAmountX = 0;
                    _this.shakeAmountY = 0;
                    _this.shakeFrame = (3 * Math.PI) / 2;
                    _this.screenShakeCutoff = 0;
                    _this.tutorialActive = false;
                    _this.screenShakeActive = false;
                    _this.levels = [];
                    _this.encounteredEnemies = [];
                    _this.newGame();
                }
            };
            checkResourcesLoaded();
        });
        this.started = false;
        this.tutorialListener = new tutorialListener_1.TutorialListener(this);
        this.setupEventListeners();
        reverb_1.ReverbEngine.initialize();
        eventBus_1.globalEventBus.on(events_1.EVENTS.LEVEL_GENERATION_STARTED, function () {
            _this.levelState = LevelState.LEVEL_GENERATION;
        });
        eventBus_1.globalEventBus.on(events_1.EVENTS.LEVEL_GENERATION_COMPLETED, function () {
            _this.levelState = LevelState.IN_LEVEL;
        });
    }
    Game.prototype.setupEventListeners = function () {
        //console.log("Setting up event listeners");
        eventBus_1.globalEventBus.on("ChatMessage", this.commandHandler.bind(this));
        console.log("Event listeners set up");
    };
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
        Game.ctx.save(); // Save the current canvas state
        // Snap to nearest shading increment
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
        Game.ctx.restore(); // Restore the canvas state
    };
    Game.drawTile = function (sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity) {
        if (shadeColor === void 0) { shadeColor = "black"; }
        if (shadeOpacity === void 0) { shadeOpacity = 0; }
        Game.drawHelper(Game.tileset, sX, sY, sW, sH, dX, dY, dW, dH, shadeColor, shadeOpacity);
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
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var backpack_1 = __webpack_require__(/*! ./item/backpack */ "./src/item/backpack.ts");
var godStone_1 = __webpack_require__(/*! ./item/godStone */ "./src/item/godStone.ts");
var heart_1 = __webpack_require__(/*! ./item/heart */ "./src/item/heart.ts");
var torch_1 = __webpack_require__(/*! ./item/torch */ "./src/item/torch.ts");
var weaponFragments_1 = __webpack_require__(/*! ./item/weaponFragments */ "./src/item/weaponFragments.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var dagger_1 = __webpack_require__(/*! ./weapon/dagger */ "./src/weapon/dagger.ts");
var spear_1 = __webpack_require__(/*! ./weapon/spear */ "./src/weapon/spear.ts");
var spellbook_1 = __webpack_require__(/*! ./weapon/spellbook */ "./src/weapon/spellbook.ts");
var warhammer_1 = __webpack_require__(/*! ./weapon/warhammer */ "./src/weapon/warhammer.ts");
var GameConstants = /** @class */ (function () {
    function GameConstants() {
    }
    GameConstants.VERSION = "v1.0.1"; //"v0.6.3";
    GameConstants.DEVELOPER_MODE = false;
    GameConstants.isMobile = false;
    GameConstants.FPS = 120;
    GameConstants.ALPHA_ENABLED = true;
    GameConstants.SHADE_LEVELS = 256;
    GameConstants.TILESIZE = 16;
    GameConstants.SCALE = 3;
    GameConstants.SWIPE_THRESH = Math.pow(25, 2); // (size of swipe threshold circle)^2
    GameConstants.HOLD_THRESH = 250; // milliseconds
    GameConstants.KEY_REPEAT_TIME = 250; // millseconds
    GameConstants.MOVEMENT_COOLDOWN = 100; // milliseconds
    GameConstants.CHAT_APPEAR_TIME = 5000;
    GameConstants.CHAT_FADE_TIME = 1000;
    GameConstants.ANIMATION_SPEED = 1;
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
    GameConstants.STARTING_INVENTORY = [dagger_1.Dagger, torch_1.Torch];
    GameConstants.STARTING_DEV_INVENTORY = [
        dagger_1.Dagger,
        weaponFragments_1.WeaponFragments,
        torch_1.Torch,
        warhammer_1.Warhammer,
        godStone_1.GodStone,
        spear_1.Spear,
        spellbook_1.Spellbook,
        armor_1.Armor,
        heart_1.Heart,
        backpack_1.Backpack,
    ];
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
var energyWizard_1 = __webpack_require__(/*! ./entity/enemy/energyWizard */ "./src/entity/enemy/energyWizard.ts");
var eventBus_1 = __webpack_require__(/*! ./eventBus */ "./src/eventBus.ts");
var events_1 = __webpack_require__(/*! ./events */ "./src/events.ts");
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
        enemy = new spawner_1.Spawner(level, game, es.x, es.y, [es.enemySpawnType]);
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
        enemy = new energyWizard_1.EnergyWizardEnemy(level, game, es.x, es.y);
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
    gs.depth = game.level.depth;
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
    eventBus_1.globalEventBus.emit(events_1.EVENTS.LEVEL_GENERATION_STARTED, {});
    game.levelgen.generateFirstNFloors(game, gameState.depth).then(function () {
        eventBus_1.globalEventBus.emit(events_1.EVENTS.LEVEL_GENERATION_COMPLETED, {});
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
        //choose one door to lock
        var locked = false;
        game.room.doors.forEach(function (door) {
            if (!locked) {
                door.lock();
                locked = true;
            }
        });
        game.chat = [];
    });
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
    function HitWarning(game, x, y, eX, eY, isEnemy, dirOnly, parent) {
        if (dirOnly === void 0) { dirOnly = false; }
        if (parent === void 0) { parent = null; }
        var _this = _super.call(this) || this;
        _this.parent = null;
        _this._pointerDir = null;
        _this._pointerOffset = null;
        _this.alpha = 0;
        _this.tickedForDeath = false;
        _this.tick = function () {
            if (_this.tickedForDeath)
                _this.dead = true;
            _this.tickedForDeath = true;
        };
        _this.removeOverlapping = function () {
            for (var _i = 0, _a = _this.game.room.entities; _i < _a.length; _i++) {
                var entity = _a[_i];
                if (entity.x === _this.x &&
                    entity.y === _this.y &&
                    entity.pushable === false) {
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
        _this.fadeHitwarnings = function (delta) {
            if (!_this.tickedForDeath) {
                if (_this.alpha < 1)
                    _this.alpha += 0.03 * delta;
                if (_this.alpha > 1)
                    _this.alpha = 1;
            }
            else {
                if (_this.alpha > 0)
                    _this.alpha -= 0.03 * delta;
                if (_this.alpha < 0)
                    _this.alpha = 0;
            }
        };
        _this.draw = function (delta) {
            _this.fadeHitwarnings(delta);
            if (Math.abs(_this.x - _this.game.players[_this.game.localPlayerID].x) <= 1 &&
                Math.abs(_this.y - _this.game.players[_this.game.localPlayerID].y) <= 1) {
                game_1.Game.ctx.globalAlpha = _this.alpha;
                if (_this.isEnemy) {
                    game_1.Game.drawFX(_this.tileX + Math.floor(HitWarning.frame), _this.tileY, 1, 1, _this.x + _this.pointerOffset.x, _this.y + _this.pointerOffset.y - _this.offsetY, 1, 1);
                }
                if (!_this.dirOnly) {
                    game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 5, 1, 1, _this.x, _this.y - _this.offsetY + 0, 1, 1);
                }
                game_1.Game.ctx.globalAlpha = 1;
            }
        };
        _this.drawTopLayer = function (delta) {
            _this.fadeHitwarnings(delta);
            game_1.Game.ctx.globalAlpha = _this.alpha;
            if (_this.isEnemy) {
                game_1.Game.drawFX(_this.tileX + Math.floor(HitWarning.frame), _this.tileY + 1, 1, 1, _this.x + _this.pointerOffset.x, _this.y + _this.pointerOffset.y - _this.offsetY, 1, 1);
            }
            if (Math.abs(_this.x - _this.game.players[_this.game.localPlayerID].x) <= 1 &&
                Math.abs(_this.y - _this.game.players[_this.game.localPlayerID].y) <= 1) {
                if (!_this.dirOnly) {
                    game_1.Game.drawFX(18 + Math.floor(HitWarning.frame), 6, 1, 1, _this.x, _this.y - _this.offsetY + 0, 1, 1);
                }
            }
            game_1.Game.ctx.globalAlpha = 1;
        };
        _this.x = x;
        _this.y = y;
        _this.dead = false;
        _this.game = game;
        _this.parent = parent;
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
    InputEnum[InputEnum["NUMBER_1"] = 14] = "NUMBER_1";
    InputEnum[InputEnum["NUMBER_2"] = 15] = "NUMBER_2";
    InputEnum[InputEnum["NUMBER_3"] = 16] = "NUMBER_3";
    InputEnum[InputEnum["NUMBER_4"] = 17] = "NUMBER_4";
    InputEnum[InputEnum["NUMBER_5"] = 18] = "NUMBER_5";
    InputEnum[InputEnum["NUMBER_6"] = 19] = "NUMBER_6";
    InputEnum[InputEnum["NUMBER_7"] = 20] = "NUMBER_7";
    InputEnum[InputEnum["NUMBER_8"] = 21] = "NUMBER_8";
    InputEnum[InputEnum["NUMBER_9"] = 22] = "NUMBER_9";
})(InputEnum = exports.InputEnum || (exports.InputEnum = {}));
var checkIsMouseHold = function () {
    if (exports.Input.mouseDownStartTime !== null &&
        Date.now() >= exports.Input.mouseDownStartTime + gameConstants_1.GameConstants.HOLD_THRESH) {
        exports.Input.isMouseHold = true;
    }
};
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
    numKeyListener: function (num) { },
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
    NUMBER_1: "Digit1",
    NUMBER_2: "Digit2",
    NUMBER_3: "Digit3",
    NUMBER_4: "Digit4",
    NUMBER_5: "Digit5",
    NUMBER_6: "Digit6",
    NUMBER_7: "Digit7",
    NUMBER_8: "Digit8",
    NUMBER_9: "Digit9",
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
            case exports.Input.NUMBER_1:
            case exports.Input.NUMBER_2:
            case exports.Input.NUMBER_3:
            case exports.Input.NUMBER_4:
            case exports.Input.NUMBER_5:
            case exports.Input.NUMBER_6:
            case exports.Input.NUMBER_7:
            case exports.Input.NUMBER_8:
            case exports.Input.NUMBER_9:
                exports.Input.numKeyListener(parseInt(event.code.slice(-1)));
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
        if (exports.Input.mouseDown)
            return; // Prevent multiple triggers
        exports.Input.mouseDown = true;
        exports.Input.mouseDownStartTime = Date.now();
        exports.Input.isMouseHold = false;
        exports.Input.mouseDownListener(exports.Input.mouseX, exports.Input.mouseY, event.button);
        // Start checking for hold
        if (!exports.Input._holdCheckInterval) {
            exports.Input._holdCheckInterval = setInterval(exports.Input.checkIsMouseHold, 16); // Check every frame
        }
    },
    handleMouseUp: function (event) {
        exports.Input.mouseDown = false;
        exports.Input.mouseDownStartTime = null;
        exports.Input.mouseUpListener(exports.Input.mouseX, exports.Input.mouseY, event.button);
        // Clear hold check interval
        if (exports.Input._holdCheckInterval) {
            clearInterval(exports.Input._holdCheckInterval);
            exports.Input._holdCheckInterval = null;
        }
        // Clear isMouseHold after a short delay to ensure click handler sees it
        setTimeout(function () {
            exports.Input.isMouseHold = false;
        }, 50);
    },
    _holdCheckInterval: null,
    checkIsMouseHold: function () {
        if (!exports.Input.mouseDown || exports.Input.mouseDownStartTime === null)
            return;
        if (Date.now() >= exports.Input.mouseDownStartTime + exports.Input.HOLD_THRESH) {
            if (!exports.Input.isMouseHold) {
                exports.Input.isMouseHold = true;
                // Call the hold callback if one is registered
                if (exports.Input.holdCallback) {
                    exports.Input.holdCallback();
                }
            }
        }
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
    isMouseHold: false,
    mouseDownStartTime: null,
    HOLD_THRESH: 200,
    holdCallback: null,
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
var item_1 = __webpack_require__(/*! ./item/item */ "./src/item/item.ts");
var levelConstants_1 = __webpack_require__(/*! ./levelConstants */ "./src/levelConstants.ts");
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
var equippable_1 = __webpack_require__(/*! ./item/equippable */ "./src/item/equippable.ts");
var armor_1 = __webpack_require__(/*! ./item/armor */ "./src/item/armor.ts");
var coin_1 = __webpack_require__(/*! ./item/coin */ "./src/item/coin.ts");
var weapon_1 = __webpack_require__(/*! ./weapon/weapon */ "./src/weapon/weapon.ts");
var usable_1 = __webpack_require__(/*! ./item/usable */ "./src/item/usable.ts");
var mouseCursor_1 = __webpack_require__(/*! ./mouseCursor */ "./src/mouseCursor.ts");
var input_1 = __webpack_require__(/*! ./input */ "./src/input.ts");
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
        this.isOpen = false;
        this.openTime = Date.now();
        this.coins = 0;
        this.weapon = null;
        this.expansion = 0;
        this.grabbedItem = null;
        this._mouseDownStartX = null;
        this._mouseDownStartY = null;
        this._mouseDownItem = null;
        this._wasHoldDetected = false;
        this._isDragging = false;
        this._dragStartItem = null;
        this._dragStartSlot = null;
        this.itemEquipAnimations = new Map();
        // New state for using items on other items
        this.usingItem = null;
        this.usingItemIndex = null;
        this.mostRecentInput = "keyboard";
        this.clear = function () {
            _this.items.fill(null);
            _this.equipAnimAmount.fill(0);
        };
        this.open = function () {
            _this.isOpen = !_this.isOpen;
            if (_this.isOpen)
                _this.openTime = Date.now();
            if (!_this.isOpen) {
                _this.selY = 0;
                _this.usingItem = null;
                _this.usingItemIndex = null;
            }
        };
        this.toggleOpen = function () {
            if (_this.isOpen) {
                _this.close();
            }
            else {
                _this.open();
            }
        };
        this.close = function () {
            _this.isOpen = false;
            if (_this.selY > 0) {
                _this.selY = 0;
            }
            _this.usingItem = null;
            _this.usingItemIndex = null;
        };
        this.left = function () {
            if (_this.selX > 0) {
                _this.selX--;
            }
        };
        this.right = function () {
            if (_this.selX < _this.cols - 1) {
                _this.selX++;
            }
        };
        this.up = function () {
            if (_this.selY > 0) {
                _this.selY--;
            }
        };
        this.down = function () {
            if (_this.selY < _this.rows + _this.expansion - 1) {
                _this.selY++;
            }
        };
        this.space = function () {
            _this.itemUse();
        };
        this.itemAtSelectedSlot = function () {
            var index = _this.selX + _this.selY * _this.cols;
            if (index < 0 || index >= _this.items.length) {
                return null;
            }
            return _this.items[index];
        };
        this.getIndexOfItem = function (item) {
            if (item === null)
                return -1;
            return _this.items.indexOf(item);
        };
        this.itemUse = function () {
            var index = _this.selX + _this.selY * _this.cols;
            if (index < 0 || index >= _this.items.length)
                return;
            var item = _this.items[index];
            if (_this.usingItem) {
                // Attempt to use 'usingItem' on the currently selected item
                if (item === null) {
                    // Clicked on empty slot; cancel the using state
                    _this.usingItem = null;
                    _this.usingItemIndex = null;
                    return;
                }
                // Attempt to use on other
                if (item instanceof item_1.Item) {
                    _this.usingItem.useOnOther(_this.player, item);
                }
                // Exit tryingToUse state
                _this.usingItem = null;
                _this.usingItemIndex = null;
            }
            else {
                // Not in tryingToUse state
                if (item instanceof usable_1.Usable) {
                    if (item.canUseOnOther) {
                        // Enter tryingToUse state
                        _this.usingItem = item;
                        _this.usingItemIndex = index;
                    }
                    else {
                        // Use normally
                        item.onUse(_this.player);
                        // Optionally remove the item
                        // this.items[index] = null;
                    }
                }
                else if (item instanceof equippable_1.Equippable) {
                    // Existing equipping logic
                    item.toggleEquip();
                    if (item instanceof weapon_1.Weapon) {
                        _this.weapon = item.equipped ? item : null;
                    }
                    if (item.equipped) {
                        _this.items.forEach(function (i, idx) {
                            if (i instanceof equippable_1.Equippable &&
                                i !== item &&
                                !item.coEquippable(i)) {
                                i.equipped = false;
                                _this.equipAnimAmount[idx] = 0;
                            }
                        });
                    }
                }
            }
        };
        this.mouseLeftClick = function () {
            _this.mostRecentInput = "mouse";
            var _a = mouseCursor_1.MouseCursor.getInstance().getPosition(), x = _a.x, y = _a.y;
            var bounds = _this.isPointInInventoryBounds(x, y);
            // Only close inventory if clicking outside
            if ((!bounds.inBounds && !_this.isPointInQuickbarBounds(x, y).inBounds) ||
                _this.isPointInInventoryButton(x, y)) {
                _this.close();
            }
        };
        this.mouseRightClick = function () {
            _this.mostRecentInput = "mouse";
            var _a = mouseCursor_1.MouseCursor.getInstance().getPosition(), x = _a.x, y = _a.y;
            var bounds = _this.isPointInInventoryBounds(x, y);
            if (bounds.inBounds) {
                _this.drop();
            }
        };
        this.leftQuickbar = function () {
            _this.mostRecentInput = "keyboard";
            _this.left();
        };
        this.rightQuickbar = function () {
            _this.mostRecentInput = "keyboard";
            _this.right();
        };
        this.spaceQuickbar = function () {
            _this.mostRecentInput = "keyboard";
            _this.itemUse();
        };
        this.handleNumKey = function (num) {
            _this.mostRecentInput = "keyboard";
            _this.selX = Math.max(0, Math.min(num - 1, _this.cols - 1));
            _this.selY = 0;
            _this.itemUse();
        };
        this.mouseMove = function () {
            _this.mostRecentInput = "mouse";
            var _a = mouseCursor_1.MouseCursor.getInstance().getPosition(), x = _a.x, y = _a.y;
            var bounds = _this.isPointInInventoryBounds(x, y);
            if (bounds.inBounds) {
                var s = _this.isOpen
                    ? Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME)
                    : 18;
                var b = 2;
                var g = -2;
                var oldSelX = _this.selX;
                var oldSelY = _this.selY;
                _this.selX = Math.max(0, Math.min(Math.floor((x - bounds.startX) / (s + 2 * b + g)), _this.cols - 1));
                _this.selY = _this.isOpen
                    ? Math.max(0, Math.min(Math.floor((y - bounds.startY) / (s + 2 * b + g)), _this.rows + _this.expansion - 1))
                    : 0;
                if (oldSelX !== _this.selX || oldSelY !== _this.selY) {
                    // Optional: Handle selection change
                }
            }
        };
        this.moveItemToSlot = function (item, index, otherItem, otherIndex) {
            var _a, _b, _c;
            if (item === null)
                return;
            // Preserve animation states before moving
            var itemAnim = _this.equipAnimAmount[index];
            var otherAnim = otherItem ? _this.equipAnimAmount[otherIndex] : 0;
            if (otherItem === null) {
                _this.items[index] = item;
                _this.equipAnimAmount[index] = (_a = _this.itemEquipAnimations.get(item)) !== null && _a !== void 0 ? _a : 0;
            }
            else {
                _this.items[index] = otherItem;
                _this.items[otherIndex] = item;
                _this.equipAnimAmount[index] =
                    (_b = _this.itemEquipAnimations.get(otherItem)) !== null && _b !== void 0 ? _b : 0;
                _this.equipAnimAmount[otherIndex] =
                    (_c = _this.itemEquipAnimations.get(item)) !== null && _c !== void 0 ? _c : 0;
            }
        };
        this.grabItem = function (item) {
            if (item === null) {
                return;
            }
            if (_this.grabbedItem !== null) {
                return;
            }
            // Remove the item from its slot when grabbed
            var index = _this.getIndexOfItem(item);
            if (index !== -1) {
                _this.items[index] = null;
                _this.grabbedItem = item;
            }
            else {
            }
        };
        this.releaseItem = function () {
            if (_this.grabbedItem === null) {
                return;
            }
            var targetIndex = _this.selX + _this.selY * _this.cols;
            var existingItem = _this.items[targetIndex];
            // If target slot is empty, place item there
            if (existingItem === null) {
                _this.items[targetIndex] = _this.grabbedItem;
            }
            else {
                // Swap items
                _this.items[targetIndex] = _this.grabbedItem;
            }
            _this.grabbedItem = null;
        };
        this.drawDraggedItem = function (delta) {
            if (_this.grabbedItem === null)
                return;
            var _a = mouseCursor_1.MouseCursor.getInstance().getPosition(), x = _a.x, y = _a.y;
            var item = _this.grabbedItem;
            var drawX = x - 0.5 * gameConstants_1.GameConstants.TILESIZE;
            var drawY = y - 0.5 * gameConstants_1.GameConstants.TILESIZE;
            var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
            var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
            item.drawIcon(delta, drawXScaled, drawYScaled);
        };
        this.drop = function () {
            var index = _this.selX + _this.selY * _this.cols;
            if (index < 0 || index >= _this.items.length)
                return;
            var item = _this.items[index];
            if (item === null)
                return;
            _this.dropItem(item, index);
        };
        this.dropItem = function (item, index) {
            item.level = _this.game.rooms[_this.player.levelID];
            item.x = _this.player.x;
            item.y = _this.player.y;
            item.alpha = 1;
            item.pickedUp = false;
            item.dropFromInventory();
            _this.equipAnimAmount[index] = 0;
            _this.game.rooms[_this.player.levelID].items.push(item);
            _this.items[index] = null;
        };
        this.dropFromInventory = function () {
            // Intentionally left blank or implement if needed
        };
        this.hasItem = function (itemType) {
            return _this.items.find(function (i) { return i instanceof itemType; }) || null;
        };
        this.hasItemCount = function (item) {
            if (item === null)
                return false;
            if (item instanceof coin_1.Coin)
                return _this.coinCount() >= item.stackCount;
            return _this.items.some(function (i) {
                return i !== null &&
                    i.constructor === item.constructor &&
                    i.stackCount >= item.stackCount;
            });
        };
        this.subtractItemCount = function (item) {
            if (item === null)
                return;
            if (item instanceof coin_1.Coin) {
                _this.subtractCoins(item.stackCount);
                return;
            }
            _this.items.forEach(function (i, idx) {
                if (i === null)
                    return;
                if (i.constructor === item.constructor) {
                    i.stackCount -= item.stackCount;
                    if (i.stackCount <= 0) {
                        _this.items[idx] = null;
                    }
                }
            });
        };
        this.coinCount = function () {
            return _this.coins;
        };
        this.subtractCoins = function (n) {
            _this.coins = Math.max(0, _this.coins - n);
        };
        this.addCoins = function (n) {
            _this.coins += n;
        };
        this.isFull = function () {
            return (_this.items.filter(function (i) { return i !== null; }).length >=
                (_this.rows + _this.expansion) * _this.cols);
        };
        this.addItem = function (item) {
            if (item === null)
                return false;
            if (item instanceof coin_1.Coin) {
                _this.coins += item.stack;
                return true;
            }
            if (item instanceof equippable_1.Equippable) {
                item.setWielder(_this.player);
            }
            if (item.stackable) {
                for (var i = 0; i < _this.items.length; i++) {
                    if (_this.items[i] !== null &&
                        _this.items[i].constructor === item.constructor) {
                        _this.items[i].stackCount += item.stackCount;
                        return true;
                    }
                }
            }
            if (!_this.isFull()) {
                for (var i = 0; i < _this.items.length; i++) {
                    if (_this.items[i] === null) {
                        _this.items[i] = item;
                        return true;
                    }
                }
            }
            return false;
        };
        this.removeItem = function (item) {
            if (item === null)
                return;
            var index = _this.items.indexOf(item);
            if (index !== -1) {
                _this.items[index] = null;
            }
        };
        this.getArmor = function () {
            return (_this.items.find(function (i) { return i instanceof armor_1.Armor && i.equipped; }) ||
                null);
        };
        this.hasWeapon = function () {
            return _this.weapon !== null;
        };
        this.getWeapon = function () {
            return _this.weapon;
        };
        this.tick = function () {
            _this.items.forEach(function (i) {
                if (i !== null)
                    i.tickInInventory();
            });
            // Check for drag initiation
            _this.checkForDragStart();
        };
        this.textWrap = function (text, x, y, maxWidth) {
            // Returns y value for next line
            if (text === "")
                return y;
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
            if (line.trim() !== "") {
                game_1.Game.fillText(line, x, y);
                y += 8;
            }
            return y;
        };
        this.drawCoins = function (delta) {
            var coinX = levelConstants_1.LevelConstants.SCREEN_W - 1;
            var coinY = levelConstants_1.LevelConstants.SCREEN_H - 1;
            game_1.Game.drawItem(19, 0, 1, 2, coinX, coinY - 1, 1, 2);
            var countText = "".concat(_this.coins);
            var width = game_1.Game.measureText(countText).width;
            var countX = 4 - width;
            var countY = -1;
            game_1.Game.fillTextOutline(countText, coinX * gameConstants_1.GameConstants.TILESIZE + countX, coinY * gameConstants_1.GameConstants.TILESIZE + countY, gameConstants_1.GameConstants.OUTLINE, "white");
            /*
            const turnCountText = `${this.player.turnCount}`;
            Game.fillTextOutline(
              turnCountText,
              coinX * GameConstants.TILESIZE + countX,
              coinY * GameConstants.TILESIZE + countY - 15,
              GameConstants.OUTLINE,
              "white",
            );
            */
        };
        this.pointInside = function (x, y) {
            var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
            var b = 2; // border
            var g = -2; // gap
            var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
            var ob = 1; // outer border
            var width = _this.cols * (s + 2 * b + g) - g;
            var height = (_this.rows + _this.expansion) * (s + 2 * b + g) - g;
            var startX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob;
            var startY = _this.isOpen
                ? Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) - ob
                : gameConstants_1.GameConstants.HEIGHT - (s + 2 * b) - 5 - ob;
            var checkHeight = _this.isOpen ? height + 2 * ob : s + 2 * b + 2 * ob;
            return (x >= startX &&
                x <= startX + width + 2 * ob &&
                y >= startY &&
                y <= startY + checkHeight);
        };
        this.drawQuickbar = function (delta) {
            var _a = mouseCursor_1.MouseCursor.getInstance().getPosition(), x = _a.x, y = _a.y;
            var isInBounds = _this.isPointInInventoryBounds(x, y).inBounds;
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
            game_1.Game.ctx.fillRect(startX - ob, startY - 1, width + 2, height + 2);
            // Draw highlighted background for selected item only if mouse is in bounds
            if (isInBounds || _this.mostRecentInput === "keyboard") {
                game_1.Game.ctx.fillRect(startX + _this.selX * (s + 2 * b + g) - hg - ob, startY - hg - ob, s + 2 * b + 2 * hg + 2 * ob, s + 2 * b + 2 * hg + 2 * ob);
            }
            // Draw individual item slots
            for (var xIdx = 0; xIdx < _this.cols; xIdx++) {
                // Draw slot outline
                game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                game_1.Game.ctx.fillRect(startX + xIdx * (s + 2 * b + g), startY, s + 2 * b, s + 2 * b);
                // Draw slot background
                game_1.Game.ctx.fillStyle = FILL_COLOR;
                game_1.Game.ctx.fillRect(startX + xIdx * (s + 2 * b + g) + b, startY + b, s, s);
                // Draw equip animation (this should always show)
                var idx = xIdx;
                game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                var yOff = s * (1 - _this.equipAnimAmount[idx]);
                game_1.Game.ctx.fillRect(startX + xIdx * (s + 2 * b + g) + b, startY + b + yOff, s, s - yOff);
                // Draw item icon if exists
                if (idx < _this.items.length && _this.items[idx] !== null) {
                    var drawX = startX +
                        xIdx * (s + 2 * b + g) +
                        b +
                        Math.floor(0.5 * s) -
                        0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawY = startY + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                    var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                    _this.items[idx].drawIcon(delta, drawXScaled, drawYScaled);
                }
            }
            // Draw selection box only if mouse is in bounds
            if (isInBounds || _this.mostRecentInput === "keyboard") {
                var selStartX = startX + _this.selX * (s + 2 * b + g);
                var selStartY = startY;
                // Outer selection box (dark)
                game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                game_1.Game.ctx.fillRect(selStartX - hg, selStartY - hg, s + 2 * b + 2 * hg, s + 2 * b + 2 * hg);
                // Inner selection box (light grey)
                game_1.Game.ctx.fillStyle = FILL_COLOR;
                game_1.Game.ctx.fillRect(selStartX + b - hg, selStartY + b - hg, s + 2 * hg, s + 2 * hg);
                // Draw equip animation for selected slot with highlight
                var idx = _this.selX;
                game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                var yOff = (s + 2 * hg) * (1 - _this.equipAnimAmount[idx]);
                game_1.Game.ctx.fillRect(Math.round(startX + _this.selX * (s + 2 * b + g) + b - hg), Math.round(startY + b + yOff - hg), s + 2 * hg, s + 2 * hg - yOff);
                _this.drawUsingItem(delta, startX, startY, s, b, g);
                // Redraw the selected item
                if (idx < _this.items.length && _this.items[idx] !== null) {
                    var drawX = selStartX + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawY = selStartY + b + Math.floor(0.5 * s) - 0.5 * gameConstants_1.GameConstants.TILESIZE;
                    var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                    var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                    _this.items[idx].drawIcon(delta, drawXScaled, drawYScaled);
                }
                _this.drawUsingItem(delta, startX, startY, s, b, g);
            }
            _this.drawUsingItem(delta, startX, startY, s, b, g);
        };
        this.drawUsingItem = function (delta, startX, startY, s, b, g) {
            // Highlight the usingItem's slot if in using state and it's different from current selection
            game_1.Game.ctx.globalCompositeOperation = "source-over";
            if (_this.usingItem && _this.usingItemIndex !== null) {
                var usingX = _this.usingItemIndex % _this.cols;
                var usingY = Math.floor(_this.usingItemIndex / _this.cols);
                var highlightStartX = startX + usingX * (s + 2 * b + g);
                var highlightStartY = startY + usingY * (s + 2 * b + g);
                game_1.Game.ctx.strokeStyle = "yellow"; // Choose a distinct color for using item
                game_1.Game.ctx.lineWidth = 2;
                game_1.Game.ctx.strokeRect(highlightStartX, highlightStartY, s + 2 * b, s + 2 * b);
                game_1.Game.ctx.lineWidth = 1; // Reset line width
            }
        };
        this.updateEquipAnimAmount = function (delta) {
            _this.equipAnimAmount.forEach(function (amount, idx) {
                var _a;
                var item = _this.items[idx];
                if (item instanceof equippable_1.Equippable) {
                    var targetAmount = item.equipped ? 1 : 0;
                    var currentAmount = (_a = _this.itemEquipAnimations.get(item)) !== null && _a !== void 0 ? _a : amount;
                    currentAmount += 0.2 * delta * (targetAmount - currentAmount);
                    currentAmount = Math.max(0, Math.min(1, currentAmount));
                    _this.itemEquipAnimations.set(item, currentAmount);
                    _this.equipAnimAmount[idx] = currentAmount;
                }
                else {
                    _this.equipAnimAmount[idx] = 0;
                    if (item)
                        _this.itemEquipAnimations.delete(item);
                }
            });
        };
        this.draw = function (delta) {
            var _a = mouseCursor_1.MouseCursor.getInstance().getPosition(), x = _a.x, y = _a.y;
            var isInBounds = _this.isPointInInventoryBounds(x, y).inBounds;
            var s = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
            var b = 2; // border
            var g = -2; // gap
            var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
            var invRows = _this.rows + _this.expansion;
            var ob = 1; // outer border
            var width = _this.cols * (s + 2 * b + g) - g;
            var height = invRows * (s + 2 * b + g) - g;
            var mainBgX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width) - ob;
            var mainBgY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height) - ob;
            // Draw coins and quickbar (these are always visible)
            _this.drawCoins(delta);
            _this.drawQuickbar(delta);
            _this.updateEquipAnimAmount(delta);
            if (_this.isOpen) {
                // Draw semi-transparent background for full inventory
                game_1.Game.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
                game_1.Game.ctx.globalAlpha = 1;
                // Define dimensions and styling variables (similar to drawQuickbar)
                var s_1 = Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME); // size of box
                var b_1 = 2; // border
                var g_1 = -2; // gap
                var hg_1 = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
                var invRows_1 = _this.rows + _this.expansion;
                var ob_1 = 1; // outer border
                var width_1 = _this.cols * (s_1 + 2 * b_1 + g_1) - g_1;
                var height_1 = invRows_1 * (s_1 + 2 * b_1 + g_1) - g_1;
                // Draw main inventory background (similar to drawQuickbar)
                game_1.Game.ctx.fillStyle = FULL_OUTLINE;
                var mainBgX_1 = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width_1) - ob_1;
                var mainBgY_1 = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height_1) - ob_1;
                game_1.Game.ctx.fillRect(mainBgX_1, mainBgY_1, width_1 + 2 * ob_1, height_1 + 2 * ob_1);
                // Draw highlighted background for selected item only if mouse is in bounds
                if (isInBounds || _this.mostRecentInput === "keyboard") {
                    var highlightX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                        0.5 * width_1 +
                        _this.selX * (s_1 + 2 * b_1 + g_1)) -
                        hg_1 -
                        ob_1;
                    var highlightY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                        0.5 * height_1 +
                        _this.selY * (s_1 + 2 * b_1 + g_1)) -
                        hg_1 -
                        ob_1;
                    game_1.Game.ctx.fillRect(highlightX, highlightY, s_1 + 2 * b_1 + 2 * hg_1 + 2 * ob_1, s_1 + 2 * b_1 + 2 * hg_1 + 2 * ob_1);
                }
                // Draw individual inventory slots (similar to drawQuickbar, but for all rows)
                for (var xIdx = 0; xIdx < _this.cols; xIdx++) {
                    for (var yIdx = 0; yIdx < _this.rows + _this.expansion; yIdx++) {
                        // Draw slot outline
                        var slotX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width_1 + xIdx * (s_1 + 2 * b_1 + g_1));
                        var slotY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height_1 + yIdx * (s_1 + 2 * b_1 + g_1));
                        game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                        game_1.Game.ctx.fillRect(slotX, slotY, s_1 + 2 * b_1, s_1 + 2 * b_1);
                        // Draw slot background
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(slotX + b_1, slotY + b_1, s_1, s_1);
                        // Draw equip animation (unique to full inventory view)
                        var idx = xIdx + yIdx * _this.cols;
                        game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                        var yOff = s_1 * (1 - _this.equipAnimAmount[idx]);
                        game_1.Game.ctx.fillRect(slotX + b_1, slotY + b_1 + yOff, s_1, s_1 - yOff);
                        // Draw item icon if exists
                        if (idx < _this.items.length && _this.items[idx] !== null) {
                            var drawX = 0.5 * gameConstants_1.GameConstants.WIDTH -
                                0.5 * width_1 +
                                xIdx * (s_1 + 2 * b_1 + g_1) +
                                b_1 +
                                Math.floor(0.5 * s_1) -
                                0.5 * gameConstants_1.GameConstants.TILESIZE;
                            var drawY = 0.5 * gameConstants_1.GameConstants.HEIGHT -
                                0.5 * height_1 +
                                yIdx * (s_1 + 2 * b_1 + g_1) +
                                b_1 +
                                Math.floor(0.5 * s_1) -
                                0.5 * gameConstants_1.GameConstants.TILESIZE;
                            var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                            var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                            _this.items[idx].drawIcon(delta, drawXScaled, drawYScaled);
                        }
                    }
                }
                // Draw item icons after animation delay (similar to drawQuickbar, but for all items)
                if (Date.now() - _this.openTime >= OPEN_TIME) {
                    _this.items.forEach(function (item, idx) {
                        if (item === null)
                            return;
                        var x = idx % _this.cols;
                        var y = Math.floor(idx / _this.cols);
                        var drawX = 0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width_1 +
                            x * (s_1 + 2 * b_1 + g_1) +
                            b_1 +
                            Math.floor(0.5 * s_1) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE;
                        var drawY = 0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height_1 +
                            y * (s_1 + 2 * b_1 + g_1) +
                            b_1 +
                            Math.floor(0.5 * s_1) -
                            0.5 * gameConstants_1.GameConstants.TILESIZE;
                        var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                        var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                        item.drawIcon(delta, drawXScaled, drawYScaled);
                    });
                    // Draw selection box and related elements only if mouse is in bounds
                    if (isInBounds || _this.mostRecentInput === "keyboard") {
                        // Draw selection box
                        game_1.Game.ctx.fillStyle = OUTLINE_COLOR;
                        game_1.Game.ctx.fillRect(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width_1 +
                            _this.selX * (s_1 + 2 * b_1 + g_1) -
                            hg_1, 0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height_1 +
                            _this.selY * (s_1 + 2 * b_1 + g_1) -
                            hg_1, s_1 + 2 * b_1 + 2 * hg_1, s_1 + 2 * b_1 + 2 * hg_1);
                        var slotX = Math.round(0.5 * gameConstants_1.GameConstants.WIDTH -
                            0.5 * width_1 +
                            _this.selX * (s_1 + 2 * b_1 + g_1) +
                            b_1 -
                            hg_1);
                        var slotY = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height_1 +
                            _this.selY * (s_1 + 2 * b_1 + g_1) +
                            b_1 -
                            hg_1);
                        game_1.Game.ctx.fillStyle = FILL_COLOR;
                        game_1.Game.ctx.fillRect(slotX, slotY, s_1 + 2 * hg_1, s_1 + 2 * hg_1);
                        // Draw equip animation for selected item (unique to full inventory view)
                        // Draw equip animation for selected item (unique to full inventory view)
                        var idx = _this.selX + _this.selY * _this.cols;
                        if (idx < _this.items.length && _this.items[idx] !== null) {
                            game_1.Game.ctx.fillStyle = EQUIP_COLOR;
                            var yOff = (s_1 + 2 * hg_1) * (1 - _this.equipAnimAmount[idx]);
                            game_1.Game.ctx.fillRect(0.5 * gameConstants_1.GameConstants.WIDTH -
                                0.5 * width_1 +
                                _this.selX * (s_1 + 2 * b_1 + g_1) +
                                b_1 -
                                hg_1, 0.5 * gameConstants_1.GameConstants.HEIGHT -
                                0.5 * height_1 +
                                _this.selY * (s_1 + 2 * b_1 + g_1) +
                                b_1 -
                                hg_1 +
                                yOff, s_1 + 2 * hg_1, s_1 + 2 * hg_1 - yOff);
                            // Redraw selected item icon (similar to drawQuickbar)
                            var drawX = 0.5 * gameConstants_1.GameConstants.WIDTH -
                                0.5 * width_1 +
                                _this.selX * (s_1 + 2 * b_1 + g_1) +
                                b_1 +
                                Math.floor(0.5 * s_1) -
                                0.5 * gameConstants_1.GameConstants.TILESIZE;
                            var drawY = 0.5 * gameConstants_1.GameConstants.HEIGHT -
                                0.5 * height_1 +
                                _this.selY * (s_1 + 2 * b_1 + g_1) +
                                b_1 +
                                Math.floor(0.5 * s_1) -
                                0.5 * gameConstants_1.GameConstants.TILESIZE;
                            var drawXScaled = drawX / gameConstants_1.GameConstants.TILESIZE;
                            var drawYScaled = drawY / gameConstants_1.GameConstants.TILESIZE;
                            _this.items[idx].drawIcon(delta, drawXScaled, drawYScaled);
                        }
                        // **Move drawUsingItem here, after the main selection box**
                    }
                    // Draw item description and action text (unique to full inventory view)
                    var selectedIdx = _this.selX + _this.selY * _this.cols;
                    if (selectedIdx < _this.items.length &&
                        _this.items[selectedIdx] !== null) {
                        var item = _this.items[selectedIdx];
                        game_1.Game.ctx.fillStyle = "white";
                        // Determine action text
                        var topPhrase = "";
                        if (item instanceof equippable_1.Equippable) {
                            topPhrase = item.equipped
                                ? "[SPACE] to unequip"
                                : "[SPACE] to equip";
                        }
                        if (item instanceof usable_1.Usable) {
                            topPhrase = "[SPACE] to use";
                        }
                        // Draw action text
                        var actionTextWidth = game_1.Game.measureText(topPhrase).width;
                        game_1.Game.fillText(topPhrase, 0.5 * (gameConstants_1.GameConstants.WIDTH - actionTextWidth), 5);
                        // Draw item description
                        var lines = item.getDescription().split("\n");
                        var nextY_1 = Math.round(0.5 * gameConstants_1.GameConstants.HEIGHT -
                            0.5 * height_1 +
                            (_this.rows + _this.expansion) * (s_1 + 2 * b_1 + g_1) +
                            b_1 +
                            5);
                        lines.forEach(function (line) {
                            nextY_1 = _this.textWrap(line, 5, nextY_1, gameConstants_1.GameConstants.WIDTH - 10);
                        });
                    }
                    // **Ensure drawUsingItem is not called again here**
                    // this.drawUsingItem(delta, mainBgX, mainBgY, s, b, g);
                }
                // **Ensure drawUsingItem is not called again here**
                // this.drawUsingItem(delta, mainBgX, mainBgY, s, b, g);
            }
            if (_this.isOpen) {
                _this.drawUsingItem(delta, mainBgX + 1, mainBgY + 1, s, b, g);
            }
            _this.drawDraggedItem(delta);
        };
        this.isPointInInventoryBounds = function (x, y) {
            var s = _this.isOpen
                ? Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME)
                : 18;
            var b = 2; // border
            var g = -2; // gap
            var hg = 3 + Math.round(0.5 * Math.sin(Date.now() * 0.01) + 0.5); // highlighted growth
            var ob = 1; // outer border
            var width = _this.cols * (s + 2 * b + g) - g;
            var startX;
            var startY;
            var height;
            if (_this.isOpen) {
                // Full inventory bounds
                height = (_this.rows + _this.expansion) * (s + 2 * b + g) - g;
                startX = 0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width;
                startY = 0.5 * gameConstants_1.GameConstants.HEIGHT - 0.5 * height;
            }
            else {
                // Quickbar bounds
                height = s + 2 * b;
                startX = 0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width;
                startY = gameConstants_1.GameConstants.HEIGHT - height - 5;
            }
            var inBounds = x >= startX - ob &&
                x <= startX + width + ob &&
                y >= startY - ob &&
                y <= startY + height + ob;
            return {
                inBounds: inBounds,
                startX: startX,
                startY: startY,
            };
        };
        this.isPointInQuickbarBounds = function (x, y) {
            var s = _this.isOpen
                ? Math.min(18, (18 * (Date.now() - _this.openTime)) / OPEN_TIME)
                : 18;
            var b = 2; // border
            var g = -2; // gap
            var width = _this.cols * (s + 2 * b + g) - g;
            var startX = 0.5 * gameConstants_1.GameConstants.WIDTH - 0.5 * width;
            var startY = gameConstants_1.GameConstants.HEIGHT - (s + 2 * b) - 5;
            var quickbarHeight = s + 2 * b;
            var inBounds = x >= startX &&
                x <= startX + width &&
                y >= startY &&
                y <= startY + quickbarHeight;
            return {
                inBounds: inBounds,
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
        this.handleMouseDown = function (x, y, button) {
            // Ignore if not left click
            if (button !== 0)
                return;
            var bounds = _this.isPointInInventoryBounds(x, y);
            if (bounds.inBounds) {
                var selectedItem = _this.itemAtSelectedSlot();
                if (selectedItem !== null) {
                    _this._dragStartItem = selectedItem;
                    _this._dragStartSlot = _this.selX + _this.selY * _this.cols;
                }
            }
        };
        this.onHoldDetected = function () {
            if (_this._dragStartItem !== null && !_this._isDragging) {
                _this._isDragging = true;
                _this.grabbedItem = _this._dragStartItem;
                // Remove item from original slot
                if (_this._dragStartSlot !== null) {
                    _this.items[_this._dragStartSlot] = null;
                }
            }
        };
        this.handleMouseUp = function (x, y, button) {
            // Ignore if not left click
            if (button !== 0)
                return;
            var invBounds = _this.isPointInInventoryBounds(x, y);
            var quickbarBounds = _this.isPointInQuickbarBounds(x, y);
            var isValidDropZone = _this.isOpen
                ? invBounds.inBounds
                : quickbarBounds.inBounds;
            if (isValidDropZone) {
                if (_this._isDragging && _this.grabbedItem !== null) {
                    // We were dragging, place the item
                    var targetSlot = _this.selX + _this.selY * _this.cols;
                    _this.placeItemInSlot(targetSlot);
                }
                else if (_this._dragStartItem !== null) {
                    // We had an item but weren't dragging (quick click)
                    _this.itemUse();
                }
            }
            else if (_this.grabbedItem !== null) {
                // Drop the item in the world
                _this.dropItem(_this.grabbedItem, _this._dragStartSlot);
                _this.grabbedItem = null;
                _this.items[_this._dragStartSlot] = null;
            }
            // Reset all drag/hold state
            _this._isDragging = false;
            _this._dragStartItem = null;
            _this._dragStartSlot = null;
            _this.grabbedItem = null;
        };
        this.checkForDragStart = function () {
            if (!input_1.Input.mouseDown || _this._dragStartItem === null || _this._isDragging) {
                return;
            }
            if (input_1.Input.isMouseHold) {
                _this._isDragging = true;
                _this.grabbedItem = _this._dragStartItem;
                // Remove item from original slot
                if (_this._dragStartSlot !== null) {
                    _this.items[_this._dragStartSlot] = null;
                }
            }
        };
        this.placeItemInSlot = function (targetSlot) {
            if (_this.grabbedItem === null)
                return;
            var existingItem = _this.items[targetSlot];
            // If target slot is empty
            if (existingItem === null) {
                _this.items[targetSlot] = _this.grabbedItem;
            }
            else {
                // Swap items
                if (_this._dragStartSlot !== null) {
                    _this.items[_this._dragStartSlot] = existingItem;
                }
                _this.items[targetSlot] = _this.grabbedItem;
            }
            _this.grabbedItem = null;
        };
        this.game = game;
        this.player = player;
        input_1.Input.mouseDownListeners.push(function (x, y, button) {
            return _this.handleMouseDown(x, y, button);
        });
        input_1.Input.mouseUpListeners.push(function (x, y, button) {
            return _this.handleMouseUp(x, y, button);
        });
        input_1.Input.holdCallback = function () { return _this.onHoldDetected(); };
        this.items = new Array((this.rows + this.expansion) * this.cols).fill(null);
        this.equipAnimAmount = new Array((this.rows + this.expansion) * this.cols).fill(0);
        var a = function (i) {
            if (i === null)
                return;
            if (i instanceof equippable_1.Equippable) {
                i.setWielder(_this.player);
            }
            if (i instanceof weapon_1.Weapon && _this.weapon === null) {
                i.toggleEquip();
                _this.weapon = i;
                //this.player.weapon = this.weapon;
            }
            _this.addItem(i);
        };
        var startingInv = gameConstants_1.GameConstants.DEVELOPER_MODE
            ? gameConstants_1.GameConstants.STARTING_DEV_INVENTORY
            : gameConstants_1.GameConstants.STARTING_INVENTORY;
        startingInv.forEach(function (item) {
            a(new item({ game: _this.game }, 0, 0));
        });
        input_1.Input.mouseDownListeners.push(function (x, y, button) {
            return _this.handleMouseDown(x, y, button);
        });
        input_1.Input.mouseUpListeners.push(function (x, y, button) {
            return _this.handleMouseUp(x, y, button);
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
    Armor.itemName = "armor";
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
            player.inventory.removeItem(_this);
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
    Backpack.itemName = "backpack";
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
    BlueGem.itemName = "zircon";
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
        _this.fuel = 100; //how many turns before it burns out
        _this.tileX = 27;
        _this.tileY = 0;
        _this.name = "candle";
        _this.fuelCap = 100;
        _this.radius = 4;
        return _this;
    }
    Candle.itemName = "candle";
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
    Coal.itemName = "coal";
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
    Object.defineProperty(Coin.prototype, "distanceToBottomRight", {
        get: function () {
            return Math.sqrt(Math.pow((this.x + this.w - window.innerWidth), 2) +
                Math.pow((this.y + this.h - window.innerHeight), 2));
        },
        enumerable: false,
        configurable: true
    });
    Coin.itemName = "coin";
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
            if (_this.broken) {
                _this.equipped = false;
                var pronoun = _this.name.endsWith("s") ? "them" : "it";
                _this.level.game.pushMessage("You'll have to fix your " +
                    _this.name +
                    " before you can use " +
                    pronoun +
                    ".");
            }
        };
        _this.drawEquipped = function (delta, x, y) {
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x, y - 1, _this.w, _this.h);
        };
        _this.degrade = function (degradeAmount) {
            if (degradeAmount === void 0) { degradeAmount = 1; }
            _this.durability -= degradeAmount;
            if (_this.durability <= 0)
                _this.break();
        };
        _this.break = function () {
            _this.durability = 0;
            _this.broken = true;
            _this.toggleEquip();
            //this.wielder.inventory.removeItem(this);
            _this.wielder = null;
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

/***/ "./src/item/godStone.ts":
/*!******************************!*\
  !*** ./src/item/godStone.ts ***!
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
exports.GodStone = void 0;
var room_1 = __webpack_require__(/*! ../room */ "./src/room.ts");
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var GodStone = /** @class */ (function (_super) {
    __extends(GodStone, _super);
    function GodStone(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            _this.teleportToExit(player);
        };
        _this.teleportToExit = function (player) {
            var downLadders = _this.room.game.rooms.filter(function (room) { return room.type === room_1.RoomType.DOWNLADDER; });
            console.log("downLadders", downLadders);
            var room = downLadders[downLadders.length - 1];
            room.game.changeLevelThroughDoor(player, room.doors[0], 1);
            player.x = room.roomX + 2;
            player.y = room.roomY + 3;
        };
        _this.getDescription = function () {
            return "YOU SHOULD NOT HAVE THIS";
        };
        _this.room = level;
        _this.count = 0;
        _this.tileX = 31;
        _this.tileY = 0;
        _this.stackable = true;
        return _this;
    }
    return GodStone;
}(usable_1.Usable));
exports.GodStone = GodStone;


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
    Gold.itemName = "gold";
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
    GoldenKey.itemName = "goldenKey";
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
    GreenGem.itemName = "peridot";
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
    Heart.itemName = "health potion";
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
exports.Item = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var drawable_1 = __webpack_require__(/*! ../drawable */ "./src/drawable.ts");
var utils_1 = __webpack_require__(/*! ../utils */ "./src/utils.ts");
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
                _this.startY = player.y;
                _this.y = player.y;
                _this.x = player.x;
                _this.drawableY = _this.y;
                _this.alpha = 1;
                _this.pickedUp = player.inventory.addItem(_this);
                if (_this.pickedUp)
                    _this.pickupSound();
            }
        };
        _this.dropFromInventory = function () {
            _this.setDrawOffset();
        };
        // Function to get the amount of shade at the item's location
        _this.shadeAmount = function () {
            if (!_this.x || !_this.y)
                return 0;
            else
                return _this.level.softVis[_this.x][_this.y];
        };
        _this.drawStatus = function (x, y) { };
        _this.drawBrokenSymbol = function (x, y) {
            if (_this.broken) {
                game_1.Game.drawFX(5, 0, 1, 1, x - 0.5 / gameConstants_1.GameConstants.TILESIZE, y - 0.5 / gameConstants_1.GameConstants.TILESIZE, 1, 1);
            }
        };
        // Function to draw the item
        _this.draw = function (delta) {
            if (!_this.pickedUp) {
                _this.drawableY = _this.y;
                if (_this.scaleFactor > 0)
                    _this.scaleFactor *= Math.pow(0.5, delta);
                else
                    _this.scaleFactor = 0;
                var scale = 1 / (_this.scaleFactor + 1);
                game_1.Game.ctx.imageSmoothingEnabled = false;
                game_1.Game.drawItem(0, 0, 1, 1, _this.x, _this.y, 1, 1);
                _this.frame += (delta * (Math.PI * 2)) / 60;
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x + _this.w * (scale * -0.5 + 0.5) + _this.drawOffset, _this.y +
                    Math.sin(_this.frame) * 0.07 -
                    1 +
                    _this.offsetY +
                    _this.h * (scale * -0.5 + 0.5), _this.w * scale, _this.h * scale, _this.level.shadeColor, _this.shadeAmount());
            }
        };
        _this.setDrawOffset = function () {
            var itemsOnTile = _this.level.items.filter(function (item) { return item.x === _this.x && item.y === _this.y; });
            if (itemsOnTile.length > 1) {
                itemsOnTile.forEach(function (item) {
                    item.drawOffset =
                        (-itemsOnTile.length / 2 + itemsOnTile.indexOf(item) + 1) /
                            itemsOnTile.length;
                });
            }
        };
        _this.degrade = function () {
            _this.durability -= 1;
        };
        // Function to draw the top layer of the item
        _this.drawTopLayer = function (delta) {
            if (_this.pickedUp) {
                _this.pickupOffsetY += (4.5 - _this.pickupOffsetY) * 0.1 * delta;
                //this.x += (Math.sin(Date.now() / 50) * delta) / 10;
                _this.alpha *= Math.pow(0.9, delta);
                if (Math.abs(_this.alpha) < 0.01) {
                    _this.drawOffset = 0;
                    _this.pickupOffsetY = 1;
                    _this.level.items = _this.level.items.filter(function (x) { return x !== _this; });
                }
                if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                    game_1.Game.ctx.globalAlpha = Math.max(0, _this.alpha);
                game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, _this.x, _this.y - _this.pickupOffsetY, _this.w, _this.h);
                game_1.Game.ctx.globalAlpha = 1.0;
            }
        };
        // Function to draw the item's icon
        _this.drawIcon = function (delta, x, y, opacity, count) {
            if (opacity === void 0) { opacity = 1; }
            if (gameConstants_1.GameConstants.ALPHA_ENABLED)
                game_1.Game.ctx.globalAlpha = opacity;
            _this.drawDurability(x, y);
            var shake = 0;
            if (_this.durability <= 1 && !_this.broken)
                shake =
                    Math.round(Math.sin(Date.now() / 25) + 1 / 2) /
                        2 /
                        gameConstants_1.GameConstants.TILESIZE;
            game_1.Game.drawItem(_this.tileX, _this.tileY, 1, 2, x + shake, y - 1, _this.w, _this.h);
            game_1.Game.ctx.globalAlpha = 1;
            var countToUse = count ? count : _this.stackCount;
            var countText = countToUse <= 1 ? "" : "" + countToUse;
            var width = game_1.Game.measureText(countText).width;
            var countX = 16 - width;
            var countY = 10;
            game_1.Game.fillTextOutline(countText, x * gameConstants_1.GameConstants.TILESIZE + countX, y * gameConstants_1.GameConstants.TILESIZE + countY, gameConstants_1.GameConstants.OUTLINE, "white");
            _this.drawStatus(x, y);
            _this.drawBrokenSymbol(x, y);
        };
        // Function to draw the item's durability bar with color transitioning from green to red
        _this.drawDurability = function (x, y) {
            if (_this.durability < _this.durabilityMax) {
                // Calculate durability ratio (1 = full, 0 = broken)
                var durabilityRatio = _this.durability / _this.durabilityMax;
                // Map durability ratio to hue (120 = green, 0 = red)
                var color = utils_1.Utils.hsvToHex(120 * durabilityRatio, // Hue from 120 (green) to 0 (red)
                1, // Full saturation
                1);
                var iconWidth = gameConstants_1.GameConstants.TILESIZE;
                var barWidth = Math.ceil(durabilityRatio * iconWidth); // Round to nearest pixel
                var barHeight = 2; // 2 pixels tall
                // Calculate the position of the durability bar
                var barX = Math.round(x * gameConstants_1.GameConstants.TILESIZE); // Round to nearest pixel
                var barY = Math.round(y * gameConstants_1.GameConstants.TILESIZE + gameConstants_1.GameConstants.TILESIZE - 2); // Round to nearest pixel
                // Set the fill style for the durability bar
                game_1.Game.ctx.fillStyle = color;
                game_1.Game.ctx.imageSmoothingEnabled = false;
                // Draw the durability bar
                game_1.Game.ctx.fillRect(barX, barY, barWidth, barHeight);
                // Reset settings
                game_1.Game.ctx.fillStyle = "white";
            }
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
        _this.scaleFactor = 5;
        _this.offsetY = -0.25;
        _this.name = "";
        _this.startY = y;
        _this.randomOffset = Math.random();
        _this.durability = 50;
        _this.durabilityMax = 50;
        _this.broken = false;
        _this.description = "";
        _this.drawOffset = 0;
        _this.pickupOffsetY = 1;
        return _this;
    }
    Item.add = function (room, x, y) {
        var rest = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            rest[_i - 3] = arguments[_i];
        }
        room.items.push(new (this.bind.apply(this, __spreadArray([void 0, room, x, y], rest, false)))());
    };
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
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var Key = /** @class */ (function (_super) {
    __extends(Key, _super);
    function Key(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getDescription = function () {
            return "KEY\nAn iron key.";
        };
        _this.onPickup = function (player) {
            if (!_this.pickedUp) {
                _this.pickedUp = player.inventory.addItem(_this);
                if (_this.pickedUp)
                    sound_1.Sound.keyPickup();
            }
        };
        _this.tileX = 1;
        _this.tileY = 0;
        return _this;
    }
    Key.itemName = "key";
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
var light_1 = __webpack_require__(/*! ./light */ "./src/item/light.ts");
var Lantern = /** @class */ (function (_super) {
    __extends(Lantern, _super);
    function Lantern(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.addFuel = function (amount) {
            _this.fuel += amount;
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
    Lantern.itemName = "lantern";
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
var utils_1 = __webpack_require__(/*! ../utils */ "./src/utils.ts");
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
                _this.wielder.defaultSightRadius + _this.fuelPercentage * _this.radius;
        };
        _this.setBrightness = function () {
            _this.wielder.lightBrightness =
                _this.minBrightness + _this.fuelPercentage * _this.maxBrightness;
        };
        _this.toggleEquip = function () {
            _this.equipped = !_this.equipped;
            if (_this.isIgnited()) {
                _this.setRadius();
                _this.wielder.lightEquipped = true;
            }
            else {
                _this.resetRadius();
                _this.wielder.lightEquipped = false;
            }
            _this.updateLighting();
        };
        _this.coEquippable = function (other) {
            return !(other instanceof Light);
        };
        _this.resetRadius = function () {
            _this.wielder.sightRadius = _this.wielder.defaultSightRadius;
        };
        _this.burn = function () {
            if (_this.fuel <= 0) {
                _this.wielder.game.pushMessage("".concat(_this.name, " depletes."));
                _this.resetRadius();
                _this.wielder.lightEquipped = false;
                _this.wielder.inventory.removeItem(_this);
                _this.updateLighting();
            }
            else if (_this.isIgnited()) {
                _this.fuel--;
                _this.setRadius();
            }
        };
        _this.drawDurability = function (x, y) {
            if (_this.fuel < _this.fuelCap) {
                // Calculate durability ratio (1 = full, 0 = broken)
                var durabilityRatio = _this.fuel / _this.fuelCap;
                // Map durability ratio to hue (120 = green, 0 = red)
                var color = utils_1.Utils.hsvToHex(120 * durabilityRatio, // Hue from 120 (green) to 0 (red)
                1, // Full saturation
                1);
                var iconWidth = gameConstants_1.GameConstants.TILESIZE;
                var barWidth = durabilityRatio * iconWidth;
                var barHeight = 2; // 2 pixels tall
                // Calculate the position of the durability bar
                var barX = x * gameConstants_1.GameConstants.TILESIZE;
                var barY = y * gameConstants_1.GameConstants.TILESIZE + gameConstants_1.GameConstants.TILESIZE - 2;
                // Set the fill style for the durability bar
                game_1.Game.ctx.fillStyle = color;
                // Set the interpolation mode to nearest neighbor
                game_1.Game.ctx.imageSmoothingEnabled = false;
                // Draw the durability bar
                game_1.Game.ctx.fillRect(barX, barY, barWidth, barHeight);
                // Reset fill style to default
                game_1.Game.ctx.fillStyle = "white";
            }
        };
        _this.tickInInventory = function () {
            _this.burn();
        };
        _this.getDescription = function () {
            return "".concat(_this.name, ": ").concat(_this.fuelPercentage * 100, "%");
        };
        _this.tileX = 28;
        _this.tileY = 0;
        _this.fuel = 0;
        _this.fuelCap = 250;
        _this.maxBrightness = 2;
        _this.minBrightness = 0.3;
        _this.radius = 6;
        return _this;
    }
    Object.defineProperty(Light.prototype, "fuelPercentage", {
        get: function () {
            return this.fuel / this.fuelCap;
        },
        enumerable: false,
        configurable: true
    });
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
    RedGem.itemName = "garnet";
    return RedGem;
}(item_1.Item));
exports.RedGem = RedGem;


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
    Stone.itemName = "stones";
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
        _this.radius = 6;
        return _this;
    }
    Torch.itemName = "torch";
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
        _this.useOnOther = function (player, other) { };
        _this.canUseOnOther = false;
        return _this;
    }
    return Usable;
}(item_1.Item));
exports.Usable = Usable;


/***/ }),

/***/ "./src/item/weaponFragments.ts":
/*!*************************************!*\
  !*** ./src/item/weaponFragments.ts ***!
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
exports.WeaponFragments = void 0;
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var equippable_1 = __webpack_require__(/*! ./equippable */ "./src/item/equippable.ts");
var WeaponFragments = /** @class */ (function (_super) {
    __extends(WeaponFragments, _super);
    function WeaponFragments(level, x, y, stackCount) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            player.health = Math.min(player.maxHealth, player.health + 1);
            if (_this.level.game.rooms[player.levelID] === _this.level.game.room)
                sound_1.Sound.heal();
            player.inventory.removeItem(_this);
            //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
        };
        _this.useOnOther = function (player, other) {
            if (other instanceof equippable_1.Equippable && other.broken) {
                var repairAmount = Math.min(other.durabilityMax - other.durability, _this.stackCount);
                other.durability += repairAmount;
                _this.stackCount -= repairAmount;
                other.broken = false;
                _this.level.game.pushMessage("You repair your ".concat(other.name, " with ").concat(repairAmount, " fragments."));
                if (_this.stackCount <= 0)
                    player.inventory.removeItem(_this);
            }
        };
        _this.getDescription = function () {
            return "WEAPON FRAGMENTS\nCan be used to repair broken weapons";
        };
        _this.tileX = 3;
        _this.tileY = 0;
        _this.offsetY = -0.3;
        _this.name = "weapon fragments";
        _this.canUseOnOther = true;
        _this.stackable = true;
        _this.stackCount = stackCount || 10;
        return _this;
    }
    WeaponFragments.itemName = "weapon fragments";
    return WeaponFragments;
}(usable_1.Usable));
exports.WeaponFragments = WeaponFragments;


/***/ }),

/***/ "./src/item/weaponPoision.ts":
/*!***********************************!*\
  !*** ./src/item/weaponPoision.ts ***!
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
exports.WeaponPoison = void 0;
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var usable_1 = __webpack_require__(/*! ./usable */ "./src/item/usable.ts");
var weapon_1 = __webpack_require__(/*! ../weapon/weapon */ "./src/weapon/weapon.ts");
var WeaponPoison = /** @class */ (function (_super) {
    __extends(WeaponPoison, _super);
    function WeaponPoison(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.onUse = function (player) {
            player.health = Math.min(player.maxHealth, player.health + 1);
            if (_this.level.game.rooms[player.levelID] === _this.level.game.room)
                sound_1.Sound.heal();
            //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
        };
        _this.useOnOther = function (player, other) {
            if (other instanceof weapon_1.Weapon) {
                other.applyStatus({ poison: true, blood: false });
                player.inventory.removeItem(_this);
                _this.level.game.pushMessage("You apply the poison to your ".concat(other.name, "."));
                console.log("weapon poison used on ".concat(other.name));
            }
        };
        _this.getDescription = function () {
            return "WEAPON POISON\nCan be applied to weapons to deal poison damage";
        };
        _this.tileX = 11;
        _this.tileY = 4;
        _this.offsetY = -0.3;
        _this.canUseOnOther = true;
        return _this;
    }
    WeaponPoison.itemName = "weapon poison";
    return WeaponPoison;
}(usable_1.Usable));
exports.WeaponPoison = WeaponPoison;


/***/ }),

/***/ "./src/level.ts":
/*!**********************!*\
  !*** ./src/level.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports) {


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
exports.Level = exports.enemyMinimumDepth = void 0;
exports.enemyMinimumDepth = {
    1: 0,
    2: 1,
    3: 0,
    4: 0,
    5: 1,
    6: 2,
    7: 2,
    8: 1,
    9: 1,
    10: 3,
    11: 2,
    12: 2,
    13: 3,
    14: 3, // FireWizardEnemy
};
/*
interface enemySpawnPoolData {
  maxCount: number;
  minCount: number;
}

interface environmentData {
  name: string;
  preferredEnemies: Array<Enemy>;
  preferredEntities: Array<Entity>;
  entityBlacklist: Array<Entity>;
  enemySpawnPoolData: enemySpawnPoolData;
  roomData: roomData;
}

interface entitySpawnData {
  enemy: Enemy;
  spawnChance: number;
  maximumCount: number;
}
*/
var Level = /** @class */ (function () {
    function Level(game, depth, width, height) {
        var _this = this;
        this.initializeLevelArray = function () {
            // Create a 300x300 grid for depth 0
            _this.levelArray = [];
            for (var x = 0; x < _this.width; x++) {
                _this.levelArray[x] = [];
                for (var y = 0; y < _this.height; y++) {
                    _this.levelArray[x][y] = null;
                }
            }
        };
        this.loadRoomsIntoLevelArray = function () {
            for (var _i = 0, _a = _this.rooms; _i < _a.length; _i++) {
                var room = _a[_i];
                for (var x = room.roomX; x < room.roomX + room.width; x++) {
                    for (var y = room.roomY; y < room.roomY + room.height; y++) {
                        _this.levelArray[x][y] = room.roomArray[x][y];
                    }
                }
            }
        };
        this.game = game;
        this.depth = depth;
        this.width = width;
        this.height = height;
        this.rooms = game.rooms;
        this.initializeLevelArray();
        //this.loadRoomsIntoLevelArray();
        console.log("depth: ".concat(this.depth));
        this.enemyParameters = this.getEnemyParameters();
    }
    /**
     * Generates enemy parameters based on the current depth.
     * @param depth The current depth level.
     * @returns An object conforming to the EnemyParameters interface.
     */
    Level.prototype.getEnemyParameters = function () {
        var _a;
        var _this = this;
        var currentDepth = this.depth;
        // Generate the enemy pool based on current depth
        var enemyPoolIds = this.generateEnemyPoolIds(currentDepth);
        // Create enemyTables where each level maps to the enemyPoolIds
        var enemyTables = {};
        for (var tableDepth = 0; tableDepth <= currentDepth; tableDepth++) {
            // Assign the same pool for all tables up to current depth
            enemyTables[tableDepth] = enemyPoolIds;
        }
        var newEnemies = enemyTables[currentDepth].filter(function (id) { return !_this.game.encounteredEnemies.includes(id); });
        (_a = this.game.encounteredEnemies).push.apply(_a, newEnemies);
        console.log("encounteredEnemies for depth ".concat(this.depth, ": ").concat(this.game.encounteredEnemies));
        return {
            enemyTables: enemyTables,
            maxDepthTable: currentDepth,
            minDepths: exports.enemyMinimumDepth,
        };
    };
    /**
     * Generates the enemy pool IDs based on the current depth, introducing up to 2 new enemies each level.
     * @param depth The current depth level.
     * @returns An array of selected enemy IDs.
     */
    Level.prototype.generateEnemyPoolIds = function (depth) {
        var _a;
        var _this = this;
        var availableEnemies = Object.entries(exports.enemyMinimumDepth)
            .filter(function (_a) {
            var enemyId = _a[0], minDepth = _a[1];
            return depth >= minDepth;
        })
            .map(function (_a) {
            var enemyId = _a[0];
            return Number(enemyId);
        });
        // Determine which enemies are new (not yet encountered)
        var newEnemies = availableEnemies.filter(function (id) { return !_this.game.encounteredEnemies.includes(id); });
        // Decide how many new enemies to introduce (1 or 2)
        var newEnemiesToAddCount = Math.min(newEnemies.length, 2);
        var newEnemiesToAdd = this.getRandomElements(newEnemies, newEnemiesToAddCount);
        // Add the new enemies to encounteredEnemies
        (_a = this.game.encounteredEnemies).push.apply(_a, newEnemiesToAdd);
        // Log the newly added enemies for debugging
        console.log("New enemies introduced at depth ".concat(depth, ": ").concat(newEnemiesToAdd));
        // Combine encountered enemies to form the enemy pool
        var enemyPoolIds = this.game.encounteredEnemies.slice();
        // Determine the number of enemy types for the current depth
        var numberOfTypes = this.getNumberOfEnemyTypes(depth);
        // Select the final set of enemy IDs for the pool
        var selectedEnemyIds = this.getRandomElements(enemyPoolIds, numberOfTypes);
        // Ensure uniqueness and limit based on available enemies
        return Array.from(new Set(selectedEnemyIds)).slice(0, numberOfTypes);
    };
    /**
     * Determines the number of enemy types allowed based on the current depth.
     * @param depth The current depth level.
     * @returns The number of enemy types.
     */
    Level.prototype.getNumberOfEnemyTypes = function (depth) {
        // Example logic: depth 0 -> 2 types, depth 1 -> 4, depth 2 -> 6, etc.
        var numberOfTypes = depth === 0 ? 2 : Math.ceil(Math.sqrt(depth + 1)) + 2;
        console.log("numberOfTypes: ".concat(numberOfTypes));
        return numberOfTypes;
    };
    /**
     * Utility function to get random elements from an array.
     * @param array The array to select from.
     * @param count The number of elements to select.
     * @returns An array of randomly selected elements.
     */
    Level.prototype.getRandomElements = function (array, count) {
        var _a;
        var shuffled = __spreadArray([], array, true);
        for (var i = shuffled.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            _a = [shuffled[j], shuffled[i]], shuffled[i] = _a[0], shuffled[j] = _a[1];
        }
        return shuffled.slice(0, Math.min(count, shuffled.length));
    };
    return Level;
}());
exports.Level = Level;


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
    LevelConstants.HEALTH_BAR_FADEOUT = 350;
    LevelConstants.HEALTH_BAR_TOTALTIME = 1000;
    LevelConstants.SHADED_TILE_CUTOFF = 1;
    LevelConstants.SMOOTH_LIGHTING = false; //doesn't work
    LevelConstants.MIN_VISIBILITY = 0; // visibility level of places you've already seen
    LevelConstants.LIGHTING_ANGLE_STEP = 5; // how many degrees between each ray, previously 5
    LevelConstants.LIGHTING_MAX_DISTANCE = 7;
    LevelConstants.LIGHT_RESOLUTION = 0.1; //1 is default
    LevelConstants.LEVEL_TEXT_COLOR = "yellow";
    LevelConstants.AMBIENT_LIGHT_COLOR = [10, 10, 10];
    LevelConstants.TORCH_LIGHT_COLOR = [200, 25, 5];
    return LevelConstants;
}());
exports.LevelConstants = LevelConstants;


/***/ }),

/***/ "./src/levelGenerator.ts":
/*!*******************************!*\
  !*** ./src/levelGenerator.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.LevelGenerator = exports.PartialLevel = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var room_1 = __webpack_require__(/*! ./room */ "./src/room.ts");
var random_1 = __webpack_require__(/*! ./random */ "./src/random.ts");
var downLadder_1 = __webpack_require__(/*! ./tile/downLadder */ "./src/tile/downLadder.ts");
var levelParametersGenerator_1 = __webpack_require__(/*! ./levelParametersGenerator */ "./src/levelParametersGenerator.ts");
var level_1 = __webpack_require__(/*! ./level */ "./src/level.ts");
var gameConstants_1 = __webpack_require__(/*! ./gameConstants */ "./src/gameConstants.ts");
// animation delays in ms
var ANIMATION_PARTITION_SPLIT_DELAY = 0; // for partition splitting
var ANIMATION_PATHFINDING_DELAY = 0; // for pathfinding
var ANIMATION_LARGE_DELAY = 0; // in between larger steps
if (document.cookie.includes("showgeneration=true")) {
    ANIMATION_PARTITION_SPLIT_DELAY = 10; // for partition splitting
    ANIMATION_PATHFINDING_DELAY = 100; // for pathfinding
    ANIMATION_LARGE_DELAY = 100; // in between larger steps
}
var PartitionConnection = /** @class */ (function () {
    function PartitionConnection(x, y, other) {
        this.x = x;
        this.y = y;
        this.other = other;
    }
    return PartitionConnection;
}());
var Partition = /** @class */ (function () {
    function Partition(x, y, w, h, fillStyle) {
        var _this = this;
        this.split = function () { return __awaiter(_this, void 0, void 0, function () {
            var rand_mid, sizeRange, MIN_SIZE, w1, w2, h1, h2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) {
                            return setTimeout(resolve, LevelGenerator.ANIMATION_CONSTANT * ANIMATION_PARTITION_SPLIT_DELAY);
                        })];
                    case 1:
                        _a.sent();
                        // Reset open walls when a partition is split
                        this.isTopOpen = true;
                        this.isRightOpen = true;
                        this.isBottomOpen = true;
                        this.isLeftOpen = true;
                        rand_mid = function () {
                            var center = 0.5;
                            var width = 0.6;
                            return (random_1.Random.rand() - 0.5) * width + center;
                        };
                        sizeRange = function () {
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
                        MIN_SIZE = 4;
                        if (this.w > this.h) {
                            w1 = Math.floor(rand_mid() * this.w);
                            w2 = this.w - w1 - 1;
                            //The remaining border - 1
                            if (w1 < MIN_SIZE || w2 < MIN_SIZE)
                                return [2 /*return*/, [this]];
                            //if either of these are less than the min size: return an array with this Partition
                            return [2 /*return*/, [
                                    new Partition(this.x, this.y, w1, this.h, this.fillStyle),
                                    new Partition(this.x + w1 + 1, this.y, w2, this.h, this.fillStyle),
                                ]];
                            //return an array with two new partitions
                        }
                        else {
                            h1 = Math.floor(rand_mid() * this.h);
                            h2 = this.h - h1 - 1;
                            if (h1 < MIN_SIZE || h2 < MIN_SIZE)
                                return [2 /*return*/, [this]];
                            return [2 /*return*/, [
                                    new Partition(this.x, this.y, this.w, h1, this.fillStyle),
                                    new Partition(this.x, this.y + h1 + 1, this.w, h2, this.fillStyle),
                                ]];
                            //identical code for case where height > width
                        }
                        return [2 /*return*/];
                }
            });
        }); };
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
        this.setOpenWall = function (connection) {
            if (connection.y === _this.y - 1 &&
                connection.x >= _this.x &&
                connection.x < _this.x + _this.w) {
                _this.isTopOpen = false;
            }
            if (connection.y === _this.y + _this.h &&
                connection.x >= _this.x &&
                connection.x < _this.x + _this.w) {
                _this.isBottomOpen = false;
            }
            if (connection.x === _this.x + _this.w &&
                connection.y >= _this.y &&
                connection.y < _this.y + _this.h) {
                _this.isRightOpen = false;
            }
            if (connection.x === _this.x - 1 &&
                connection.y >= _this.y &&
                connection.y < _this.y + _this.h) {
                _this.isLeftOpen = false;
            }
        };
        this.get_branch_point = function () {
            var points = [];
            for (var x = _this.x; x < _this.x + _this.w; x++) {
                //count up from the partitions x to its width
                points.push({ x: x, y: _this.y - 1 /*one row above partition*/ });
                points.push({ x: x, y: _this.y + _this.h /*one row below partition*/ });
            } // pushes the points above and below the partition
            for (var y = _this.y; y < _this.y + _this.h; y++) {
                points.push({ x: _this.x - 1, y: y });
                points.push({ x: _this.x + _this.w, y: y });
            } //pushes points to left and right of the partition
            points = points.filter(function (p) {
                return !_this.connections.some(function (c) { return Math.abs(c.x - p.x) + Math.abs(c.y - p.y) <= 1; });
            });
            points.sort(function () { return 0.5 - random_1.Random.rand(); });
            return points[0]; //return first object of x y points in array points
        };
        this.draw = function (delta, levelCenterX, levelCenterY) {
            game_1.Game.ctx.fillStyle = _this.fillStyle;
            game_1.Game.ctx.fillRect(Math.round(gameConstants_1.GameConstants.WIDTH / 2 + _this.x - levelCenterX), Math.round(gameConstants_1.GameConstants.HEIGHT / 2 + _this.y - levelCenterY), _this.w, _this.h);
            for (var _i = 0, _a = _this.connections; _i < _a.length; _i++) {
                var connection = _a[_i];
                game_1.Game.ctx.fillRect(Math.round(gameConstants_1.GameConstants.WIDTH / 2 + connection.x - levelCenterX), Math.round(gameConstants_1.GameConstants.HEIGHT / 2 + connection.y - levelCenterY), 1, 1);
            }
        };
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.fillStyle = fillStyle;
        this.type = room_1.RoomType.DUNGEON;
        this.connections = [];
        this.distance = 1000;
        this.isTopOpen = true;
        this.isRightOpen = true;
        this.isBottomOpen = true;
        this.isLeftOpen = true;
        this.onMainPath = false;
        this.pathIndex = 0;
    }
    return Partition;
}()); //end of Partition class
var split_partitions = function (partitions, prob) { return __awaiter(void 0, void 0, void 0, function () {
    var _loop_1, _i, partitions_1, partition;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _loop_1 = function (partition) {
                    var _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                if (!(random_1.Random.rand() < prob)) return [3 /*break*/, 2];
                                partitions = partitions.filter(function (p) { return p !== partition; }); // remove partition
                                _c = (_b = partitions).concat;
                                return [4 /*yield*/, partition.split()];
                            case 1:
                                partitions = _c.apply(_b, [_d.sent()]); // add splits
                                _d.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                };
                _i = 0, partitions_1 = partitions;
                _a.label = 1;
            case 1:
                if (!(_i < partitions_1.length)) return [3 /*break*/, 4];
                partition = partitions_1[_i];
                return [5 /*yield**/, _loop_1(partition)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/, partitions];
        }
    });
}); };
var split_partition = function (partition, prob) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(random_1.Random.rand() < prob)) return [3 /*break*/, 2];
                return [4 /*yield*/, partition.split()];
            case 1: return [2 /*return*/, _a.sent()];
            case 2: return [2 /*return*/, [partition]];
        }
    });
}); };
var reduce_dimensions = function (partition, params) {
    var reduceY = 0;
    var reduceX = 0;
    var translateX = 0;
    var translateY = 0;
    partition.connections.forEach(function (connection) {
        if (connection.y === partition.y)
            reduceY++, translateY++;
        if (connection.y === partition.y + partition.h)
            reduceY++;
        if (connection.x === partition.x)
            reduceX++, translateX++;
        if (connection.x === partition.x + partition.w)
            reduceX++;
    });
    if (partition.w > 7) {
        partition.w -= translateX;
        partition.x += translateX;
    }
    if (partition.h > 7) {
        partition.h -= translateY;
        partition.y += translateY;
    }
};
var get_wall_rooms = function (partitions, mapWidth, mapHeight) {
    return partitions.filter(function (partition, index) {
        // Helper function to check if a specific path is clear
        var isPathClear = function (direction) {
            switch (direction) {
                case "left":
                    var _loop_2 = function (y) {
                        var blocked = partitions.some(function (other) {
                            if (other === partition)
                                return false;
                            // Check if other partition overlaps this y-coordinate and is to the left
                            return (other.y <= y &&
                                y < other.y + other.h &&
                                other.x + other.w > 0 &&
                                other.x + other.w <= partition.x);
                        });
                        if (!blocked)
                            return { value: true }; // Found at least one y without a blocker
                    };
                    for (var y = partition.y; y < partition.y + partition.h; y++) {
                        var state_1 = _loop_2(y);
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                    return false;
                case "right":
                    var _loop_3 = function (y) {
                        var blocked = partitions.some(function (other) {
                            if (other === partition)
                                return false;
                            // Check if other partition overlaps this y-coordinate and is to the right
                            return (other.y <= y &&
                                y < other.y + other.h &&
                                other.x < mapWidth &&
                                other.x >= partition.x + partition.w);
                        });
                        if (!blocked)
                            return { value: true };
                    };
                    for (var y = partition.y; y < partition.y + partition.h; y++) {
                        var state_2 = _loop_3(y);
                        if (typeof state_2 === "object")
                            return state_2.value;
                    }
                    return false;
                case "top":
                    var _loop_4 = function (x) {
                        var blocked = partitions.some(function (other) {
                            if (other === partition)
                                return false;
                            // Check if other partition overlaps this x-coordinate and is above
                            return (other.x <= x &&
                                x < other.x + other.w &&
                                other.y + other.h > 0 &&
                                other.y + other.h <= partition.y);
                        });
                        if (!blocked)
                            return { value: true };
                    };
                    for (var x = partition.x; x < partition.x + partition.w; x++) {
                        var state_3 = _loop_4(x);
                        if (typeof state_3 === "object")
                            return state_3.value;
                    }
                    return false;
                case "bottom":
                    var _loop_5 = function (x) {
                        var blocked = partitions.some(function (other) {
                            if (other === partition)
                                return false;
                            // Check if other partition overlaps this x-coordinate and is below
                            return (other.x <= x &&
                                x < other.x + other.w &&
                                other.y < mapHeight &&
                                other.y >= partition.y + partition.h);
                        });
                        if (!blocked)
                            return { value: true };
                    };
                    for (var x = partition.x; x < partition.x + partition.w; x++) {
                        var state_4 = _loop_5(x);
                        if (typeof state_4 === "object")
                            return state_4.value;
                    }
                    return false;
                default:
                    return false;
            }
        };
        var hasLeftPath = isPathClear("left");
        var hasRightPath = isPathClear("right");
        var hasTopPath = isPathClear("top");
        var hasBottomPath = isPathClear("bottom");
        // Count the number of open paths
        var openPaths = [
            hasLeftPath,
            hasRightPath,
            hasTopPath,
            hasBottomPath,
        ].filter(Boolean).length;
        // Define wall rooms as those with exactly one open path
        var isWallRoom = openPaths === 1;
        return isWallRoom;
    });
};
var remove_wall_rooms = function (partitions, w, h, prob) {
    if (prob === void 0) { prob = 1.0; }
    // Get all wall rooms
    var wallRooms = get_wall_rooms(partitions, w, h);
    var _loop_6 = function (wallRoom) {
        if (random_1.Random.rand() < prob) {
            partitions = partitions.filter(function (p) { return p !== wallRoom; });
        }
    };
    // Remove wall rooms based on probability
    for (var _i = 0, wallRooms_1 = wallRooms; _i < wallRooms_1.length; _i++) {
        var wallRoom = wallRooms_1[_i];
        _loop_6(wallRoom);
    }
    return partitions;
};
var populate_grid = function (partitions, grid, w, h) {
    for (var x = 0; x < w; x++) {
        //loop through the horizontal tiles
        grid[x] = []; //empty array at x index
        for (var y = 0; y < h; y++) {
            grid[x][y] = false;
            for (var _i = 0, partitions_2 = partitions; _i < partitions_2.length; _i++) {
                var partition = partitions_2[_i];
                if (partition.point_in(x, y))
                    grid[x][y] = partition;
            }
        }
    }
    return grid;
    //input grid array, partitions array and width and height
    //output grid array that indicates which cells are in which partition
};
var generate_dungeon_candidate = function (game, partialLevel, map_w, map_h, depth, params) { return __awaiter(void 0, void 0, void 0, function () {
    var minRoomCount, maxRoomCount, maxRoomArea, splitProbabilities, wallRemoveProbability, grid, i, _a, i, spawn, connected, frontier, found_boss, room, doors_found, num_doors, tries, max_tries, point, _i, _b, p, _loop_7, _c, _d, partition, num_loop_doors, _loop_8, i, boss, found_stair, max_stair_tries, _loop_9, stair_tries, state_5, seen, room, _e, _f, c, other, added_rope_hole, _g, _h, p;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                minRoomCount = params.minRoomCount, maxRoomCount = params.maxRoomCount, maxRoomArea = params.maxRoomArea, splitProbabilities = params.splitProbabilities, wallRemoveProbability = params.wallRemoveProbability;
                partialLevel.partitions = [new Partition(0, 0, map_w, map_h, "white")];
                grid = [];
                _j.label = 1;
            case 1:
                if (!(partialLevel.partitions.length < params.maxRoomCount)) return [3 /*break*/, 6];
                i = 0;
                _j.label = 2;
            case 2:
                if (!(i < splitProbabilities.length)) return [3 /*break*/, 5];
                _a = partialLevel;
                return [4 /*yield*/, split_partitions(partialLevel.partitions, splitProbabilities[i])];
            case 3:
                _a.partitions = _j.sent();
                _j.label = 4;
            case 4:
                i++;
                return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 1];
            case 6:
                for (i = 0; i < 100; i++) {
                    partialLevel.partitions.forEach(function (partition) { return __awaiter(void 0, void 0, void 0, function () {
                        var roomArea, _a, _b, _c;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    roomArea = 100000;
                                    if (!(partition.area() > roomArea)) return [3 /*break*/, 2];
                                    partialLevel.partitions = partialLevel.partitions.filter(function (p) { return p !== partition; });
                                    _a = partialLevel;
                                    _c = (_b = partialLevel.partitions).concat;
                                    return [4 /*yield*/, split_partition(partition, 0.5)];
                                case 1:
                                    _a.partitions = _c.apply(_b, [_d.sent()]);
                                    _d.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); });
                }
                //visualize_partialLevel.partitions(partialLevel.partitions, map_w, map_h);
                partialLevel.partitions = remove_wall_rooms(partialLevel.partitions, map_w, map_h, wallRemoveProbability);
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, LevelGenerator.ANIMATION_CONSTANT * ANIMATION_LARGE_DELAY);
                    })];
            case 7:
                _j.sent();
                // Remove wall rooms based on probability
                /*
                if (partitions.length > params.minRoomCount) {
                  for (let i = 0; i < 1; i++) {
                    partitions = remove_wall_rooms(partitions, map_w, map_h, wallRemoveProbability);
                  }
                }
                
                /*
                  partitions = partitions.filter((p) => {
                    if (p.area() > maxRoomArea && partitions.length > params.minRoomCount) {
                      return false;
                    }
                    return true;
                  });
                 
                  while (partitions.length > maxRoomCount) {
                    partitions.pop();
                  }
                */
                // Check if we have any partitions before proceeding
                if (partialLevel.partitions.length === 0) {
                    partialLevel.partitions = [];
                    return [2 /*return*/];
                }
                //populate the grid with partitions
                partialLevel.partitions.sort(function (a, b) { return a.area() - b.area(); });
                // shade each partition's fillStyle based on its area, medium gray for smallest, white for largest
                partialLevel.partitions.forEach(function (partition) {
                    partition.fillStyle = "rgba(128, 128, 128, ".concat(partition.area() / partialLevel.partitions[0].area(), ")");
                });
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, LevelGenerator.ANIMATION_CONSTANT * ANIMATION_LARGE_DELAY);
                    })];
            case 8:
                _j.sent();
                // Make sure we have at least one partition before assigning spawn
                if (partialLevel.partitions.length === 0) {
                    console.log("No partitions generated after filtering.");
                    partialLevel.partitions = [];
                    return [2 /*return*/];
                }
                spawn = partialLevel.partitions[0];
                if (!spawn) {
                    console.log("No spawn point found.");
                    partialLevel.partitions = [];
                    return [2 /*return*/];
                }
                spawn.type = room_1.RoomType.START;
                spawn.fillStyle = "rgb(0, 255, 0)";
                if (partialLevel.partitions.length > 1) {
                    partialLevel.partitions[partialLevel.partitions.length - 1].type =
                        room_1.RoomType.BOSS;
                    partialLevel.partitions[partialLevel.partitions.length - 1].fillStyle =
                        "red";
                }
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, LevelGenerator.ANIMATION_CONSTANT * ANIMATION_LARGE_DELAY);
                    })];
            case 9:
                _j.sent();
                connected = [spawn];
                frontier = [spawn];
                found_boss = false;
                _j.label = 10;
            case 10:
                if (!(frontier.length > 0 && !found_boss)) return [3 /*break*/, 12];
                room = frontier[0];
                if (room !== spawn)
                    room.fillStyle = "green";
                frontier.splice(0, 1);
                doors_found = 0;
                num_doors = Math.floor(random_1.Random.rand() * 2 + 1);
                tries = 0;
                max_tries = 1000;
                while (doors_found < num_doors && tries < max_tries) {
                    point = room.get_branch_point();
                    for (_i = 0, _b = partialLevel.partitions; _i < _b.length; _i++) {
                        p = _b[_i];
                        if (p !== room &&
                            connected.indexOf(p) === -1 &&
                            p.point_next_to(point.x, point.y)) {
                            room.connections.push(new PartitionConnection(point.x, point.y, p));
                            p.connections.push(new PartitionConnection(point.x, point.y, room));
                            // Set open walls based on connection
                            room.setOpenWall(new PartitionConnection(point.x, point.y, p));
                            p.setOpenWall(new PartitionConnection(point.x, point.y, room));
                            frontier.push(p);
                            connected.push(p);
                            doors_found++;
                            if (p.type === room_1.RoomType.BOSS) {
                                found_boss = true;
                                p.fillStyle = "rgb(255, 0, 0)";
                            }
                            break;
                        }
                    }
                    tries++;
                }
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, LevelGenerator.ANIMATION_CONSTANT * ANIMATION_PATHFINDING_DELAY);
                    })];
            case 11:
                _j.sent();
                return [3 /*break*/, 10];
            case 12:
                _loop_7 = function (partition) {
                    if (partition.connections.length === 0)
                        partialLevel.partitions = partialLevel.partitions.filter(function (p) { return p !== partition; });
                };
                // remove rooms we haven't connected to yet
                for (_c = 0, _d = partialLevel.partitions; _c < _d.length; _c++) {
                    partition = _d[_c];
                    _loop_7(partition);
                }
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, LevelGenerator.ANIMATION_CONSTANT * ANIMATION_LARGE_DELAY);
                    })];
            case 13:
                _j.sent();
                grid = populate_grid(partialLevel.partitions, grid, map_w, map_h); // recalculate with removed rooms
                // make sure we haven't removed all the rooms
                if (partialLevel.partitions.length === 0) {
                    partialLevel.partitions = [];
                    return [2 /*return*/]; // for now just return an empty list so we can retry
                }
                num_loop_doors = Math.floor(random_1.Random.rand() * 4 + 4);
                _loop_8 = function (i) {
                    var roomIndex = Math.floor(random_1.Random.rand() * partialLevel.partitions.length);
                    var room = partialLevel.partitions[roomIndex];
                    var found_door = false;
                    var tries = 0;
                    var max_tries = 10;
                    var not_already_connected = partialLevel.partitions.filter(function (p) { return !room.connections.some(function (c) { return c.other === p; }); });
                    while (!found_door && tries < max_tries) {
                        var point = room.get_branch_point();
                        for (var _k = 0, not_already_connected_1 = not_already_connected; _k < not_already_connected_1.length; _k++) {
                            var p = not_already_connected_1[_k];
                            if (p !== room && p.point_next_to(point.x, point.y)) {
                                room.connections.push(new PartitionConnection(point.x, point.y, p));
                                p.connections.push(new PartitionConnection(point.x, point.y, room));
                                // Set open walls based on connection
                                room.setOpenWall(new PartitionConnection(point.x, point.y, p));
                                p.setOpenWall(new PartitionConnection(point.x, point.y, room));
                                found_door = true;
                                break;
                            }
                        }
                        tries++;
                    }
                };
                for (i = 0; i < num_loop_doors; i++) {
                    _loop_8(i);
                }
                // add stair room
                if (!partialLevel.partitions.some(function (p) { return p.type === room_1.RoomType.BOSS; })) {
                    partialLevel.partitions = [];
                    return [2 /*return*/];
                }
                boss = partialLevel.partitions.find(function (p) { return p.type === room_1.RoomType.BOSS; });
                found_stair = false;
                max_stair_tries = 100;
                _loop_9 = function (stair_tries) {
                    var stair = new Partition(game_1.Game.rand(boss.x - 1, boss.x + boss.w - 2, random_1.Random.rand), boss.y - 4, 3, 3, "white");
                    stair.type = room_1.RoomType.DOWNLADDER;
                    stair.fillStyle = "blue";
                    if (!partialLevel.partitions.some(function (p) { return p.overlaps(stair); })) {
                        found_stair = true;
                        partialLevel.partitions.push(stair);
                        stair.connections.push(new PartitionConnection(stair.x + 1, stair.y + 3, boss));
                        boss.connections.push(new PartitionConnection(stair.x + 1, stair.y + 3, stair));
                        // Set open walls for stair and boss connection
                        stair.setOpenWall(new PartitionConnection(stair.x + 1, stair.y + 3, boss));
                        boss.setOpenWall(new PartitionConnection(stair.x + 1, stair.y + 3, stair));
                        return "break";
                    }
                };
                for (stair_tries = 0; stair_tries < max_stair_tries; stair_tries++) {
                    state_5 = _loop_9(stair_tries);
                    if (state_5 === "break")
                        break;
                }
                if (!found_stair) {
                    console.log("No stair found");
                    partialLevel.partitions = [];
                    game.pushMessage("No stair found");
                    return [2 /*return*/];
                }
                // calculate room distances
                frontier = [spawn];
                seen = [];
                spawn.distance = 0;
                while (frontier.length > 0) {
                    room = frontier[0];
                    frontier.splice(0, 1);
                    seen.push(room);
                    for (_e = 0, _f = room.connections; _e < _f.length; _e++) {
                        c = _f[_e];
                        other = c.other;
                        other.distance = Math.min(other.distance, room.distance + 1);
                        if (seen.indexOf(other) === -1)
                            frontier.push(other);
                    }
                }
                added_rope_hole = false;
                for (_g = 0, _h = partialLevel.partitions; _g < _h.length; _g++) {
                    p = _h[_g];
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
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, 10 * LevelGenerator.ANIMATION_CONSTANT * ANIMATION_LARGE_DELAY);
                    })];
            case 14:
                _j.sent();
                return [2 /*return*/];
        }
    });
}); };
var generate_dungeon = function (game, partialLevel, map_w, map_h, depth, params) { return __awaiter(void 0, void 0, void 0, function () {
    var passes_checks, tries;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                passes_checks = false;
                tries = 0;
                _a.label = 1;
            case 1:
                if (!!passes_checks) return [3 /*break*/, 3];
                return [4 /*yield*/, generate_dungeon_candidate(game, partialLevel, map_w, map_h, depth, params)];
            case 2:
                _a.sent();
                passes_checks = true;
                if (partialLevel.partitions.length < params.minRoomCount) {
                    passes_checks = false;
                    if (document.cookie.includes("showgeneration=true"))
                        game.pushMessage("Not enough rooms");
                }
                else if (!partialLevel.partitions.some(function (p) { return p.type === room_1.RoomType.BOSS; })) {
                    passes_checks = false;
                    if (document.cookie.includes("showgeneration=true"))
                        game.pushMessage("Boss room unreachable");
                }
                else if (partialLevel.partitions.find(function (p) { return p.type === room_1.RoomType.BOSS; }).distance < 3) {
                    passes_checks = false;
                    if (document.cookie.includes("showgeneration=true"))
                        game.pushMessage("Boss room too close to spawn");
                }
                tries++;
                return [3 /*break*/, 1];
            case 3:
                game.pushMessage("Dungeon passed all checks");
                return [4 /*yield*/, new Promise(function (resolve) {
                        return setTimeout(resolve, 10 * LevelGenerator.ANIMATION_CONSTANT * ANIMATION_LARGE_DELAY);
                    })];
            case 4:
                _a.sent();
                console.log("finished generation");
                return [2 /*return*/];
        }
    });
}); };
var generate_cave_candidate = function (partialLevel, map_w, map_h, num_rooms) { return __awaiter(void 0, void 0, void 0, function () {
    var grid, i, _a, i, _b, i, _c, spawn, i, connected, frontier, room, doors_found, num_doors, tries, max_tries, point, _i, _d, p, num_loop_doors, _loop_10, i, seen, room, _e, _f, c, other;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                partialLevel.partitions = [new Partition(0, 0, map_w, map_h, "white")];
                grid = [];
                i = 0;
                _g.label = 1;
            case 1:
                if (!(i < 3)) return [3 /*break*/, 4];
                _a = partialLevel;
                return [4 /*yield*/, split_partitions(partialLevel.partitions, 0.75)];
            case 2:
                _a.partitions = _g.sent();
                _g.label = 3;
            case 3:
                i++;
                return [3 /*break*/, 1];
            case 4:
                i = 0;
                _g.label = 5;
            case 5:
                if (!(i < 3)) return [3 /*break*/, 8];
                _b = partialLevel;
                return [4 /*yield*/, split_partitions(partialLevel.partitions, 1)];
            case 6:
                _b.partitions = _g.sent();
                _g.label = 7;
            case 7:
                i++;
                return [3 /*break*/, 5];
            case 8:
                i = 0;
                _g.label = 9;
            case 9:
                if (!(i < 3)) return [3 /*break*/, 12];
                _c = partialLevel;
                return [4 /*yield*/, split_partitions(partialLevel.partitions, 0.5)];
            case 10:
                _c.partitions = _g.sent();
                _g.label = 11;
            case 11:
                i++;
                return [3 /*break*/, 9];
            case 12:
                grid = populate_grid(partialLevel.partitions, grid, map_w, map_h);
                partialLevel.partitions.sort(function (a, b) { return a.area() - b.area(); });
                if (partialLevel.partitions.length === 0) {
                    throw new Error("No partitions generated."); // Throw an error if no partitions
                }
                spawn = partialLevel.partitions[0];
                spawn.type = room_1.RoomType.ROPECAVE;
                for (i = 1; i < partialLevel.partitions.length; i++)
                    partialLevel.partitions[i].type = room_1.RoomType.CAVE;
                connected = [spawn];
                frontier = [spawn];
                // connect rooms until we hit num_rooms
                while (frontier.length > 0 && connected.length < num_rooms) {
                    room = frontier[0];
                    frontier.splice(0, 1);
                    doors_found = 0;
                    num_doors = Math.floor(random_1.Random.rand() * 2 + 1);
                    tries = 0;
                    max_tries = 1000;
                    while (doors_found < num_doors &&
                        tries < max_tries &&
                        connected.length < num_rooms) {
                        point = room.get_branch_point();
                        if (!point) {
                        }
                        for (_i = 0, _d = partialLevel.partitions; _i < _d.length; _i++) {
                            p = _d[_i];
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
                partialLevel.partitions = partialLevel.partitions.filter(function (partition) { return partition.connections.length > 0; });
                grid = populate_grid(partialLevel.partitions, grid, map_w, map_h); // recalculate with removed rooms
                // make sure we haven't removed all the rooms
                if (partialLevel.partitions.length === 0) {
                    throw new Error("No valid rooms after filtering."); // Throw an error if no valid rooms
                }
                num_loop_doors = Math.floor(random_1.Random.rand() * 4 + 4);
                _loop_10 = function (i) {
                    var roomIndex = Math.floor(random_1.Random.rand() * partialLevel.partitions.length);
                    var room = partialLevel.partitions[roomIndex];
                    var found_door = false;
                    var tries = 0;
                    var max_tries = 100;
                    var not_already_connected = partialLevel.partitions.filter(function (p) { return !room.connections.some(function (c) { return c.other === p; }); });
                    while (!found_door && tries < max_tries) {
                        var point = room.get_branch_point();
                        if (!point) {
                            break; // Skip if no valid branch point found
                        }
                        for (var _h = 0, not_already_connected_2 = not_already_connected; _h < not_already_connected_2.length; _h++) {
                            var p = not_already_connected_2[_h];
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
                for (i = 0; i < num_loop_doors; i++) {
                    _loop_10(i);
                }
                // calculate room distances
                frontier = [spawn];
                seen = [];
                spawn.distance = 0;
                while (frontier.length > 0) {
                    room = frontier[0];
                    frontier.splice(0, 1);
                    seen.push(room);
                    for (_e = 0, _f = room.connections; _e < _f.length; _e++) {
                        c = _f[_e];
                        other = c.other;
                        other.distance = Math.min(other.distance, room.distance + 1);
                        if (seen.indexOf(other) === -1)
                            frontier.push(other);
                    }
                }
                return [2 /*return*/, partialLevel.partitions];
        }
    });
}); };
var generate_cave = function (partialLevel, mapWidth, mapHeight) { return __awaiter(void 0, void 0, void 0, function () {
    var numberOfRooms;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                numberOfRooms = 5;
                _a.label = 1;
            case 1: return [4 /*yield*/, generate_cave_candidate(partialLevel, mapWidth, mapHeight, numberOfRooms)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                if (partialLevel.partitions.length < numberOfRooms) return [3 /*break*/, 1];
                _a.label = 4;
            case 4: return [2 /*return*/, partialLevel.partitions];
        }
    });
}); };
var generate_tutorial = function (height, width) {
    if (height === void 0) { height = 7; }
    if (width === void 0) { width = 7; }
    var partitions;
    partitions = [new Partition(0, 0, height, width, "white")];
    partitions[0].type = room_1.RoomType.TUTORIAL;
    return partitions;
};
var visualize_partitions = function (partitions, mapWidth, mapHeight) {
    // Create grid with padded spaces
    var grid = Array.from({ length: mapHeight }, function () { return Array(mapWidth).fill(" . "); });
    // Calculate the maximum number of digits needed
    var maxIndex = partitions.length - 1;
    var padLength = maxIndex.toString().length;
    partitions.forEach(function (partition, index) {
        // Pad the index number with spaces to maintain consistent width
        var paddedIndex = index.toString().padStart(padLength, " ");
        for (var x = partition.x; x < partition.x + partition.w; x++) {
            for (var y = partition.y; y < partition.y + partition.h; y++) {
                if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
                    grid[y][x] = " ".concat(paddedIndex, " "); // Pad numbers with spaces
                }
            }
        }
    });
    console.log("Partition Layout:");
    console.log("   " + __spreadArray([], Array(mapWidth), true).map(function (_, i) { return i % 10; }).join("  ") + " X"); // Column headers
    grid.forEach(function (row, index) {
        var paddedIndex = index.toString().padStart(2, " ");
        console.log("".concat(paddedIndex, " ").concat(row.join("")));
    });
    console.log("Y");
};
var check_overlaps = function (partitions) {
    for (var i = 0; i < partitions.length; i++) {
        for (var j = i + 1; j < partitions.length; j++) {
            var a = partitions[i];
            var b = partitions[j];
            if (a.x < b.x + b.w &&
                a.x + a.w > b.x &&
                a.y < b.y + b.h &&
                a.y + a.h > b.y) {
                console.log("Overlap detected between Partition ".concat(i, " and Partition ").concat(j));
                return true;
            }
        }
    }
    return false;
};
var PartialLevel = /** @class */ (function () {
    function PartialLevel() {
    }
    return PartialLevel;
}());
exports.PartialLevel = PartialLevel;
var LevelGenerator = /** @class */ (function () {
    function LevelGenerator() {
        var _this = this;
        this.depthReached = 0;
        this.currentFloorFirstLevelID = 0;
        this.setOpenWallsForPartitions = function (partitions, mapWidth, mapHeight) {
            for (var _i = 0, partitions_3 = partitions; _i < partitions_3.length; _i++) {
                var partition = partitions_3[_i];
                // Reset all walls to closed by default
                partition.isTopOpen = false;
                partition.isRightOpen = false;
                partition.isBottomOpen = false;
                partition.isLeftOpen = false;
                // Check if partition touches map boundaries
                if (partition.x === 0) {
                    partition.isLeftOpen = true;
                }
                if (partition.y === 0) {
                    partition.isTopOpen = true;
                }
                if (partition.x + partition.w === mapWidth) {
                    partition.isRightOpen = true;
                }
                if (partition.y + partition.h === mapHeight) {
                    partition.isBottomOpen = true;
                }
            }
        };
        this.createLevel = function (depth) {
            var newLevel = new level_1.Level(_this.game, depth, 100, 100);
            _this.game.levels.push(newLevel);
            _this.game.level = newLevel;
        };
        this.getRooms = function (partitions, depth, mapGroup) {
            //this.setOpenWallsForPartitions(partitions, 35, 35); // Using standard map size
            var rooms = [];
            for (var i = 0; i < partitions.length; i++) {
                var partition = partitions[i];
                // Pass open walls information to the Room constructor
                var room = new room_1.Room(_this.game, partition.x - 1, partition.y - 1, partition.w + 2, partition.h + 2, partition.type, depth, mapGroup, _this.game.levels[depth], random_1.Random.rand);
                rooms.push(room);
            }
            var doors_added = [];
            partitions.forEach(function (partition, index) {
                partition.connections.forEach(function (connection) {
                    var door = rooms[index].addDoor(connection.x, connection.y);
                    var existingDoor = doors_added.find(function (existing) { return existing.x === door.x && existing.y === door.y; });
                    if (existingDoor) {
                        existingDoor.link(door);
                        door.link(existingDoor);
                    }
                    doors_added.push(door);
                });
            });
            for (var _i = 0, rooms_1 = rooms; _i < rooms_1.length; _i++) {
                var room = rooms_1[_i];
                room.populate(random_1.Random.rand);
            }
            return rooms;
        };
        this.setSeed = function (seed) {
            _this.seed = seed;
        };
        this.generate = function (game, depth, cave, callback) {
            if (cave === void 0) { cave = false; }
            return __awaiter(_this, void 0, void 0, function () {
                var mapGroup, rooms;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.levelParams = levelParametersGenerator_1.LevelParameterGenerator.getParameters(depth);
                            this.depthReached = depth;
                            // Set the random state based on the seed and depth
                            random_1.Random.setState(this.seed + depth);
                            this.game = game;
                            mapGroup = this.game.rooms.length > 0
                                ? this.game.rooms[this.game.rooms.length - 1].mapGroup + 1
                                : 0;
                            this.partialLevel = new PartialLevel();
                            if (!cave) return [3 /*break*/, 2];
                            return [4 /*yield*/, generate_cave(this.partialLevel, 20, 20)];
                        case 1:
                            _a.sent(); // You might want to make these dynamic based on params
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, generate_dungeon(game, this.partialLevel, this.levelParams.mapWidth, this.levelParams.mapHeight, depth, this.levelParams)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4:
                            // Call this function before get_wall_rooms
                            if (check_overlaps(this.partialLevel.partitions)) {
                                console.warn("There are overlapping partitions.");
                            }
                            // Get the levels based on the partitions
                            this.createLevel(depth);
                            rooms = this.getRooms(this.partialLevel.partitions, depth, mapGroup);
                            console.log("mapGroup: ".concat(mapGroup));
                            console.log("depth: ".concat(depth));
                            // Update the current floor first level ID if it's not a cave
                            if (!cave)
                                this.currentFloorFirstLevelID = this.game.rooms.length;
                            // Add the new levels to the game rooms
                            this.game.rooms = rooms;
                            // // Generate the rope hole if it exists
                            // for (let room of rooms) {
                            //   if (room.type === RoomType.ROPEHOLE) {
                            //     for (let x = room.roomX; x < room.roomX + room.width; x++) {
                            //       for (let y = room.roomY; y < room.roomY + room.height; y++) {
                            //         let tile = room.roomArray[x][y];
                            //         if (tile instanceof DownLadder && tile.isRope) {
                            //           tile.generate();
                            //           callback(cave
                            //             ? rooms.find((r) => r.type === RoomType.ROPECAVE)
                            //             : rooms.find((r) => r.type === RoomType.START));
                            //           return;
                            //         }
                            //       }
                            //     }
                            //   }
                            // }
                            // Return the start room or the rope cave room
                            callback(cave
                                ? rooms.find(function (r) { return r.type === room_1.RoomType.ROPECAVE; })
                                : rooms.find(function (r) { return r.type === room_1.RoomType.START; }));
                            return [2 /*return*/];
                    }
                });
            });
        };
        this.generateFirstNFloors = function (game, numFloors) { return __awaiter(_this, void 0, void 0, function () {
            var i, foundRoom, x, y, tile;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generate(game, 0, false, function () { })];
                    case 1:
                        _a.sent();
                        for (i = 0; i < numFloors; i++) {
                            foundRoom = this.game.rooms
                                .slice()
                                .reverse()
                                .find(function (room) { return room.type === room_1.RoomType.DOWNLADDER; });
                            if (foundRoom) {
                                for (x = foundRoom.roomX; x < foundRoom.roomX + foundRoom.width; x++) {
                                    for (y = foundRoom.roomY; y < foundRoom.roomY + foundRoom.height; y++) {
                                        tile = foundRoom.roomArray[x][y];
                                        if (tile instanceof downLadder_1.DownLadder) {
                                            tile.generate();
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        this.draw = function (delta) {
            game_1.Game.ctx.fillStyle = "rgba(0, 0, 0, 1)";
            game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            if (document.cookie.includes("showgeneration=true")) {
                if (_this.partialLevel.partitions) {
                    _this.partialLevel.partitions.forEach(function (partition) {
                        partition.draw(delta, _this.levelParams.mapWidth / 2, _this.levelParams.mapHeight / 2);
                    });
                }
            }
            else {
                game_1.Game.ctx.fillStyle = "rgb(255, 255, 255)";
                var dimensions = game_1.Game.measureText("generating level...");
                game_1.Game.fillText("generating level...", gameConstants_1.GameConstants.WIDTH / 2 - dimensions.width / 2, gameConstants_1.GameConstants.HEIGHT / 2 - dimensions.height / 2);
            }
        };
    }
    LevelGenerator.ANIMATION_CONSTANT = 1;
    return LevelGenerator;
}());
exports.LevelGenerator = LevelGenerator;


/***/ }),

/***/ "./src/levelParametersGenerator.ts":
/*!*****************************************!*\
  !*** ./src/levelParametersGenerator.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LevelParameterGenerator = exports.enemyClasses = void 0;
var crabEnemy_1 = __webpack_require__(/*! ./entity/enemy/crabEnemy */ "./src/entity/enemy/crabEnemy.ts");
var frogEnemy_1 = __webpack_require__(/*! ./entity/enemy/frogEnemy */ "./src/entity/enemy/frogEnemy.ts");
var zombieEnemy_1 = __webpack_require__(/*! ./entity/enemy/zombieEnemy */ "./src/entity/enemy/zombieEnemy.ts");
var skullEnemy_1 = __webpack_require__(/*! ./entity/enemy/skullEnemy */ "./src/entity/enemy/skullEnemy.ts");
var energyWizard_1 = __webpack_require__(/*! ./entity/enemy/energyWizard */ "./src/entity/enemy/energyWizard.ts");
var chargeEnemy_1 = __webpack_require__(/*! ./entity/enemy/chargeEnemy */ "./src/entity/enemy/chargeEnemy.ts");
var bishopEnemy_1 = __webpack_require__(/*! ./entity/enemy/bishopEnemy */ "./src/entity/enemy/bishopEnemy.ts");
var armoredzombieEnemy_1 = __webpack_require__(/*! ./entity/enemy/armoredzombieEnemy */ "./src/entity/enemy/armoredzombieEnemy.ts");
var bigSkullEnemy_1 = __webpack_require__(/*! ./entity/enemy/bigSkullEnemy */ "./src/entity/enemy/bigSkullEnemy.ts");
var queenEnemy_1 = __webpack_require__(/*! ./entity/enemy/queenEnemy */ "./src/entity/enemy/queenEnemy.ts");
var knightEnemy_1 = __webpack_require__(/*! ./entity/enemy/knightEnemy */ "./src/entity/enemy/knightEnemy.ts");
var bigKnightEnemy_1 = __webpack_require__(/*! ./entity/enemy/bigKnightEnemy */ "./src/entity/enemy/bigKnightEnemy.ts");
var fireWizard_1 = __webpack_require__(/*! ./entity/enemy/fireWizard */ "./src/entity/enemy/fireWizard.ts");
var rookEnemy_1 = __webpack_require__(/*! ./entity/enemy/rookEnemy */ "./src/entity/enemy/rookEnemy.ts");
exports.enemyClasses = {
    1: crabEnemy_1.CrabEnemy,
    2: frogEnemy_1.FrogEnemy,
    3: zombieEnemy_1.ZombieEnemy,
    4: skullEnemy_1.SkullEnemy,
    5: energyWizard_1.EnergyWizardEnemy,
    6: chargeEnemy_1.ChargeEnemy,
    7: rookEnemy_1.RookEnemy,
    8: bishopEnemy_1.BishopEnemy,
    9: armoredzombieEnemy_1.ArmoredzombieEnemy,
    10: bigSkullEnemy_1.BigSkullEnemy,
    11: queenEnemy_1.QueenEnemy,
    12: knightEnemy_1.KnightEnemy,
    13: bigKnightEnemy_1.BigKnightEnemy,
    14: fireWizard_1.FireWizardEnemy,
};
var LevelParameterGenerator = /** @class */ (function () {
    function LevelParameterGenerator() {
    }
    /**
     * Generates level parameters based on the current depth.
     * @param depth The current depth level.
     * @returns An object conforming to the LevelParameters interface.
     */
    LevelParameterGenerator.getParameters = function (depth) {
        return {
            minRoomCount: depth > 0 ? 4 : 5,
            maxRoomCount: depth > 0 ? 12 : 8,
            maxRoomArea: depth > 0 ? 120 + 10 * depth : 40,
            mapWidth: 25 + 5 * depth,
            mapHeight: 25 + 5 * depth,
            splitProbabilities: [0.75, 1.0, 0.25],
            wallRemoveProbability: depth > 0 ? 0.5 : 1,
            numLoopDoorsRange: [4, 8],
            numberOfRooms: depth > 0 ? 5 : 3,
            softMaxRoomArea: 0.5 * (120 + 10 * depth),
        };
    };
    return LevelParameterGenerator;
}());
exports.LevelParameterGenerator = LevelParameterGenerator;


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
        this.shouldUpdate = function () {
            _this.hasChanged =
                _this.x !== _this.oldX ||
                    _this.y !== _this.oldY ||
                    _this.r !== _this.oldR ||
                    _this.c !== _this.oldC ||
                    _this.b !== _this.oldB ||
                    _this.hasChanged;
            return _this.hasChanged;
        };
        this.x = x;
        this.y = y;
        this.r = r;
        this.c = c;
        this.b = b;
        this.oldX = x;
        this.oldY = y;
        this.oldR = r;
        this.oldC = c;
        this.oldB = b;
        this.hasChanged = true;
    }
    return LightSource;
}());
exports.LightSource = LightSource;


/***/ }),

/***/ "./src/lighting.ts":
/*!*************************!*\
  !*** ./src/lighting.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Lighting = void 0;
var lightSource_1 = __webpack_require__(/*! ./lightSource */ "./src/lightSource.ts");
var Lighting = /** @class */ (function () {
    function Lighting() {
    }
    Lighting.momentaryLight = function (room, x, y, radius, color, duration, brightness, delay) {
        var lightSource = Lighting.newLightSource(x, y, color, radius, brightness);
        setTimeout(function () {
            room.updateLightSources(lightSource);
            setTimeout(function () {
                room.updateLightSources(lightSource, true);
            }, duration);
        }, delay);
    };
    Lighting.newLightSource = function (x, y, color, radius, brightness) {
        return new lightSource_1.LightSource(x, y, radius, color, brightness);
    };
    Lighting.addLightSource = function (room, lightSource) {
        room.lightSources.push(lightSource);
    };
    Lighting.removeLightSource = function (room, lightSource) {
        room.lightSources = room.lightSources.filter(function (ls) { return ls !== lightSource; });
    };
    return Lighting;
}());
exports.Lighting = Lighting;


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
                if (_this.game.room.mapGroup === level.mapGroup &&
                    (level.entered === true || gameConstants_1.GameConstants.DEVELOPER_MODE)) {
                    _this.mapData.push({
                        room: level,
                        walls: level.innerWalls,
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
            game_1.Game.ctx.save(); // Save the current canvas state
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
            game_1.Game.ctx.restore(); // Restore the canvas state
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
                20 -
                15 * _this.scale, 0.25 * gameConstants_1.GameConstants.HEIGHT -
                _this.game.room.roomY -
                Math.floor(0.5 * _this.game.room.height) -
                1 * _this.scale -
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
            game_1.Game.ctx.save(); // Save the current canvas state
            for (var _i = 0, walls_1 = walls; _i < walls_1.length; _i++) {
                var wall = walls_1[_i];
                game_1.Game.ctx.fillStyle = "#404040";
                game_1.Game.ctx.fillRect(wall.x * s, wall.y * s, 1 * s, 1 * s);
            }
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        this.drawRoomDoors = function (doors) {
            var s = _this.scale;
            game_1.Game.ctx.save(); // Save the current canvas state
            for (var _i = 0, doors_1 = doors; _i < doors_1.length; _i++) {
                var door = doors_1[_i];
                if (door.opened === false)
                    game_1.Game.ctx.fillStyle = "#5A5A5A";
                if (door.opened === true) {
                    game_1.Game.ctx.fillStyle = "black";
                    game_1.Game.ctx.fillRect(door.x * s, door.y * s, 1 * s, 1 * s);
                }
                game_1.Game.ctx.fillStyle = "#5A5A5A"; // Reset to default after each door
            }
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        this.drawRoomPlayers = function (players, delta) {
            var s = _this.scale;
            game_1.Game.ctx.save(); // Save the current canvas state
            for (var i in players) {
                game_1.Game.ctx.fillStyle = "white";
                if (_this.game.rooms[players[i].levelID].mapGroup === _this.game.room.mapGroup) {
                    game_1.Game.ctx.fillRect(players[i].x * s, players[i].y * s, 1 * s, 1 * s);
                }
            }
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        this.drawRoomEntities = function (entities) {
            var s = _this.scale;
            game_1.Game.ctx.save(); // Save the current canvas state
            for (var _i = 0, entities_1 = entities; _i < entities_1.length; _i++) {
                var enemy = entities_1[_i];
                _this.setEntityColor(enemy);
                game_1.Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s);
            }
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        this.setEntityColor = function (enemy) {
            // No need to save/restore here as only fillStyle is being set
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
            game_1.Game.ctx.save(); // Save the current canvas state
            for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                var item = items_1[_i];
                var x = item.x;
                var y = item.y;
                game_1.Game.ctx.fillStyle = "#ac3232";
                if (!item.pickedUp) {
                    game_1.Game.ctx.fillRect(item.x * s, item.y * s, 1 * s, 1 * s);
                }
            }
            game_1.Game.ctx.restore(); // Restore the canvas state
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

/***/ "./src/particle/damageNumber.ts":
/*!**************************************!*\
  !*** ./src/particle/damageNumber.ts ***!
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
exports.DamageNumber = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var particle_1 = __webpack_require__(/*! ./particle */ "./src/particle/particle.ts");
var DamageNumber = /** @class */ (function (_super) {
    __extends(DamageNumber, _super);
    function DamageNumber(room, x, y, damage, color, outlineColor) {
        var _this = _super.call(this) || this;
        _this.alpha = 1;
        _this.frame = 0;
        _this.xoffset = 0;
        _this.getXoffset = function () {
            if (_this.room.particles.length > 0) {
                var damageNumbers = _this.room.particles.filter(function (p) { return p instanceof DamageNumber; });
                if (damageNumbers.length % 3 === 0)
                    return 0.5;
                if (damageNumbers.length % 3 === 1)
                    return 0;
                if (damageNumbers.length % 3 === 2)
                    return 0.25;
            }
        };
        _this.drawTopLayer = function (delta) {
            game_1.Game.ctx.save();
            if (_this.dead) {
                game_1.Game.ctx.restore();
                return;
            }
            if (_this.frame > 30)
                _this.alpha *= 0.75;
            _this.y -= 0.03 * delta;
            _this.frame += delta;
            var width = game_1.Game.measureText(_this.damage.toString()).width;
            game_1.Game.ctx.globalAlpha = _this.alpha;
            if (_this.alpha <= 0.002) {
                _this.alpha = 0;
                _this.dead = true;
            }
            game_1.Game.fillTextOutline(_this.damage.toString(), (_this.x + 0.4 + _this.xoffset) * gameConstants_1.GameConstants.TILESIZE - width / 2, (_this.y - 0.6) * gameConstants_1.GameConstants.TILESIZE, _this.outlineColor, _this.color);
            game_1.Game.ctx.globalAlpha = 1;
            game_1.Game.ctx.restore();
        };
        _this.room = room;
        _this.damage = damage;
        _this.x = x;
        _this.y = y;
        if (color)
            _this.color = color;
        else
            _this.color = "red";
        if (outlineColor)
            _this.outlineColor = outlineColor;
        else
            _this.outlineColor = gameConstants_1.GameConstants.OUTLINE;
        _this.xoffset = Math.random() * 0.2;
        return _this;
    }
    return DamageNumber;
}(particle_1.Particle));
exports.DamageNumber = DamageNumber;


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
    function ImageParticle(room, x, y, z, s, dx, dy, dz, tileX, tileY, size, delay, expirationTimer, targetX, targetY, targetZ) {
        var _this = _super.call(this) || this;
        _this.render = function () {
            var scale = gameConstants_1.GameConstants.TILESIZE;
            var yOffset = _this.z * scale;
            var frame = _this.s > 0.5 ? 1 : 0; // Placeholder frames for large and small particles
            game_1.Game.ctx.imageSmoothingEnabled = false;
            var adjustedTileX = _this.tileX + _this.size;
            game_1.Game.drawFX(adjustedTileX, _this.tileY, 1, 1, _this.x - _this.alpha / 2, _this.y - _this.z - _this.alpha / 2, 1, 1, _this.shadeColor(), _this.shadeAmount());
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
        _this.room = room;
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
    ImageParticle.shotgun = function (room, cx, cy, tx, ty, tileX, tileY) {
        for (var i = 0; i < 4; i++) {
            room.particles.push(new ImageParticle(room, cx, cy, 0, Math.random() * 0.5 + 0.3, 0, 0, 0, tileX, tileY, 0));
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
            tileX, tileY, [2, 1, 0, 1, 2, 2, 2][i]));
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
        _this.shadeAmount = function () {
            var x = Math.floor(_this.x);
            var y = Math.floor(_this.y);
            if (!_this.room.softVis[x])
                return 0.9;
            var shade = _this.room.softVis[x][y];
            return shade !== null && shade !== void 0 ? shade : 0.9;
        };
        _this.shadeColor = function () {
            return _this.room.shadeColor;
        };
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
            _this.z += _this.dz * delta;
            _this.dz *= 0.9;
            _this.frame += 0.3 * delta;
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
var stats_1 = __webpack_require__(/*! ./stats */ "./src/stats.ts");
var spellbook_1 = __webpack_require__(/*! ./weapon/spellbook */ "./src/weapon/spellbook.ts");
var PlayerDirection;
(function (PlayerDirection) {
    PlayerDirection[PlayerDirection["DOWN"] = 0] = "DOWN";
    PlayerDirection[PlayerDirection["UP"] = 1] = "UP";
    PlayerDirection[PlayerDirection["RIGHT"] = 2] = "RIGHT";
    PlayerDirection[PlayerDirection["LEFT"] = 3] = "LEFT";
})(PlayerDirection = exports.PlayerDirection || (exports.PlayerDirection = {}));
var DrawDirection;
(function (DrawDirection) {
    DrawDirection[DrawDirection["X"] = 0] = "X";
    DrawDirection[DrawDirection["Y"] = 1] = "Y";
})(DrawDirection || (DrawDirection = {}));
var Player = /** @class */ (function (_super) {
    __extends(Player, _super);
    function Player(game, x, y, isLocalPlayer) {
        var _this = _super.call(this) || this;
        _this.animationFrameId = null;
        _this.isProcessingQueue = false;
        _this.lowHealthFrame = 0;
        _this.drawMoveQueue = [];
        _this.inputHandler = function (input) {
            if (!_this.game.started && input !== input_1.InputEnum.MOUSE_MOVE) {
                _this.game.startedFadeOut = true;
                return;
            }
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
                case input_1.InputEnum.NUMBER_1:
                case input_1.InputEnum.NUMBER_2:
                case input_1.InputEnum.NUMBER_3:
                case input_1.InputEnum.NUMBER_4:
                case input_1.InputEnum.NUMBER_5:
                case input_1.InputEnum.NUMBER_6:
                case input_1.InputEnum.NUMBER_7:
                case input_1.InputEnum.NUMBER_8:
                case input_1.InputEnum.NUMBER_9:
                    _this.numKeyListener(input);
                    break;
            }
        };
        _this.commaListener = function () {
            _this.inventory.mostRecentInput = "keyboard";
            _this.inventory.left();
        };
        _this.periodListener = function () {
            _this.inventory.mostRecentInput = "keyboard";
            _this.inventory.right();
        };
        _this.numKeyListener = function (input) {
            _this.inventory.mostRecentInput = "keyboard";
            _this.inventory.handleNumKey(input - 13);
        };
        _this.tapListener = function () {
            _this.inventory.mostRecentInput = "mouse";
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
            _this.inventory.mostRecentInput = "keyboard";
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
            _this.inventory.mostRecentInput = "keyboard";
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
            _this.inventory.mostRecentInput = "keyboard";
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
            _this.inventory.mostRecentInput = "keyboard";
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
            _this.inventory.mostRecentInput = "keyboard";
            if (!_this.game.chatOpen) {
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
            }
        };
        _this.mouseLeftClick = function () {
            _this.inventory.mostRecentInput = "mouse";
            if (_this.dead) {
                _this.restart();
            }
            else if (_this.openVendingMachine)
                if (_this.openVendingMachine.isPointInVendingMachineBounds(mouseCursor_1.MouseCursor.getInstance().getPosition().x, mouseCursor_1.MouseCursor.getInstance().getPosition().y)) {
                    _this.openVendingMachine.space();
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
                _this.inventory.toggleOpen();
            }
        };
        _this.mouseRightClick = function () {
            _this.inventory.mostRecentInput = "mouse";
            _this.inventory.mouseRightClick();
        };
        _this.mouseMove = function () {
            _this.inventory.mostRecentInput = "mouse";
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
        _this.tryVaultOver = function (x, y, direction) {
            switch (direction) {
                case PlayerDirection.UP:
                    _this.tryMove(x, y - 1);
                    break;
                case PlayerDirection.DOWN:
                    _this.tryMove(x, y + 1);
                    break;
                case PlayerDirection.LEFT:
                    _this.tryMove(x - 1, y);
                    break;
                case PlayerDirection.RIGHT:
                    _this.tryMove(x + 1, y);
                    break;
            }
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
            if (_this.canMove() || _this.moveQueue.length >= 1) {
                _this.direction = game_1.Direction.LEFT;
                _this.tryMove(_this.x - 1, _this.y);
            }
            else
                _this.queueMove(_this.x - 1, _this.y, game_1.Direction.LEFT);
        };
        _this.right = function () {
            if (_this.canMove() || _this.moveQueue.length >= 1) {
                _this.direction = game_1.Direction.RIGHT;
                _this.tryMove(_this.x + 1, _this.y);
            }
            else
                _this.queueMove(_this.x + 1, _this.y, game_1.Direction.RIGHT);
        };
        _this.up = function () {
            if (_this.canMove() || _this.moveQueue.length >= 1) {
                _this.direction = game_1.Direction.UP;
                _this.tryMove(_this.x, _this.y - 1);
            }
            else
                _this.queueMove(_this.x, _this.y - 1, game_1.Direction.UP);
        };
        _this.down = function () {
            if (_this.canMove() || _this.moveQueue.length >= 1) {
                _this.direction = game_1.Direction.DOWN;
                _this.tryMove(_this.x, _this.y + 1);
            }
            else
                _this.queueMove(_this.x, _this.y + 1, game_1.Direction.DOWN);
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
            var slowMotion = _this.slowMotionEnabled;
            var newMove = { x: x, y: y };
            // TODO don't move if hit by enemy
            _this.game.rooms[_this.levelID].catchUp();
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
                e.lastX = e.x;
                e.lastY = e.y;
                //console.log(`e.lastX, e.lastY: ${e.lastX}, ${e.lastY}`);
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
                                f.lastX = f.x;
                                f.lastY = f.y;
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
                                _this.game.rooms[_this.levelID].particles.push(new slashParticle_1.SlashParticle(e.x, e.y));
                                _this.shakeScreen(_this.x, _this.y, e.x, e.y);
                                //this.hitShake(this.x, this.y, e.x, e.y);
                                _this.game.rooms[_this.levelID].tick(_this);
                                return;
                            }
                        }
                        else {
                            if (_this.game.rooms[_this.levelID] === _this.game.room)
                                sound_1.Sound.push();
                            // here pushedEnemies may still be []
                            for (var _d = 0, pushedEnemies_1 = pushedEnemies; _d < pushedEnemies_1.length; _d++) {
                                var f = pushedEnemies_1[_d];
                                f.lastX = f.x;
                                f.lastY = f.y;
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
                            _this.moveDistance++;
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
                    _this.shakeScreen(_this.x, _this.y, x, y);
                    if (other.canUnlock(_this))
                        other.unlock(_this);
                }
            }
        };
        _this.updateLastPosition = function (x, y) {
            _this.lastX = x;
            _this.lastY = y;
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
                _this.hurting = true;
                _this.hurtAlpha = 0.5;
                if (_this.health <= 0 && !gameConstants_1.GameConstants.DEVELOPER_MODE) {
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
            //this.game.rooms[this.levelID].updateLighting();
        };
        _this.doneMoving = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.drawX) < EPSILON && Math.abs(_this.drawY) < EPSILON;
        };
        _this.doneHitting = function () {
            var EPSILON = 0.01;
            return Math.abs(_this.hitX) < EPSILON && Math.abs(_this.hitY) < EPSILON;
        };
        _this.enableSlowMotion = function () {
            if (_this.motionSpeed < 1 && !_this.slowMotionEnabled) {
                _this.motionSpeed *= 1.08;
                if (_this.motionSpeed >= 1)
                    _this.motionSpeed = 1;
            }
            if (_this.slowMotionEnabled && _this.motionSpeed > 0.25) {
                _this.motionSpeed *= 0.95;
                if (_this.motionSpeed < 0.25)
                    _this.motionSpeed = 0.25;
            }
        };
        _this.move = function (x, y) {
            _this.updateLastPosition(_this.x, _this.y);
            //this.actionTab.setState(ActionState.MOVE);
            if (_this.game.rooms[_this.levelID] === _this.game.room)
                sound_1.Sound.playerStoneFootstep();
            if (_this.openVendingMachine)
                _this.openVendingMachine.close();
            _this.drawX += x - _this.x;
            _this.drawY += y - _this.y;
            _this.drawMoveQueue.push({
                drawX: x - _this.x,
                drawY: y - _this.y,
            });
            /*
            if (this.drawX > 1) this.drawX = 1;
            if (this.drawY > 1) this.drawY = 1;
            if (this.drawX < -1) this.drawX = -1;
            if (this.drawY < -1) this.drawY = -1;
            */
            _this.x = x;
            _this.y = y;
            for (var _i = 0, _a = _this.game.rooms[_this.levelID].items; _i < _a.length; _i++) {
                var i = _a[_i];
                if (i.x === x && i.y === y) {
                    i.onPickup(_this);
                }
            }
            var diffX = x - _this.lastX;
            var diffY = y - _this.lastY;
            if (diffX === 0 && diffY === 0)
                return;
            //this.game.rooms[this.levelID].updateLighting();
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
            _this.hitX = 0;
            _this.hitY = 0;
        };
        _this.update = function () { };
        _this.updateSlowMotion = function () {
            if (_this.slowMotionTickDuration > 0)
                _this.slowMotionTickDuration -= 1;
            if (_this.slowMotionTickDuration === 0)
                _this.slowMotionEnabled = false;
        };
        _this.finishTick = function () {
            _this.turnCount += 1;
            _this.inventory.tick();
            _this.flashing = false;
            var totalHealthDiff = _this.health - _this.lastTickHealth;
            _this.lastTickHealth = _this.health; // update last tick health
            if (totalHealthDiff < 0) {
                _this.flashing = true;
            }
            _this.moveDistance = 0;
            //this.actionTab.actionState = ActionState.READY;
            //Sets the action tab state to Wait (during enemy turn)
        };
        /**
         * Draws the player sprite to the canvas.
         * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
         * to ensure canvas state is preserved.
         */
        _this.drawPlayerSprite = function (delta) {
            game_1.Game.ctx.save(); // Save the current canvas state
            _this.frame += 0.1 * delta;
            if (_this.frame >= 4)
                _this.frame = 0;
            game_1.Game.drawMob(1 + Math.floor(_this.frame), 8 + _this.direction * 2, 1, 2, _this.x - _this.drawX - _this.hitX, _this.y - 1.45 - _this.drawY - _this.jumpY - _this.hitY, 1, 2);
            if (_this.inventory.getArmor() && _this.inventory.getArmor().health > 0) {
                // TODO draw armor
            }
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        _this.heal = function (amount) {
            _this.health += amount;
            if (_this.health > _this.maxHealth)
                _this.health = _this.maxHealth;
        };
        _this.drawSpellBeam = function (delta) {
            // Clear existing beam effects each frame
            _this.game.rooms[_this.levelID].beamEffects = [];
            if (_this.inventory.getWeapon() instanceof spellbook_1.Spellbook) {
                var spellbook = _this.inventory.getWeapon();
                if (spellbook.isTargeting) {
                    var targets = spellbook.targets;
                    for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
                        var target = targets_1[_i];
                        // Create a new beam effect from the player to the enemy
                        _this.game.rooms[_this.levelID].addBeamEffect(_this.x - _this.drawX, _this.y - _this.drawY, target.x - target.drawX, target.y - target.drawY);
                        // Retrieve the newly added beam effect
                        var beam = _this.game.rooms[_this.levelID].beamEffects[_this.game.rooms[_this.levelID].beamEffects.length - 1];
                        // Render the beam
                        beam.render(_this.x - _this.drawX, _this.y - _this.drawY, target.x - target.drawX, target.y - target.drawY, "cyan", 2, delta);
                    }
                }
            }
        };
        _this.draw = function (delta) {
            _this.updateDrawXY(delta);
            _this.drawableY = _this.y;
            _this.flashingFrame += (delta * 12) / gameConstants_1.GameConstants.FPS;
            if (!_this.dead) {
                game_1.Game.drawMob(0, 0, 1, 1, _this.x - _this.drawX, _this.y - _this.drawY, 1, 1);
                if (!_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0) {
                    _this.drawPlayerSprite(delta);
                }
            }
            _this.drawSpellBeam(delta);
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
                _this.direction = game_1.Direction.RIGHT;
            }
            else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
                _this.direction = game_1.Direction.DOWN;
            }
            else if (angle >= (-3 * Math.PI) / 4 && angle < -Math.PI / 4) {
                _this.direction = game_1.Direction.UP;
            }
            else {
                _this.direction = game_1.Direction.LEFT;
            }
        };
        _this.heartbeat = function () {
            _this.guiHeartFrame = 1;
        };
        _this.tapHoldHandler = function () {
            _this.mapToggled = !_this.mapToggled;
        };
        /**
         * Draws the top layer elements, such as the health bar.
         * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
         * to ensure canvas state is preserved.
         */
        _this.drawTopLayer = function (delta) {
            game_1.Game.ctx.save(); // Save the current canvas state
            _this.healthBar.draw(delta, _this.health, _this.maxHealth, _this.x - _this.drawX, _this.y - _this.drawY, !_this.flashing || Math.floor(_this.flashingFrame) % 2 === 0);
            game_1.Game.ctx.restore(); // Restore the canvas state
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
                    var shake = 0;
                    var shakeY = 0;
                    if (_this.health <= 1) {
                        shake =
                            Math.round(Math.sin(Date.now() / 25 / (i + 1)) + i / 2) /
                                2 /
                                gameConstants_1.GameConstants.TILESIZE;
                        shakeY =
                            Math.round(Math.sin(Date.now() / 25 / (i + 2)) + i / 2) /
                                2 /
                                gameConstants_1.GameConstants.TILESIZE;
                    }
                    var frame = _this.guiHeartFrame > 0 ? 1 : 0;
                    if (i >= Math.floor(_this.health)) {
                        if (i == Math.floor(_this.health) && (_this.health * 2) % 2 == 1) {
                            // draw half heart
                            game_1.Game.drawFX(4, 2, 1, 1, i + shake, levelConstants_1.LevelConstants.SCREEN_H - 1 + shakeY, 1, 1);
                        }
                        else {
                            game_1.Game.drawFX(3, 2, 1, 1, i + shake, levelConstants_1.LevelConstants.SCREEN_H - 1 + shakeY, 1, 1);
                        }
                    }
                    else {
                        game_1.Game.drawFX(frame, 2, 1, 1, i + shake, levelConstants_1.LevelConstants.SCREEN_H - 1 + shakeY, 1, 1);
                    }
                }
                if (_this.inventory.getArmor())
                    _this.inventory.getArmor().drawGUI(delta, _this.maxHealth);
            }
            else {
                game_1.Game.ctx.fillStyle = levelConstants_1.LevelConstants.LEVEL_TEXT_COLOR;
                var enemies = stats_1.statsTracker.getStats().enemies;
                // Count the occurrences of each enemy
                var enemyCounts = enemies.reduce(function (acc, enemy) {
                    acc[enemy] = (acc[enemy] || 0) + 1;
                    return acc;
                }, {});
                // Create individual lines
                var lines_1 = [];
                // Line 1: Game Over or slain by
                if (_this.lastHitBy !== "enemy") {
                    lines_1.push("You were slain by ".concat(_this.lastHitBy, "."));
                }
                else {
                    lines_1.push("Game Over");
                }
                lines_1.push("Depth reached: ".concat(_this.game.rooms[_this.levelID].depth));
                // Line 2: Enemies killed
                lines_1.push("".concat(Object.values(enemyCounts).reduce(function (a, b) { return a + b; }, 0), " enemies killed in total:"));
                // Subsequent lines: Each enemy count
                Object.entries(enemyCounts).forEach(function (_a) {
                    var enemy = _a[0], count = _a[1];
                    lines_1.push("".concat(enemy, " x").concat(count));
                });
                // Line after enemy counts: Restart instruction
                var restartButton = "Press space or click to restart";
                // Calculate total height based on number of lines
                var lineHeight_1 = game_1.Game.letter_height + 2; // Adjust spacing as needed
                var totalHeight = lines_1.length * lineHeight_1 + lineHeight_1; // Additional space for restart button
                // Starting Y position to center the text block
                var startY_1 = gameConstants_1.GameConstants.HEIGHT / 2 - totalHeight / 2;
                // Draw each line centered horizontally
                lines_1.forEach(function (line, index) {
                    var textWidth = game_1.Game.measureText(line).width;
                    var spacing = index === 0 || index === 1 || index === lines_1.length - 1
                        ? lineHeight_1 * 1.5
                        : lineHeight_1;
                    game_1.Game.fillText(line, gameConstants_1.GameConstants.WIDTH / 2 - textWidth / 2, startY_1);
                    startY_1 += spacing;
                });
                // Draw the restart button
                var restartTextWidth = game_1.Game.measureText(restartButton).width;
                game_1.Game.fillText(restartButton, gameConstants_1.GameConstants.WIDTH / 2 - restartTextWidth / 2, startY_1);
            }
            postProcess_1.PostProcessor.draw(delta);
            if (_this.hurting)
                _this.drawHurt(delta);
            if (_this.mapToggled === true)
                _this.map.draw(delta);
            //this.drawTileCursor(delta);
            _this.drawInventoryButton(delta);
        };
        _this.drawHurt = function (delta) {
            game_1.Game.ctx.save(); // Save the current canvas state
            game_1.Game.ctx.globalAlpha = _this.hurtAlpha;
            _this.hurtAlpha -= (_this.hurtAlpha / 10) * delta;
            if (_this.hurtAlpha <= 0.01) {
                _this.hurtAlpha = 0;
                _this.hurting = false;
            }
            game_1.Game.ctx.globalCompositeOperation = "screen";
            game_1.Game.ctx.fillStyle = "#cc3333"; // bright but not fully saturated red
            game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
            game_1.Game.ctx.globalCompositeOperation = "source-over";
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        _this.drawLowHealth = function (delta) {
            //unused
            if (_this.health <= 1 && !_this.dead) {
                // Calculate pulsating alpha for the vignette effect
                var lowHealthAlpha = 0.5; //Math.sin(this.lowHealthFrame / 10) * 0.5 + 0.5;
                game_1.Game.ctx.globalAlpha = lowHealthAlpha;
                _this.lowHealthFrame += delta;
                var gradientBottom = game_1.Game.ctx.createLinearGradient(0, gameConstants_1.GameConstants.HEIGHT, 0, (gameConstants_1.GameConstants.HEIGHT * 2) / 3);
                // Define gradient color stops
                [gradientBottom].forEach(function (gradient) {
                    gradient.addColorStop(0, "#cc3333"); // Solid red at edges
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent toward center
                });
                // Draw the gradients
                game_1.Game.ctx.globalCompositeOperation = "source-over";
                game_1.Game.ctx.fillStyle = gradientBottom;
                game_1.Game.ctx.fillRect(0, 0, gameConstants_1.GameConstants.WIDTH, gameConstants_1.GameConstants.HEIGHT);
                // Reset composite operation and alpha
                game_1.Game.ctx.globalCompositeOperation = "source-over";
                game_1.Game.ctx.globalAlpha = 1.0;
            }
            else {
                _this.lowHealthFrame = 0;
            }
        };
        _this.updateDrawXY = function (delta) {
            if (!_this.doneMoving()) {
                /*
                for (let i = 0; i < this.drawMoveQueue.length; i++) {
                  let prevX = 0;
                  let prevY = 0;
                  if (this.drawMoveQueue.length > 1) {
                    prevX = this.drawMoveQueue[i - 1]?.drawX;
                    prevY = this.drawMoveQueue[i - 1]?.drawY;
                  }
                  //let threshold = (1 - i / this.drawMoveQueue.length) / 2;
                  const speed = (i + 1) / (this.drawMoveQueue.length * 20);
                  if (Math.abs(this.drawMoveQueue[i].drawX) > 0) {
                    this.drawMoveQueue[i].drawX *=
                      0.99 -
                      Math.abs(Math.sin(this.drawMoveQueue[i].drawX * Math.PI)) / 10 -
                      speed ** delta;
                  } else if (Math.abs(this.drawMoveQueue[i].drawX) < 0.01) {
                    this.drawMoveQueue[i].drawX = 0;
                  }
                  if (Math.abs(this.drawMoveQueue[i].drawY) > 0) {
                    this.drawMoveQueue[i].drawY *=
                      0.99 -
                      Math.abs(Math.sin(this.drawMoveQueue[i].drawX * Math.PI)) / 10 -
                      speed ** delta;
                  } else if (Math.abs(this.drawMoveQueue[i].drawY) < 0.01) {
                    this.drawMoveQueue[i].drawY = 0;
                  }
          
                  this.drawMoveQueue[i].drawX = Math.min(
                    Math.max(this.drawMoveQueue[i].drawX, -1),
                    1,
                  );
                  this.drawMoveQueue[i].drawY = Math.min(
                    Math.max(this.drawMoveQueue[i].drawY, -1),
                    1,
                  );
                }
          
                let sumX = 0;
                let sumY = 0;
                this.drawMoveQueue.forEach((move) => {
                  sumX += move.drawX;
                  sumY += move.drawY;
                });
                
                this.drawX = sumX;
                this.drawY = sumY;
                if (
                  Math.abs(this.drawMoveQueue[0].drawX) < 0.01 &&
                  Math.abs(this.drawMoveQueue[0].drawY) < 0.01
                )
                  this.drawMoveQueue.shift();
                  
                  */
                _this.drawX *= Math.pow(0.85, delta);
                _this.drawY *= Math.pow(0.85, delta);
                _this.drawX = Math.abs(_this.drawX) < 0.01 ? 0 : _this.drawX;
                _this.drawY = Math.abs(_this.drawY) < 0.01 ? 0 : _this.drawY;
            }
            if (_this.doneHitting()) {
                _this.jump(delta);
            }
            if (!_this.doneHitting()) {
                _this.updateHitXY(delta);
            }
            _this.enableSlowMotion();
            gameConstants_1.GameConstants.ANIMATION_SPEED = _this.motionSpeed;
        };
        _this.updateHitXY = function (delta) {
            var hitX = _this.hitX - _this.hitX * 0.3;
            var hitY = _this.hitY - _this.hitY * 0.3;
            _this.hitX = Math.min(Math.max(hitX, -1), 1);
            _this.hitY = Math.min(Math.max(hitY, -1), 1);
            if (Math.abs(hitX) < 0.01)
                _this.hitX = 0;
            if (Math.abs(hitY) < 0.01)
                _this.hitY = 0;
        };
        _this.hitShake = function (playerX, playerY, otherX, otherY) {
            var range = gameConstants_1.GameConstants.TILESIZE;
            _this.hitX = Math.min(Math.max(0.5 * (playerX - otherX), -range), range);
            _this.hitY = Math.min(Math.max(0.5 * (playerY - otherY), -range), range);
        };
        _this.shakeScreen = function (playerX, playerY, otherX, otherY, shakeStrength) {
            if (shakeStrength === void 0) { shakeStrength = 10; }
            var range = gameConstants_1.GameConstants.TILESIZE;
            _this.hitX = Math.min(Math.max(0.5 * (playerX - otherX), -range), range);
            _this.hitY = Math.min(Math.max(0.5 * (playerY - otherY), -range), range);
            _this.game.shakeScreen(-_this.hitX * 3 * shakeStrength, -_this.hitY * 3 * shakeStrength);
        };
        _this.jump = function (delta) {
            var j = Math.max(Math.abs(_this.drawX), Math.abs(_this.drawY));
            _this.jumpY = Math.abs(Math.sin(j * Math.PI) * _this.jumpHeight);
            if (Math.abs(_this.jumpY) < 0.01)
                _this.jumpY = 0;
            if (_this.jumpY > _this.jumpHeight)
                _this.jumpY = _this.jumpHeight;
        };
        /**
         * Draws the inventory button to the canvas.
         * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
         * to ensure canvas state is preserved.
         */
        _this.drawInventoryButton = function (delta) {
            game_1.Game.ctx.save(); // Save the current canvas state
            game_1.Game.drawFX(0, 0, 2, 2, levelConstants_1.LevelConstants.SCREEN_W - 2, 0, 2, 2);
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        /**
         * Draws the tile cursor to the canvas.
         * Added `ctx.save()` at the beginning and `ctx.restore()` at the end
         * to ensure canvas state is preserved.
         */
        _this.drawTileCursor = function (delta) {
            game_1.Game.ctx.save(); // Save the current canvas state
            var inRange = _this.moveRangeCheck(_this.mouseToTile().x, _this.mouseToTile().y);
            var tileX = inRange ? 22 : 24;
            game_1.Game.drawFX(tileX + Math.floor(hitWarning_1.HitWarning.frame), 4, 1, 2, _this.tileCursor.x, _this.tileCursor.y - 1, 1, 2);
            game_1.Game.ctx.restore(); // Restore the canvas state
        };
        _this.queueHandler = function () {
            //      console.log("Queue handler running, queue length:", this.moveQueue.length);
            //console.log("Is processing queue:", this.isProcessingQueue);
            if (!_this.isProcessingQueue) {
                return;
            }
            var currentTime = Date.now();
            var timeSinceLastMove = currentTime - _this.lastMoveTime;
            //console.log("Time since last move:", timeSinceLastMove);
            if (currentTime - _this.lastMoveTime >= gameConstants_1.GameConstants.MOVEMENT_COOLDOWN) {
                if (_this.moveQueue.length > 0) {
                    var _a = _this.moveQueue.shift(), x = _a.x, y = _a.y, direction = _a.direction;
                    //console.log("Processing move to:", x, y);
                    _this.handleMoveLoop({ x: x, y: y, direction: direction });
                    _this.lastMoveTime = currentTime;
                }
                else {
                    //console.log("Queue empty, stopping processing");
                    _this.stopQueueProcessing();
                }
            }
            else {
                //console.log(
                //  "Waiting for cooldown, remaining time:",
                //  GameConstants.MOVEMENT_COOLDOWN - timeSinceLastMove
                //);
            }
            _this.animationFrameId = requestAnimationFrame(_this.queueHandler);
            //console.log("Next animation frame requested:", this.animationFrameId);
        };
        _this.startQueueProcessing = function () {
            //console.log("Attempting to start queue processing");
            //console.log(
            //  "Current state - isProcessing:",
            //  this.isProcessingQueue,
            //  "animationFrameId:",
            //  this.animationFrameId
            //);
            if (!_this.isProcessingQueue) {
                //console.log("Starting queue processing");
                _this.isProcessingQueue = true;
                _this.animationFrameId = requestAnimationFrame(_this.queueHandler);
                //console.log("Animation frame requested:", this.animationFrameId);
            }
            else {
                //console.log("Queue processing already running");
            }
        };
        _this.stopQueueProcessing = function () {
            //console.log("Stopping queue processing");
            //console.log(
            //  "Current state - isProcessing:",
            //  this.isProcessingQueue,
            //  "animationFrameId:",
            //  this.animationFrameId
            //);
            _this.isProcessingQueue = false;
            if (_this.animationFrameId !== null) {
                //console.log("Canceling animation frame:", this.animationFrameId);
                cancelAnimationFrame(_this.animationFrameId);
                _this.animationFrameId = null;
            }
        };
        _this.handleMoveLoop = function (_a) {
            var x = _a.x, y = _a.y, direction = _a.direction;
            switch (direction) {
                case game_1.Direction.RIGHT:
                    _this.right();
                    break;
                case game_1.Direction.LEFT:
                    _this.left();
                    break;
                case game_1.Direction.DOWN:
                    _this.down();
                    break;
                case game_1.Direction.UP:
                    _this.up();
                    break;
            }
        };
        _this.queueMove = function (x, y, direction) {
            if (!x || !y || _this.moveQueue.length > 0)
                return;
            //console.log("Queueing move to:", x, y);
            //console.log("Current queue length:", this.moveQueue.length);
            var move = { x: x, y: y, direction: direction };
            _this.moveQueue.push(move);
            _this.startQueueProcessing();
            //console.log("Queue length after push:", this.moveQueue.length);
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
        _this.jumpHeight = 0.3;
        _this.frame = 0;
        _this.moveDistance = 0;
        _this.direction = game_1.Direction.UP;
        _this.lastX = 0;
        _this.lastY = 0;
        _this.isLocalPlayer = isLocalPlayer;
        if (isLocalPlayer) {
            input_1.Input.leftSwipeListener = function () {
                if (!_this.inventory.isPointInQuickbarBounds(input_1.Input.mouseX, input_1.Input.mouseY)
                    .inBounds &&
                    !_this.inventory.isOpen)
                    _this.inputHandler(input_1.InputEnum.LEFT);
            };
            input_1.Input.rightSwipeListener = function () {
                if (!_this.inventory.isPointInQuickbarBounds(input_1.Input.mouseX, input_1.Input.mouseY)
                    .inBounds &&
                    !_this.inventory.isOpen)
                    _this.inputHandler(input_1.InputEnum.RIGHT);
            };
            input_1.Input.upSwipeListener = function () {
                if (!_this.inventory.isPointInQuickbarBounds(input_1.Input.mouseX, input_1.Input.mouseY)
                    .inBounds &&
                    !_this.inventory.isOpen)
                    _this.inputHandler(input_1.InputEnum.UP);
            };
            input_1.Input.downSwipeListener = function () {
                if (!_this.inventory.isPointInQuickbarBounds(input_1.Input.mouseX, input_1.Input.mouseY)
                    .inBounds &&
                    !_this.inventory.isOpen)
                    _this.inputHandler(input_1.InputEnum.DOWN);
            };
            input_1.Input.commaListener = function () { return _this.inputHandler(input_1.InputEnum.COMMA); };
            input_1.Input.periodListener = function () { return _this.inputHandler(input_1.InputEnum.PERIOD); };
            input_1.Input.tapListener = function () {
                if (_this.inventory.isOpen) {
                    if (_this.inventory.pointInside(input_1.Input.mouseX, input_1.Input.mouseY)) {
                        _this.inputHandler(input_1.InputEnum.SPACE);
                    }
                }
                else {
                    if (_this.inventory.isPointInQuickbarBounds(input_1.Input.mouseX, input_1.Input.mouseY)
                        .inBounds) {
                        if (_this.inventory.pointInside(input_1.Input.mouseX, input_1.Input.mouseY)) {
                            _this.inputHandler(input_1.InputEnum.SPACE);
                        }
                    }
                }
            };
            input_1.Input.mouseMoveListener = function () { return _this.inputHandler(input_1.InputEnum.MOUSE_MOVE); };
            input_1.Input.mouseLeftClickListeners.push(function () {
                return _this.inputHandler(input_1.InputEnum.LEFT_CLICK);
            });
            input_1.Input.mouseRightClickListeners.push(function () {
                return _this.inputHandler(input_1.InputEnum.RIGHT_CLICK);
            });
            input_1.Input.numKeyListener = function (num) {
                return _this.inputHandler(input_1.InputEnum.NUMBER_1 + num - 1);
            };
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
        _this.hurting = false;
        _this.hurtAlpha = 0.5;
        _this.lightBrightness = 0.3;
        _this.sineAngle = Math.PI / 2;
        _this.drawMoveSpeed = 0.3; // greater than 1 less than 2
        _this.moveQueue = [];
        _this.isProcessingQueue = false;
        _this.hitX = 0;
        _this.hitY = 0;
        _this.motionSpeed = 1;
        _this.slowMotionEnabled = false;
        _this.slowMotionTickDuration = 0;
        _this.justMoved = DrawDirection.Y;
        return _this;
    }
    Object.defineProperty(Player.prototype, "angle", {
        get: function () {
            if (this.direction !== undefined) {
                switch (this.direction) {
                    case game_1.Direction.UP:
                        return 270;
                    case game_1.Direction.RIGHT:
                        return 0;
                    case game_1.Direction.DOWN:
                        return 90;
                    case game_1.Direction.LEFT:
                        return 180;
                }
            }
            else {
                return 0;
            }
        },
        enumerable: false,
        configurable: true
    });
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
var lighting_1 = __webpack_require__(/*! ../lighting */ "./src/lighting.ts");
var utils_1 = __webpack_require__(/*! ../utils */ "./src/utils.ts");
var PlayerFireball = /** @class */ (function (_super) {
    __extends(PlayerFireball, _super);
    function PlayerFireball(parent, x, y) {
        var _this = _super.call(this, parent, x, y) || this;
        _this.drawTopLayer = function (delta) {
            if (_this.dead)
                return;
            if (_this.offsetFrame < 0)
                _this.offsetFrame += 10 * delta;
            if (_this.offsetFrame >= 0) {
                _this.frame += 0.25 * delta;
            }
            if (_this.frame > 17)
                _this.dead = true;
            game_1.Game.drawFX(Math.floor(_this.frame), 6, 1, 2, _this.x, _this.y - 1, 1, 2);
        };
        _this.state = 0;
        _this.frame = 6;
        _this.offsetFrame =
            -utils_1.Utils.distance(_this.parent.x, _this.parent.y, _this.x, _this.y) * 50;
        _this.delay = 0;
        lighting_1.Lighting.momentaryLight(_this.parent.game.rooms[_this.parent.levelID], _this.x + 0.5, _this.y + 0.5, 0.5, [255, 100, 0], 250, 10, 1);
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
var lighting_1 = __webpack_require__(/*! ../lighting */ "./src/lighting.ts");
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
                var lightSource = _this.parent.room.lightSources.find(function (ls) { return ls === _this.lightSource; });
                lightSource.b = 0.4;
                _this.parent.room.hitwarnings.push(new hitWarning_1.HitWarning(_this.parent.game, _this.x, _this.y, _this.parent.x, _this.parent.y, true));
            }
            if (!_this.dead && _this.state === 2) {
                lighting_1.Lighting.momentaryLight(_this.parent.room, _this.x, _this.y, 3, _this.parent.projectileColor, 500, 5, 350);
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
                    game_1.Game.drawFX(22 + Math.floor(_this.frame), _this.tileY, 1, 1, _this.x, _this.y, 1, 1);
                }
                else if (_this.state === 1) {
                    _this.frame += 0.25 * delta;
                    if (_this.frame >= 4)
                        _this.frame = 0;
                    game_1.Game.drawFX(18 + Math.floor(_this.frame), _this.tileY, 1, 1, _this.x, _this.y - 0.2, 1, 1);
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
        _this.tileY = parent.name === "wizard bomber" ? 7 : 8;
        _this.parent = parent;
        _this.frame = 0;
        _this.state = 0; // this.distanceToParent;
        _this.lightSource = new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 4, parent.projectileColor, 0.1);
        _this.parent.addLightSource(_this.lightSource);
        return _this;
        //this.parent.room.updateLighting();
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
        Random.state ^= Random.state << 21;
        Random.state ^= Random.state >>> 35;
        Random.state ^= Random.state << 4;
        return (Random.state >>> 0) / 4294967296;
    };
    return Random;
}());
exports.Random = Random;
// copy and paste into browser console
// let state;
// let rand = () => { state ^= (state << 21); state ^= (state >>> 35); state ^= (state << 4); return (state >>> 0) / 4294967296; }


/***/ }),

/***/ "./src/reverb.ts":
/*!***********************!*\
  !*** ./src/reverb.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReverbEngine = void 0;
var ReverbEngine = /** @class */ (function () {
    function ReverbEngine() {
    }
    // Initialize the AudioContext and ConvolverNode
    ReverbEngine.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!ReverbEngine.audioContext) return [3 /*break*/, 2];
                        ReverbEngine.audioContext = new (window.AudioContext ||
                            window.webkitAudioContext)();
                        ReverbEngine.convolver = ReverbEngine.audioContext.createConvolver();
                        ReverbEngine.convolver.connect(ReverbEngine.audioContext.destination);
                        return [4 /*yield*/, ReverbEngine.loadReverbBuffer("res/SFX/impulses/small.mp3")];
                    case 1:
                        _a.sent();
                        ReverbEngine.setDefaultReverb();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // Load a specified impulse response
    ReverbEngine.loadReverbBuffer = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var response, arrayBuffer, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fetch(filePath)];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) {
                            throw new Error("HTTP error! status: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.arrayBuffer()];
                    case 2:
                        arrayBuffer = _b.sent();
                        _a = ReverbEngine;
                        return [4 /*yield*/, ReverbEngine.audioContext.decodeAudioData(arrayBuffer)];
                    case 3:
                        _a.reverbBuffer =
                            _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // Set the default reverb buffer
    ReverbEngine.setDefaultReverb = function () {
        if (ReverbEngine.reverbBuffer) {
            ReverbEngine.convolver.buffer = ReverbEngine.reverbBuffer;
        }
    };
    /**
     * Set the reverb characteristics by specifying an impulse response file.
     * @param filePath - The path to the impulse response file.
     */
    ReverbEngine.setReverbImpulse = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, ReverbEngine.loadReverbBuffer(filePath)];
                    case 1:
                        _a.sent();
                        if (ReverbEngine.reverbBuffer) {
                            ReverbEngine.convolver.buffer = ReverbEngine.reverbBuffer;
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Apply reverb to a given HTMLAudioElement
    ReverbEngine.applyReverb = function (audioElement) {
        try {
            if (ReverbEngine.mediaSources.has(audioElement)) {
                return;
            }
            var track = ReverbEngine.audioContext.createMediaElementSource(audioElement);
            track.connect(ReverbEngine.convolver);
            ReverbEngine.mediaSources.set(audioElement, track);
        }
        catch (error) { }
    };
    // Remove reverb from a given HTMLAudioElement
    ReverbEngine.removeReverb = function (audioElement) {
        var track = ReverbEngine.mediaSources.get(audioElement);
        if (track) {
            track.disconnect();
            ReverbEngine.mediaSources.delete(audioElement);
        }
    };
    ReverbEngine.reverbBuffer = null;
    ReverbEngine.mediaSources = new WeakMap();
    return ReverbEngine;
}());
exports.ReverbEngine = ReverbEngine;


/***/ }),

/***/ "./src/room.ts":
/*!*********************!*\
  !*** ./src/room.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Room = exports.WallDirection = exports.TurnState = exports.RoomType = exports.EnemyTypeMap = exports.EnemyType = void 0;
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
//import { ActionState, ActionTab } from "./actionTab";
var tombStone_1 = __webpack_require__(/*! ./entity/object/tombStone */ "./src/entity/object/tombStone.ts");
var pumpkin_1 = __webpack_require__(/*! ./entity/object/pumpkin */ "./src/entity/object/pumpkin.ts");
var queenEnemy_1 = __webpack_require__(/*! ./entity/enemy/queenEnemy */ "./src/entity/enemy/queenEnemy.ts");
var frogEnemy_1 = __webpack_require__(/*! ./entity/enemy/frogEnemy */ "./src/entity/enemy/frogEnemy.ts");
var bigKnightEnemy_1 = __webpack_require__(/*! ./entity/enemy/bigKnightEnemy */ "./src/entity/enemy/bigKnightEnemy.ts");
var enemy_1 = __webpack_require__(/*! ./entity/enemy/enemy */ "./src/entity/enemy/enemy.ts");
var fireWizard_1 = __webpack_require__(/*! ./entity/enemy/fireWizard */ "./src/entity/enemy/fireWizard.ts");
var energyWizard_1 = __webpack_require__(/*! ./entity/enemy/energyWizard */ "./src/entity/enemy/energyWizard.ts");
var reverb_1 = __webpack_require__(/*! ./reverb */ "./src/reverb.ts");
var astarclass_1 = __webpack_require__(/*! ./astarclass */ "./src/astarclass.ts");
var warhammer_1 = __webpack_require__(/*! ./weapon/warhammer */ "./src/weapon/warhammer.ts");
var spellbook_1 = __webpack_require__(/*! ./weapon/spellbook */ "./src/weapon/spellbook.ts");
var torch_1 = __webpack_require__(/*! ./item/torch */ "./src/item/torch.ts");
var rookEnemy_1 = __webpack_require__(/*! ./entity/enemy/rookEnemy */ "./src/entity/enemy/rookEnemy.ts");
var beamEffect_1 = __webpack_require__(/*! ./beamEffect */ "./src/beamEffect.ts");
/**
 * Enumeration of available enemy types.
 */
var EnemyType;
(function (EnemyType) {
    EnemyType["crab"] = "crab";
    EnemyType["frog"] = "frog";
    EnemyType["zombie"] = "zombie";
    EnemyType["skull"] = "skull";
    EnemyType["energyWizard"] = "energywizard";
    EnemyType["charge"] = "charge";
    EnemyType["rook"] = "rook";
    EnemyType["bishop"] = "bishop";
    EnemyType["armoredzombie"] = "armoredzombie";
    EnemyType["bigskull"] = "bigskull";
    EnemyType["queen"] = "queen";
    EnemyType["knight"] = "knight";
    EnemyType["bigknight"] = "bigknight";
    EnemyType["firewizard"] = "firewizard";
    // Add other enemy types here
})(EnemyType = exports.EnemyType || (exports.EnemyType = {}));
/**
 * Mapping of enemy types to their corresponding classes.
 */
exports.EnemyTypeMap = (_a = {},
    _a[EnemyType.crab] = crabEnemy_1.CrabEnemy,
    _a[EnemyType.frog] = frogEnemy_1.FrogEnemy,
    _a[EnemyType.zombie] = zombieEnemy_1.ZombieEnemy,
    _a[EnemyType.skull] = skullEnemy_1.SkullEnemy,
    _a[EnemyType.energyWizard] = energyWizard_1.EnergyWizardEnemy,
    _a[EnemyType.charge] = chargeEnemy_1.ChargeEnemy,
    _a[EnemyType.rook] = rookEnemy_1.RookEnemy,
    _a[EnemyType.bishop] = bishopEnemy_1.BishopEnemy,
    _a[EnemyType.armoredzombie] = armoredzombieEnemy_1.ArmoredzombieEnemy,
    _a[EnemyType.bigskull] = bigSkullEnemy_1.BigSkullEnemy,
    _a[EnemyType.queen] = queenEnemy_1.QueenEnemy,
    _a[EnemyType.knight] = knightEnemy_1.KnightEnemy,
    _a[EnemyType.bigknight] = bigKnightEnemy_1.BigKnightEnemy,
    _a[EnemyType.firewizard] = fireWizard_1.FireWizardEnemy,
    _a);
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
var WallDirection;
(function (WallDirection) {
    WallDirection["NORTH"] = "North";
    WallDirection["EAST"] = "East";
    WallDirection["SOUTH"] = "South";
    WallDirection["WEST"] = "West";
    WallDirection["TOPLEFT"] = "TopLeft";
    WallDirection["TOPRIGHT"] = "TopRight";
    WallDirection["BOTTOMLEFT"] = "BottomLeft";
    WallDirection["BOTTOMRIGHT"] = "BottomRight";
})(WallDirection = exports.WallDirection || (exports.WallDirection = {}));
var Room = /** @class */ (function () {
    function Room(game, x, y, w, h, type, depth, mapGroup, level, rand, onMainPath, pathIndex) {
        if (rand === void 0) { rand = random_1.Random.rand; }
        if (onMainPath === void 0) { onMainPath = false; }
        if (pathIndex === void 0) { pathIndex = 0; }
        var _this = this;
        this.name = "";
        this.shadeColor = "black";
        //actionTab: ActionTab;
        this.wallInfo = new Map();
        this.onMainPath = false;
        this.pathIndex = 0;
        // Add a list to keep track of BeamEffect instances
        this.beamEffects = [];
        this.tileInside = function (tileX, tileY) {
            return _this.pointInside(tileX, tileY, _this.roomX, _this.roomY, _this.width, _this.height);
        };
        this.removeWall = function (x, y) {
            if (_this.roomArray[x][y] instanceof wall_1.Wall) {
                _this.roomArray[x][y] = null;
            }
            //this.innerWalls = this.innerWalls.filter((w) => w.x !== x && w.y !== y);
            //this.outerWalls = this.outerWalls.filter((w) => w.x !== x && w.y !== y);
        };
        this.getWallType = function (pointX, pointY, rectX, rectY, width, height) {
            var directions = [];
            if (pointY === rectY && pointX >= rectX && pointX <= rectX + width)
                directions.push(WallDirection.NORTH);
            if (pointY === rectY + height && pointX >= rectX && pointX <= rectX + width)
                directions.push(WallDirection.SOUTH);
            if (pointX === rectX && pointY >= rectY && pointY <= rectY + height)
                directions.push(WallDirection.WEST);
            if (pointX === rectX + width && pointY >= rectY && pointY <= rectY + height)
                directions.push(WallDirection.EAST);
            return directions;
        };
        //used for spawn commands, implement elsewhere later
        /**
         * Adds a new enemy to the room based on the provided enemy type string.
         *
         * @param enemyType - The string identifier for the enemy type.
         */
        this.addNewEnemy = function (enemyType) {
            var EnemyClass = exports.EnemyTypeMap[enemyType];
            if (!EnemyClass) {
                console.error("Enemy type \"".concat(enemyType, "\" is not recognized."));
                return;
            }
            var tiles = _this.getEmptyTiles();
            if (!tiles || tiles.length === 0) {
                console.log("No tiles left to spawn enemies.");
                return;
            }
            var _a = _this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            EnemyClass.add(_this, _this.game, x, y);
        };
        this.populateEmpty = function (rand) {
            _this.addRandomTorches("medium");
        };
        this.populateDungeon = function (rand) {
            //this.addChests(10, rand);
            var factor = game_1.Game.rand(1, 36, rand);
            if (factor < 30)
                _this.addWallBlocks(rand);
            if (factor % 4 === 0)
                _this.addChasms(rand);
            _this.addRandomTorches("medium");
            if (factor > 15)
                _this.addSpikeTraps(game_1.Game.randTable([0, 0, 0, 1, 1, 2, 3], rand), rand);
            var numEmptyTiles = _this.getEmptyTiles().length;
            var numTotalObstacles = Math.floor(numEmptyTiles * 0.35 * rand());
            var numPlants = Math.ceil(numTotalObstacles * rand());
            var numObstacles = numTotalObstacles - numPlants;
            _this.addPlants(numPlants, rand);
            _this.addObstacles(numObstacles, rand);
            var numEnemies = Math.ceil((numEmptyTiles - numTotalObstacles) *
                Math.min(_this.depth * 0.1 + 0.1, 0.35));
            _this.addEnemies(numEnemies, rand);
            if (factor <= 6)
                _this.addVendingMachine(rand);
            var obstacles = _this.checkDoorObstructions();
            if (obstacles.length > 0) {
                var _loop_1 = function (obstacle) {
                    console.log("Removing obstacle at (".concat(obstacle.x, ",").concat(obstacle.y, ")"));
                    _this.entities = _this.entities.filter(function (e) { return e !== obstacle; });
                    obstacle = null;
                };
                for (var _i = 0, obstacles_1 = obstacles; _i < obstacles_1.length; _i++) {
                    var obstacle = obstacles_1[_i];
                    _loop_1(obstacle);
                }
            }
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
            spawner_1.Spawner.add(_this, _this.game, Math.floor(_this.roomX + _this.width / 2), Math.floor(_this.roomY + _this.height / 2));
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
            vendingMachine_1.VendingMachine.add(_this, _this.game, x - 2, y - 1, new shotgun_1.Shotgun(_this, 0, 0));
            vendingMachine_1.VendingMachine.add(_this, _this.game, x + 2, y - 1, new heart_1.Heart(_this, 0, 0));
            vendingMachine_1.VendingMachine.add(_this, _this.game, x - 2, y + 2, new armor_1.Armor(_this, 0, 0));
            vendingMachine_1.VendingMachine.add(_this, _this.game, x + 2, y + 2, new spear_1.Spear(_this, 0, 0));
            var obstacles = _this.checkDoorObstructions();
            if (obstacles.length > 0) {
            }
            var _loop_2 = function (obstacle) {
                _this.entities = _this.entities.filter(function (e) { return e !== obstacle; });
                obstacle = null;
            };
            for (var _i = 0, obstacles_2 = obstacles; _i < obstacles_2.length; _i++) {
                var obstacle = obstacles_2[_i];
                _loop_2(obstacle);
            }
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
                d = new door_1.Door(_this, _this.game, x, y, game_1.Direction.RIGHT, t);
                _this.roomArray[x + 1][y] = new spawnfloor_1.SpawnFloor(_this, x + 1, y);
            }
            else if (x === _this.roomX + _this.width - 1) {
                d = new door_1.Door(_this, _this.game, x, y, game_1.Direction.LEFT, t);
                _this.roomArray[x - 1][y] = new spawnfloor_1.SpawnFloor(_this, x - 1, y);
            }
            else if (y === _this.roomY) {
                d = new door_1.Door(_this, _this.game, x, y, game_1.Direction.UP, t);
                _this.roomArray[x][y + 1] = new spawnfloor_1.SpawnFloor(_this, x, y + 1);
            }
            else if (y === _this.roomY + _this.height - 1) {
                d = new door_1.Door(_this, _this.game, x, y, game_1.Direction.DOWN, t);
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
            _this.setReverb();
        };
        this.enterLevelThroughDoor = function (player, door, side) {
            if (door instanceof door_1.Door && door.doorDir === game_1.Direction.UP) {
                //if top door
                door.opened = true;
                player.moveNoSmooth(door.x, door.y + 1);
            }
            else if (door instanceof door_1.Door && door.doorDir === game_1.Direction.DOWN) {
                //if bottom door
                player.moveNoSmooth(door.x, door.y - 1);
            }
            else if (door instanceof door_1.Door &&
                [game_1.Direction.RIGHT, game_1.Direction.LEFT].includes(door.doorDir)) {
                // if side door
                player.moveNoSmooth(door.x + side, door.y);
            }
            _this.clearDeadStuff();
            _this.calculateWallInfo();
            _this.updateLighting();
            _this.entered = true;
            _this.particles = [];
            _this.alertEnemiesOnEntry();
            _this.message = _this.name;
            player.map.saveMapData();
            _this.setReverb();
        };
        this.enterLevelThroughLadder = function (player, ladder) {
            player.moveSnap(ladder.x, ladder.y + 1);
            _this.clearDeadStuff();
            _this.calculateWallInfo();
            _this.updateLighting();
            _this.entered = true;
            _this.message = _this.name;
            player.map.saveMapData();
            _this.setReverb();
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
            var _loop_3 = function (e) {
                returnVal = returnVal.filter(function (t) { return !e.pointIn(t.x, t.y); });
            };
            for (var _i = 0, _a = _this.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                _loop_3(e);
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
                    var visDiff = _this.softVis[x][y] - _this.vis[x][y];
                    var softVis = _this.softVis[x][y];
                    if (Math.abs(visDiff) > 0.01) {
                        visDiff *= Math.pow(0.05, delta);
                    }
                    if (Math.abs(visDiff) > 0.0001) {
                        softVis -= visDiff;
                    }
                    if (softVis < 0)
                        softVis = 0;
                    if (softVis > 1)
                        softVis = 1;
                    if (Math.abs(visDiff) > 0) {
                        _this.softVis[x][y] = softVis;
                    }
                    // if (this.softVis[x][y] < 0.01) this.softVis[x][y] = 0;
                }
            }
        };
        this.fadeRgb = function (delta) {
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    var _a = _this.softCol[x][y], softR = _a[0], softG = _a[1], softB = _a[2];
                    var _b = _this.col[x][y], targetR = _b[0], targetG = _b[1], targetB = _b[2];
                    // Calculate differences
                    var diffR = softR - targetR;
                    var diffG = softG - targetG;
                    var diffB = softB - targetB;
                    // Apply smoothing similar to fadeLighting
                    if (Math.abs(diffR) > 8) {
                        diffR *= Math.pow(0.05, delta);
                    }
                    if (Math.abs(diffG) > 8) {
                        diffG *= Math.pow(0.05, delta);
                    }
                    if (Math.abs(diffB) > 8) {
                        diffB *= Math.pow(0.05, delta);
                    }
                    // Update soft colors
                    if (Math.abs(diffR) > 1) {
                        _this.softCol[x][y][0] = _this.clamp(Math.round(softR - diffR), 0, 255);
                    }
                    if (Math.abs(diffG) > 1) {
                        _this.softCol[x][y][1] = _this.clamp(Math.round(softG - diffG), 0, 255);
                    }
                    if (Math.abs(diffB) > 1) {
                        _this.softCol[x][y][2] = _this.clamp(Math.round(softB - diffB), 0, 255);
                    }
                }
            }
        };
        this.updateLighting = function () {
            // Start timing the initial setup
            //console.time("updateLighting: Initial Setup");
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
            // End timing the initial setup
            //console.timeEnd("updateLighting: Initial Setup");
            // Start timing the processing of light sources
            //console.time("updateLighting: Process LightSources");
            for (var _i = 0, _a = _this.lightSources; _i < _a.length; _i++) {
                var l = _a[_i];
                if (l.shouldUpdate()) {
                    for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                        _this.castTintAtAngle(i, l.x, l.y, l.r, l.c, l.b); // RGB color in sRGB
                    }
                }
            }
            // End timing the processing of light sources
            //console.timeEnd("updateLighting: Process LightSources");
            // Start timing the processing of player lighting
            //console.time("updateLighting: Process Players");
            var lightingAngleStep = levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP;
            for (var p in _this.game.players) {
                var player = _this.game.players[p];
                if (_this === _this.game.rooms[player.levelID]) {
                    //console.log(`i: ${player.angle}`);
                    for (var i = 0; i < 360; i += lightingAngleStep) {
                        var lightColor = levelConstants_1.LevelConstants.AMBIENT_LIGHT_COLOR;
                        if (player.lightEquipped)
                            lightColor = levelConstants_1.LevelConstants.TORCH_LIGHT_COLOR;
                        _this.castTintAtAngle(i, player.x + 0.5, player.y + 0.5, Math.min(Math.max(player.sightRadius - _this.depth + 2, player_1.Player.minSightRadius), 10), lightColor, // RGB color in sRGB
                        5);
                    }
                }
            }
            // End timing the processing of player lighting
            //console.timeEnd("updateLighting: Process Players");
            // Start timing the blending of colors
            //console.time("updateLighting: Blend Colors Array");
            var roomX = _this.roomX;
            var roomY = _this.roomY;
            var width = _this.width;
            var height = _this.height;
            var renderBuffer = _this.renderBuffer;
            for (var x = roomX; x < roomX + width; x++) {
                for (var y = roomY; y < roomY + height; y++) {
                    _this.col[x][y] = _this.blendColorsArray(renderBuffer[x][y]);
                }
            }
            // End timing the blending of colors
            //console.timeEnd("updateLighting: Blend Colors Array");
            // Start timing the conversion to luminance
            //console.time("updateLighting: Convert to Luminance");
            for (var x = roomX; x < roomX + width; x++) {
                for (var y = roomY; y < roomY + height; y++) {
                    _this.vis[x][y] = _this.rgbToLuminance(_this.col[x][y]);
                }
            }
            // End timing the conversion to luminance
            //console.timeEnd("updateLighting: Convert to Luminance");
        };
        this.updateLightSources = function (lightSource, remove) {
            _this.oldCol = [];
            _this.oldVis = [];
            _this.oldCol = _this.col;
            _this.oldVis = _this.vis;
            if (lightSource) {
                for (var i = 0; i < 360; i += levelConstants_1.LevelConstants.LIGHTING_ANGLE_STEP) {
                    if (!remove) {
                        _this.castTintAtAngle(i, lightSource.x, lightSource.y, lightSource.r, lightSource.c, lightSource.b); // RGB color in sRGB
                    }
                    else {
                        _this.unCastTintAtAngle(i, lightSource.x, lightSource.y, lightSource.r, lightSource.c, lightSource.b);
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
        };
        this.revertLightSources = function () {
            //console.log("reverting lighting");
            _this.oldCol = [];
            _this.oldVis = [];
            _this.col = _this.oldCol;
            _this.vis = _this.oldVis;
        };
        this.castShadowsAtAngle = function (angle, px, py, radius, oldVis) {
            var dx = Math.cos((angle * Math.PI) / 180);
            var dy = Math.sin((angle * Math.PI) / 180);
            var onOpaqueSection = false;
            for (var i = 0; i < radius + 1.5; i++) {
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
         * Casts or uncategorizes a tint from a light source at a specific angle.
         *
         * @param angle - The angle in degrees at which to cast or uncast the tint.
         * @param px - The x-coordinate of the light source.
         * @param py - The y-coordinate of the light source.
         * @param radius - The radius of the light's influence.
         * @param color - The RGB color tuple representing the tint.
         * @param brightness - The brightness of the light source.
         * @param action - 'cast' to add tint, 'unCast' to remove tint.
         */
        this.processTintAtAngle = function (angle, px, py, radius, color, brightness, action) {
            if (action === void 0) { action = "cast"; }
            var dx = Math.cos((angle * Math.PI) / 180);
            var dy = Math.sin((angle * Math.PI) / 180);
            // Convert input color from sRGB to linear RGB
            var linearColor = [
                _this.sRGBToLinear(color[0]),
                _this.sRGBToLinear(color[1]),
                _this.sRGBToLinear(color[2]),
            ];
            var _loop_4 = function (i) {
                var currentX = Math.floor(px + dx * i);
                var currentY = Math.floor(py + dy * i);
                if (!_this.isPositionInRoom(currentX, currentY))
                    return { value: void 0 }; // Outside the room
                var tile = _this.roomArray[currentX][currentY];
                if (tile.isOpaque()) {
                    return { value: void 0 };
                }
                // Handle i=0 separately to ensure correct intensity
                var intensity = void 0;
                if (i === 0) {
                    intensity = brightness * 0.1;
                }
                else {
                    intensity = brightness / Math.pow(Math.E, i);
                }
                if (intensity < 0.005)
                    intensity = 0;
                if (intensity <= 0)
                    return "continue";
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
                if (action === "cast") {
                    _this.renderBuffer[currentX][currentY].push(weightedLinearColor);
                }
                else if (action === "unCast") {
                    _this.renderBuffer[currentX][currentY] = _this.renderBuffer[currentX][currentY].filter(function (colorEntry) {
                        return !(Math.abs(colorEntry[0] - weightedLinearColor[0]) < 0.0001 &&
                            Math.abs(colorEntry[1] - weightedLinearColor[1]) < 0.0001 &&
                            Math.abs(colorEntry[2] - weightedLinearColor[2]) < 0.0001 &&
                            Math.abs(colorEntry[3] - weightedLinearColor[3]) < 0.0001);
                    });
                }
            };
            for (var i = 0; i <= Math.min(levelConstants_1.LevelConstants.LIGHTING_MAX_DISTANCE, radius); i++) {
                var state_1 = _loop_4(i);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        };
        /**
         * Casts a tint from a light source at a specific angle.
         *
         * @param angle - The angle in degrees at which to cast the tint.
         * @param px - The x-coordinate of the light source.
         * @param py - The y-coordinate of the light source.
         * @param radius - The radius of the light's influence.
         * @param color - The RGB color tuple representing the tint.
         * @param brightness - The brightness of the light source.
         */
        this.castTintAtAngle = function (angle, px, py, radius, color, brightness) {
            _this.processTintAtAngle(angle, px, py, radius, color, brightness, "cast");
        };
        /**
         * Uncasts a tint from a light source at a specific angle.
         *
         * @param angle - The angle in degrees at which to uncast the tint.
         * @param px - The x-coordinate of the light source.
         * @param py - The y-coordinate of the light source.
         * @param radius - The radius of the light's influence.
         * @param color - The RGB color tuple representing the tint.
         * @param brightness - The brightness of the light source.
         */
        this.unCastTintAtAngle = function (angle, px, py, radius, color, brightness) {
            _this.processTintAtAngle(angle, px, py, radius, color, brightness, "unCast");
        };
        this.sRGBToLinear = function (value) {
            var normalized = value / 255;
            if (normalized <= 0.04045) {
                return normalized / 12.92;
            }
            else {
                return Math.pow((normalized + 0.055) / 1.055, 2.2);
            }
        };
        this.linearToSRGB = function (value) {
            if (value <= 0.0031308) {
                return Math.round(12.92 * value * 255);
            }
            else {
                return Math.round((1.055 * Math.pow(value, 1 / 2.2 /*gamma*/) - 0.055) * 255);
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
            var scalingFactor = 0.45 * 2.5; // Adjust as needed
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
        this.tickHitWarnings = function () {
            for (var _i = 0, _a = _this.hitwarnings; _i < _a.length; _i++) {
                var h = _a[_i];
                if (h.parent && (h.parent.dead || h.parent.unconscious)) {
                    h.tick();
                }
            }
        };
        this.tick = function (player) {
            player.updateSlowMotion();
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
            // Update Beam Effects lighting
            //console.log("updating lighting");
            _this.updateLighting();
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
            //console.log(this.entities.filter((e) => e instanceof Enemy).length);
            _this.turn = TurnState.playerTurn;
        };
        this.checkForNoEnemies = function () {
            var enemies = _this.entities.filter(function (e) { return e instanceof enemy_1.Enemy; });
            if (enemies.length === 0 && _this.lastEnemyCount > 0) {
                // if (this.doors[0].type === DoorType.GUARDEDDOOR) {
                _this.doors.forEach(function (d) {
                    if (d.type === door_1.DoorType.GUARDEDDOOR) {
                        d.unGuard();
                        _this.game.pushMessage("The foes have been slain and the door allows you passage.");
                    }
                });
            }
        };
        this.draw = function (delta) {
            hitWarning_1.HitWarning.updateFrame(delta);
            _this.fadeRgb(delta);
            _this.fadeLighting(delta);
        };
        this.drawColorLayer = function () {
            game_1.Game.ctx.save();
            game_1.Game.ctx.globalCompositeOperation = "soft-light";
            game_1.Game.ctx.globalAlpha = 0.75;
            for (var x = _this.roomX; x < _this.roomX + _this.width; x++) {
                for (var y = _this.roomY; y < _this.roomY + _this.height; y++) {
                    var _a = _this.softCol[x][y], r = _a[0], g = _a[1], b = _a[2];
                    if (r === 0 && g === 0 && b === 0)
                        continue; // Skip if no color
                    game_1.Game.ctx.fillStyle = "rgba(".concat(r, ", ").concat(g, ", ").concat(b, ", ").concat(1 - _this.vis[x][y], ")");
                    game_1.Game.ctx.fillRect(x * gameConstants_1.GameConstants.TILESIZE, y * gameConstants_1.GameConstants.TILESIZE, gameConstants_1.GameConstants.TILESIZE, gameConstants_1.GameConstants.TILESIZE);
                }
            }
            game_1.Game.ctx.restore();
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
        this.checkDoorObstructions = function () {
            var obstacles = [];
            for (var _i = 0, _a = _this.doors; _i < _a.length; _i++) {
                var door = _a[_i];
                for (var _b = 0, _c = _this.doors; _b < _c.length; _b++) {
                    var otherDoor = _c[_b];
                    if (door === otherDoor || door === null || otherDoor === null)
                        break;
                    var pathObstacles = _this.findPath(door, otherDoor);
                    if (pathObstacles.length > 0) {
                    }
                    obstacles.push.apply(obstacles, pathObstacles);
                }
            }
            return obstacles;
        };
        this.findPath = function (startTile, targetTile) {
            var disablePositions = Array();
            var obstacleCandidates = [];
            for (var _i = 0, _a = _this.entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e instanceof vendingMachine_1.VendingMachine || e instanceof rockResource_1.Rock) {
                    disablePositions.push({ x: e.x, y: e.y });
                    obstacleCandidates.push(e);
                }
            }
            /*
            for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
              for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
                if (
                  this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                  (this.room.roomArray[xx][yy] as SpikeTrap).on
                ) {
                  // Don't walk on active spike traps
                  disablePositions.push({ x: xx, y: yy } as astar.Position);
                }
              }
            }
              */
            // Create a grid of the room
            var grid = [];
            for (var x = 0; x < _this.roomX + _this.width; x++) {
                grid[x] = [];
                for (var y = 0; y < _this.roomY + _this.height; y++) {
                    if (_this.roomArray[x] && _this.roomArray[x][y])
                        grid[x][y] = _this.roomArray[x][y];
                    else
                        grid[x][y] = false;
                }
            }
            // Find a path to the target player
            var moves = astarclass_1.astar.AStar.search(grid, startTile, targetTile, disablePositions, false, false, false);
            if (moves.length === 0) {
                return obstacleCandidates;
            }
            else {
                return [];
            }
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
        this.innerWalls = Array();
        this.level = level;
        this.roomArray = [];
        for (var x_2 = this.roomX - 1; x_2 < this.roomX + this.width + 1; x_2++) {
            this.roomArray[x_2] = [];
            for (var y_2 = this.roomY - 1; y_2 < this.roomY + this.height + 1; y_2++) {
                this.roomArray[x_2][y_2] = null;
            }
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
            for (var y_3 = this.roomY; y_3 < this.roomY + this.height; y_3++) {
                this.vis[x_3][y_3] = 1;
                this.softVis[x_3][y_3] = 1;
                this.col[x_3][y_3] = [0, 0, 0];
                this.softCol[x_3][y_3] = [0, 0, 0];
            }
        }
        this.renderBuffer = [];
        for (var x_4 = this.roomX; x_4 < this.roomX + this.width; x_4++) {
            this.renderBuffer[x_4] = [];
            for (var y_4 = this.roomY; y_4 < this.roomY + this.height; y_4++) {
                this.renderBuffer[x_4][y_4] = [];
            }
        }
        this.skin = tile_1.SkinType.DUNGEON;
        if (this.type === RoomType.ROPECAVE || this.type === RoomType.CAVE)
            this.skin = tile_1.SkinType.CAVE;
        this.buildEmptyRoom();
        this.onMainPath = onMainPath;
        this.pathIndex = pathIndex;
        this.coordinatesWithLightingChanges = [];
    }
    Room.prototype.pointInside = function (x, y, rX, rY, rW, rH) {
        if (x < rX || x >= rX + rW)
            return false;
        if (y < rY || y >= rY + rH)
            return false;
        return true;
    };
    Room.prototype.changeReverb = function (newImpulsePath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, reverb_1.ReverbEngine.setReverbImpulse(newImpulsePath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(Room.prototype, "roomArea", {
        get: function () {
            var area = (this.width - 2) * (this.height - 2);
            var openTiles = [];
            for (var x = this.roomX + 1; x < this.roomX + this.width - 1; x++) {
                for (var y = this.roomY + 1; y < this.roomY + this.height - 1; y++) {
                    if (this.roomArray[x][y] instanceof floor_1.Floor)
                        openTiles.push({ x: x, y: y });
                }
            }
            //console.log(area, openTiles.length);
            return openTiles.length;
        },
        enumerable: false,
        configurable: true
    });
    Room.prototype.setReverb = function () {
        var roomArea = this.roomArea;
        if (roomArea < 10) {
            this.changeReverb("res/SFX/impulses/small.mp3");
        }
        else if (roomArea < 55) {
            this.changeReverb("res/SFX/impulses/medium.mp3");
        }
        else {
            this.changeReverb("res/SFX/impulses/large.mp3");
        }
    };
    /**
     * Checks if a room can be placed at the specified position with the given dimensions.
     *
     * @param x - The x-coordinate of the door which the new room will branch from.
     * @param y - The y-coordinate of the door which the new room will branch from.
     * @param width - The width of the room.
     * @param height - The height of the room.
     * @returns `true` if the room can be placed without overlapping; otherwise, `false`.
     */
    Room.prototype.buildEmptyRoom = function () {
        // fill in wall and floor
        for (var x = this.roomX; x < this.roomX + this.width; x++) {
            for (var y = this.roomY; y < this.roomY + this.height; y++) {
                if (this.pointInside(x, y, this.roomX + 1, this.roomY + 1, this.width - 2, this.height - 2)) {
                    this.roomArray[x][y] = new floor_1.Floor(this, x, y);
                }
                else {
                    this.roomArray[x][y] = new wall_1.Wall(this, x, y, this.getWallType(x, y, this.roomX, this.roomY, this.width, this.height));
                }
            }
        }
    };
    Room.prototype.addWallBlocks = function (rand) {
        var _this = this;
        var numBlocks = game_1.Game.randTable([0, 0, 1, 1, 2, 2, 2, 2, 3], rand);
        if (this.width > 8 && rand() > 0.5)
            numBlocks *= 4;
        var _loop_5 = function (i) {
            var blockW = Math.min(game_1.Game.randTable([2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 5], rand), this_1.width - 4);
            var blockH = Math.min(blockW + game_1.Game.rand(-2, 2, rand), this_1.height - 4);
            var x = game_1.Game.rand(this_1.roomX + 2, this_1.roomX + this_1.width - blockW - 2, rand);
            var y = game_1.Game.rand(this_1.roomY + 2, this_1.roomY + this_1.height - blockH - 2, rand);
            var neighborCount = function (wall) {
                var _a;
                var count = 0;
                for (var xx = wall.x - 1; xx <= wall.x + 1; xx++) {
                    for (var yy = wall.y - 1; yy <= wall.y + 1; yy++) {
                        if (((_a = _this.roomArray[xx]) === null || _a === void 0 ? void 0 : _a[yy]) instanceof wall_1.Wall &&
                            !(xx === wall.x && yy === wall.y))
                            count++;
                    }
                }
                return count;
            };
            for (var xx = x; xx < x + blockW; xx++) {
                for (var yy = y; yy < y + blockH; yy++) {
                    var w = new wall_1.Wall(this_1, xx, yy);
                    this_1.roomArray[xx][yy] = w;
                    this_1.innerWalls.push(w);
                }
            }
            this_1.innerWalls.forEach(function (wall) {
                if (neighborCount(wall) <= 1) {
                    _this.removeWall(wall.x, wall.y);
                    _this.roomArray[wall.x][wall.y] = new floor_1.Floor(_this, wall.x, wall.y);
                    _this.innerWalls = _this.innerWalls.filter(function (w) { return w !== wall; });
                }
            });
        };
        var this_1 = this;
        for (var i = 0; i < numBlocks; i++) {
            _loop_5(i);
        }
    };
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
        if (tiles === null)
            return;
        //don't put enemies near the entrances so you don't get screwed instantly
        // Create a Set to store coordinates that should be excluded
        var excludedCoords = new Set();
        // For each door, add coordinates in a 5x5 area around it to excluded set
        for (var _i = 0, _a = this.doors; _i < _a.length; _i++) {
            var door = _a[_i];
            for (var dx = -2; dx <= 2; dx++) {
                for (var dy = -2; dy <= 2; dy++) {
                    excludedCoords.add("".concat(door.x + dx, ",").concat(door.y + dy));
                }
            }
        }
        // Filter tiles that aren't in the excluded set
        tiles = tiles.filter(function (tile) { return !excludedCoords.has("".concat(tile.x, ",").concat(tile.y)); });
        var _loop_6 = function (i) {
            var rerolls = 1;
            if (tiles.length === 0) {
                console.log("No tiles left to spawn enemies");
                return out_i_1 = i, "break";
            }
            var emptyTiles = this_2.getRandomEmptyPosition(tiles);
            if (emptyTiles.x === null || emptyTiles.y === null) {
                i = numEnemies;
                return out_i_1 = i, "break";
            }
            var x = emptyTiles.x, y = emptyTiles.y;
            // Define the enemy tables for each depth level
            var tables = this_2.level.enemyParameters.enemyTables;
            // Define the maximum depth level
            var max_depth_table = this_2.level.enemyParameters.maxDepthTable;
            // Get the current depth level, capped at the maximum
            var d = Math.min(this_2.depth, max_depth_table);
            // If there is a table for the current depth level
            if (tables[d] && tables[d].length > 0) {
                // Function to add an enemy to the room
                var addEnemy = function (enemy) {
                    var _loop_7 = function (xx) {
                        var _loop_9 = function (yy) {
                            if (!tiles.some(function (tt) { return tt.x === x + xx && tt.y === y + yy; })) {
                                // If it does, increment the enemy count and return false
                                numEnemies++;
                                return { value: false };
                            }
                        };
                        for (var yy = 0; yy < enemy.h; yy++) {
                            var state_4 = _loop_9(yy);
                            if (typeof state_4 === "object")
                                return state_4;
                        }
                    };
                    // Check if the enemy overlaps with any other enemies
                    for (var xx = 0; xx < enemy.w; xx++) {
                        var state_3 = _loop_7(xx);
                        if (typeof state_3 === "object")
                            return state_3.value;
                    }
                    // If it doesn't, add the enemy to the room, remove the tiles used from the available pool, and return true
                    _this.entities.push(enemy);
                    var _loop_8 = function (xx) {
                        var _loop_10 = function (yy) {
                            tiles = tiles.filter(function (t) { return !(t.x === x + xx && t.y === y + yy); });
                        };
                        for (var yy = 0; yy < enemy.h; yy++) {
                            _loop_10(yy);
                        }
                    };
                    for (var xx = 0; xx < enemy.w; xx++) {
                        _loop_8(xx);
                    }
                    return true;
                };
                // Randomly select an enemy type from the table
                var type = game_1.Game.randTable(tables[d], Math.random);
                switch (type) {
                    case 1:
                        crabEnemy_1.CrabEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 2:
                        frogEnemy_1.FrogEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 3:
                        zombieEnemy_1.ZombieEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 4:
                        skullEnemy_1.SkullEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 5:
                        energyWizard_1.EnergyWizardEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 6:
                        chargeEnemy_1.ChargeEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 7:
                        rookEnemy_1.RookEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 8:
                        bishopEnemy_1.BishopEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 9:
                        armoredzombieEnemy_1.ArmoredzombieEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 10:
                        if (addEnemy(new bigSkullEnemy_1.BigSkullEnemy(this_2, this_2.game, x, y))) {
                            // clear out some space
                            for (var xx = 0; xx < 2; xx++) {
                                for (var yy = 0; yy < 2; yy++) {
                                    this_2.roomArray[x + xx][y + yy] = new floor_1.Floor(this_2, x + xx, y + yy); // remove any walls
                                }
                            }
                        }
                        break;
                    case 11:
                        queenEnemy_1.QueenEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 12:
                        knightEnemy_1.KnightEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 13:
                        if (addEnemy(new bigKnightEnemy_1.BigKnightEnemy(this_2, this_2.game, x, y))) {
                            // clear out some space
                            for (var xx = 0; xx < 2; xx++) {
                                for (var yy = 0; yy < 2; yy++) {
                                    this_2.roomArray[x + xx][y + yy] = new floor_1.Floor(this_2, x + xx, y + yy); // remove any walls
                                }
                            }
                        }
                        break;
                    case 14:
                        zombieEnemy_1.ZombieEnemy.add(this_2, this_2.game, x, y);
                        break;
                    case 15:
                        fireWizard_1.FireWizardEnemy.add(this_2, this_2.game, x, y);
                        break;
                }
            }
            out_i_1 = i;
        };
        var this_2 = this, out_i_1;
        // Loop through the number of enemies to be added
        for (var i = 0; i < numEnemies; i++) {
            var state_2 = _loop_6(i);
            i = out_i_1;
            if (state_2 === "break")
                break;
        }
        var spawnerAmounts = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3,
        ];
        if (this.depth > 0) {
            var spawnerAmount = game_1.Game.randTable(spawnerAmounts, Math.random);
            console.log("Adding ".concat(spawnerAmount, " spawners"));
            this.addSpawners(spawnerAmount, Math.random);
        }
    };
    Room.prototype.addSpawners = function (numSpawners, rand) {
        var tiles = this.getEmptyTiles();
        if (tiles === null) {
            console.log("No tiles left to spawn spawners");
            return;
        }
        for (var i = 0; i < numSpawners; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            var spawnTable = this.level
                .getEnemyParameters()
                .enemyTables[this.depth].filter(function (t) { return t !== 7; });
            spawner_1.Spawner.add(this, this.game, x, y, spawnTable);
        }
    };
    Room.prototype.addObstacles = function (numObstacles, rand) {
        // add crates/barrels
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numObstacles; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            switch (game_1.Game.randTable([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5, 5, 5], rand)) {
                case 1:
                    crate_1.Crate.add(this, this.game, x, y);
                    break;
                case 2:
                    barrel_1.Barrel.add(this, this.game, x, y);
                    break;
                case 3:
                    tombStone_1.TombStone.add(this, this.game, x, y, 1);
                    break;
                case 4:
                    tombStone_1.TombStone.add(this, this.game, x, y, 0);
                    break;
                case 5:
                    pumpkin_1.Pumpkin.add(this, this.game, x, y);
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
                pottedPlant_1.PottedPlant.add(this, this.game, x, y);
            else if (r <= 0.65)
                pot_1.Pot.add(this, this.game, x, y);
            else if (r <= 0.75)
                rockResource_1.Rock.add(this, this.game, x, y);
            else if (r <= 0.97)
                mushrooms_1.Mushrooms.add(this, this.game, x, y);
            else
                chest_1.Chest.add(this, this.game, x, y);
        }
    };
    Room.prototype.addResources = function (numResources, rand) {
        var tiles = this.getEmptyTiles();
        for (var i = 0; i < numResources; i++) {
            var _a = this.getRandomEmptyPosition(tiles), x = _a.x, y = _a.y;
            var r = rand();
            if (r <= (10 - Math.pow(this.depth, 3)) / 10)
                coalResource_1.CoalResource.add(this, this.game, x, y);
            else if (r <= (10 - Math.pow((this.depth - 2), 3)) / 10)
                goldResource_1.GoldResource.add(this, this.game, x, y);
            else
                emeraldResource_1.EmeraldResource.add(this, this.game, x, y);
        }
    };
    Room.prototype.addVendingMachine = function (rand) {
        var _a = this.getRandomEmptyPosition(this.getEmptyTiles()), x = _a.x, y = _a.y;
        var table = this.depth > 0
            ? [1, 1, 1, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9]
            : [1, 1, 1];
        var type = game_1.Game.randTable(table, rand);
        switch (type) {
            case 1:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new heart_1.Heart(this, x, y));
                break;
            case 2:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new lantern_1.Lantern(this, x, y));
                break;
            case 3:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new armor_1.Armor(this, x, y));
                break;
            case 4:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new dualdagger_1.DualDagger(this, x, y));
                break;
            case 5:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new spear_1.Spear(this, x, y));
                break;
            case 6:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new shotgun_1.Shotgun(this, x, y));
                break;
            case 7:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new warhammer_1.Warhammer(this, x, y));
                break;
            case 8:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new spellbook_1.Spellbook(this, x, y));
                break;
            case 9:
                vendingMachine_1.VendingMachine.add(this, this.game, x, y, new torch_1.Torch(this, x, y));
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
    Room.prototype.pathIsBlockedBy = function (tile, otherTile) {
        var entities = [];
        if (tile.isSolid())
            entities.push(tile);
        if (otherTile.isSolid())
            entities.push(otherTile);
        return entities;
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
    /**
     * Adds a new BeamEffect to the room.
     *
     * @param x1 - Starting tile X coordinate.
     * @param y1 - Starting tile Y coordinate.
     * @param x2 - Ending tile X coordinate.
     * @param y2 - Ending tile Y coordinate.
     */
    Room.prototype.addBeamEffect = function (x1, y1, x2, y2) {
        var beam = new beamEffect_1.BeamEffect(x1, y1, x2, y2);
        this.beamEffects.push(beam);
    };
    return Room;
}());
exports.Room = Room;


/***/ }),

/***/ "./src/sound.ts":
/*!**********************!*\
  !*** ./src/sound.ts ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sound = void 0;
var game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
var reverb_1 = __webpack_require__(/*! ./reverb */ "./src/reverb.ts");
var Sound = /** @class */ (function () {
    function Sound() {
    }
    Sound.playSoundSafely = function (audio) {
        audio.play().catch(function (err) {
            if (err.name === "NotAllowedError") {
                console.warn("Audio playback requires user interaction first");
            }
            else {
                console.error("Error playing sound:", err);
            }
        });
    };
    Sound.playWithReverb = function (audio) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, reverb_1.ReverbEngine.initialize()];
                    case 1:
                        _b.sent();
                        reverb_1.ReverbEngine.applyReverb(audio);
                        this.playSoundSafely(audio);
                        return [2 /*return*/];
                }
            });
        });
    };
    Sound.stopSoundWithReverb = function (audio) {
        reverb_1.ReverbEngine.removeReverb(audio);
        audio.pause();
        audio.currentTime = 0;
    };
    var _a;
    _a = Sound;
    Sound.initialized = false;
    Sound.loadSounds = function () {
        if (Sound.initialized)
            return;
        Sound.initialized = true;
        Sound.playerStoneFootsteps = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.playerStoneFootsteps.push(new Audio("res/SFX/footsteps/stone/footstep" + i + ".mp3"));
        });
        for (var _i = 0, _b = Sound.playerStoneFootsteps; _i < _b.length; _i++) {
            var f = _b[_i];
            f.volume = 1.0;
        }
        Sound.enemyFootsteps = new Array();
        [1, 2, 3, 4, 5].forEach(function (i) {
            return Sound.enemyFootsteps.push(new Audio("res/SFX/footsteps/enemy/enemyfootstep" + i + ".mp3"));
        });
        for (var _c = 0, _d = Sound.enemyFootsteps; _c < _d.length; _c++) {
            var f = _d[_c];
            f.volume = 1.0;
        }
        Sound.swingSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.swingSounds.push(new Audio("res/SFX/attacks/swing" + i + ".mp3"));
        });
        for (var _e = 0, _f = Sound.swingSounds; _e < _f.length; _e++) {
            var f = _f[_e];
            (f.volume = 0.5), f.load;
            //f.play();
        }
        Sound.hitSounds = new Array();
        [1, 2].forEach(function (i) {
            return Sound.hitSounds.push(new Audio("res/SFX/attacks/hurt" + i + ".mp3"));
        });
        for (var _g = 0, _h = Sound.hitSounds; _g < _h.length; _g++) {
            var f = _h[_g];
            (f.volume = 0.5), f.load;
            //f.play();
        }
        Sound.enemySpawnSound = new Audio("res/SFX/attacks/enemyspawn.mp3");
        Sound.enemySpawnSound.volume = 0.7;
        Sound.chestSounds = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.chestSounds.push(new Audio("res/SFX/chest/chest" + i + ".mp3"));
        });
        for (var _j = 0, _k = Sound.chestSounds; _j < _k.length; _j++) {
            var f = _k[_j];
            f.volume = 0.5;
        }
        Sound.coinPickupSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.coinPickupSounds.push(new Audio("res/SFX/items/coins" + i + ".mp3"));
        });
        for (var _l = 0, _m = Sound.coinPickupSounds; _l < _m.length; _l++) {
            var f = _m[_l];
            f.volume = 1.0;
        }
        Sound.miningSounds = new Array();
        [1, 2, 3, 4].forEach(function (i) {
            return Sound.miningSounds.push(new Audio("res/SFX/resources/Pickaxe" + i + ".mp3"));
        });
        for (var _o = 0, _p = Sound.miningSounds; _o < _p.length; _o++) {
            var f = _p[_o];
            f.volume = 0.3;
        }
        Sound.hurtSounds = new Array();
        [1].forEach(function (i) {
            return Sound.hurtSounds.push(new Audio("res/SFX/attacks/hit.mp3"));
        });
        for (var _q = 0, _r = Sound.hurtSounds; _q < _r.length; _q++) {
            var f = _r[_q];
            f.volume = 0.3;
        }
        Sound.genericPickupSound = new Audio("res/SFX/items/pickup.mp3");
        Sound.genericPickupSound.volume = 1.0;
        Sound.breakRockSound = new Audio("res/SFX/resources/rockbreak.mp3");
        Sound.breakRockSound.volume = 1.0;
        Sound.pushSounds = new Array();
        [1, 2].forEach(function (i) {
            return Sound.pushSounds.push(new Audio("res/SFX/pushing/push" + i + ".mp3"));
        });
        for (var _s = 0, _t = Sound.pushSounds; _s < _t.length; _s++) {
            var f = _t[_s];
            f.volume = 1.0;
        }
        Sound.healSound = new Audio("res/SFX/items/powerup1.mp3");
        Sound.healSound.volume = 0.5;
        Sound.music = new Audio("res/bewitched.mp3");
        Sound.graveSound = new Audio("res/SFX/attacks/skelespawn.mp3");
        Sound.ambientSound = new Audio("res/SFX/ambient/ambientDark2.mp3");
        Sound.ambientSound.volume = 1;
        Sound.goreSound = new Audio("res/SFX/misc Unused/gore2.mp3");
        Sound.goreSound.volume = 0.5;
        Sound.unlockSounds = new Array();
        [1].forEach(function (i) {
            return Sound.unlockSounds.push(new Audio("res/SFX/door/unlock" + i + ".mp3"));
        });
        for (var _u = 0, _v = Sound.unlockSounds; _u < _v.length; _u++) {
            var f = _v[_u];
            f.volume = 0.5;
        }
        Sound.doorOpenSounds = new Array();
        [1, 2].forEach(function (i) {
            return Sound.doorOpenSounds.push(new Audio("res/SFX/door/open" + i + ".mp3"));
        });
        for (var _w = 0, _x = Sound.doorOpenSounds; _w < _x.length; _w++) {
            var f = _x[_w];
            f.volume = 0.5;
        }
        Sound.keyPickupSound = new Audio("res/SFX/items/keyPickup.mp3");
        Sound.keyPickupSound.volume = 1.0;
        Sound.potSmashSounds = new Array();
        [1, 2, 3].forEach(function (i) {
            return Sound.potSmashSounds.push(new Audio("res/SFX/objects/potSmash" + i + ".mp3"));
        });
        for (var _y = 0, _z = Sound.potSmashSounds; _y < _z.length; _y++) {
            var f = _z[_y];
            f.volume = 0.5;
        }
        Sound.magicSound = new Audio("res/SFX/attacks/magic2.mp3");
        Sound.magicSound.volume = 0.25;
        Sound.wooshSound = new Audio("res/SFX/attacks/woosh1.mp3");
        Sound.wooshSound.volume = 0.2;
    };
    Sound.playerStoneFootstep = function () { return __awaiter(void 0, void 0, void 0, function () {
        var f;
        return __generator(_a, function (_b) {
            switch (_b.label) {
                case 0:
                    f = game_1.Game.randTable(Sound.playerStoneFootsteps, Math.random);
                    return [4 /*yield*/, this.playWithReverb(f)];
                case 1:
                    _b.sent();
                    f.currentTime = 0;
                    f.play();
                    return [2 /*return*/];
            }
        });
    }); };
    Sound.enemyFootstep = function () {
        var f = game_1.Game.randTable(Sound.enemyFootsteps, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.hit = function () {
        var f = game_1.Game.randTable(Sound.swingSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
        setTimeout(function () {
            var f = game_1.Game.randTable(Sound.hitSounds, Math.random);
            _a.playWithReverb(f);
            f.currentTime = 0;
        }, 100);
    };
    Sound.hurt = function () {
        var f = game_1.Game.randTable(Sound.hurtSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.enemySpawn = function () {
        _a.playWithReverb(Sound.enemySpawnSound);
        Sound.enemySpawnSound.currentTime = 0;
    };
    Sound.chest = function () {
        var f = game_1.Game.randTable(Sound.chestSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.potSmash = function () {
        var f = game_1.Game.randTable(Sound.potSmashSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.pickupCoin = function () {
        var f = game_1.Game.randTable(Sound.coinPickupSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.mine = function () {
        var f = game_1.Game.randTable(Sound.miningSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.breakRock = function () {
        setTimeout(function () {
            _a.playWithReverb(Sound.breakRockSound);
        }, 100);
        Sound.breakRockSound.currentTime = 0;
    };
    Sound.heal = function () {
        _a.playWithReverb(Sound.healSound);
        Sound.healSound.currentTime = 0;
    };
    Sound.genericPickup = function () {
        _a.playWithReverb(Sound.genericPickupSound);
        Sound.genericPickupSound.currentTime = 0;
    };
    Sound.keyPickup = function () {
        _a.playWithReverb(Sound.keyPickupSound);
        Sound.keyPickupSound.currentTime = 0;
    };
    Sound.push = function () {
        var f = game_1.Game.randTable(Sound.pushSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.skeleSpawn = function () {
        _a.playWithReverb(Sound.graveSound);
        Sound.graveSound.currentTime = 0;
        Sound.graveSound.volume = 0.3;
    };
    Sound.unlock = function () {
        var f = game_1.Game.randTable(Sound.unlockSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.playMusic = function () {
        /*
        Sound.music.addEventListener(
          "ended",
          () => {
            Sound.music.currentTime = 0;
            Sound.playSoundSafely(Sound.music);
          },
          false
        );
        Sound.playSoundSafely(Sound.music);
        */
    };
    Sound.doorOpen = function () {
        var f = game_1.Game.randTable(Sound.doorOpenSounds, Math.random);
        _a.playWithReverb(f);
        f.currentTime = 0;
    };
    Sound.playAmbient = function () {
        Sound.ambientSound.addEventListener("ended", function () {
            Sound.ambientSound.currentTime = 0;
            _a.playWithReverb(Sound.ambientSound);
        }, true);
        _a.playWithReverb(Sound.ambientSound);
    };
    Sound.playGore = function () {
        _a.playWithReverb(Sound.goreSound);
        Sound.goreSound.currentTime = 0;
    };
    Sound.playMagic = function () {
        var f = Sound.magicSound;
        var woosh = Sound.wooshSound;
        _a.playWithReverb(f);
        _a.playWithReverb(woosh);
        f.currentTime = 0;
        woosh.currentTime = 0;
    };
    Sound.delayPlay = function (method, delay) {
        setTimeout(method, delay);
    };
    return Sound;
}());
exports.Sound = Sound;


/***/ }),

/***/ "./src/stats.ts":
/*!**********************!*\
  !*** ./src/stats.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.statsTracker = void 0;
var eventBus_1 = __webpack_require__(/*! ./eventBus */ "./src/eventBus.ts");
var events_1 = __webpack_require__(/*! ./events */ "./src/events.ts");
var StatsTracker = /** @class */ (function () {
    function StatsTracker() {
        var _this = this;
        this.stats = {
            enemiesKilled: 0,
            damageDone: 0,
            damageTaken: 0,
            turnsPassed: 0,
            coinsCollected: 0,
            itemsCollected: 0,
            enemies: [],
        };
        this.handleEnemyKilled = function (payload) {
            _this.stats.enemiesKilled += 1;
            _this.stats.enemies.push(payload.enemyId);
            //console.log(`Enemy killed: ${payload.enemyId}`);
        };
        this.handleDamageDone = function (payload) {
            _this.stats.damageDone += payload.amount;
            //console.log(`Damage done: ${payload.amount}`);
        };
        this.handleDamageTaken = function (payload) {
            _this.stats.damageTaken += payload.amount;
            //console.log(`Damage taken: ${payload.amount}`);
        };
        this.handleTurnPassed = function () {
            _this.stats.turnsPassed += 1;
            //console.log(`Turn passed: ${this.stats.turnsPassed}`);
        };
        this.handleCoinCollected = function (payload) {
            _this.stats.coinsCollected += payload.amount;
            //console.log(`Coins collected: ${payload.amount}`);
        };
        this.handleItemCollected = function (payload) {
            _this.stats.itemsCollected += 1;
            //console.log(`Item collected: ${payload.itemId}`);
        };
        this.initializeListeners();
    }
    StatsTracker.prototype.initializeListeners = function () {
        eventBus_1.globalEventBus.on(events_1.EVENTS.ENEMY_KILLED, this.handleEnemyKilled);
        eventBus_1.globalEventBus.on(events_1.EVENTS.DAMAGE_DONE, this.handleDamageDone);
        eventBus_1.globalEventBus.on(events_1.EVENTS.DAMAGE_TAKEN, this.handleDamageTaken);
        eventBus_1.globalEventBus.on(events_1.EVENTS.TURN_PASSED, this.handleTurnPassed);
        eventBus_1.globalEventBus.on(events_1.EVENTS.COIN_COLLECTED, this.handleCoinCollected);
        eventBus_1.globalEventBus.on(events_1.EVENTS.ITEM_COLLECTED, this.handleItemCollected);
    };
    StatsTracker.prototype.getStats = function () {
        return this.stats;
    };
    StatsTracker.prototype.resetStats = function () {
        this.stats = {
            enemiesKilled: 0,
            damageDone: 0,
            damageTaken: 0,
            turnsPassed: 0,
            coinsCollected: 0,
            itemsCollected: 0,
            enemies: [],
        };
        //console.log("Stats have been reset.");
    };
    return StatsTracker;
}());
exports.statsTracker = new StatsTracker();


/***/ }),

/***/ "./src/textbox.ts":
/*!************************!*\
  !*** ./src/textbox.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TextBox = void 0;
var eventBus_1 = __webpack_require__(/*! ./eventBus */ "./src/eventBus.ts");
var TextBox = /** @class */ (function () {
    function TextBox(element) {
        var _this = this;
        this.allowedCharacters = "all";
        this.message = "";
        this.handleKeyPress = function (key) {
            var fontHas = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/ ".split("");
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
                        _this.updateElement();
                        _this.message =
                            _this.message.substring(0, _this.cursor - 1) +
                                key +
                                _this.message.substring(_this.cursor - 1, _this.message.length);
                    }
                }
                //console.log(`Current message: "${this.message}"`);
                return;
            }
            else {
                switch (key) {
                    case "Backspace":
                        if (_this.cursor > 0) {
                            _this.text =
                                _this.text.substring(0, _this.cursor - 1) +
                                    _this.text.substring(_this.cursor, _this.text.length);
                            _this.cursor = Math.max(0, _this.cursor - 1);
                            _this.updateElement();
                            _this.message =
                                _this.message.substring(0, _this.cursor) +
                                    _this.message.substring(_this.cursor + 1, _this.message.length);
                        }
                        break;
                    case "Delete":
                        if (_this.cursor < _this.text.length) {
                            _this.text =
                                _this.text.substring(0, _this.cursor) +
                                    _this.text.substring(_this.cursor + 1, _this.text.length);
                            _this.updateElement();
                            _this.message =
                                _this.message.substring(0, _this.cursor) +
                                    _this.message.substring(_this.cursor + 1, _this.message.length);
                        }
                        break;
                    case "ArrowLeft":
                        _this.cursor = Math.max(0, _this.cursor - 1);
                        _this.updateCursorPosition();
                        break;
                    case "ArrowRight":
                        _this.cursor = Math.min(_this.text.length, _this.cursor + 1);
                        _this.updateCursorPosition();
                        break;
                    case "Enter":
                        _this.sendMessage();
                        _this.escapeCallback();
                        break;
                    case "Escape":
                        _this.escapeCallback();
                        break;
                }
            }
            //console.log(`Current message: "${this.message}"`);
        };
        this.handleTouchStart = function (e) {
            _this.focus();
            e.preventDefault();
        };
        this.text = "";
        this.cursor = 0;
        this.enterCallback = function () { };
        this.escapeCallback = function () { };
        this.element = element;
        this.element.addEventListener("touchstart", this.handleTouchStart);
    }
    TextBox.prototype.setEnterCallback = function (callback) {
        this.enterCallback = callback;
    };
    TextBox.prototype.setEscapeCallback = function (callback) {
        this.escapeCallback = callback;
    };
    TextBox.prototype.clear = function () {
        this.text = "";
        this.cursor = 0;
        this.message = "";
        this.updateElement();
    };
    TextBox.prototype.focus = function () {
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
    TextBox.prototype.sendMessage = function () {
        var message = this.message;
        this.enterCallback();
        //console.log(`Sending message: "${message}"`);
        if (message.startsWith("/")) {
            message = message.substring(1);
            eventBus_1.globalEventBus.emit("ChatMessage", message);
            //console.log(`Chat message emitted: "${message}"`);
        }
        this.clear();
    };
    TextBox.prototype.updateElement = function () {
        this.element.textContent = this.text;
        // Optionally, update cursor position in the UI
    };
    TextBox.prototype.updateCursorPosition = function () {
        // Implement cursor position update in the UI if necessary
    };
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
                if (_this.room.game.players[i].x === _this.x &&
                    _this.room.game.players[i].y === _this.y)
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
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var DoorDir;
(function (DoorDir) {
    DoorDir["North"] = "North";
    DoorDir["East"] = "East";
    DoorDir["South"] = "South";
    DoorDir["West"] = "West";
})(DoorDir = exports.DoorDir || (exports.DoorDir = {}));
var DoorType;
(function (DoorType) {
    DoorType[DoorType["DOOR"] = 0] = "DOOR";
    DoorType[DoorType["LOCKEDDOOR"] = 1] = "LOCKEDDOOR";
    DoorType[DoorType["GUARDEDDOOR"] = 2] = "GUARDEDDOOR";
})(DoorType = exports.DoorType || (exports.DoorType = {}));
var Door = /** @class */ (function (_super) {
    __extends(Door, _super);
    function Door(room, game, x, y, doorDir, doorType) {
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
        };
        _this.removeLockIcon = function () {
            _this.iconTileX = 2;
            _this.iconAlpha = 1;
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
                _this.room.checkForNoEnemies();
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
                    sound_1.Sound.unlock();
                    _this.removeLock();
                    _this.unlocking = true;
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
            if (!_this.opened) {
                sound_1.Sound.doorOpen();
            }
            _this.opened = true;
            _this.linkedDoor.opened = true;
            if (_this.doorDir === game_1.Direction.UP || _this.doorDir === game_1.Direction.DOWN) {
                _this.game.changeLevelThroughDoor(player, _this.linkedDoor);
            }
            else
                _this.game.changeLevelThroughDoor(player, _this.linkedDoor, _this.linkedDoor.room.roomX - _this.room.roomX > 0 ? 1 : -1);
            _this.linkedDoor.removeLock();
            _this.linkedDoor.removeLockIcon();
        };
        _this.draw = function (delta) {
            if (_this.doorDir === game_1.Direction.UP) {
                //if top door
                if (_this.opened)
                    game_1.Game.drawTile(6, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                else
                    game_1.Game.drawTile(3, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            }
            if (_this.doorDir !== game_1.Direction.UP)
                //if not top door
                game_1.Game.drawTile(1, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            //the following used to be in the drawaboveplayer function
            if (_this.doorDir === game_1.Direction.UP) {
                //if top door
                if (!_this.opened)
                    game_1.Game.drawTile(13, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
                else
                    game_1.Game.drawTile(14, 0, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
            }
        };
        _this.drawAbovePlayer = function (delta) { };
        _this.drawAboveShading = function (delta) {
            if (_this.frame > 100)
                _this.frame = 0;
            _this.frame += 1;
            game_1.Game.ctx.globalAlpha = _this.iconAlpha;
            var multiplier = 0.125;
            if (_this.unlocking == true) {
                _this.iconAlpha *= Math.pow(0.92, delta);
                _this.iconYOffset -= 0.035 * delta;
                multiplier = 0;
                if (_this.iconAlpha <= 0.01) {
                    _this.iconYOffset = 0;
                    _this.unlocking = false;
                    _this.iconTileX = 2;
                    _this.iconXOffset = 0;
                    _this.iconAlpha = 1;
                }
            }
            if (_this.doorDir === game_1.Direction.UP) {
                //if top door
                game_1.Game.drawFX(_this.iconTileX, 2, 1, 1, _this.x + _this.iconXOffset, _this.y -
                    1.25 +
                    multiplier * Math.sin((_this.frame * Math.PI) / 50) +
                    _this.iconYOffset, 1, 1);
            }
            else {
                game_1.Game.drawFX(_this.iconTileX, 2, 1, 1, _this.x + _this.iconXOffset, _this.y -
                    1.25 +
                    multiplier * Math.sin((_this.frame * Math.PI) / 50) +
                    _this.iconYOffset, 1, 1); //if not top door
            }
            game_1.Game.ctx.globalAlpha = 1;
        };
        _this.game = game;
        _this.opened = false;
        _this.doorDir = doorDir;
        _this.locked = false;
        _this.isDoor = true;
        _this.type = doorType;
        _this.iconTileX = 2;
        _this.iconXOffset = 0;
        _this.iconYOffset = 0;
        _this.unlocking = false;
        _this.iconAlpha = 1;
        _this.frame = 0;
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownLadder = void 0;
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var tile_1 = __webpack_require__(/*! ./tile */ "./src/tile/tile.ts");
var upLadder_1 = __webpack_require__(/*! ./upLadder */ "./src/tile/upLadder.ts");
var events_1 = __webpack_require__(/*! ../events */ "./src/events.ts");
var eventBus_1 = __webpack_require__(/*! ../eventBus */ "./src/eventBus.ts");
var DownLadder = /** @class */ (function (_super) {
    __extends(DownLadder, _super);
    function DownLadder(room, game, x, y) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isRope = false;
        _this.generate = function () { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.linkedLevel) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.game.levelgen.generate(this.game, this.room.depth + (this.isRope ? 0 : 1), this.isRope, function (linkedLevel) {
                                _this.linkedLevel = linkedLevel;
                                for (var x = _this.linkedLevel.roomX; x < _this.linkedLevel.roomX + _this.linkedLevel.width; x++) {
                                    for (var y = _this.linkedLevel.roomY; y < _this.linkedLevel.roomY + _this.linkedLevel.height; y++) {
                                        var tile = _this.linkedLevel.roomArray[x][y];
                                        if (tile instanceof upLadder_1.UpLadder && tile.isRope)
                                            tile.linkedLevel = _this.room;
                                    }
                                }
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); };
        _this.onCollide = function (player) {
            var allPlayersHere = true;
            for (var i in _this.game.players) {
                if (_this.game.rooms[_this.game.players[i].levelID] !== _this.room ||
                    _this.game.players[i].x !== _this.x ||
                    _this.game.players[i].y !== _this.y) {
                    allPlayersHere = false;
                }
            }
            if (allPlayersHere) {
                eventBus_1.globalEventBus.emit(events_1.EVENTS.LEVEL_GENERATION_STARTED, {});
                _this.generate().then(function () {
                    eventBus_1.globalEventBus.emit(events_1.EVENTS.LEVEL_GENERATION_COMPLETED, {});
                    for (var i in _this.game.players) {
                        _this.game.changeLevelThroughLadder(_this.game.players[i], _this);
                    }
                });
            }
            else {
                if (player === _this.game.players[_this.game.localPlayerID])
                    _this.game.chat.push(new game_1.ChatMessage("all players must be present"));
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
    function Wall(room, x, y, wallDirections) {
        var _this = _super.call(this, room, x, y) || this;
        _this.isSolid = function () {
            return true;
        };
        _this.canCrushEnemy = function () {
            return true;
        };
        _this.isOpaque = function () {
            var wallInfo = _this.wallInfo();
            if (!wallInfo)
                return true;
            return ((!wallInfo.isTopWall && !wallInfo.isInnerWall) ||
                wallInfo.isLeftWall ||
                wallInfo.isRightWall);
        };
        _this.wallInfo = function () {
            return _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
        };
        _this.draw = function (delta) {
            var wallInfo = _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
            if (!wallInfo)
                return;
            // Set tileYOffset based on inner wall type
            _this.tileXOffset =
                wallInfo.innerWallType === "bottomInner" ||
                    wallInfo.innerWallType === "surroundedInner"
                    ? 0
                    : 26;
            // Only draw the bottom part of the wall if it's not at the bottom edge of the room
            if (wallInfo.isDoorWall ||
                wallInfo.isBelowDoorWall ||
                (wallInfo.isTopWall && !wallInfo.isLeftWall && !wallInfo.isRightWall) ||
                wallInfo.isInnerWall)
                game_1.Game.drawTile(0, _this.skin, 1, 1, _this.x, _this.y, 1, 1, _this.room.shadeColor, _this.room.softVis[_this.x][_this.y + 1]);
            game_1.Game.drawTile(2 + _this.tileXOffset, _this.skin, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.shadeAmount());
        };
        _this.drawAboveShading = function (delta) {
            var wallInfo = _this.room.wallInfo.get("".concat(_this.x, ",").concat(_this.y));
            if (!wallInfo)
                return;
            if (wallInfo.isBottomWall ||
                wallInfo.isBelowDoorWall ||
                wallInfo.isAboveDoorWall) {
                game_1.Game.drawTile(2 + _this.tileXOffset, _this.skin, 1, 1, _this.x, _this.y - 1, 1, 1, _this.room.shadeColor, _this.room.softVis[_this.x][_this.y + 1]);
            }
        };
        _this.isDoor = false;
        _this.tileXOffset = 6;
        _this.wallDirections = wallDirections || [];
        return _this;
    }
    Object.defineProperty(Wall.prototype, "direction", {
        get: function () {
            var directions = [];
            if (this.room.roomArray[this.x - 1][this.y] == null)
                directions.push(game_1.Direction.LEFT);
            if (this.room.roomArray[this.x + 1][this.y] == null)
                directions.push(game_1.Direction.RIGHT);
            if (this.room.roomArray[this.x][this.y - 1] == null)
                directions.push(game_1.Direction.DOWN);
            if (this.room.roomArray[this.x][this.y + 1] == null)
                directions.push(game_1.Direction.UP);
            if (directions.length == 1)
                return directions[0];
            if (directions.includes(game_1.Direction.UP) &&
                directions.includes(game_1.Direction.LEFT))
                return game_1.Direction.UP_LEFT;
            if (directions.includes(game_1.Direction.UP) &&
                directions.includes(game_1.Direction.RIGHT))
                return game_1.Direction.UP_RIGHT;
            if (directions.includes(game_1.Direction.DOWN) &&
                directions.includes(game_1.Direction.LEFT))
                return game_1.Direction.DOWN_LEFT;
            return game_1.Direction.DOWN_RIGHT;
        },
        enumerable: false,
        configurable: true
    });
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
var levelConstants_1 = __webpack_require__(/*! ../levelConstants */ "./src/levelConstants.ts");
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
        _this.room.lightSources.push(new lightSource_1.LightSource(_this.x + 0.5, _this.y + 0.5, 5, levelConstants_1.LevelConstants.TORCH_LIGHT_COLOR, 1.5));
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
            //this.game.pushMessage(`New enemy encountered: ${data.enemyName}`);
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
                //this.game.pushMessage("Defeat the enemies guarding the exits.");
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
    // Corrected HSV to HEX conversion
    Utils.hsvToHex = function (h, s, v) {
        var c = v * s;
        var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        var m = v - c;
        var r = 0, g = 0, b = 0;
        if (h >= 0 && h < 60) {
            r = c;
            g = x;
            b = 0;
        }
        else if (h >= 60 && h < 120) {
            r = x;
            g = c;
            b = 0;
        }
        else if (h >= 120 && h < 180) {
            r = 0;
            g = c;
            b = x;
        }
        else if (h >= 180 && h < 240) {
            r = 0;
            g = x;
            b = c;
        }
        else if (h >= 240 && h < 300) {
            r = x;
            g = 0;
            b = c;
        }
        else {
            r = c;
            g = 0;
            b = x;
        }
        // Convert to RGB values
        var rFinal = Math.round((r + m) * 255);
        var gFinal = Math.round((g + m) * 255);
        var bFinal = Math.round((b + m) * 255);
        // Convert RGB to HEX
        var toHex = function (val) {
            var hex = val.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        return "#".concat(toHex(rFinal)).concat(toHex(gFinal)).concat(toHex(bFinal));
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
        _this.degrade = function () { };
        _this.tileX = 22;
        _this.tileY = 0;
        _this.name = "dagger";
        _this.description = "A basic but dependable weapon.";
        return _this;
    }
    Dagger.itemName = "dagger";
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
                    _this.statusEffect(e);
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.room)
                    sound_1.Sound.hit();
                _this.wielder.hitX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.hitY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].entities = _this.game.rooms[_this.wielder.levelID].entities.filter(function (e) { return !e.dead; });
                if (!_this.firstAttack) {
                    _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                }
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.hitX, 10 * _this.wielder.hitY);
                if (_this.firstAttack) {
                    _this.game.rooms[_this.wielder.levelID].tickHitWarnings();
                    _this.game.rooms[_this.wielder.levelID].clearDeadStuff();
                    _this.firstAttack = false;
                    _this.wielder.slowMotionEnabled = true;
                }
                _this.degrade();
            }
            return !flag;
        };
        _this.tileX = 23;
        _this.tileY = 0;
        _this.firstAttack = true;
        _this.name = "Dual Daggers";
        _this.durability = 75;
        _this.durabilityMax = 75;
        _this.description =
            "After the first attack, enemies will not take their turn until you attack or move again.";
        return _this;
    }
    DualDagger.itemName = "dual daggers";
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
    Pickaxe.itemName = "pickaxe";
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
                _this.wielder.hitX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.hitY = 0.5 * (_this.wielder.y - newY);
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
                    _this.game.shakeScreen(10 * _this.wielder.hitX, 10 * _this.wielder.hitY);
                _this.degrade();
                return false;
            }
            return true;
        };
        _this.tileX = 26;
        _this.tileY = 0;
        _this.name = "shotgun";
        return _this;
    }
    Shotgun.itemName = "shotgun";
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
var enemy_1 = __webpack_require__(/*! ../entity/enemy/enemy */ "./src/entity/enemy/enemy.ts");
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
                            _this.statusEffect(e);
                            flag = true;
                        }
                    }
                    if (e.pointIn(newX2, newY2) &&
                        !_this.game.rooms[_this.wielder.levelID].roomArray[newX][newY].isSolid()) {
                        //only hit targest 2 tiles away if they are enemies
                        if (!e.pushable && e instanceof enemy_1.Enemy)
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
                _this.wielder.hitX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.hitY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX2, newY2));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.hitX, 10 * _this.wielder.hitY);
                _this.degrade();
                return false;
            }
            if (flag) {
                if (_this.wielder.game.room === _this.wielder.game.rooms[_this.wielder.levelID])
                    sound_1.Sound.hit();
                _this.wielder.hitX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.hitY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.hitX, 10 * _this.wielder.hitY);
                _this.degrade();
            }
            return !flag;
        };
        _this.tileX = 24;
        _this.tileY = 0;
        _this.name = "spear";
        _this.description =
            "Hits enemies in front of you within a range of 2 tiles.";
        return _this;
    }
    Spear.itemName = "spear";
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
var enemy_1 = __webpack_require__(/*! ../entity/enemy/enemy */ "./src/entity/enemy/enemy.ts");
var utils_1 = __webpack_require__(/*! ../utils */ "./src/utils.ts");
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var Spellbook = /** @class */ (function (_super) {
    __extends(Spellbook, _super);
    function Spellbook(level, x, y) {
        var _this = _super.call(this, level, x, y) || this;
        _this.getTargets = function () {
            _this.targets = [];
            var entities = _this.game.rooms[_this.wielder.levelID].entities;
            _this.targets = entities.filter(function (e) {
                return !e.pushable &&
                    utils_1.Utils.distance(_this.wielder.x, _this.wielder.y, e.x, e.y) <= _this.range;
            });
            var enemies = _this.targets.filter(function (e) { return e instanceof enemy_1.Enemy; });
            //console.log(enemies);
            if (enemies.length > 0)
                return enemies;
            else {
                //console.log(this.targets);
                return _this.targets;
            }
        };
        _this.weaponMove = function (newX, newY) {
            _this.getTargets();
            var direction = _this.wielder.direction;
            var flag = false;
            var targets = _this.targets;
            var isTargetInDirection = function (e) {
                switch (direction) {
                    case game_1.Direction.UP:
                        return e.y <= newY;
                    case game_1.Direction.RIGHT:
                        return e.x >= newX;
                    case game_1.Direction.DOWN:
                        return e.y >= newY;
                    case game_1.Direction.LEFT:
                        return e.x <= newX;
                    default:
                        return false;
                }
            };
            if (targets.length > 0) {
                _this.isTargeting = true;
            }
            else {
                _this.isTargeting = false;
            }
            targets = targets.filter(isTargetInDirection);
            for (var _i = 0, targets_1 = targets; _i < targets_1.length; _i++) {
                var e = targets_1[_i];
                if (!_this.game.rooms[_this.wielder.levelID].roomArray[e.x][e.y].isSolid()) {
                    e.hurt(_this.wielder, 1);
                    _this.game.rooms[_this.wielder.levelID].projectiles.push(new playerFireball_1.PlayerFireball(_this.wielder, e.x, e.y));
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.room)
                    sound_1.Sound.hit();
                _this.wielder.hitX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.hitY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.hitX, 10 * _this.wielder.hitY);
                sound_1.Sound.playMagic();
                _this.degrade();
                setTimeout(function () {
                    _this.isTargeting = false;
                }, 100);
            }
            return !flag;
        };
        _this.range = 4;
        _this.tileX = 25;
        _this.tileY = 0;
        _this.canMine = true;
        _this.name = "Spellbook";
        _this.isTargeting = false;
        _this.durability = 5;
        _this.durabilityMax = 10;
        _this.description = "Hits multiple enemies within a range of 4 tiles.";
        return _this;
    }
    Spellbook.itemName = "spear";
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
        _this.damage = 3;
        _this.name = "warhammer";
        _this.durability = 1;
        return _this;
    }
    Warhammer.itemName = "warhammer";
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
var game_1 = __webpack_require__(/*! ../game */ "./src/game.ts");
var equippable_1 = __webpack_require__(/*! ../item/equippable */ "./src/item/equippable.ts");
var sound_1 = __webpack_require__(/*! ../sound */ "./src/sound.ts");
var slashParticle_1 = __webpack_require__(/*! ../particle/slashParticle */ "./src/particle/slashParticle.ts");
var enemy_1 = __webpack_require__(/*! ../entity/enemy/enemy */ "./src/entity/enemy/enemy.ts");
var gameConstants_1 = __webpack_require__(/*! ../gameConstants */ "./src/gameConstants.ts");
var weaponFragments_1 = __webpack_require__(/*! ../item/weaponFragments */ "./src/item/weaponFragments.ts");
var Weapon = /** @class */ (function (_super) {
    __extends(Weapon, _super);
    function Weapon(level, x, y, status) {
        var _this = _super.call(this, level, x, y) || this;
        _this.break = function () {
            _this.durability = 0;
            _this.wielder.inventory.weapon = null;
            _this.toggleEquip();
            //this.wielder.inventory.removeItem(this);
            //this.wielder = null;
            _this.broken = true;
        };
        _this.coEquippable = function (other) {
            if (other instanceof Weapon)
                return false;
            return true;
        };
        _this.applyStatus = function (status) {
            _this.status = status;
        };
        _this.statusEffect = function (enemy) {
            if (enemy instanceof enemy_1.Enemy) {
                if (_this.status.poison)
                    enemy.poison();
                if (_this.status.blood)
                    enemy.bleed();
            }
        };
        _this.disassemble = function () {
            var inventory = _this.wielder.inventory;
            var inventoryX = _this.x;
            var inventoryY = _this.y;
            var numFragments = Math.floor(_this.durability / 3);
            _this.toggleEquip();
            inventory.weapon = null;
            inventory.removeItem(_this);
            inventory.addItem(new weaponFragments_1.WeaponFragments(_this.level, inventoryX, inventoryY, numFragments));
        };
        _this.weaponMove = function (newX, newY) {
            var flag = false;
            for (var _i = 0, _a = _this.game.rooms[_this.wielder.levelID].entities; _i < _a.length; _i++) {
                var e = _a[_i];
                if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
                    e.hurt(_this.wielder, _this.damage);
                    _this.statusEffect(e);
                    flag = true;
                }
            }
            if (flag) {
                if (_this.wielder.game.rooms[_this.wielder.levelID] === _this.wielder.game.room)
                    sound_1.Sound.hit();
                _this.wielder.hitX = 0.5 * (_this.wielder.x - newX);
                _this.wielder.hitY = 0.5 * (_this.wielder.y - newY);
                _this.game.rooms[_this.wielder.levelID].particles.push(new slashParticle_1.SlashParticle(newX, newY));
                _this.game.rooms[_this.wielder.levelID].tick(_this.wielder);
                if (_this.wielder === _this.game.players[_this.game.localPlayerID])
                    _this.game.shakeScreen(10 * _this.wielder.hitX, 10 * _this.wielder.hitY);
                _this.degrade();
                //console.log(this.durability);
            }
            return !flag;
        };
        _this.drawStatus = function (x, y) {
            if (_this.status.poison || _this.status.blood) {
                var tileX = 3;
                if (_this.status.poison) {
                    tileX = 4;
                }
                if (_this.status.blood) {
                    tileX = 3;
                }
                game_1.Game.drawFX(tileX, 0, 1, 1, x - 1 / gameConstants_1.GameConstants.TILESIZE, y - 1 / gameConstants_1.GameConstants.TILESIZE, 1, 1);
            }
        };
        _this.getDescription = function () {
            var broken = _this.broken ? " (broken)" : "";
            var status = [];
            var durability = "";
            if (_this.status.poison)
                status.push("Poison");
            if (_this.status.blood)
                status.push(" Bleed");
            if (_this.durability < _this.durabilityMax)
                durability = " Durability: ".concat(_this.durability, "/").concat(_this.durabilityMax);
            return "".concat(_this.name).concat(broken, "\n").concat(status.join(", "), "\n").concat(durability, "\n").concat(_this.description);
        };
        _this.tick = function () { };
        if (level)
            _this.game = level.game;
        _this.canMine = false;
        _this.range = 1;
        _this.damage = 1;
        _this.status = status || { poison: false, blood: false };
        _this.durability = 50;
        _this.durabilityMax = 50;
        return _this;
    }
    Weapon.itemName = "weapon";
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