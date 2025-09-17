import { globalEventBus } from "../event/eventBus";

export class TextBox {
  text: string;
  cursor: number;
  private enterCallback: () => void;
  private escapeCallback: () => void;
  private allowedCharacters: string = "all";
  private element: HTMLElement;
  private message: string = "";
  private sentMessages: Array<string>;
  private currentMessageIndex: number = -1;
  private readonly MAX_HISTORY: number = 50;

  constructor(element: HTMLElement) {
    this.text = "";
    this.cursor = 0;
    this.enterCallback = () => {};
    this.escapeCallback = () => {};
    this.element = element;
    this.sentMessages = [];

    //this.element.addEventListener("touchstart", this.handleTouchStart);
  }

  public setEnterCallback(callback: () => void): void {
    this.enterCallback = callback;
  }

  public setEscapeCallback(callback: () => void): void {
    this.escapeCallback = callback;
  }

  public clear(): void {
    this.text = "";
    this.cursor = 0;
    this.message = "";
    this.updateElement();
  }

  public handleKeyPress = (key: string): void => {
    const fontHas = "abcdefghijklmnopqrstuvwxyz1234567890,.!?:'()[]%-/+ ".split(
      "",
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
          this.updateElement();

          this.message =
            this.message.substring(0, this.cursor - 1) +
            key +
            this.message.substring(this.cursor - 1, this.message.length);
        }
      }
      //console.log(`Current message: "${this.message}"`);
      return;
    } else {
      switch (key) {
        case "Backspace":
          if (this.cursor > 0) {
            this.text =
              this.text.substring(0, this.cursor - 1) +
              this.text.substring(this.cursor, this.text.length);
            this.cursor = Math.max(0, this.cursor - 1);
            this.updateElement();

            this.message =
              this.message.substring(0, this.cursor) +
              this.message.substring(this.cursor + 1, this.message.length);
          }
          break;
        case "Delete":
          if (this.cursor < this.text.length) {
            this.text =
              this.text.substring(0, this.cursor) +
              this.text.substring(this.cursor + 1, this.text.length);
            this.updateElement();

            this.message =
              this.message.substring(0, this.cursor) +
              this.message.substring(this.cursor + 1, this.message.length);
          }
          break;
        case "ArrowLeft":
          this.cursor = Math.max(0, this.cursor - 1);
          this.updateCursorPosition();
          break;
        case "ArrowRight":
          this.cursor = Math.min(this.text.length, this.cursor + 1);
          this.updateCursorPosition();
          break;
        case "ArrowUp":
          if (
            this.sentMessages.length > 0 &&
            this.currentMessageIndex < this.sentMessages.length - 1
          ) {
            this.currentMessageIndex++;
            this.text =
              this.sentMessages[
                this.sentMessages.length - 1 - this.currentMessageIndex
              ];
            this.updateElement();
            this.message = this.text;
          }
          break;
        case "ArrowDown":
          if (this.currentMessageIndex > 0) {
            this.currentMessageIndex--;
            this.text =
              this.sentMessages[
                this.sentMessages.length - 1 - this.currentMessageIndex
              ];
            this.updateElement();
            this.message = this.text;
          } else if (this.currentMessageIndex === 0) {
            this.currentMessageIndex = -1;
            this.clear();
          }
          break;
        case "Enter":
          this.sendMessage();
          this.escapeCallback();
          break;
        case "Escape":
          this.escapeCallback();
          break;
      }
    }
    //console.log(`Current message: "${this.message}"`);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    this.focus();
    e.preventDefault();
  };

  public focus(): void {
    const input = this.element as HTMLInputElement;
    if (!input) return;

    // Temporarily position the input on-screen (near bottom-left), tiny and nearly transparent
    const prev = {
      position: input.style.position,
      left: input.style.left,
      right: input.style.right,
      top: input.style.top,
      bottom: input.style.bottom,
      width: input.style.width,
      height: input.style.height,
      opacity: input.style.opacity,
      zIndex: input.style.zIndex,
      pointerEvents: input.style.pointerEvents,
    };

    input.style.position = "fixed";
    input.style.left = "8px";
    input.style.bottom = "40px";
    input.style.top = "";
    input.style.right = "";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0.01";
    input.style.zIndex = "9999";
    input.style.pointerEvents = "auto";

    try {
      input.focus();
      // Place cursor at end
      if (typeof input.setSelectionRange === "function") {
        const len = input.value?.length ?? 0;
        input.setSelectionRange(len, len);
      }
    } catch {}

    const restore = () => {
      input.style.position = prev.position;
      input.style.left = prev.left;
      input.style.right = prev.right;
      input.style.top = prev.top;
      input.style.bottom = prev.bottom;
      input.style.width = prev.width;
      input.style.height = prev.height;
      input.style.opacity = prev.opacity;
      input.style.zIndex = prev.zIndex;
      input.style.pointerEvents = prev.pointerEvents;
      input.removeEventListener("blur", restore);
    };
    input.addEventListener("blur", restore);
  }

  private sendMessage(): void {
    let message = this.message.trim();

    if (message) {
      // Add the new message to the history
      this.sentMessages.push(message);

      // Ensure the history size doesn't exceed the maximum limit
      if (this.sentMessages.length > this.MAX_HISTORY) {
        this.sentMessages.shift(); // Remove the oldest message
      }
      globalEventBus.emit("ChatMessageSent", message);

      console.log(this.sentMessages);

      this.enterCallback();

      if (message.startsWith("/")) {
        message = message.substring(1);
        globalEventBus.emit("ChatCommand", message);
      }

      this.clear();

      // Reset the navigation index
      this.currentMessageIndex = -1;
    }
  }

  private updateElement(): void {
    // Update the HTML element with the current text
    // Modify to handle multiple lines if necessary
    this.element.textContent = this.text;

    // Optionally, update cursor position in the UI
  }

  private updateCursorPosition(): void {
    // Implement cursor position update in the UI if necessary
  }

  // Optional: Modify other methods if needed to handle wrapped messages
}
