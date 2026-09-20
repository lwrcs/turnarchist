/** Opt-in at page load; ordinary play keeps its existing behavior. */
export const AGENT_MODE = typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("agent") === "1";
/** A hidden agent-only iframe permitted to restore privileged simulation snapshots. */
export const AGENT_SIMULATION_MODE = AGENT_MODE &&
  new URLSearchParams(window.location.search).get("simulator") === "1";
export let AGENT_FAST_MODE = false;
export function setAgentFastMode(enabled: boolean) { AGENT_FAST_MODE = AGENT_MODE && enabled; }

// A dedicated agent tab accepts actions through its API, not concurrent DOM input.
if (AGENT_MODE) {
  for (const event of ["keydown", "keyup", "mousedown", "mouseup", "mousemove",
    "click", "dblclick", "contextmenu", "touchstart", "touchmove", "touchend", "wheel"]) {
    window.addEventListener(event, event => event.stopImmediatePropagation(), { capture: true });
  }
}
