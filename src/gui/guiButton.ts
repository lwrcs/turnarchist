import { Sound } from "../sound/sound";
import { MuteButton } from "./muteButton";

export class guiButton {
  toggleable: boolean;
  toggled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  onClick: () => void;
  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void,
    toggleable: boolean = false,
  ) {
    this.toggleable = toggleable;
    this.toggled = false;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
  }

  // Add a method to update the button's own text based on mute state
  toggleMuteText = () => {
    // 'this' refers to the guiButton instance
    this.text = !Sound.audioMuted ? "Unmute Sound" : "Mute Sound";
    MuteButton.toggleMute();
  };
}
