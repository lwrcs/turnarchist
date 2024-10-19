## Specific features

### Re-enable backtracking through stairs

- Previous versions allowed this, but re-implementation may be challenging
  - Where is previous level data stored once you move to the next?

## Brainstorm

### Level Expansion During Gameplay

#### Proposition:

- Level generator will:
  - Check walls with empty space behind
  - Add cracked walls to those spaces and push them to the level array
  - Player can use a pickaxe on cracked walls
  - Cracked wall will be replaced with Door of DoorType.PASSAGE
    - A new room will be created and pushed to the level array
    - Shape will be based on available space and room specifications
  - Player can enter the new room, which may have more cracked walls for further expansion

#### Advantages:

- Allows for infinite levels
- Ensures necessary items to exit the level are obtainable
  - Bad RNG? Explore more to find what you need

#### Additional Ideas:

- Room for creativity:
  - Probability of new room:
    - Being a specific type (variance in skin, room shape, etc.)
    - Having one or more cracked walls, or being a dead end

---

## Housekeeping

- Establish standards for class structure:
  - What classes should handle which data?
  - What should we avoid?

- Restructuring:
  - Make the LevelGenerator class more modular without a complete overhaul
    - Adding new room types, items, monsters, objects, etc. should require minimal changes to the generator code
    - LevelGenerator creates levels, but the Level class handles distribution of enemies and objects
    - Implement broader logic efficiently
      - How will a key in one room unlock a door in another?
