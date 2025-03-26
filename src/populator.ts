import { Entity } from "./entity/entity";
import { Game } from "./game";
import { Room } from "./room/room";
import { Random } from "./random";

//The Populate class will handle distribution of enemies and objects in room.
//At this time I don't think it will handle placement within the room itself

/*export enum Enemy {
  Crab = 0,
  Frog = 1,
  Knight = 2,
  Skeleton = 3,
  Mage = 4,
}

export class Populate {
  room: Room;
  enemies: Array<Entity>;

  constructor(game: Game) {
    this.enemies = [];
  }

  static populateRoom = (r: Room) => {
    Populate.getEnemyCount(r.depth, r.width * r.height);
    return [];
  };

  static getEnemyCount = (d: number, a: number) => {
    const dF = Math.log(d); //Depth factor to apply to min max calc
    const count = Math.round((dF * a) / 20); //(depth factor * room area) / 20
    const min = count + 3;
    const max = count - 3;
    return [min, max];
  };

  static rollEnemy = (enemies: Array<Enemy>, rand: Random) => {
    const enemyTypes = Object.values(Enemy).filter(value => typeof value === 'number') as number[];
    const availableEnemies = enemyTypes.filter(enemy => !enemies.includes(enemy));
    
    // Increase the probability of choosing an enemy not already in the array
    const weights = enemyTypes.map(enemy => (availableEnemies.includes(enemy) ? 2 : 1));
    const totalWeight = weights.reduce((acc, weight) => acc + weight, 0);
    
    let randomValue = rand.next() * totalWeight;
    for (let i = 0; i < enemyTypes.length; i++) {
      randomValue -= weights[i];
      if (randomValue <= 0) {
        return enemyTypes[i];
      }
    }
    return enemyTypes[0]; // Fallback
  };

  static rollEnemies = (r: Room, rand: Random) => {
    const range = Populate.getEnemyCount(r.depth, r.width * r.height);
    const count = Math.floor(rand.next() * (range[1] - range[0] + 1)) + range[0];
    const enemies: Array<Enemy> = [];
    for (let i = 0; i < count; i++) {
      const enemy = Populate.rollEnemy(enemies, rand);
      enemies.push(enemy);
    }
    return enemies;
  };
}
*/
