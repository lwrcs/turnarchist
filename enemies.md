# Enemies

**Enemy States**:
- Sleeping
    * All enemies sleep until within range of player, then entering hostile state
- Hostile
    * An enemy in hostile state will deal damage if the player steps into their attack range
- Stalled
    * A stalled enemy is harmless for the current turn and cannot move or deal damage

## Crab
**Mechanics**:
- Can move or attack every other turn
    * Hostile when red
    * Stalled when grey

**Hitpoints**: 1

**Damage**: 1
## Zombie
**Mechanics**:
- Can only attack and move in the direction they are facing
- Each turn they do **one** of the following
    * Advance one tile
    * Attack
    * Rotate 90 degrees

**Hitpoints**: 1, 2

**Damage**: 1


**Variants**:
Armored Zombie (+1 HP)

## Burrow Knight
**Mechanics**:

- Can move or attack every other turn, after moving or attacking hide in helmet
    * Hostile when not hiding
    * Stalled when hiding

**Hitpoints**: 2

**Damage**: 1


## Charge Knight
**Mechanics**:
- Detects unobscured players within their vertical or horizontal path
- Upon detection they become hostile, showing a beam where they will charge next turn
- Charge through players dealing damage, then become stalled for 1 turn

**Hitpoints**: 1

**Damage**: 1

## Basic Skeleton

**Mechanics**:
- Can move or attack every turn in any direction
- Lose their heads after being damaged entering stalled state
    * If damaged again will die
    * If x turns pass will regrow head and become hostile

**Hitpoints**: 1

**Damage**: 1


## Wizard Bombers

**Mechanics**:
- Teleport around the level and cast an explosive spell in a cross pattern
- Blue warning tiles will show where the spell will be cast next turn
- After casting teleport again

**Hitpoints**: 1

**Damage**: 1

## Death Spawners

**Mechanics**:
- Death Spawners do not move or attack directly
- every x turns can spawn a skeleton on an open tile adjecent to them
- A blue orb will appear on the tile where a skeleton will spawn
    * Can spawn a skeleton on top of the player dealing 0.5 Damage

**Hitpoints**: 4

**Damage**: n/a