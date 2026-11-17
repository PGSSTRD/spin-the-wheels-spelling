# Spin The Wheels — Developer Specification

**Status:** Synchronized through 2026-11-17, including language and retained-asset audio paths; release packaging, identifiers, rights, and device validation remain outstanding
**Last updated:** 2026-11-17
**Product scope:** MVP-derived game with approved manual-spelling changes

## 1. Purpose and implementation baseline

Define reproducible runtime, data, state, media, asset, and integration contracts
for [PRD.md](./PRD.md). Presentation is specified in [UISPEC.md](./UISPEC.md);
verification and known gaps are in [TESTSPEC.md](./TESTSPEC.md).

Current implementation: React/ReactDOM 19, TypeScript, Vite 8, Vitest,
Testing Library, and jsdom. The current manifest pins compatible ranges around
React 19.3.1, TypeScript 7.0.2, Vite 8.3.8, Vitest 5.1.0, and jsdom 31.0.1.
Use strict TypeScript and preserve the behavior below if recreating with
equivalent tooling. Existing commands are `npm run dev`, `npm test`, and
`npm run build`; build runs type-check before bundling.

## 2. Runtime and deployment

### DVS-01 — Standalone entry and file origin (PRD-07)

- Run from a package-root `index.html` using `file://` without a web server.
- Keep bundler base `./`, local relative resources, and a root rendering element
  present before JavaScript executes. Never derive asset roots from the `"null"`
  file origin or use root-absolute runtime paths.
- Current output uses an IIFE entry and a classic deferred script, not a module
  script that relies on HTTP module loading. Styles are bundled locally.
- No runtime network dependency, Service Worker, Cache Storage, remote
  configuration, or analytics/error-reporting service is required.

### DVS-02 — Local file loading (PRD-04, PRD-05, PRD-07)

- Load `lang/english/levels.json` using asynchronous `XMLHttpRequest`.
  Accept status `0` or `200`; reject other statuses, network errors, invalid
  JSON, and invalid level data with a blocking UI error and diagnostic.
- Use native relative `<img>` URLs for images, `Audio` for recordings, and
  CSS `@font-face` for the font. Do not impose an XHR-buffer requirement on
  native image/audio/font loading or use local-file `fetch()`.
- Do not preload all images or require all media before ready. Availability
  probes follow DVS-11; individual media errors do not invalidate levels.
- Development may serve equivalent HTTP routes, but standalone operation
  must not depend on the development server.
- BroadcastChannel is not required; any future use must be optional/guarded.

## 3. Launch parameters

### DVS-03 — Query parsing (PRD-06, PRD-07)

Read `window.location.search`:

- `cr_lang=english` is supported. If absent without a
  `ReactNativeWebView.postMessage` function, default to `english`.
- If absent with that bridge, show a configuration error. Unknown/empty
  language codes fail explicitly; do not substitute a different language.
- `cr_user_id` is an opaque reporting value; default to `""`. Do not invent
  an identity or log it in runtime diagnostics.
- No `cr_book` is required or consumed by this Layout A game.

## 4. Level JSON contract

### DVS-04 — Source schema and supplied catalog (PRD-02, PRD-05, PRD-06)

Source: `content/lang/english/levels.json`; runtime:
`lang/english/levels.json`. It is one non-empty array, not one JSON file per
level. Each spinner is wrapped under its position key. There is no required
`word_media` map or image index. Reproduce the current catalog as follows:

```json
[
  {
    "level_id": "001",
    "word_list": ["cat", "mat", "pat"],
    "spinners": [
      { "spinner1": { "letter_list": ["c", "m", "p"] } },
      { "spinner2": { "letter_list": ["a"] } },
      { "spinner3": { "letter_list": ["t"] } }
    ]
  },
  {
    "level_id": "002",
    "word_list": ["cap", "map", "nap", "tap"],
    "spinners": [
      { "spinner1": { "letter_list": ["c", "m", "n", "t"] } },
      { "spinner2": { "letter_list": ["a"] } },
      { "spinner3": { "letter_list": ["p"] } }
    ]
  },
  {
    "level_id": "003",
    "word_list": ["cat", "cam", "can", "cap", "map", "man", "mat", "nap", "pam", "pan", "pat", "tan", "tap"],
    "spinners": [
      { "spinner1": { "letter_list": ["c", "m", "n", "p", "t"] } },
      { "spinner2": { "letter_list": ["a"] } },
      { "spinner3": { "letter_list": ["c", "m", "n", "p", "t"] } }
    ]
  },
  {
    "level_id": "004",
    "word_list": ["fin", "lip", "liz", "sin", "sip", "sit", "sis", "zip", "zit", "nip", "nil", "pit", "pin", "pip"],
    "spinners": [
      { "spinner1": { "letter_list": ["f", "l", "s", "n", "p", "z"] } },
      { "spinner2": { "letter_list": ["i"] } },
      { "spinner3": { "letter_list": ["f", "l", "s", "n", "p", "t", "z"] } }
    ]
  },
  {
    "level_id": "005",
    "word_list": [
      "cat", "cam", "can", "cap", "map", "man", "mat", "nap", "nip", "nil",
      "pam", "pal", "pan", "pat", "tan", "tap", "fan", "fat", "fin", "fit",
      "lap", "lat", "lip", "lit", "liz", "sam", "sap", "sat", "sal", "sim",
      "sin", "sip", "sit", "sis", "zap", "zip", "zit", "pit", "pin", "pip"
    ],
    "spinners": [
      { "spinner1": { "letter_list": ["c", "m", "n", "p", "t", "f", "l", "s", "z"] } },
      { "spinner2": { "letter_list": ["a", "i"] } },
      { "spinner3": { "letter_list": ["c", "m", "n", "p", "t", "f", "l", "s", "z"] } }
    ]
  }
]
```

Level word counts are 3, 4, 13, 14, and 40; the union has 40 words.
Keep letter/word order exactly as configured. Internally normalize each source
spinner to `{ id: "spinnerN", letter_list: [...] }` and retain three ordered
positions. The UI starts at array index 0; labels/cue numbers use
`Number(level_id)`, yielding levels 1-5 for this catalog.

### DVS-05 — Validation (PRD-02, PRD-05)

Validate the entire array before enabling play:

1. A non-empty array of objects, each with a unique non-empty string `level_id`.
2. Exactly three spinner entries. Entry at position N must contain a
   `spinnerN` object with a non-empty `letter_list`.
3. Spinner letters are single ASCII `A-Z`/`a-z`; normalize to lowercase and
   reject case-insensitive duplicates.
4. Middle-spinner letters are limited to `a,e,i,o,u`.
5. `word_list` is non-empty, unique, and strictly matches lowercase
   `[a-z]{3}`. Unlike spinner letters, uppercase source words are rejected,
   as are whitespace, punctuation, and wrong lengths.
6. Every word's character at each position belongs to that spinner's set.
   Do not require every possible letter combination to be a word or perform
   dictionary validation.
7. Extra fields may be ignored; no media-map validation is required.
   Missing/corrupt media files are runtime fallback cases, not schema errors.

Fail explicitly without silently dropping words or fabricating a level.
The parser accepts general non-empty ID strings; numeric-ID enforcement is
not implemented. Supplied/replacement catalog IDs must support the UI's
numeric labels and cue convention, or those consumers need a deliberate update.

## 5. Game state and interaction

### DVS-06 — Manual state machine and feedback lock (PRD-01 through PRD-04)

Observable implementation states:

| State | Behavior |
|---|---|
| `loading` | Await full validated catalog; no playable controls. |
| `ready` | No target; Find a word enabled; wheels inactive. |
| `awaiting-change` | Target selected; Find a word label disabled; wait for picture and first real letter change. |
| `spelling` | Spell label; enable only with picture ready, all choices complete, no drag, and no pending feedback. |
| `correct` | Wheels locked; Find a word remains disabled until feedback completes, then enabled. |
| `data-error` | Explicit blocking error; no playable level. |

- Find is accepted only in ready/correct with no pending submission feedback.
  Filter out the current word when alternatives exist, then choose
  `floor(random * candidateCount)` (bounded to a valid index). Inject randomness
  for deterministic tests; do not implement an exhaustion bag.
- Reset adjustable letters to `?` and fixed letters to their sole value.
  An all-fixed level enters spelling directly; otherwise await a real change.
- Image readiness gates interaction, but target pronunciation is independent
  of image success. Selecting a target emits `word_presented` immediately.
- Wheel movement follows UI-02. Editing clears incorrect feedback, resets its
  animation attempt key, and enters spelling without changing the target.
- Spell requires every selected value to differ from `?`. Compare the joined
  letters to the exact target, not membership in the level's word list.
- Incorrect answers stay in spelling with retry feedback. Correct answers
  enter correct and lock the wheels.
- Each submission tracks a unique feedback ID, pending feedback audio, and
  the indices whose selected-letter animations must finish: all three for
  correct, mismatches only for incorrect.
- Gate both Find and Spell until audio is complete/suppressed and the pending
  letter set is empty. Receive real `animationend` notifications from the
  selected letter in every affected wheel; do not substitute a guessed timer
  or unlock after only the first of three animations.
- Wrong-answer edits cancel the red animation set, but retain the audio lock
  until retry playback finishes or is muted. They do not restart a target.
- New cycles and actual level changes clear feedback and image state. Level
  changes can interrupt feedback, reset wheels, and cancel audio; reselecting
  the same level is a no-op. Ignore stale completion callbacks by identity and
  cancellation state. Unmount stops audio without continuing a playlist.

## 6. Media and audio

### DVS-07 — Filenames, sequencing, and failures (PRD-04, PRD-05, PRD-08)

Resolve relative to the runtime entry, not a per-word JSON media map:
source recordings live under `content/lang/english/audios/`, preserving the
language directory while using Curious Reader's required plural folder name.

| Purpose | Runtime resource |
|---|---|
| Word picture, first candidate | `assets/images/<word>.svg` |
| Word picture, second candidate | `assets/images/<word>.jpg` |
| Final picture fallback | Bundled local `painting.svg`, grayscale via CSS |
| Word pronunciation | `lang/english/audios/words/<word>.mp3` |
| Correct-answer cue | `lang/english/audios/correct.mp3` |
| Retry cue | `lang/english/audios/please-try-again.mp3` |
| Actual level change | `lang/english/audios/level-<number>.mp3` |

- Try SVG then JPG only on loading/decoding error, then the painting.
  Do not probe PNG, `.jpeg`, WebP, or all words. Reset to SVG on each new
  target/level; isolate candidate DOM lifecycles so old errors do not skip JPG.
- Do not enable wheels after SVG failure while JPG is still pending. Mark
  picture ready on successful image load or presentation of the final fallback.
- Adding a named SVG/JPG directly to a standalone image directory needs no
  generated index/code rebuild; a subsequent image load uses those paths
  (normal browser caching still applies).
- Use a cancellable sequential playlist with one playback element reused
  across tracks. Advance on `ended` or a handled failure; ignore duplicate
  completions and late callbacks after cancellation.
- Find pronounces the target once. Correct plays correct cue, then the word;
  start gold flashes on the word's actual `playing` event, with an idempotent
  completion/failure fallback. Mark feedback audio complete after the last
  track, including its failure path.
- Retry starts red flashes and retry audio together. Its completion/failure
  clears only the audio part of the feedback lock.
- Muted/known-unavailable playback skips media without false errors, invokes
  completion behavior, and starts correct flashes immediately.
- Muting pauses playback, detaches callbacks, releases the feedback audio
  lock, and starts pending correct flashes without discarding visual wait.
  Unmuting never resumes/replays an interrupted sequence.
- Genuine playback errors set an appropriate visible status and log a
  diagnostic. Correct-cue failure still attempts the word; word failure still
  starts remaining flashes. Do not use fake playback success or silent buffers
  to conceal an error.
- No initial narration or initial level-1 cue. Actual level changes announce
  `Number(level_id)`, including returning to 1; pass the new level to audio
  suppression logic rather than inheriting the old level's unavailable flag.
- Both instruction MP3s remain unused; `content/audios/triumphant.wav` is unused
  and not bundled. Do not re-enable them implicitly.
- Validate actual MP3 decoding from file origin as well as HTTP. A prior
  compatibility repair losslessly remuxed affected clips with metadata removed
  and Xing writing disabled; successful HTTP playback alone is insufficient.

### DVS-11 — Mute persistence and bounded probes (PRD-08)

- Store the choice under `sessionStorage["spin-the-wheels-muted"]`.
  Restore only when navigation timing identifies a reload; fresh navigation
  starts false even if an old session value exists. Preserve across levels.
  Log storage failures explicitly; gameplay/toggling must still work.
- Start availability checks on initial level and actual changes, even when
  muted. Never play a probe or require autoplay permission to test loading.
- Probe unique clips sequentially: correct, retry, level announcement, then
  that level's words in configured order. `loadeddata` establishes a usable
  candidate; stop and release it at the first success.
- Keep at most one live availability probe, independently of the one
  foreground playback element. Release each failed probe's handlers/source
  before the next, cancel on level change/unmount, and ignore stale results.
- Only all-candidate failure marks that level unavailable. Unknown/pending,
  one missing clip, and denied autoplay do not. A pending probe has no arbitrary
  absence timeout. The largest level has 40 words plus three shared/level cues;
  do not open all 43 concurrently.
- A disabled unavailable toggle shows the unmuted-shaped gray icon, retaining
  the user's mute preference for recovery on another usable level.

## 7. Curious Reader reporting

### DVS-08 — `cr_event` bridge (PRD-07)

When `typeof window.ReactNativeWebView?.postMessage === "function"`, send one
JSON-stringified envelope per occurrence:

```json
{
  "type": "cr_event",
  "payload": {
    "payload_id": "<fresh UUID v4>",
    "cr_user_id": "<opaque query value or empty string>",
    "sub_app_id": "spin-the-wheels",
    "payload_version": 1,
    "collection": "user_sessions_data",
    "timestamp": "<ISO-8601 UTC>",
    "data": { "type": "word_presented", "lang": "english", "level_id": "001", "word": "cat" }
  }
}
```

- `game_started`: once after valid data reaches ready per mounted game,
  with `data.type` and `data.lang`.
- `word_presented`: once per accepted Find, before picture/audio readiness,
  with type, language, original level ID, and target word.
- No score or per-letter/per-frame/mute/submission events are emitted.
- Plain-browser reporting is a no-op. Bridge exceptions are caught/logged
  without blocking play; no await, network call, retry queue, batching, or
  `options` for this collection.
- Use `crypto.randomUUID()` or a UUID-v4 `getRandomValues` fallback. Keep
  timestamps UTC and payload values JSON-safe.
- Current `sub_app_id` is `spin-the-wheels`, pending permanent assignment
  confirmation. Keep the bridge in the standalone build.
- The third-party message limit is 64 KB. The helper does not implement a
  generic size guard; verify actual release inputs/payload size and do not
  claim arbitrary oversized values are rejected.

## 8. Build, typography, and asset rights

### DVS-09 — Current artifact and release package (PRD-07, PRD-10)

`npm run build` type-checks and emits a combined `dist` tree:

```text
index.html
assets/<bundled-entry>.js
assets/images/<supplied image files>
assets/fonts/lexend-v26-latin-regular.woff2
assets/fonts/OFL-Lexend.txt
lang/english/levels.json
lang/english/audios/<cues>.mp3
lang/english/audios/words/<word>.mp3
content/licenses.json
```

- Copy source images, English audio, and level JSON to those paths. The font
  filename is fixed, not hashed; copy its unchanged notice and the manifest.
  Active speaker SVGs and the fallback are locally inlined; do not promise
  every manifest source asset is emitted separately.
- Development serves levels/audio at the same runtime paths and
  `/assets/images/<word>.svg|jpg` with correct MIME types. Missing image files
  return 404, not successful HTML fallback. Do not require runtime Internet.
- No source maps, external script dependency, or Service Worker in output.
- **Pending release step:** ThirdPartySpec Layout A still requires
  `<engine>-core.zip` with root index/engine/shared assets and no `lang/`,
  plus `<engine>-lang-<langCode>.zip` with `lang/<langCode>/levels.json` and
  `audios/` including words. No wrapping folders or colliding tier files.
  The current build does not generate these ZIPs; do not zip all of `dist`
  as the engine tier and claim compliance.
- Provide the separate true-PNG language icon (recommended 512 square,
  minimum 192 square), and agree slug, catalog code, title, URL template,
  and permanent reporting ID. Layout A uses `?cr_lang={lang}`, with container
  user ID appended. Actual publishing/delivery is a Curious Reader workflow.

### DVS-12 — Font and license inventory (PRD-09, PRD-10)

- Bundle `content/assets/fonts/lexend-v26-latin-regular.woff2` as family Lexend,
  normal style, weight 400, swap display, sans-serif fallback, and no
  synthesized faces. Requested UI weights do not imply supplied bold/variable
  font files. Preserve the font and OFL notice byte-for-byte.
- Source `content/licenses.json` contains an `assets` array of objects with
  unique `path` and non-empty `creator`, `license`, `source`, `notes` strings.
  Paths omit source `content/`; interpret as content/package-root-relative,
  not relative to the packaged manifest's directory.
- Cover retained unused source media too. Current inventory has 56 assets:

| Assets | Count | Recorded license / provenance |
|---|---:|---|
| MP3s under English audio and words | 49 | `LicenseRef-ElevenLabs-Free-Plan`; Project contributors using ElevenLabs; `https://elevenlabs.io` |
| Original speaker SVGs | 3 | `CC0-1.0`, owner-approved 2026-11-17 |
| Lexend regular WOFF2 | 1 | `OFL-1.1`, The Lexend Project Authors |
| Supplied painting and cat SVGs | 2 | `NOASSERTION`; original source/rights unverified |
| Generated `audios/triumphant.wav` | 1 | `NOASSERTION`; original procedural audio, not ElevenLabs, no dedication approved |

- MP3 notes preserve the contributor-reported free-plan conditions: no
  commercial license, reported noncommercial publication-title attribution
  using `elevenlabs.io` or `11.ai`, applicable terms/guidance URLs, and
  outstanding distribution approval. The 2026-11-03 guidance check is inherited
  from a previous-project record, not independently rechecked here.
  Preserve `https://elevenlabs.io/terms` and
  `https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform`.
- A manifest entry neither grants rights nor satisfies the reported title
  attribution requirement. Do not rename the game or approve distribution
  implicitly. Do not extend icon CC0 to pictures, font, recordings, or fanfare.
- Retain Lexend's full supplied copyright/OFL text, including its Reserved Font
  Name `RevReading Lexend` and 2018 copyright, at `assets/fonts/OFL-Lexend.txt`;
  use `https://fonts.google.com/specimen/Lexend` as the font's source record.
  Attribution URLs in notes are provenance references, not runtime network
  dependencies.

### DVS-10 — Startup/error resilience (PRD-04, PRD-05, PRD-07)

- ThirdPartySpec acceptance target: ready or explicit local-data error within
  10 seconds offline. Current XHR has no timeout for a request that never
  completes; that fault remains an implementation/release gap, not a passed test.
- Ordinary JSON errors are blocking; image/audio errors are not. Retain the
  target and actionable statuses; never fabricate content or heard narration.
- No uncaught error or external request is acceptable. Optional reporting
  errors and blocked session storage are contained/logged.

## 9. Remaining release decisions and evidence limits

Confirm permanent integration identifiers/events, build release ZIPs, clear
media rights, validate the actual WebView/older Android devices and applicable
accessibility standard, and address startup timeout behavior. Browser media
events and desktop probes do not prove audible quality on all hardware.
Reduced-motion behavior is recorded as implemented in UISPEC, not a claim
that flashes are reduced or a full accessibility audit has passed.

## 10. References

- [PRD.md](./PRD.md), [UISPEC.md](./UISPEC.md), [TESTSPEC.md](./TESTSPEC.md).
- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), MVP baseline with later approved manual-gameplay overrides.
- [**ThirdPartySpec v1.8**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u), offline/runtime and release contract.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c), traceability and controlled specification changes.

## 11. Change log

2026-11-13 — Copilot — Created the initial runtime, data, offline integration, reporting, and packaging specification.
2026-11-16 — Copilot — Added the plain-browser English default and retained the required cr_lang parameter for Curious Reader launches.
2026-11-17 — Copilot — Replaced the obsolete schema and automatic-spin state machine with the current catalog, manual feedback gate, sequential media and probe logic, mute persistence, asset inventory, and explicit release-package gaps.
2026-11-17 — Copilot — Changed English recording source, runtime, probe, package, and license-inventory paths to the required audios folder while preserving media bytes and behavior.
2026-11-17 — Copilot — Renamed the top-level retained-audio folder to audios and updated the fanfare inventory path without bundling or activating it.
