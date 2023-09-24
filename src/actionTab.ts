import { Game } from "./game";
import { LevelConstants } from "./levelConstants";
import { Inventory } from "./inventory";
import { GameConstants } from "./gameConstants";
import { Player } from "./player";

export enum ActionState {
  READY,
  ATTACK,
  WAIT,
  HALFATTACK,
  MOVE
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

  getWeapon = (player: Player) => {
    this.weapon = player.inventory.weapon;
  };
  setState = (state: ActionState) => {
    this.actionState = state;
  };

  draw = (delta: number) => {
    let tabX = LevelConstants.SCREEN_W / 2;
    let tabY = LevelConstants.SCREEN_H - 1;

    let action = this.actionState;
    const actionString: string = "" + ActionState[action]
    let width = Game.measureText(actionString).width;
    let actionX = 4 - width/2;
    let actionY = -1;

    Game.fillTextOutline(
      actionString,
      tabX * GameConstants.TILESIZE + actionX,
      tabY * GameConstants.TILESIZE + actionY,
      GameConstants.OUTLINE,
      "white"
    );
  };
  /*
    switch (this.actionState) {
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
    }*/
}
