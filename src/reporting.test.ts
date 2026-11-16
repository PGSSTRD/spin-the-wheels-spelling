import { afterEach, describe, expect, it, vi } from "vitest";
import { emitGameEvent } from "./reporting";

afterEach(() => {
  delete window.ReactNativeWebView;
  vi.restoreAllMocks();
});

describe("emitGameEvent", () => {
  it("sends a fresh, valid Curious Reader event envelope", () => {
    const postMessage = vi.fn();
    window.ReactNativeWebView = { postMessage };

    emitGameEvent({ type: "word_presented", lang: "english", level_id: "001", word: "cat" }, "user-1");

    expect(postMessage).toHaveBeenCalledOnce();
    const message = JSON.parse(postMessage.mock.calls[0][0]);
    expect(message.type).toBe("cr_event");
    expect(message.payload).toMatchObject({
      cr_user_id: "user-1",
      sub_app_id: "spin-the-wheels",
      payload_version: 1,
      collection: "user_sessions_data",
      data: { type: "word_presented", lang: "english", level_id: "001", word: "cat" },
    });
    expect(message.payload.payload_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(Number.isNaN(Date.parse(message.payload.timestamp))).toBe(false);
    expect(postMessage.mock.calls[0][0].length).toBeLessThan(64 * 1024);
  });

  it("does nothing when the container bridge is unavailable", () => {
    expect(() => emitGameEvent({ type: "game_started", lang: "english" }, "")).not.toThrow();
  });

  it("contains bridge exceptions so reporting cannot break gameplay", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    window.ReactNativeWebView = {
      postMessage: () => {
        throw new Error("bridge failed");
      },
    };

    expect(() => emitGameEvent({ type: "game_started", lang: "english" }, "")).not.toThrow();
    expect(error).toHaveBeenCalledOnce();
  });
});
