Here is an example of how to modularize a monolithic class using composition. Use this pattern to refactor the provided source code, adapting module names and structure where appropriate. Maintain the principle of separating concerns, keeping domain logic self-contained and coordinated via the main class.

// PURPOSE:
// This example demonstrates how to refactor a monolithic class into a modular, maintainable structure
// using composition. It’s designed to guide AI-assisted refactoring, providing a flexible but clear pattern
// that prioritizes clean separation of concerns.

// CONTEXT:
// The original code shows a `Character` class that directly handles input, movement, actions, and rendering.
// In the refactored version, those responsibilities are delegated to separate handler modules that each
// encapsulate a specific domain of behavior. The main class orchestrates coordination between modules,
// holding the shared state.

// INTENDED USE:
// Use this example as a model when refactoring real code. The AI should recognize:
// - How to extract domain-specific responsibilities into clearly named modules
// - How to pass ownership references (e.g., the master class) for shared state or coordination
// - That structure and naming shown here are illustrative, not mandatory — adapt them to the specific codebase

// GOALS:
// - Demonstrate modularization of functionality (Input, Movement, Actions)
// - Emphasize clarity, encapsulation, and traceability over rigid patterns
// - Encourage loose coupling via composition and responsibility delegation

////////////////////////////////////////////
// BEFORE: MONOLITHIC CLASS (NOT IDEAL) //
////////////////////////////////////////////

class Character {
x: number = 0;
y: number = 0;
health: number = 10;
direction: 'up' | 'down' | 'left' | 'right' = 'down';

constructor() {
window.addEventListener('keydown', this.handleKey);
}

handleKey = (e: KeyboardEvent) => {
switch (e.key.toLowerCase()) {
case 'w': this.move(0, -1, 'up'); break;
case 's': this.move(0, 1, 'down'); break;
case 'a': this.move(-1, 0, 'left'); break;
case 'd': this.move(1, 0, 'right'); break;
case ' ': this.attack(); break;
}
};

move(dx: number, dy: number, dir: typeof this.direction) {
this.x += dx;
this.y += dy;
this.direction = dir;
console.log(`Moved to (${this.x}, ${this.y})`);
}

attack() {
console.log(`Attacked in direction ${this.direction}`);
}

draw(ctx: CanvasRenderingContext2D) {
ctx.fillStyle = 'blue';
ctx.fillRect(this.x _ 32, this.y _ 32, 32, 32);
}
}

////////////////////////////////////////////
// AFTER: MODULAR DESIGN (RECOMMENDED) //
////////////////////////////////////////////

class Character {
x = 0;
y = 0;
health = 10;
direction: 'up' | 'down' | 'left' | 'right' = 'down';

inputHandler: CharacterInputHandler;
movement: CharacterMovement;
actions: CharacterActionProcessor;

constructor() {
this.inputHandler = new CharacterInputHandler(this);
this.movement = new CharacterMovement(this);
this.actions = new CharacterActionProcessor(this);
}

draw(ctx: CanvasRenderingContext2D) {
ctx.fillStyle = 'blue';
ctx.fillRect(this.x _ 32, this.y _ 32, 32, 32);
}
}

class CharacterInputHandler {
constructor(private character: Character) {
window.addEventListener('keydown', this.handleKey);
}

handleKey = (e: KeyboardEvent) => {
switch (e.key.toLowerCase()) {
case 'w': this.character.movement.queueMove(0, -1, 'up'); break;
case 's': this.character.movement.queueMove(0, 1, 'down'); break;
case 'a': this.character.movement.queueMove(-1, 0, 'left'); break;
case 'd': this.character.movement.queueMove(1, 0, 'right'); break;
case ' ': this.character.actions.queueAttack(); break;
}
};
}

class CharacterMovement {
private moveQueue: { dx: number; dy: number; direction: Character['direction'] }[] = [];

constructor(private character: Character) {}

queueMove(dx: number, dy: number, direction: Character['direction']) {
this.moveQueue.push({ dx, dy, direction });
this.processQueue();
}

private processQueue() {
while (this.moveQueue.length > 0) {
const { dx, dy, direction } = this.moveQueue.shift()!;
this.character.x += dx;
this.character.y += dy;
this.character.direction = direction;
console.log(`Moved to (${this.character.x}, ${this.character.y})`);
}
}
}

class CharacterActionProcessor {
constructor(private character: Character) {}

queueAttack() {
console.log(`Attacked in direction ${this.character.direction}`);
// Future: implement hit detection, cooldowns, animations, etc.
}
}
