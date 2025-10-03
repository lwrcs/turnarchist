import { setCookie, getCookie } from "../utility/cookies";
import { Game } from "../game";
import { GameConstants } from "./gameConstants";
import { Sound } from "../sound/sound";

const SETTINGS_KEY = "wr_settings";

type Settings = {
  muted?: boolean;
  softScale?: number;
  shade?: boolean;
  smoothLighting?: boolean;
  hoverText?: boolean;
  screenShake?: boolean;
};

export const saveSettings = (game: Game) => {
  const s: Settings = {
    muted: (Sound as any).audioMuted ?? false,
    softScale: (GameConstants as any).SOFT_SCALE ?? GameConstants.SCALE,
    shade: GameConstants.SHADE_ENABLED,
    smoothLighting: GameConstants.SMOOTH_LIGHTING,
    hoverText: GameConstants.HOVER_TEXT_ENABLED,
    screenShake: GameConstants.SCREEN_SHAKE_ENABLED,
  };
  setCookie(SETTINGS_KEY, JSON.stringify(s), 180);
};

export const loadSettings = (game: Game) => {
  const raw = getCookie(SETTINGS_KEY);
  if (!raw) return;
  try {
    const s: Settings = JSON.parse(raw);
    if (typeof s.muted === "boolean") {
      if (s.muted && !(Sound as any).audioMuted) Sound.toggleMute();
      if (!s.muted && (Sound as any).audioMuted) Sound.toggleMute();
    }
    if (typeof s.softScale === "number") {
      (GameConstants as any).SOFT_SCALE = s.softScale;
    }
    //if (typeof s.shade === "boolean") GameConstants.SHADE_ENABLED = s.shade;
    if (typeof s.smoothLighting === "boolean")
      GameConstants.SMOOTH_LIGHTING = s.smoothLighting;
    if (typeof s.hoverText === "boolean") {
      GameConstants.HOVER_TEXT_ENABLED = s.hoverText;
      console.log("Load hover text enabled", GameConstants.HOVER_TEXT_ENABLED);
    }
    if (typeof s.screenShake === "boolean") {
      GameConstants.SCREEN_SHAKE_ENABLED = s.screenShake;
    }
  } catch (e) {
    console.warn("Failed to parse settings cookie", e);
  }
};
