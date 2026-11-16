import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadLevels } from "./levels";
import { emitGameEvent } from "./reporting";
import type { GameStatus, Level } from "./types";
import { Wheel } from "./Wheel";

interface AppProps {
  loadLevelData?: (language: string) => Promise<Level[]>;
  random?: () => number;
}

const INSTRUCTION = "Give the wheels a spin and spell a word!";

function initialLetters(level: Level): string[] {
  return level.spinners.map((spinner) => spinner.letter_list.length === 1 ? spinner.letter_list[0] : "?");
}

export function App({
  loadLevelData = loadLevels,
  random = Math.random,
}: AppProps) {
  const [status, setStatus] = useState<GameStatus>("loading");
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [word, setWord] = useState("");
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [feedback, setFeedback] = useState(INSTRUCTION);
  const [pictureReady, setPictureReady] = useState(false);
  const [dragging, setDragging] = useState<Set<number>>(new Set());
  const [cycle, setCycle] = useState(0);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const stopAudioRef = useRef<(() => void) | undefined>(undefined);
  const gameStartedRef = useRef(false);
  const loadLevelDataRef = useRef(loadLevelData);

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const isContainerLaunch = typeof window.ReactNativeWebView?.postMessage === "function";
  const language = query.get("cr_lang") ?? (isContainerLaunch ? "" : "english");
  const userId = query.get("cr_user_id") ?? "";
  const level = levels[levelIndex];
  const canFind = status === "ready" || status === "correct";
  const canSpell = status === "spelling" && pictureReady && dragging.size === 0;
  const wheelsEnabled = pictureReady && (status === "awaiting-change" || status === "spelling");

  useEffect(() => {
    let active = true;
    if (!language) {
      console.error("Could not load level data: the cr_lang launch parameter is missing.");
      setErrorMessage("The Curious Reader launch is missing its game language. Please reopen the game.");
      setStatus("data-error");
      return () => {
        active = false;
      };
    }

    loadLevelDataRef.current(language)
      .then((loadedLevels) => {
        if (!active) return;
        setLevels(loadedLevels);
        setSelectedLetters(initialLetters(loadedLevels[0]));
        setStatus("ready");
        if (!gameStartedRef.current) {
          gameStartedRef.current = true;
          emitGameEvent({ type: "game_started", lang: language }, userId);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error("Could not load level data.", error);
        setErrorMessage(error instanceof Error ? error.message : "The game data could not be loaded.");
        setStatus("data-error");
      });

    return () => {
      active = false;
      stopAudioRef.current?.();
    };
  }, [language, userId]);

  const selectLevel = (nextIndex: number) => {
    stopAudioRef.current?.();
    setLevelIndex(nextIndex);
    setWord("");
    setSelectedLetters(initialLetters(levels[nextIndex]));
    setFeedback(INSTRUCTION);
    setPictureReady(false);
    setDragging(new Set());
    setCycle((current) => current + 1);
    setImageUnavailable(false);
    setAudioUnavailable(false);
    setStatus("ready");
  };

  const findWord = () => {
    if (!canFind || !level) return;
    const candidates = level.word_list.length > 1
      ? level.word_list.filter((candidate) => candidate !== word)
      : level.word_list;
    const selectedIndex = Math.min(
      candidates.length - 1,
      Math.max(0, Math.floor(random() * candidates.length)),
    );
    const nextWord = candidates[selectedIndex];

    stopAudioRef.current?.();
    setWord(nextWord);
    setSelectedLetters(initialLetters(level));
    setFeedback(INSTRUCTION);
    setPictureReady(false);
    setDragging(new Set());
    setCycle((current) => current + 1);
    setImageUnavailable(false);
    setAudioUnavailable(false);
    setStatus(level.spinners.every((spinner) => spinner.letter_list.length === 1) ? "spelling" : "awaiting-change");
    emitGameEvent({ type: "word_presented", lang: language, level_id: level.level_id, word: nextWord }, userId);
    stopAudioRef.current = playAudio(
      [`lang/${language}/audios/${nextWord}.mp3`, `lang/${language}/audios/${nextWord}.wav`],
      `pronunciation for ${nextWord}`,
      setAudioUnavailable,
    );
  };

  const changeLetter = (index: number, letter: string) => {
    if (!wheelsEnabled) return;
    setSelectedLetters((current) => current.map((value, position) => position === index ? letter : value));
    setFeedback(INSTRUCTION);
    setStatus("spelling");
  };

  const changeDragging = useCallback((index: number, active: boolean) => {
    setDragging((current) => {
      const next = new Set(current);
      if (active) next.add(index);
      else next.delete(index);
      return next;
    });
  }, []);

  const spell = () => {
    if (!canSpell) return;
    if (selectedLetters.join("") === word) {
      setFeedback("Correct!");
      setStatus("correct");
      stopAudioRef.current?.();
      stopAudioRef.current = undefined;
    } else {
      setFeedback("Please try again!");
    }
  };

  if (status === "loading") {
    return (
      <main className="page-shell">
        <section className="game-card loading-card" aria-live="polite">
          <span className="eyebrow">SPIN THE WHEELS</span>
          <p>Loading your spelling game…</p>
        </section>
      </main>
    );
  }

  if (status === "data-error") {
    return (
      <main className="page-shell">
        <section className="game-card error-card" role="alert">
          <span className="eyebrow">SPIN THE WHEELS</span>
          <h1>We couldn’t load this game</h1>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  if (!level) return null;

  return (
    <main className="page-shell">
      <section className="game-card">
        <header className="game-header">
          <div className="brand-mark" aria-hidden="true">S</div>
          <div>
            <span className="eyebrow">A LITTLE WORD MAGIC</span>
            <h1>Spin the Wheels</h1>
          </div>
          <label className="level-picker">
            <span>Level</span>
            <select
              aria-label="Choose level"
              value={levelIndex}
              onChange={(event) => selectLevel(Number(event.currentTarget.value))}
            >
              {levels.map((item, index) => (
                <option key={item.level_id} value={index}>Level {Number(item.level_id)}</option>
              ))}
            </select>
          </label>
        </header>

        <p className="instruction" role="status">{feedback}</p>

        <div className="word-result" aria-live="polite" aria-atomic="true">
          {word ? (
            <span className="spelled-word">{word}</span>
          ) : (
            <span className="result-prompt">Your word will appear here</span>
          )}
        </div>

        {word && (
          <section className="picture-panel" aria-label={`Picture for ${word}`} key={`${cycle}-${word}`}>
            {imageUnavailable ? (
              <div className="media-fallback" role="img" aria-label={`Picture of ${word} is unavailable`}>
                <span aria-hidden="true">🖼️</span>
                <p>Picture for <strong>{word}</strong> is unavailable.</p>
              </div>
            ) : (
              <img
                className="word-picture"
                src={`assets/images/${word}.png`}
                alt={word}
                onLoad={() => setPictureReady(true)}
                onError={() => {
                  setImageUnavailable(true);
                  setPictureReady(true);
                }}
              />
            )}
          </section>
        )}

        <div className={`wheels${!word ? " wheels-awaiting-word" : ""}${status === "correct" ? " wheels-correct" : ""}`} role="group" aria-label="Spelling wheels">
          {level.spinners.map((spinner, index) => (
            <div className="wheel-column" key={`${level.level_id}-${cycle}-${spinner.id}`}>
              <span className="wheel-position-label" aria-hidden="true">
                {["FIRST", "MIDDLE", "LAST"][index]}
              </span>
              <Wheel
                letters={spinner.letter_list}
                value={selectedLetters[index]}
                label={`${["First", "Middle", "Last"][index]} letter${spinner.letter_list.length === 1 ? `: ${spinner.letter_list[0]} (fixed)` : ""}`}
                enabled={wheelsEnabled}
                onChange={(letter) => changeLetter(index, letter)}
                onDraggingChange={(active) => changeDragging(index, active)}
              />
            </div>
          ))}
        </div>

        <button className="spin-button" type="button" onClick={canFind ? findWord : spell} disabled={!canFind && !canSpell}>
          {status === "spelling" ? "Spell" : "Find a word"}
        </button>
        {audioUnavailable && word && (
          <p className="media-status" role="status">Audio for “{word}” is unavailable.</p>
        )}
        <footer className="game-footer">One word at a time. You’ve got this!</footer>
      </section>
    </main>
  );
}

function playAudio(
  sources: string[],
  description: string,
  setUnavailable: (value: boolean) => void,
): () => void {
  let active = true;
  let audio: HTMLAudioElement | undefined;
  try {
    const player = new Audio();
    audio = player;

    const tryFormat = (formatIndex: number) => {
      let handled = false;
      const handleFailure = (error?: unknown) => {
        if (handled || !active) return;
        handled = true;
        if (formatIndex + 1 < sources.length) {
          tryFormat(formatIndex + 1);
        } else {
          console.warn(`Could not play ${description}.`, error);
          setUnavailable(true);
        }
      };

      player.onerror = () => handleFailure();
      player.src = sources[formatIndex];
      void player.play().catch(handleFailure);
    };

    tryFormat(0);
  } catch (error) {
    console.warn(`Could not start ${description}.`, error);
    setUnavailable(true);
  }
  return () => {
    active = false;
    if (audio) {
      audio.onerror = null;
      audio.pause();
    }
  };
}
