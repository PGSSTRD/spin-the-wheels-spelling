# Spin the Wheels

React + TypeScript implementation of the three-letter MVP.
The supplied Lexend Latin regular WOFF2 is loaded locally throughout the UI,
including headings, wheels, target words, and controls, with a system
sans-serif fallback and swap display. No external font service is used.
Spinner letters are optically centered for Lexend without changing wheel
dimensions or dragging distances.
The level selector has no separate visible label; its accessible name remains
"Choose level". Its 36px height and responsive 16-20px text complement the title,
with bottom alignment to the title area and its existing right-edge alignment.

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
Green speaker (`#2f7642`, matching active wheel letters) means audio is on;
red slashed speaker (`#e42e2e`, matching wrong-letter flashes) means muted.
Unavailable audio retains a neutral gray icon.
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
Browser text selection is disabled throughout the game card to prevent
accidental highlighting. Wheel gestures also suppress native text dragging.
Keyboard focus, level selection, and pointer/touch wheel controls are unchanged.

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
`lang/english/audios/correct.mp3` plays to completion. The gold flashes then
start when `lang/english/audios/words/<word>.mp3` begins playing.
Audio errors are reported non-blockingly; remaining feedback still runs.
After each Spell submission, the primary button stays disabled until both
the feedback audio and all letter flashes finish. Muted or unavailable audio
requires waiting only for the flashes. Muting during feedback stops its audio
but does not skip the remaining visual feedback. After a wrong answer, wheels
remain editable: editing clears the red flashes as before, while the button
still waits for any retry audio. Changing levels cancels feedback and its lock.
After successful feedback completes, **Find a word** starts a new cycle, stops
any other pending audio, and clears the previous feedback.
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

Audio source files live in `content/lang/english/audios/`, with word MP3s under
`words/` and success feedback in `correct.mp3`. Development serves them under
`lang/english/audios/`; the build copies them to the same relative path in
the standalone package. Finding a target also uses its supplied word MP3.
The supplied recordings cover all 40 unique configured words.
The retry, five level-announcement, and twelve affected word MP3s have been
losslessly repackaged without optional metadata for direct `file://` playback
compatibility. All 40 word clips have been checked for file-mode loading.
When replacing these recordings, check playback from the standalone file
as well as through the development server; successful HTTP playback alone
does not establish file-mode compatibility.
Place word images at `content/assets/images/<word>.svg` or `<word>.jpg`
(for example, `cat.svg`). The game tries SVG first, then JPG only if SVG fails
to load or decode. Only after both fail does it show the monochrome painting;
it does not probe other formats or require an image index.
Development serves images under `assets/images/`; the build copies the image
folder to that same path in the standalone package. Images can also be added
directly to that folder in a standalone package.
The picture frame is always visible, remaining empty before target selection
and after a level change. Word images fit inside 80% of both its height and
width while preserving their aspect ratio. Missing or invalid images use a
grayscale rendering of the supplied `painting.svg`, bundled locally, with the
same sizing. The fallback retains an accessible description but no visible
message; gameplay remains usable. The original painting SVG is not modified.
The original celebration sound is retained at `content/audios/triumphant.wav`
for future use, but is not played or bundled by the current game.

## Asset licensing

[content/licenses.json](content/licenses.json) records the three original
speaker SVGs, the supplied Lexend font, both supplied image SVGs, all 49 MP3
recordings, and the generated fanfare WAV using the other spelling project's
manifest format. This includes retained unused source assets.
The speaker SVGs' CC0-1.0 dedication was approved on 2026-11-17.
Lexend is OFL-1.1; its full supplied copyright/license notice is retained at
[content/assets/fonts/OFL-Lexend.txt](content/assets/fonts/OFL-Lexend.txt).
Paths omit the source `content/` prefix; active icons are inlined in the
application bundle. The build emits the font unchanged under `assets/fonts/`,
copies the OFL notice alongside it, and includes the manifest at the package
root as `licenses.json`. The source remains `content/licenses.json`.
The MP3 entries record the contributor-reported ElevenLabs free-plan origin
and supplied restrictions, including no commercial license and outstanding
distribution approval. The manifest alone does not satisfy the reported
publication-title attribution requirement. The guidance check date is inherited
from the supplied previous-project record, not a new verification.
The supplied painting SVG is recorded as `NOASSERTION`: its original source
and public-domain dedication have not been verified. A search assistant's
description alone does not establish its licensing or redistribution rights.
The cat SVG is also `NOASSERTION` because its provenance/license is unknown.
The original generated fanfare is recorded separately from ElevenLabs as
`NOASSERTION` pending an explicit license decision; the speaker icons' CC0
dedication does not automatically apply to it.

## Validate

```powershell
npm test
npm run build
```
