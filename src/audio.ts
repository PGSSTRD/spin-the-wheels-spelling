import type { Level } from "./types";

export interface AudioTrack {
  source: string;
  description: string;
  onUnavailable: (value: boolean) => void;
  onPlaying?: () => void;
  onComplete?: () => void;
}

export function checkLevelAudio(
  level: Level,
  language: string,
  onAvailable: (available: boolean) => void,
): () => void {
  const base = `lang/${language}/audio`;
  const sources = [...new Set([
    `${base}/correct.mp3`,
    `${base}/please-try-again.mp3`,
    `${base}/level-${Number(level.level_id)}.mp3`,
    ...level.word_list.map((word) => `${base}/words/${word}.mp3`),
  ])];
  let player: HTMLAudioElement | undefined;
  let active = true;
  const release = () => {
    if (player) {
      player.onloadeddata = null;
      player.onerror = null;
      player.removeAttribute("src");
      player.load();
      player = undefined;
    }
  };
  const cleanup = () => {
    active = false;
    release();
  };
  const check = (index: number) => {
    if (!active) return;
    release();
    if (index === sources.length) {
      active = false;
      onAvailable(false);
      return;
    }
    const source = sources[index];
    let finished = false;
    const fail = (error: unknown) => {
      if (!active || finished) return;
      finished = true;
      console.warn(`Could not load audio asset ${source}.`, error);
      check(index + 1);
    };
    try {
      const candidate = new Audio();
      player = candidate;
      candidate.preload = "auto";
      candidate.onloadeddata = () => {
        if (!active || finished) return;
        finished = true;
        cleanup();
        onAvailable(true);
      };
      candidate.onerror = () => fail(candidate.error);
      candidate.src = source;
      candidate.load();
    } catch (error) {
      fail(error);
    }
  };
  check(0);
  return cleanup;
}

export function playAudio(tracks: AudioTrack[]): () => void {
  let active = true;
  let audio: HTMLAudioElement | undefined;
  const playTrack = (index: number) => {
    if (!active || index >= tracks.length) return;
    const track = tracks[index];
    let finished = false;
    const finish = () => {
      if (!active || finished) return;
      finished = true;
      track.onComplete?.();
      playTrack(index + 1);
    };
    const fail = (error?: unknown) => {
      if (!active || finished) return;
      console.warn(`Could not play ${track.description}.`, error);
      track.onUnavailable(true);
      finish();
    };
    try {
      const player = audio ?? new Audio();
      audio = player;
      player.onended = finish;
      player.onplaying = () => {
        if (active && !finished) track.onPlaying?.();
      };
      player.onerror = () => fail(player.error);
      player.src = track.source;
      void player.play().catch(fail);
    } catch (error) {
      fail(error);
    }
  };
  playTrack(0);
  return () => {
    active = false;
    if (audio) {
      audio.onerror = null;
      audio.onended = null;
      audio.onplaying = null;
      audio.pause();
    }
  };
}
