import levelsData from "../content/lang/english/levels.json";
import { describe, expect, it, vi } from "vitest";
import { loadLevels, parseLevels } from "./levels";

describe("parseLevels", () => {
  it("accepts the five configured three-letter MVP levels", () => {
    const levels = parseLevels(levelsData);

    expect(levels.map((level) => level.level_id)).toEqual(["001", "002", "003", "004", "005"]);
    for (const level of levels) {
      expect(level.spinners).toHaveLength(3);
      expect(level.word_list.every((word) => word.length === 3)).toBe(true);
      expect(level.spinners[1].letter_list.every((letter) => "aeiou".includes(letter))).toBe(true);
      for (const word of level.word_list) {
        expect(level.spinners.every((spinner, index) => spinner.letter_list.includes(word[index]))).toBe(true);
      }
    }
  });

  it.each([
    ["empty level list", []],
    ["four spinners", [{ level_id: "x", word_list: ["cat"], spinners: [{}, {}, {}, {}] }]],
    ["unsupported word length", [{ level_id: "x", word_list: ["cats"], spinners: [{}, {}, {}] }]],
    [
      "consonant in middle spinner",
      [{
        level_id: "x",
        word_list: ["cat"],
        spinners: [
          { spinner1: { letter_list: ["c"] } },
          { spinner2: { letter_list: ["b"] } },
          { spinner3: { letter_list: ["t"] } },
        ],
      }],
    ],
  ])("rejects %s", (_description, input) => {
    expect(() => parseLevels(input)).toThrow();
  });
});

describe("loadLevels", () => {
  it("loads local XHR status 0 data for file-origin compatibility", async () => {
    const request = {
      status: 0,
      responseText: JSON.stringify(levelsData),
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      open: vi.fn(),
      send: vi.fn(function (this: { onload: (() => void) | null }) {
        this.onload?.();
      }),
    };

    const levels = await loadLevels("english", () => request as unknown as XMLHttpRequest);

    expect(request.open).toHaveBeenCalledWith("GET", "lang/english/levels.json", true);
    expect(levels).toHaveLength(5);
  });

  it("rejects unsupported language codes", async () => {
    await expect(loadLevels("unknown")).rejects.toThrow('Language "unknown" is not available.');
  });
});
