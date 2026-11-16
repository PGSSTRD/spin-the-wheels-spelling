# Spin the Wheels

React + TypeScript implementation of the three-letter MVP.

## Play

The game starts silently, with the written instruction visible.
The startup instruction MP3 is retained but not played; there is no
instruction-playback error or retry button.
Changing levels plays `level-<number>.mp3`; level 1 is announced only when
returning from another level, never on initial startup.

Select **Find a word** to reveal a target word and its picture and hear its
pronunciation once. Multi-letter wheels start at `?`; single-letter wheels
remain fixed and use gray spinners with darker gray letters. Before a word is
found, all spinners use that gray styling; multi-letter spinners regain their
colors when a target is selected. All spinners have stationary top/bottom
shading, an inset rim, and a bright center band to suggest a rounded roller;
gray spinners use a matching monochrome treatment.
After the picture (or its fallback) appears, drag a multi-letter
wheel up/down by 40px per letter, or focus it and use the arrow keys. Letters
wrap in their configured order; the question mark disappears after the first
step and returns only for a new target.
Wheel gestures suppress browser text selection and native text dragging;
text elsewhere on the page remains selectable.

After a letter changes, select **Spell** to check against the target. Retry
incorrect attempts: only mismatched positions (including remaining `?` values)
flash red together three times over 1.5 seconds while `please-try-again.mp3` plays.
Matching letters remain unchanged.
Each incorrect submission restarts the red flashes; adjusting a wheel clears
them. After **Correct!**, the wheels lock and their selected
letters flash gold together three times over 1.5 seconds (0.25 seconds gold, then
0.25 seconds in their normal colors, repeated three times). First,
`lang/english/audio/correct.mp3` plays to completion. The gold flashes then
start when `lang/english/audio/words/<word>.mp3` begins playing.
Audio errors are reported non-blockingly; remaining feedback still runs.
**Find a word** starts a new cycle, stops pending audio, and clears any remaining
flashes. Changing levels also cancels the sequence.
The next target never repeats the current word unless the
level contains only one word. Changing levels resets the attempt.
As clarified, **Find a word** continues to pronounce the word on every use;
the shorter `give-the-wheels-a-spin.mp3` is not played.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/` directly for a plain-browser preview; English is
the default when `cr_lang` is absent. You can also specify it explicitly with
`http://localhost:5173/?cr_lang=english`. Curious Reader container launches
must include `cr_lang`.

The app loads the level data from `content/lang/english/levels.json` through a
local XHR-compatible route. The production build copies that source file to
`dist/lang/english/levels.json` for standalone relative-path loading.

Audio source files live in `content/lang/english/audio/`, with word MP3s under
`words/` and success feedback in `correct.mp3`. Development serves them under
`lang/english/audio/`; the build copies them to the same relative path in
the standalone package. Finding a target also uses its supplied word MP3.
The supplied recordings cover all 40 unique configured words.
Place word images at `assets/images/<word>.png` in the standalone package;
missing images use the existing non-blocking fallback.
The original celebration sound is retained at `content/audio/triumphant.wav`
for future use, but is not played or bundled by the current game.

## Validate

```powershell
npm test
npm run build
```
