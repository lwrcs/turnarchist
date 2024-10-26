# Lower Level Class Dependencies

Lower level classes probably shouldn't store higher level classes.

## Usage of storing Game:

- Room:

  - Arguments for new entities
  - Some usage of finding player data

- Entity:

  - Mostly used for player data

- Doors:
  - Used for accessing the game.changeLevelThroughX methods
  - Used for the game.levelgen.generate method
  - Used for the game.chat.pushMessage
  - Used for the game.rooms.entities array for guarded doors
  - Used to activate game.tutorialActive

## Usage of storing Room:

- Tile:

  - Used for getting softVis value in the shadeAmount method

- Entity:
  - Used for checking if same room as player
  - Used for checking if same room as drop (Item) and pushing dropped items to the room.items array
  - Used for placing bones tile through roomArray in the kill method
  - Used for getting softVis value in the shadeAmount method
  -
