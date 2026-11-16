import type { Level, Spinner } from "./types";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSpinner(value: unknown, index: number, levelId: string): Spinner {
  if (!isRecord(value)) {
    throw new Error(`Level ${levelId} spinner ${index + 1} is invalid.`);
  }

  const spinnerId = `spinner${index + 1}`;
  const definition = value[spinnerId];
  if (!isRecord(definition) || !Array.isArray(definition.letter_list)) {
    throw new Error(`Level ${levelId} is missing ${spinnerId} letters.`);
  }

  const letters = definition.letter_list;
  if (
    letters.length === 0 ||
    letters.some((letter) => typeof letter !== "string" || !/^[a-z]$/i.test(letter))
  ) {
    throw new Error(`Level ${levelId} ${spinnerId} must contain English letters.`);
  }

  const normalizedLetters = letters.map((letter) => (letter as string).toLowerCase());
  if (new Set(normalizedLetters).size !== normalizedLetters.length) {
    throw new Error(`Level ${levelId} ${spinnerId} contains duplicate letters.`);
  }

  if (index === 1 && normalizedLetters.some((letter) => !VOWELS.has(letter))) {
    throw new Error(`Level ${levelId} middle spinner must contain vowels only.`);
  }

  return { id: spinnerId, letter_list: normalizedLetters };
}

export function parseLevels(value: unknown): Level[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Level data must be a non-empty array.");
  }

  const ids = new Set<string>();
  return value.map((entry, levelIndex) => {
    if (!isRecord(entry) || typeof entry.level_id !== "string" || entry.level_id.length === 0) {
      throw new Error(`Level ${levelIndex + 1} has no valid level_id.`);
    }

    const levelId = entry.level_id;
    if (ids.has(levelId)) {
      throw new Error(`Duplicate level_id: ${levelId}.`);
    }
    ids.add(levelId);

    if (!Array.isArray(entry.spinners) || entry.spinners.length !== 3) {
      throw new Error(`Level ${levelId} must define exactly three spinners.`);
    }
    const spinners = entry.spinners.map((spinner, index) =>
      normalizeSpinner(spinner, index, levelId),
    ) as [Spinner, Spinner, Spinner];

    if (
      !Array.isArray(entry.word_list) ||
      entry.word_list.length === 0 ||
      entry.word_list.some((word) => typeof word !== "string" || !/^[a-z]{3}$/.test(word))
    ) {
      throw new Error(`Level ${levelId} must contain three-letter English words.`);
    }

    const words = entry.word_list as string[];
    if (new Set(words).size !== words.length) {
      throw new Error(`Level ${levelId} contains duplicate words.`);
    }

    for (const word of words) {
      for (let position = 0; position < spinners.length; position += 1) {
        if (!spinners[position].letter_list.includes(word[position])) {
          throw new Error(`Word "${word}" cannot be spelled with level ${levelId} spinners.`);
        }
      }
    }

    return { level_id: levelId, spinners, word_list: words };
  });
}

export function loadLevels(
  language: string,
  createRequest: () => XMLHttpRequest = () => new XMLHttpRequest(),
): Promise<Level[]> {
  if (language !== "english") {
    return Promise.reject(new Error(`Language "${language}" is not available.`));
  }

  return new Promise((resolve, reject) => {
    const request = createRequest();
    request.open("GET", `lang/${language}/levels.json`, true);
    request.onload = () => {
      if (request.status !== 0 && request.status !== 200) {
        reject(new Error(`Could not load level data (HTTP ${request.status}).`));
        return;
      }

      try {
        resolve(parseLevels(JSON.parse(request.responseText) as unknown));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Level data is invalid."));
      }
    };
    request.onerror = () => reject(new Error("Could not load local level data."));
    request.send();
  });
}
