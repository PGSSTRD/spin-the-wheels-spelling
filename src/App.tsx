import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadLevels } from "./levels";
import { emitGameEvent } from "./reporting";
import type { GameStatus, Level } from "./types";
import { Wheel } from "./Wheel";
import { checkLevelAudio, playAudio, type AudioTrack } from "./audio";
import mutedIcon from "../content/assets/icons/audio-muted.svg";
import unmutedIcon from "../content/assets/icons/audio-unmuted-v2.svg";

interface AppProps {
  loadLevelData?: (language: string) => Promise<Level[]>;
  random?: () => number;
}

const INSTRUCTION = "Give the wheels a spin and spell a word!";
const MUTE_STORAGE_KEY = "spin-the-wheels-muted";

function initialMuted(): boolean {
  const navigation = performance.getEntriesByType?.("navigation")[0];
  if (!navigation || !("type" in navigation) || navigation.type !== "reload") return false;
  try {
    return sessionStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch (error) {
    console.warn("Could not restore the audio preference for this reload.", error);
    return false;
  }
}

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
  const [incorrectAttempt, setIncorrectAttempt] = useState(0);
  const [pictureReady, setPictureReady] = useState(false);
  const [dragging, setDragging] = useState<Set<number>>(new Set());
  const [cycle, setCycle] = useState(0);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [correctAudioUnavailable, setCorrectAudioUnavailable] = useState(false);
  const [flashLetters, setFlashLetters] = useState(false);
  const [narrationError, setNarrationError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [muted, setMuted] = useState(initialMuted);
  const [audioAvailability, setAudioAvailability] = useState<{ level: Level; available: boolean }>();
  const stopAudioRef = useRef<(() => void) | undefined>(undefined);
  const gameStartedRef = useRef(false);
  const loadLevelDataRef = useRef(loadLevelData);

  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const isContainerLaunch = typeof window.ReactNativeWebView?.postMessage === "function";
  const language = query.get("cr_lang") ?? (isContainerLaunch ? "" : "english");
  const userId = query.get("cr_user_id") ?? "";
  const level = levels[levelIndex];
  const noAudio = audioAvailability?.available === false && audioAvailability.level === level;
  const audioLabel = noAudio ? "Audio unavailable for this level" : muted ? "Unmute audio" : "Mute audio";
  const canFind = status === "ready" || status === "correct";
  const canSpell = status === "spelling" && pictureReady && dragging.size === 0
    && selectedLetters.every((letter) => letter !== "?");
  const wheelsEnabled = pictureReady && (status === "awaiting-change" || status === "spelling");

  useEffect(() => {
    try {
      sessionStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch (error) {
      console.warn("Could not save the audio preference for a reload.", error);
    }
  }, [muted]);

  useEffect(() => {
    if (!level) return;
    return checkLevelAudio(level, language, (available) => setAudioAvailability({ level, available }));
  }, [level, language]);

  const playTracks = (tracks: AudioTrack[], audioLevel = level) => {
    stopAudioRef.current?.();
    stopAudioRef.current = undefined;
    if (muted || (audioAvailability?.available === false && audioAvailability.level === audioLevel)) {
      tracks.forEach((track) => track.onComplete?.());
      return;
    }
    stopAudioRef.current = playAudio(tracks);
  };

  const toggleMuted = () => {
    if (noAudio) return;
    if (!muted) {
      stopAudioRef.current?.();
      stopAudioRef.current = undefined;
      if (status === "correct") setFlashLetters(true);
    }
    setMuted(!muted);
  };

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
    if (nextIndex === levelIndex) return;
    setLevelIndex(nextIndex);
    setWord("");
    setSelectedLetters(initialLetters(levels[nextIndex]));
    setFeedback(INSTRUCTION);
    setIncorrectAttempt(0);
    setPictureReady(false);
    setDragging(new Set());
    setCycle((current) => current + 1);
    setImageUnavailable(false);
    setAudioUnavailable(false);
    setCorrectAudioUnavailable(false);
    setFlashLetters(false);
    setNarrationError("");
    setStatus("ready");
    playTracks([{
      source: `lang/${language}/audio/level-${Number(levels[nextIndex].level_id)}.mp3`,
      description: "level announcement",
      onUnavailable: () => setNarrationError("The level announcement could not be played."),
    }], levels[nextIndex]);
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

    setWord(nextWord);
    setSelectedLetters(initialLetters(level));
    setFeedback(INSTRUCTION);
    setIncorrectAttempt(0);
    setPictureReady(false);
    setDragging(new Set());
    setCycle((current) => current + 1);
    setImageUnavailable(false);
    setAudioUnavailable(false);
    setCorrectAudioUnavailable(false);
    setFlashLetters(false);
    setNarrationError("");
    setStatus(level.spinners.every((spinner) => spinner.letter_list.length === 1) ? "spelling" : "awaiting-change");
    emitGameEvent({ type: "word_presented", lang: language, level_id: level.level_id, word: nextWord }, userId);
    playTracks([{
      source: `lang/${language}/audio/words/${nextWord}.mp3`,
      description: `pronunciation for ${nextWord}`,
      onUnavailable: setAudioUnavailable,
    }]);
  };

  const changeLetter = (index: number, letter: string) => {
    if (!wheelsEnabled) return;
    setSelectedLetters((current) => current.map((value, position) => position === index ? letter : value));
    setFeedback(INSTRUCTION);
    setIncorrectAttempt(0);
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
      setIncorrectAttempt(0);
      setStatus("correct");
      setAudioUnavailable(false);
      setNarrationError("");
      playTracks([
        {
          source: `lang/${language}/audio/correct.mp3`,
          description: "correct-answer audio",
          onUnavailable: setCorrectAudioUnavailable,
        },
        {
          source: `lang/${language}/audio/words/${word}.mp3`,
          description: `pronunciation for ${word}`,
          onUnavailable: setAudioUnavailable,
          onPlaying: () => setFlashLetters(true),
          onComplete: () => setFlashLetters(true),
        },
      ]);
    } else {
      setFeedback("Please try again!");
      setIncorrectAttempt((current) => current + 1);
      setNarrationError("");
      playTracks([{
        source: `lang/${language}/audio/please-try-again.mp3`,
        description: "try-again audio",
        onUnavailable: () => setNarrationError("The try-again audio could not be played."),
      }]);
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

        <div className={`wheels${!word ? " wheels-awaiting-word" : ""}${status === "correct" && flashLetters ? " wheels-correct" : ""}`} role="group" aria-label="Spelling wheels">
          {level.spinners.map((spinner, index) => (
            <div className="wheel-column" key={`${level.level_id}-${cycle}-${spinner.id}`}>
              <Wheel
                letters={spinner.letter_list}
                value={selectedLetters[index]}
                label={`${["First", "Middle", "Last"][index]} letter${spinner.letter_list.length === 1 ? `: ${spinner.letter_list[0]} (fixed)` : ""}`}
                enabled={wheelsEnabled}
                incorrectAttempt={selectedLetters[index] !== word[index] ? incorrectAttempt : 0}
                onChange={(letter) => changeLetter(index, letter)}
                onDraggingChange={(active) => changeDragging(index, active)}
              />
            </div>
          ))}
        </div>

        <div className="game-actions">
          <button
            className="audio-toggle"
            type="button"
            aria-label={audioLabel}
            aria-pressed={muted}
            title={audioLabel}
            disabled={noAudio}
            onClick={toggleMuted}
          >
            <img src={!noAudio && muted ? mutedIcon : unmutedIcon} alt="" draggable={false} />
          </button>
          <button className="spin-button" type="button" onClick={canFind ? findWord : spell} disabled={!canFind && !canSpell}>
            {status === "spelling" ? "Spell" : "Find a word"}
          </button>
        </div>
        {narrationError && <p className="media-status" role="status">{narrationError}</p>}
        {audioUnavailable && word && (
          <p className="media-status" role="status">Audio for “{word}” is unavailable.</p>
        )}
        {correctAudioUnavailable && (
          <p className="media-status" role="status">The correct-answer audio is unavailable.</p>
        )}
        <footer className="game-footer">One word at a time. You’ve got this!</footer>
      </section>
    </main>
  );
}
