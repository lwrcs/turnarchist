import { Game } from "./game";
import { LevelConstants } from "./levelConstants";
import { Inventory } from "./inventory";
import { GameConstants } from "./gameConstants";
import { Player } from "./player";

export enum ActionState {
  Ready,
  Attack,
  Wait,
  halfAttack,
}

export class ActionTab {
  actionState: ActionState;
  weapon: any;
  game: Game;

  constructor(inventory: Inventory, game: Game) {
    this.weapon = inventory.weapon;
    this.game = game;
  }

  tick = () => {};
  
  draw = (player: Player, inventory: Inventory) => {
    //need block of code to draw outline
    //location on screen etc
    const w = inventory.weapon;
    let action = player.actionTab.actionState

    //play ready animation
    switch (action) {
      case ActionState.Ready: {
        Game.ctx.fillStyle = "green";
        Game.ctx.fillRect(1, 1, 4, 4);
      }
      case ActionState.Attack: {
        //if (w == ) {
          Game.ctx.fillStyle = "red";
          Game.ctx.fillRect(1, 1, 4, 4);
         //first slash
        //if (w == this.weapon.dualdagger); /* same attack anim for now...
        //first slash of slash animation
      }
      case ActionState.halfAttack: {
        Game.ctx.fillStyle = "orange";
        Game.ctx.fillRect(1, 1, 4, 4);
        //if (w == this.weapon.dualdagger);
        //render second of two slash animations
      }
      case ActionState.Wait: {
        Game.ctx.fillStyle = "blue";
        Game.ctx.fillRect(1, 1, 4, 4);
        //render waiting animation}
      }
    }
  };
}
