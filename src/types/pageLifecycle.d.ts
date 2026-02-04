declare global {
  interface DocumentEventMap {
    /** Page Lifecycle API: fired when the page is being frozen by the UA (may not fire on all platforms). */
    freeze: Event;
    /** Page Lifecycle API: fired when the page is resumed after being frozen. */
    resume: Event;
  }
}

export {};


