# Spin the Wheels

React + TypeScript implementation of the three-letter MVP.

## Play

The game starts silently, with the written instruction visible.
The startup instruction MP3 is retained but not played; there is no
instruction-playback error or retry button.
Changing levels plays `level-<number>.mp3`; level 1 is announced only when
returning from another level, never on initial startup.

The speaker button sits at the lower left of the action row, matching the
primary button's height and bottom edge and the header brand mark's left edge.
The muted icon has an outlined circle whose outer diameter matches the primary
button's height; the mute slash stays within that circle. The active unmuted
asset is `audio-unmuted-v2.svg`, which omits the circle while preserving the
same speaker geometry, position, and image dimensions. The original circular
unmuted SVG is retained but unused.
Black speaker means audio is on; black slashed speaker means muted.
Select it to toggle. Muting stops current playback immediately and silences
subsequent word, level, correct, and retry clips without stopping gameplay.
Gold flashes start immediately when audio is muted; red flashes are unchanged.
Unmuting does not replay canceled clips.

The mute choice carries across levels. A fresh navigation starts unmuted;
a same-tab reload restores that tab's choice using session storage. If browser
storage is blocked, the game logs the issue and mute still works for the
current page, but reload persistence cannot be guaranteed.

On startup and level changes, silent media-load checks determine whether any
of that level's words, level announcement, correct clip, or retry clip is
usable. Checks load only one clip at a time, starting with shared cues, and
stop at the first success to avoid competing with narration for many audio
decoders. Only if all fail does the speaker turn gray and become disabled.
Partial availability keeps it active, with real per-file playback errors
still reported. Pending checks and autoplay restrictions do not mean files
are absent. The local SVGs are included in the bundle for offline use.

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

After a letter changes, the button reads **Spell**, but remains disabled until
every adjustable wheel has a letter selected (no `?` remains). Fixed letters
already count as chosen. The picture or fallback must be ready and no wheel
may be dragging. Select **Spell** to check against the target. Retry
incorrect attempts: only mismatched positions
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
The retry, five level-announcement, and twelve affected word MP3s have been
losslessly repackaged without optional metadata for direct `file://` playback
compatibility. All 40 word clips have been checked for file-mode loading.
When replacing these recordings, check playback from the standalone file
as well as through the development server; successful HTTP playback alone
does not establish file-mode compatibility.
Place word images at `assets/images/<word>.png` in the standalone package;
missing images use the existing non-blocking fallback.
The original celebration sound is retained at `content/audio/triumphant.wav`
for future use, but is not played or bundled by the current game.

## Validate

```powershell
npm test
npm run build
```
