/** Opt-in at page load; ordinary play keeps its existing behavior. */
export const AGENT_MODE = typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("agent") === "1";

// A dedicated agent tab accepts actions through its API, not concurrent DOM input.
if (AGENT_MODE) {
  for (const event of ["keydown", "keyup", "mousedown", "mouseup", "mousemove",
    "click", "dblclick", "contextmenu", "touchstart", "touchmove", "touchend", "wheel"]) {
    window.addEventListener(event, event => event.stopImmediatePropagation(), { capture: true });
  }
}
