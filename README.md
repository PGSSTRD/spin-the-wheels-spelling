# Spin the Wheels

React + TypeScript implementation of the three-letter MVP.

## Play

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
flash red together twice over one second. Matching letters remain unchanged.
Each incorrect submission restarts the red flashes; adjusting a wheel clears
them. After **Correct!**, the wheels lock and their selected
letters flash gold together twice over one second (0.25 seconds gold, then
0.25 seconds in their normal colors, repeated twice). The flashes begin
immediately; celebration sound playback is currently disabled.
**Find a word** starts a new cycle and clears any remaining flashes.
The next target never repeats the current word unless the
level contains only one word. Changing levels resets the attempt.

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

Place word images at `assets/images/<word>.png` and pronunciations at
`lang/english/audios/<word>.mp3` in the standalone package. Until those assets
are supplied, the game displays the specified non-blocking media fallbacks.
The original celebration sound is retained at `content/audio/triumphant.wav`
for future use, but is not played or bundled by the current game.

## Validate

```powershell
npm test
npm run build
```
