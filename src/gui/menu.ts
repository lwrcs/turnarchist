import { Game } from "../game";
import { guiButton } from "./guiButton";
import { InputEnum } from "../game/input";
import { GameConstants } from "../game/gameConstants";

export class Menu {
  buttons: guiButton[];
  open: boolean;
  selectedButton: number;
  subMenus: { [key: string]: Menu };
  currentSubMenu: string | null;

  constructor() {
    this.buttons = [];
    this.open = false;
    this.selectedButton = 0;
    this.subMenus = {};
    this.currentSubMenu = null;
    //this.initializeMainMenu();
  }

  initializeMainMenu() {
    this.addButton(new guiButton(0, 0, 200, 50, "Start Game", this.startGame));
    this.addButton(
      new guiButton(0, 60, 200, 50, "Settings", () =>
        this.openSubMenu("Settings"),
      ),
    );
    this.addButton(new guiButton(0, 120, 200, 50, "Exit", this.exitGame));
    this.initializeSettingsMenu();
    this.positionButtons();
  }

  initializeSettingsMenu() {
    const settingsMenu = new Menu();
    settingsMenu.addButton(
      new guiButton(0, 0, 200, 50, "Audio", this.openAudioSettings),
    );
    settingsMenu.addButton(
      new guiButton(0, 60, 200, 50, "Graphics", this.openGraphicsSettings),
    );
    settingsMenu.addButton(
      new guiButton(0, 120, 200, 50, "Controls", this.openControlsSettings),
    );
    settingsMenu.addButton(
      new guiButton(0, 180, 200, 50, "Back", () => this.closeSubMenu()),
    );
    settingsMenu.positionButtons();
    this.subMenus["Settings"] = settingsMenu;
  }

  addButton(button: guiButton) {
    this.buttons.push(button);
  }

  drawMenu() {
    if (!this.open && !this.currentSubMenu) return;

    Game.ctx.save();
    Game.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    Game.ctx.fillRect(0, 0, innerWidth, innerHeight);

    const menuToDraw = this.currentSubMenu
      ? this.subMenus[this.currentSubMenu]
      : this;
    menuToDraw.buttons.forEach((button) => {
      this.drawButton(button, menuToDraw);
    });
    Game.ctx.restore();
  }

  drawButton(button: guiButton, menu: Menu) {
    Game.ctx.fillStyle =
      menu.selectedButton === menu.buttons.indexOf(button)
        ? "rgba(200, 200, 200, 1)"
        : "rgba(255, 255, 255, 1)";
    Game.ctx.fillRect(button.x, button.y, button.width, button.height);
    Game.ctx.fillStyle = "rgba(0, 0, 0, 1)";
    Game.ctx.font = "20px Arial";

    const textWidth = Game.measureText(button.text).width;
    const textX = button.x + (button.width - textWidth) / 2;
    const textY = button.y + button.height / 2 + Game.letter_height / 2;

    Game.fillText(button.text, textX, textY);
  }

  inputHandler(input: InputEnum) {
    if (!this.open) return;

    switch (input) {
      case InputEnum.ESCAPE:
        if (this.currentSubMenu) {
          this.closeSubMenu();
        } else {
          this.open = false;
        }
        break;
      case InputEnum.UP:
        this.up();
        break;
      case InputEnum.DOWN:
        this.down();
        break;
      case InputEnum.SPACE:
        this.select();
        break;
      default:
        break;
    }
  }

  openSubMenu(menuName: string) {
    if (this.subMenus[menuName]) {
      this.currentSubMenu = menuName;
      this.selectedButton = 0;
    }
  }

  closeSubMenu() {
    this.currentSubMenu = null;
    this.selectedButton = 0;
  }

  close() {
    this.open = false;
    this.currentSubMenu = null;
  }

  select() {
    const menuToSelect = this.currentSubMenu
      ? this.subMenus[this.currentSubMenu]
      : this;
    if (menuToSelect.open) {
      menuToSelect.buttons[menuToSelect.selectedButton].onClick();
    }
  }

  up() {
    const menuToNavigate = this.currentSubMenu
      ? this.subMenus[this.currentSubMenu]
      : this;
    if (menuToNavigate.open) {
      menuToNavigate.selectedButton =
        (menuToNavigate.selectedButton - 1 + menuToNavigate.buttons.length) %
        menuToNavigate.buttons.length;
    }
  }

  down() {
    const menuToNavigate = this.currentSubMenu
      ? this.subMenus[this.currentSubMenu]
      : this;
    if (menuToNavigate.open) {
      menuToNavigate.selectedButton =
        (menuToNavigate.selectedButton + 1) % menuToNavigate.buttons.length;
    }
  }

  // Example action methods
  startGame = () => {
    console.log("Game Started");
    this.close();
    // Implement game start logic
  };

  exitGame = () => {
    console.log("Exit Game");
    // Implement exit game logic
  };

  openAudioSettings = () => {
    console.log("Audio Settings Opened");
    // Implement audio settings logic
  };

  openGraphicsSettings = () => {
    console.log("Graphics Settings Opened");
    // Implement graphics settings logic
  };

  openControlsSettings = () => {
    console.log("Controls Settings Opened");
    // Implement controls settings logic
  };

  positionButtons() {
    const startX = (GameConstants.WIDTH - 200) / 2;
    const startY = (GameConstants.HEIGHT - this.buttons.length * 60) / 2;
    this.buttons.forEach((button, index) => {
      button.x = startX;
      button.y = startY + index * 60;
    });
  }
}
