export class TextBox {
  text: string;
  cursor: number;
  enterCallback;
  escapeCallback;
  allowedCharacters = "all";
  element: HTMLElement;

  constructor(element: HTMLElement) {
    this.text = "";
    this.cursor = 0;
    this.enterCallback = () => {};
    this.escapeCallback = () => {};
    this.element = element;
    this.element.addEventListener("touchstart", this.handleTouchStart);
  }

  setEnterCallback = (callback) => {
    this.enterCallback = callback;
  };

  setEscapeCallback = (callback) => {
    this.escapeCallback = callback;
  };

  clear = () => {
    this.text = "";
    this.cursor = 0;
  };

  handleKeyPress = (key: string) => {
    const fontHas = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/".split(
      ""
    );
    if (key.length === 1) {
      key = key.toLowerCase();
      if (fontHas.includes(key)) {
        if (
          this.allowedCharacters === "all" ||
          this.allowedCharacters.includes(key)
        ) {
          this.text =
            this.text.substring(0, this.cursor) +
            key +
            this.text.substring(this.cursor, this.text.length);
          this.cursor += 1;
        }
      }
      return;
    } else {
      switch (key) {
        case "Backspace":
          this.text =
            this.text.substring(0, this.cursor - 1) +
            this.text.substring(this.cursor, this.text.length);
          this.cursor = Math.max(0, this.cursor - 1);
          break;
        case "Delete":
          this.text =
            this.text.substring(0, this.cursor) +
            this.text.substring(this.cursor + 1, this.text.length);
          break;
        case "ArrowLeft":
          this.cursor = Math.max(0, this.cursor - 1);
          break;
        case "ArrowRight":
          this.cursor = Math.min(this.text.length, this.cursor + 1);
          break;
        case "Enter":
          this.enterCallback();
          break;
        case "Escape":
          this.escapeCallback();
          break;
      }
    }
  };

  handleTouchStart = (e: TouchEvent) => {
    this.focus();
    e.preventDefault();
  };

  focus = () => {
    // Create a temporary input element to trigger the on-screen keyboard
    const tempInput = document.createElement("input");
    tempInput.type = "text";
    tempInput.style.position = "absolute";
    tempInput.style.opacity = "0";
    tempInput.style.zIndex = "-1"; // Ensure it doesn't interfere with the game UI
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.addEventListener("blur", () => {
      document.body.removeChild(tempInput);
    });
  };
}
