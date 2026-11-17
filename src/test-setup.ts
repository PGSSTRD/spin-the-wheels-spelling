import "@testing-library/jest-dom/vitest";

// React uses this constructor's presence to choose unprefixed animation events.
window.AnimationEvent ??= class extends Event {
  readonly animationName: string;
  readonly elapsedTime: number;
  readonly pseudoElement: string;

  constructor(type: string, init: AnimationEventInit = {}) {
    super(type, init);
    this.animationName = init.animationName ?? "";
    this.elapsedTime = init.elapsedTime ?? 0;
    this.pseudoElement = init.pseudoElement ?? "";
  }
};

HTMLElement.prototype.setPointerCapture ??= () => undefined;
HTMLElement.prototype.hasPointerCapture ??= () => false;

window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

window.requestAnimationFrame ??= ((callback: FrameRequestCallback) =>
  window.setTimeout(() => callback(performance.now()), 0)) as typeof window.requestAnimationFrame;
window.cancelAnimationFrame ??= ((handle: number) => window.clearTimeout(handle)) as typeof window.cancelAnimationFrame;
