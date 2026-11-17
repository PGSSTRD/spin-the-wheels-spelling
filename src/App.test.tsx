import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import levelsData from "../content/lang/english/levels.json";
import { parseLevels } from "./levels";
import { App } from "./App";
import type { Level } from "./types";
import mutedIcon from "../content/assets/icons/audio-muted.svg";
import unmutedIcon from "../content/assets/icons/audio-unmuted-v2.svg";

const levels = parseLevels(levelsData);
const instruction = "Give the wheels a spin and spell a word!";
const retrySource = "lang/english/audio/please-try-again.mp3";
let audioPlay: ReturnType<typeof vi.fn<() => Promise<void>>>;
let audioPause: ReturnType<typeof vi.fn>;
let audioSources: string[];
let audioPlayers: {
  onended: (() => void) | null;
  onplaying: (() => void) | null;
  onerror: (() => void) | null;
}[];
let audioChecks: {
  src: string;
  onloadeddata: (() => void) | null;
  onerror: (() => void) | null;
}[];
let audioCheckSources: string[];

beforeEach(() => {
  delete window.ReactNativeWebView;
  window.history.replaceState({}, "", "?cr_lang=english&cr_user_id=test-user");
  audioPlay = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  audioPause = vi.fn();
  audioSources = [];
  audioPlayers = [];
  audioChecks = [];
  audioCheckSources = [];
  sessionStorage.clear();
  vi.stubGlobal("Audio", class {
    src = "";
    onerror: (() => void) | null = null;
    onended: (() => void) | null = null;
    onplaying: (() => void) | null = null;
    onloadeddata: (() => void) | null = null;
    play() {
      if (!audioPlayers.includes(this)) audioPlayers.push(this);
      audioSources.push(this.src);
      return audioPlay();
    }
    load() {
      if (this.src && !audioChecks.includes(this)) {
        audioChecks.push(this);
        audioCheckSources.push(this.src);
      }
    }
    removeAttribute(name: string) {
      if (name === "src") this.src = "";
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

function controlAnimationFrames() {
  let nextId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callbacks.set(++nextId, callback);
    return nextId;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    callbacks.delete(id);
  });
  return () => act(() => {
    const frame = [...callbacks.values()];
    callbacks.clear();
    frame.forEach((callback) => callback(performance.now()));
  });
}

function failAudioChecks() {
  act(() => {
    let check = audioChecks.at(-1);
    while (check?.onerror) {
      check.onerror();
      const next = audioChecks.at(-1);
      if (next === check) break;
      check = next;
    }
  });
}

describe("manual spelling cycle", () => {
  it("mutes every gameplay cue, keeps visual feedback, and preserves mute across levels", async () => {
    await openGame();
    const toggle = screen.getByRole("button", { name: "Mute audio" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAccessibleName("Unmute audio");
    expect(toggle.querySelector("img")).toHaveAttribute("src", mutedIcon);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    findWord(false, "cap");
    const wheel = screen.getByRole("spinbutton");
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(wheel).toHaveClass("wheel-incorrect");
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("group", { name: "Spelling wheels" })).toHaveClass("wheels-correct");
    expect(audioPlay).not.toHaveBeenCalled();
    expect(screen.queryByText(/audio.*unavailable/i)).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAccessibleName("Mute audio");
    expect(toggle.querySelector("img")).toHaveAttribute("src", unmutedIcon);
    expect(audioPlay).not.toHaveBeenCalled();
    findWord(false, "map");
    expect(audioSources).toEqual(["lang/english/audio/words/map.mp3"]);
  });

  it.each(["pronunciation", "correct", "success word"])("immediately cancels %s when muting and ignores stale callbacks", async (phase) => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    findWord();
    if (phase !== "pronunciation") {
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
      fireEvent.click(screen.getByRole("button", { name: "Spell" }));
      if (phase === "success word") act(() => audioPlayers[1].onended?.());
    }
    const player = audioPlayers.at(-1)!;
    const { onended, onplaying, onerror } = player;
    audioPause.mockClear();
    const sources = [...audioSources];
    fireEvent.click(screen.getByRole("button", { name: "Mute audio" }));
    expect(audioPause).toHaveBeenCalledOnce();
    act(() => { onended?.(); onplaying?.(); onerror?.(); });
    expect(audioSources).toEqual(sources);
    expect(warning).not.toHaveBeenCalled();
    if (phase !== "pronunciation") {
      expect(screen.getByRole("group", { name: "Spelling wheels" })).toHaveClass("wheels-correct");
    }
    fireEvent.click(screen.getByRole("button", { name: "Unmute audio" }));
    expect(audioSources).toEqual(sources);
  });

  it("checks one clip at a time, keeps pending checks enabled, and stops at the first usable clip", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    expect(audioCheckSources).toEqual(["lang/english/audio/correct.mp3"]);
    expect(audioPlay).not.toHaveBeenCalled();
    for (let index = 0; index < 3; index += 1) {
      act(() => audioChecks[index].onerror?.());
      expect(audioChecks.filter((check) => check.src)).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Mute audio" })).toBeEnabled();
    }
    expect(audioCheckSources).toEqual([
      "lang/english/audio/correct.mp3", retrySource, "lang/english/audio/level-1.mp3",
      "lang/english/audio/words/cat.mp3",
    ]);
    act(() => audioChecks.at(-1)?.onloadeddata?.());
    expect(screen.getByRole("button", { name: "Mute audio" })).toBeEnabled();
    expect(audioChecks).toHaveLength(4);
    expect(audioChecks.every((check) => check.src === "" && check.onerror === null)).toBe(true);
  });

  it("only probes one shared clip when it is usable, even in the largest level", async () => {
    await openGame([levels[4]]);
    expect(audioChecks).toHaveLength(1);
    act(() => audioChecks[0].onloadeddata?.());
    expect(audioChecks).toHaveLength(1);
    expect(audioPlay).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Mute audio" })).toBeEnabled();
  });

  it("disables only after every clip fails, rechecks new levels and ignores stale results", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    const staleSuccess = audioChecks[0].onloadeddata;
    failAudioChecks();
    expect(audioCheckSources).toEqual([
      "lang/english/audio/correct.mp3", retrySource, "lang/english/audio/level-1.mp3",
      ...levels[0].word_list.map((word) => `lang/english/audio/words/${word}.mp3`),
    ]);
    const unavailable = screen.getByRole("button", { name: "Audio unavailable for this level" });
    expect(unavailable).toBeDisabled();
    expect(unavailable.querySelector("img")).toHaveAttribute("src", unmutedIcon);
    fireEvent.click(unavailable);
    expect(unavailable).toHaveAttribute("aria-pressed", "false");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    expect(audioSources).toEqual(["lang/english/audio/level-2.mp3"]);
    expect(screen.getByRole("button", { name: "Mute audio" })).toBeEnabled();
    failAudioChecks();
    act(() => staleSuccess?.());
    expect(screen.getByRole("button", { name: "Audio unavailable for this level" })).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "0" } });
    act(() => audioChecks.at(-1)?.onloadeddata?.());
    expect(screen.getByRole("button", { name: "Mute audio" })).toBeEnabled();
  });

  it("does not mistake autoplay rejection for absent audio", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    act(() => audioChecks[0].onloadeddata?.());
    audioPlay.mockRejectedValueOnce(new DOMException("Interaction required", "NotAllowedError"));
    findWord();
    expect(await screen.findByText("Audio for “cat” is unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mute audio" })).toBeEnabled();
  });

  it.each([false, true])("keeps mute preference=%s through an unavailable level and still allows silent spelling", async (muted) => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    if (muted) fireEvent.click(screen.getByRole("button", { name: "Mute audio" }));
    failAudioChecks();
    expect(screen.getByRole("button", { name: "Audio unavailable for this level" })).toHaveAttribute("aria-pressed", String(muted));
    findWord();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("group", { name: "Spelling wheels" })).toHaveClass("wheels-correct");
    expect(audioPlay).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    act(() => audioChecks.at(-1)?.onloadeddata?.());
    expect(screen.getByRole("button", { name: muted ? "Unmute audio" : "Mute audio" })).toBeEnabled();
    expect(audioSources).toEqual(muted ? [] : ["lang/english/audio/level-2.mp3"]);
  });

  it.each(["navigate", "reload"])("restores mute only on reload, not a fresh %s launch", async (type) => {
    sessionStorage.setItem("spin-the-wheels-muted", "true");
    vi.stubGlobal("performance", { now: () => 0, getEntriesByType: () => [{ type }] });
    await openGame();
    expect(screen.getByRole("button", { name: type === "reload" ? "Unmute audio" : "Mute audio" })).toBeEnabled();
    expect(sessionStorage.getItem("spin-the-wheels-muted")).toBe(String(type === "reload"));
  });

  it("logs blocked preference storage without preventing mute", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Blocked", "SecurityError"); });
    await openGame();
    fireEvent.click(screen.getByRole("button", { name: "Mute audio" }));
    expect(screen.getByRole("button", { name: "Unmute audio" })).toBeEnabled();
    expect(warning).toHaveBeenCalledWith("Could not save the audio preference for a reload.", expect.any(DOMException));
  });

  it("starts silently without instruction playback, errors, or a retry button", async () => {
    const frame = controlAnimationFrames();
    await openGame();
    frame();
    frame();
    expect(audioPlay).not.toHaveBeenCalled();
    expect(audioPlayers).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Play instructions" })).not.toBeInTheDocument();
    expect(screen.queryByText("The instructions could not be played.")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
  });

  it("defaults to English and shows placeholders and fixed letters before selection", async () => {
    window.history.replaceState({}, "", "/");
    const load = await openGame();
    expect(load).toHaveBeenCalledWith("english");
    expect(audioSources).toEqual([]);
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
    expect(screen.getByRole("spinbutton", { name: "First letter" })).toHaveAttribute("aria-valuetext", "Not selected");
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("img", { name: "Middle letter: a (fixed)" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Last letter: t (fixed)" })).toBeInTheDocument();
    expect(screen.queryByText(/^(first|middle|last)$/i)).not.toBeInTheDocument();
  });

  it("announces only actual level changes, including returning to level 1", async () => {
    await openGame();
    const picker = screen.getByRole("combobox");
    fireEvent.change(picker, { target: { value: "0" } });
    expect(audioSources).toEqual([]);
    for (const index of [1, 2, 3, 4, 0]) {
      fireEvent.change(picker, { target: { value: String(index) } });
    }
    expect(audioSources).toEqual([
      ...[2, 3, 4, 5, 1].map((number) => `lang/english/audio/level-${number}.mp3`),
    ]);
  });

  it("replays try-again narration on each incorrect submission without overlapping audio", async () => {
    await openGame();
    findWord();
    const wheel = screen.getByRole("spinbutton");
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    audioPause.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(audioSources.slice(-2)).toEqual([retrySource, retrySource]);
    expect(audioPause).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Please try again!");
    expect(wheel).toHaveClass("wheel-incorrect");
  });

  it.each(["level", "retry"])("reports a non-blocking %s narration failure", async (cue) => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    if (cue === "retry") {
      findWord();
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
      fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    }
    audioPlay.mockRejectedValueOnce(new Error("Missing narration"));
    if (cue === "level") fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    else fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(await screen.findByText(cue === "level"
      ? "The level announcement could not be played."
      : "The try-again audio could not be played.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: cue === "level" ? "Find a word" : "Spell" })).toBeEnabled();
    expect(warning).toHaveBeenCalledWith(
      cue === "level" ? "Could not play level announcement." : "Could not play try-again audio.",
      expect.any(Error),
    );
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
    expect(audioPlay).toHaveBeenCalledTimes(1);
  });

  it("handles wrong attempts, clears feedback on change, locks success, and resets the next cycle", async () => {
    await openGame();
    findWord();
    const wheel = screen.getByRole("spinbutton");
    fireEvent.keyDown(wheel, { key: "ArrowUp" }); // c
    fireEvent.keyDown(wheel, { key: "ArrowUp" }); // m: another valid level word
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Please try again!");
    expect(wheel).toHaveClass("wheel-incorrect");
    expect(screen.getByRole("img", { name: "Middle letter: a (fixed)" })).not.toHaveClass("wheel-incorrect");
    expect(screen.getByRole("img", { name: "Last letter: t (fixed)" })).not.toHaveClass("wheel-incorrect");
    expect(audioSources).toEqual(["lang/english/audio/words/cat.mp3", retrySource]);
    expect(screen.getByRole("img", { name: "cat" })).toBeInTheDocument();
    fireEvent.keyDown(wheel, { key: "ArrowDown" });
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
    expect(wheel).not.toHaveClass("wheel-incorrect");
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    expect(wheel).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(wheel, { key: "ArrowUp" });
    expect(wheel).toHaveAttribute("aria-valuetext", "c");
    expect(audioSources).toEqual(["lang/english/audio/words/cat.mp3", retrySource, "lang/english/audio/correct.mp3"]);

    findWord(false, "mat");
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuetext", "Not selected");
    expect(screen.getByRole("status")).toHaveTextContent(instruction);
    expect(audioPlay).toHaveBeenCalledTimes(4);
    expect(audioPause).toHaveBeenCalledTimes(3);
  });

  it("plays correct audio before starting the word audio and gold flashes, including on later words", async () => {
    await openGame();
    findWord();
    const wheels = screen.getByRole("group", { name: "Spelling wheels" });
    expect(wheels).not.toHaveClass("wheels-correct");
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByText("Correct!")).toBeInTheDocument();
    expect(wheels).not.toHaveClass("wheels-correct");
    expect(audioSources).toEqual(["lang/english/audio/words/cat.mp3", "lang/english/audio/correct.mp3"]);
    act(() => audioPlayers[1].onplaying?.());
    expect(wheels).not.toHaveClass("wheels-correct");
    const correctEnded = audioPlayers[1].onended;
    act(() => {
      correctEnded?.();
      correctEnded?.();
    });
    expect(audioSources).toEqual([
      "lang/english/audio/words/cat.mp3", "lang/english/audio/correct.mp3", "lang/english/audio/words/cat.mp3",
    ]);
    expect(wheels).not.toHaveClass("wheels-correct");
    act(() => audioPlayers[1].onplaying?.());
    expect(wheels).toHaveClass("wheels-correct");
    findWord(false, "mat");
    expect(wheels).not.toHaveClass("wheels-correct");
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(wheels).not.toHaveClass("wheels-correct");
    act(() => audioPlayers[3].onended?.());
    act(() => audioPlayers[3].onplaying?.());
    expect(wheels).toHaveClass("wheels-correct");
    expect(audioSources.slice(-3)).toEqual([
      "lang/english/audio/words/mat.mp3", "lang/english/audio/correct.mp3", "lang/english/audio/words/mat.mp3",
    ]);
    expect(audioSources).not.toContain("lang/english/audio/give-the-wheels-a-spin.mp3");
  });

  it("continues to word playback and flashing if correct audio fails", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    findWord();
    audioPlay.mockRejectedValueOnce(new Error("Missing correct audio"));
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(await screen.findByText("The correct-answer audio is unavailable.")).toBeInTheDocument();
    expect(audioSources.slice(-2)).toEqual(["lang/english/audio/correct.mp3", "lang/english/audio/words/cat.mp3"]);
    act(() => audioPlayers[1].onplaying?.());
    expect(screen.getByRole("group", { name: "Spelling wheels" })).toHaveClass("wheels-correct");
    expect(warning).toHaveBeenCalledWith("Could not play correct-answer audio.", expect.any(Error));
  });

  it("still flashes and allows the next word if success pronunciation fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    findWord();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    audioPlay.mockRejectedValueOnce(new Error("Missing word audio"));
    act(() => audioPlayers[1].onended?.());
    expect(await screen.findByText("Audio for “cat” is unavailable.")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Spelling wheels" })).toHaveClass("wheels-correct");
    expect(screen.getByRole("button", { name: "Find a word" })).toBeEnabled();
    findWord(false, "mat");
    expect(screen.queryByText("Audio for “cat” is unavailable.")).not.toBeInTheDocument();
  });

  it.each([
    ["correct", "new word"], ["correct", "level change"], ["correct", "unmount"],
    ["word", "new word"], ["word", "level change"], ["word", "unmount"],
  ])("cancels the %s audio phase on %s and ignores stale callbacks", async (phase, action) => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    await openGame();
    findWord();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    if (phase === "word") act(() => audioPlayers[1].onended?.());
    const { onended, onplaying, onerror } = audioPlayers[1];
    audioPause.mockClear();
    if (action === "new word") findWord(false, "mat");
    else if (action === "level change") fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } });
    else cleanup();
    const sources = [...audioSources];
    expect(audioPause).toHaveBeenCalledOnce();
    act(() => {
      onended?.();
      onplaying?.();
      onerror?.();
    });
    expect(audioSources).toEqual(sources);
    expect(warning).not.toHaveBeenCalled();
    if (action !== "unmount") {
      expect(screen.getByRole("group", { name: "Spelling wheels" })).not.toHaveClass("wheels-correct");
    }
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

  it.each([2, 4])("requires every adjustable spinner to be chosen in level index %s before submitting", async (levelIndex) => {
    const random = vi.fn(() => 0);
    await openGame(levels, random);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: String(levelIndex) } });
    findWord();
    const playCount = audioPlay.mock.calls.length;
    const positions = [2, 0, 1].filter((index) => levels[levelIndex].spinners[index].letter_list.length > 1);
    for (const [chosen, index] of positions.entries()) {
      const label = `${["First", "Middle", "Last"][index]} letter`;
      const wheel = screen.getByRole("spinbutton", { name: label });
      const steps = levels[levelIndex].spinners[index].letter_list.indexOf("cat"[index]) + 1;
      for (let step = 0; step < steps; step += 1) fireEvent.keyDown(wheel, { key: "ArrowUp" });
      const button = screen.getByRole("button", { name: "Spell" });
      if (chosen < positions.length - 1) {
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(screen.getByRole("status")).toHaveTextContent(instruction);
        expect(screen.getByText("cat")).toBeInTheDocument();
        expect(audioPlay).toHaveBeenCalledTimes(playCount);
        expect(random).toHaveBeenCalledOnce();
        expect(document.querySelector(".wheel-incorrect")).toBeNull();
      } else {
        expect(button).toBeEnabled();
      }
    }
    fireEvent.click(screen.getByRole("button", { name: "Spell" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    findWord(false, "cam");
    expect(screen.getByRole("button", { name: "Find a word" })).toBeDisabled();
    for (const wheel of screen.getAllByRole("spinbutton")) {
      expect(wheel).toHaveAttribute("aria-valuetext", "Not selected");
    }
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
    expect(audioPause).toHaveBeenCalledTimes(1);
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
    expect(wheels.nextElementSibling).toBe(button.parentElement);
    findWord(true);
    const picture = screen.getByRole("region", { name: "Picture for cat" });
    expect(picture.nextElementSibling).toBe(wheels);
    expect(wheels.nextElementSibling).toBe(button.parentElement);
    expect(screen.getByRole("img", { name: "Picture of cat is unavailable" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Spell");
  });

  it("exposes a non-blocking error if the supplied word MP3 fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    audioPlay.mockRejectedValue(new Error("Missing audio"));
    await openGame();
    findWord();
    await act(async () => { await Promise.resolve(); });
    expect(audioSources).toEqual(["lang/english/audio/words/cat.mp3"]);
    expect(screen.getByText("Audio for “cat” is unavailable.")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("spinbutton"), { key: "ArrowUp" });
    expect(screen.getByRole("button", { name: "Spell" })).toBeEnabled();
  });
});
