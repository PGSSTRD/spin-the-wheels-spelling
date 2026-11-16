import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import levelsData from "../content/lang/english/levels.json";
import { parseLevels } from "./levels";
import { App } from "./App";

const levels = parseLevels(levelsData);

beforeEach(() => {
  delete window.ReactNativeWebView;
  window.history.replaceState({}, "", "?cr_lang=english&cr_user_id=test-user");
});

afterEach(() => {
  cleanup();
  delete window.ReactNativeWebView;
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Spin the Wheels", () => {
  it("defaults to English when opened in a plain browser without cr_lang", async () => {
    window.history.replaceState({}, "", "/");
    const loadLevelData = vi.fn(async () => levels);

    render(<App loadLevelData={loadLevelData} random={() => 0} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(loadLevelData).toHaveBeenCalledWith("english");
    expect(screen.getByRole("button", { name: "Spin" })).toBeEnabled();
  });

  it("requires cr_lang when launched with the Curious Reader bridge", async () => {
    window.history.replaceState({}, "", "/");
    window.ReactNativeWebView = { postMessage: vi.fn() };
    const loadLevelData = vi.fn(async () => levels);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<App loadLevelData={loadLevelData} />);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("launch is missing its game language");
    expect(loadLevelData).not.toHaveBeenCalled();
  });

  it("loads a level, spins to a configured word, and keeps selection disabled during the spin", async () => {
    vi.useFakeTimers();
    const audioPlay = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("Audio", class {
      onerror: (() => void) | null = null;
      play: typeof audioPlay;
      constructor(_source: string) {
        this.play = audioPlay;
      }
    });

    render(<App loadLevelData={async () => levels} random={() => 0} />);
    await act(async () => {
      await Promise.resolve();
    });
    const button = screen.getByRole("button", { name: "Spin" });

    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(screen.getByText("Here comes your word…")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spin again" })).toBeEnabled();
    expect(audioPlay).toHaveBeenCalledOnce();
  });

  it("allows choosing one of the configured levels", async () => {
    render(<App loadLevelData={async () => levels} random={() => 0} />);

    await act(async () => {
      await Promise.resolve();
    });
    const chooser = screen.getByRole("combobox", { name: "Choose level" });
    fireEvent.change(chooser, { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Spin" }));

    expect(screen.getByRole("button", { name: "Spinning…" })).toBeDisabled();
  });

  it("shows a blocking error when level data cannot be loaded", async () => {
    render(<App loadLevelData={async () => { throw new Error("Invalid level data."); }} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid level data.");
    expect(screen.queryByRole("button", { name: "Spin" })).not.toBeInTheDocument();
  });

  it("tries the supported WAV pronunciation when the MP3 is unavailable", async () => {
    vi.useFakeTimers();
    const sources: string[] = [];
    let attempts = 0;
    vi.stubGlobal("Audio", class {
      onerror: (() => void) | null = null;
      src = "";
      play() {
        sources.push(this.src);
        attempts += 1;
        return attempts === 1
          ? Promise.reject(new Error("MP3 unavailable"))
          : Promise.resolve();
      }
    });

    render(<App loadLevelData={async () => levels} random={() => 0} />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(sources).toEqual([
      "lang/english/audios/cat.mp3",
      "lang/english/audios/cat.wav",
    ]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows explicit image and audio fallbacks when media is unavailable", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("Audio", class {
      onerror: (() => void) | null = null;
      play: () => Promise<void>;
      constructor(_source: string) {
        this.play = vi.fn().mockRejectedValue(new Error("Audio unavailable"));
      }
    });

    render(<App loadLevelData={async () => levels} random={() => 0} />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole("button", { name: "Spin" }));
    await act(async () => {
      vi.advanceTimersByTime(1500);
      await Promise.resolve();
      await Promise.resolve();
    });

    fireEvent.error(screen.getByRole("img", { name: "cat" }));
    expect(screen.getByRole("img", { name: "Picture of cat is unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Audio for “cat” is unavailable.");
  });
});
