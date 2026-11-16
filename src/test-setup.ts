import "@testing-library/jest-dom/vitest";

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
