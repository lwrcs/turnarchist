
# To-Do

## Core Gameplay

### Implement tutorial first level
- Predetermined layout
- Each rooms doors are guarded
- Dying resets to the beginning of the level automatically

### Expand core game loop

- Tune distribution of necessary items
    - when are items needed?
    - how are they obtained?
    - are necessary resources a chore to maintain?

### Create more level variation
- Expand depth of procedural generation

***
## Housekeeping

- Establish standards for class structure
    - What classes should handle which pieces of data?
    - What should we avoid?

- Restructuring
    
    - The LevelGenerator class is pretty messy. The goal for now is not to overhaul it entirely but to do the best to make it more modular. **Adding new roomtypes, items, monsters, objects, etc. should require as little tweaking as possible to the generator code.** 

        - Keep in mind the LevelGenerator creates levels, but the Level class handles distribution of enemies and objects.

        - We'll also need an efficient way to implement broader logic to the levels.
            - How will a key be obtainable in one room that is needed to unlock a door in another?

## Specific features

### Re-enable the ability to backtrack to different floors through stairs
- Previous versions this was possible, but it may not be easy to re-implement
    - Where is previous level data stored once you move to the next?



## Brainstorm

### Novel method for level expansion during gameplay
#### Proposition:
- Level generator will
    - checks walls with empty space behind
    - add cracked walls to those spaces and push them to the level array
    - player can use a pickaxe on cracked walls
    - cracked wall will be replaced with Door of DoorType.PASSAGE
        - a new room will be created and pushed to the level array
        - shape will be based on available space and specifications of the type of room
    - The player can then enter the new room, which may have cracked walls there as well to further expand.

#### Why is this advantageous?
- The primary advantage of this type of generation is the ability to make levels infinite. 
- In theory this takes care of items which are necessary to exit the level being unobtainable.
    - Bad RNG causes level to be unfinishable? You'd better explore more. 

#### More ideas
- There is a LOT of room for creativity
    - The moment that cracked walls are broken and a new room is generated is very important. 
    - ***What is the probability of the new room...***
        - being a specific type
            - variance in skin, room shape, etc.
        - having one or more cracked walls, or being a dead end

    - What 

         
         




