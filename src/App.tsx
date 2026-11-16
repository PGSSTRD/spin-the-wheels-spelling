import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadLevels } from "./levels";
import { emitGameEvent } from "./reporting";
import type { GameStatus, Level } from "./types";
import { Wheel } from "./Wheel";

interface AppProps {
  loadLevelData?: (language: string) => Promise<Level[]>;
  random?: () => number;
  spinDuration?: number;
}

const SPIN_DURATION_MS = 1500;

export function App({
  loadLevelData = loadLevels,
  random = Math.random,
  spinDuration = SPIN_DURATION_MS,
}: AppProps) {
  const [status, setStatus] = useState<GameStatus>("loading");
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelIndex, setLevelIndex] = useState(0);
  const [word, setWord] = useState("");
  const [spinToken, setSpinToken] = useState(0);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const timeoutRef = useRef<number | undefined>(undefined);
  const gameStartedRef = useRef(false);
  const loadLevelDataRef = useRef(loadLevelData);

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const isContainerLaunch = typeof window.ReactNativeWebView?.postMessage === "function";
  const language = query.get("cr_lang") ?? (isContainerLaunch ? "" : "english");
  const userId = query.get("cr_user_id") ?? "";
  const level = levels[levelIndex];
  const canSpin = status === "ready" || status === "result";

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
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
    };
  }, [language, userId]);

  const selectLevel = useCallback((nextIndex: number) => {
    setLevelIndex(nextIndex);
    setWord("");
    setImageUnavailable(false);
    setAudioUnavailable(false);
    setStatus("ready");
  }, []);

  const spin = useCallback(() => {
    if (!canSpin || !level) return;
    const selectedIndex = Math.min(
      level.word_list.length - 1,
      Math.max(0, Math.floor(random() * level.word_list.length)),
    );
    const nextWord = level.word_list[selectedIndex];

    setWord(nextWord);
    setImageUnavailable(false);
    setAudioUnavailable(false);
    setStatus("spinning");
    setSpinToken((current) => current + 1);

    timeoutRef.current = window.setTimeout(() => {
      setStatus("result");
      emitGameEvent({ type: "word_presented", lang: language, level_id: level.level_id, word: nextWord }, userId);
      playWordAudio(language, nextWord, setAudioUnavailable);
    }, spinDuration);
  }, [canSpin, language, level, random, spinDuration, userId]);

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
              disabled={status === "spinning"}
            >
              {levels.map((item, index) => (
                <option key={item.level_id} value={index}>Level {Number(item.level_id)}</option>
              ))}
            </select>
          </label>
        </header>

        <p className="instruction">Give the wheels a spin and discover a word!</p>

        <div className="wheels" role="group" aria-label="Spelling wheels">
          {level.spinners.map((spinner, index) => (
            <div className="wheel-column" key={`${level.level_id}-${spinner.id}`}>
              <span className="wheel-position-label" aria-hidden="true">
                {["FIRST", "MIDDLE", "LAST"][index]}
              </span>
              <Wheel
                letters={spinner.letter_list}
                value={word[index] ?? spinner.letter_list[0]}
                spinToken={spinToken}
                spinning={status === "spinning"}
              />
            </div>
          ))}
        </div>

        <div className="word-result" aria-live="polite" aria-atomic="true">
          {status === "spinning" ? (
            <span className="result-prompt">Here comes your word…</span>
          ) : status === "result" ? (
            <span className="spelled-word">{word}</span>
          ) : (
            <span className="result-prompt">Your word will appear here</span>
          )}
        </div>

        {status === "result" && (
          <section className="picture-panel" aria-label={`Picture for ${word}`}>
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
                onError={() => setImageUnavailable(true)}
              />
            )}
          </section>
        )}

        <button className="spin-button" type="button" onClick={spin} disabled={!canSpin}>
          <span aria-hidden="true" className={status === "spinning" ? "button-spinner" : ""}>⟳</span>
          {status === "spinning" ? "Spinning…" : status === "result" ? "Spin again" : "Spin"}
        </button>
        {audioUnavailable && status === "result" && (
          <p className="media-status" role="status">Audio for “{word}” is unavailable.</p>
        )}
        <footer className="game-footer">One word at a time. You’ve got this!</footer>
      </section>
    </main>
  );
}

function playWordAudio(language: string, word: string, setUnavailable: (value: boolean) => void): void {
  try {
    const audio = new Audio();
    const formats = ["mp3", "wav"];

    const tryFormat = (formatIndex: number) => {
      let handled = false;
      const handleFailure = (error?: unknown) => {
        if (handled) return;
        handled = true;
        if (formatIndex + 1 < formats.length) {
          tryFormat(formatIndex + 1);
        } else {
          console.warn(`Could not play pronunciation for ${word}.`, error);
          setUnavailable(true);
        }
      };

      audio.onerror = () => handleFailure();
      audio.src = `lang/${language}/audios/${word}.${formats[formatIndex]}`;
      void audio.play().catch(handleFailure);
    };

    tryFormat(0);
  } catch (error) {
    console.warn(`Could not start pronunciation for ${word}.`, error);
    setUnavailable(true);
  }
}
