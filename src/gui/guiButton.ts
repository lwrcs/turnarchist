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
  /**
   * When true, draws this button with an opaque background (instead of the default translucent one).
   * Intended for overlay menus like smithing selections over inventory.
   */
  opaque?: boolean;
  /**
   * When set, draws a stroke outline around the button (e.g. "rgba(255,255,255,1)").
   */
  outlineColor?: string;
  /**
   * Hover animation amount in [0,1]. Driven by Menu drawing.
   */
  hoverAnim: number;
  /**
   * Disabled-button rejection shake animation.
   */
  rejectShakeRemainingMs: number;
  rejectShakeElapsedMs: number;
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
    this.opaque = false;
    this.outlineColor = undefined;
    this.hoverAnim = 0;
    this.rejectShakeRemainingMs = 0;
    this.rejectShakeElapsedMs = 0;
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
