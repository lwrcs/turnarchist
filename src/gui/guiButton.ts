import { Sound } from "../sound/sound";
import { Menu } from "./menu";
import { MuteButton } from "./muteButton";

export class guiButton {
  toggleable: boolean;
  toggled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  parent: Menu;
  onClick: () => void;
  // Optional styling
  noFill?: boolean;
  textColor?: string;
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    toggleable: boolean = false,
    parent?: Menu,
  ) {
    this.toggleable = toggleable;
    this.toggled = false;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    this.parent = parent;
    this.noFill = false;
    this.textColor = undefined;
  }

  // Add a method to update the button's own text based on mute state
  toggleMuteText = () => {
    // 'this' refers to the guiButton instance
    MuteButton.toggleMute();

    this.text = Sound.audioMuted ? "Sound Muted" : "Sound Unmuted";
    this.parent?.game.pushMessage(this.text);
  };

  // Check if a point is within the button bounds
  isPointInButton(x: number, y: number): boolean {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }
}
