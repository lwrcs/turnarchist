import { GameConstants } from "../game/gameConstants";
import { LinkButton } from "./linkButton";

export class FeedbackButton extends LinkButton {
  constructor(
    { x, y }: { x: number; y: number } = {
      x: GameConstants.WIDTH / 2,
      y: GameConstants.HEIGHT / 2,
    },
  ) {
    super({
      text: "Provide Feedback",
      linkUrl: "https://forms.gle/sWzqPGCa1L9XJ3Mk8",
      x,
      y,
    });
  }
}
