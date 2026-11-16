import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import levelsData from "../content/lang/english/levels.json";
import { parseLevels } from "./levels";
import { App } from "./App";
import type { Level } from "./types";

const levels = parseLevels(levelsData);
const instruction = "Give the wheels a spin and spell a word!";
let audioPlay: ReturnType<typeof vi.fn<() => Promise<void>>>;
let audioPause: ReturnType<typeof vi.fn>;
let audioSources: string[];

beforeEach(() => {
  delete window.ReactNativeWebView;
  window.history.replaceState({}, "", "?cr_lang=english&cr_user_id=test-user");
  audioPlay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  audioPause = vi.fn();
  audioSources = [];
  vi.stubGlobal("Audio", class {
    src = "";
    onerror: (() => void) | null = null;
    play() {
      audioSources.push(this.src);
      return audioPlay();
    }
    pause = audioPause;
  });
});

afterEach(() => {
  cleanup();
  delete window.ReactNativeWebView;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function openGame(data = levels, random = () => 0) {
  const loadLevelData = vi.fn(async () => data);
  render(<App loadLevelData={loadLevelData} random={random} />);
  await screen.findByRole("button", { name: "Find a word" });
  return loadLevelData;
}

function findWord(fallback = false, word = "cat") {
  fireEvent.click(screen.getByRole("button", { name: "Find a word" }));
  const image = screen.getByRole("img", { name: word });
  if (fallback) fireEvent.error(image);
  else fireEvent.load(image);
}

describe("manual spelling cycle", () => {
  it("defaults to English and shows placeholders and fixed letters before selection", async () => {
    window.history.replaceState({}, "", "/");
    const load = await openGame();
    expect(load).toHaveBeenCalledWith("english");
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
    expect(screen.getByRole("spinbutton", { name: "First letter" })).toHaveAttribute("aria-valuetext", "Not selected");
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("img", { name: "Middle letter: a (fixed)" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Last letter: t (fixed)" })).toBeInTheDocument();
  });

  it("requires cr_lang in the container", async () => {
    window.history.replaceState({}, "", "/");
    window.ReactNativeWebView = { postMessage: vi.fn() };
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const load = vi.fn(async () => levels);
    render(<App loadLevelData={load} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("launch is missing its game language");
    expect(load).not.toHaveBeenCalled();
  });

  it("shows a blocking load error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<App loadLevelData={async () => { throw new Error("Invalid level data."); }} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid level data.");
  });

  it("finds a target without changing wheels, pronounces once, and waits for picture presentation", async () => {
    const random = vi.fn(() => 0);
    await openGame(levels, random);
    fireEvent.click(screen.getByRole("button", { name: "Find a word" }));
    const wheel = screen.getByRole("spinbutton");
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(wheel).toHaveAttribute("aria-disabled", "true");
    expect(wheel).toHaveAttribute("aria-valuetext", "Not selected");
    expect(screen.getByRole("button", { name: "Find a word" })).toBeDisabled();
    fireEvent.load(screen.getByRole("img", { name: "cat" }));
    expect(wheel).toHaveAttribute("aria-disabled", "false");
    fireEvent.click(screen.getByRole("button", { name: "Find a word" }));
    expect(random).toHaveBeenCalledOnce();
    expect(audioPlay).toHaveBeenCalledOnce();
  });

  it("handles wrong attempts, clears feedback on change, locks success, and resets the next cycle", async () => {
    await openGame();
    findWord();
    const wheel = screen.getByRole("spinbutton");
    fireEvent.keyDown(wheel, { key: "ArrowUp" }); // c
    fireEvent.keyDown(wheel, { key: "ArrowUp" }); // m: another valid level word
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Please try again!");
    expect(audioSources).toEqual(["lang/english/audios/cat.mp3"]);
    expect(screen.getByRole("img", { name: "cat" })).toBeInTheDocument();
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    expect(wheel).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    expect(wheel).toHaveAttribute("aria-valuetext", "c");
    expect(audioSources).toEqual(["lang/english/audios/cat.mp3"]);

    findWord(false, "mat");
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuetext", "Not selected");
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
    expect(audioPlay).toHaveBeenCalledTimes(2);
    expect(audioPause).toHaveBeenCalledOnce();
  });

  it("flashes immediately on success without playing a celebration sound, including on later words", async () => {
    await openGame();
    findWord();
    const wheels = screen.getByRole("group", { name: "Spelling wheels" });
    expect(wheels).not.toHaveClass("wheels-correct");
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(wheels).toHaveClass("wheels-correct");
    expect(audioSources).toEqual(["lang/english/audios/cat.mp3"]);
    findWord(false, "mat");
    expect(wheels).not.toHaveClass("wheels-correct");
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(wheels).toHaveClass("wheels-correct");
    expect(audioSources).toEqual(["lang/english/audios/cat.mp3", "lang/english/audios/mat.mp3"]);
  });

  it.each([
    { randomValue: 0, words: ["cat", "mat", "pat"], expected: ["cat", "mat", "cat"] },
    { randomValue: 0.5, words: ["cat", "mat", "pat"], expected: ["mat", "pat", "mat"] },
    { randomValue: 0.999, words: ["cat", "mat", "pat"], expected: ["pat", "mat", "pat"] },
    { randomValue: 0.999, words: ["cat", "mat"], expected: ["mat", "cat", "mat"] },
  ])("excludes the previous word with random=$randomValue and words=$words", async ({ randomValue, words, expected }) => {
    const random = vi.fn(() => randomValue);
    await openGame([{ ...levels[0], word_list: words }], random);

    for (const target of expected) {
      findWord(false, target);
      const wheel = screen.getByRole("spinbutton");
      const steps = levels[0].spinners[0].letter_list.indexOf(target[0]) + 1;
      for (let step = 0; step < steps; step += 1) {
        fireEvent.keyDown(wheel, { key: "ArrowUp" });
      }
      fireEvent.click(screen.getByRole("button", { name: "Spell" }));
      expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    }

    expect(random).toHaveBeenCalledTimes(expected.length);
  });

  it("tracks placeholders independently and rejects a submission with a remaining question mark", async () => {
    await openGame();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    findWord();
    const first = screen.getByRole("spinbutton", { name: "First letter" });
    const last = screen.getByRole("spinbutton", { name: "Last letter" });
    fireEvent.keyDown(first, { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Please try again!");
    expect(last).toHaveAttribute("aria-valuetext", "Not selected");
    fireEvent.keyDown(last, { key: "ArrowDown" }); // t, last configured letter
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
  });

  it("prevents submission during a drag and enables it after pointer cancellation", async () => {
    await openGame();
    findWord();
    const wheel = screen.getByRole("spinbutton");
    const sendPointer = (type: string, y: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, {
        pointerId: { value: 1 },
        isPrimary: { value: true },
        button: { value: 0 },
        clientY: { value: y },
      });
      fireEvent(wheel, event);
    };

    sendPointer("pointerdown", 100);
    sendPointer("pointermove", 60);
    const button = screen.getByRole("button", { name: "Spell" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
    sendPointer("pointercancel", 60);
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
  });

  it("resets the current attempt when changing levels", async () => {
    await openGame();
    findWord();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "4" } });
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
    for (const wheel of screen.getAllByRole("spinbutton")) {
      expect(wheel).toHaveAttribute("aria-valuetext", "Not selected");
      expect(wheel).toHaveAttribute("aria-disabled", "true");
    }
    expect(screen.queryByRole("region", { name: /Picture for/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find a word" })).toBeEnabled();
    expect(audioPause).toHaveBeenCalledOnce();
  });

  it("offers Spell immediately for an all-fixed level once the picture is shown", async () => {
    const fixed: Level = {
      level_id: "fixed",
      word_list: ["cat"],
      spinners: [
        { id: "spinner1", letter_list: ["c"] },
        { id: "spinner2", letter_list: ["a"] },
        { id: "spinner3", letter_list: ["t"] },
      ],
    };
    await openGame([fixed]);
    findWord();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    findWord();
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
  });

  it("keeps the approved layout and enables play when the image fallback is shown", async () => {
    await openGame();
    const wheels = screen.getByRole("group", { name: "Spelling wheels" });
    const button = screen.getByRole("button", { name: "Find a word" });
    expect(wheels.nextElementSibling).toBe(button);
    findWord(true);
    const picture = screen.getByRole("region", { name: "Picture for cat" });
    expect(picture.nextElementSibling).toBe(wheels);
    expect(wheels.nextElementSibling).toBe(button);
    expect(screen.getByRole("img", { name: "Picture of cat is unavailable" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Spell");
  });

  it("tries WAV after MP3 failure and exposes a non-blocking error if both fail", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const sources: string[] = [];
    vi.stubGlobal("Audio", class {
      src = "";
      pause = vi.fn();
      play() {
        sources.push(this.src);
        return Promise.reject(new Error("Missing audio"));
      }
    });
    await openGame();
    findWord();
    await act(async () => { await Promise.resolve(); });
    expect(sources).toEqual(["lang/english/audios/cat.mp3", "lang/english/audios/cat.wav"]);
    expect(screen.getByText("Audio for “cat” is unavailable.")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    expect(screen.getByRole("button", { name: "Spell" })).toBeEnabled();
  });
});
