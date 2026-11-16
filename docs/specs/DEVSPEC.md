# Spin The Wheels — Developer Specification

**Status:** Draft — plain-browser English default specified; remaining product decisions need confirmation
**Last updated:** 2026-11-16
**Product scope:** MVP Implementation only

## 1. Purpose and related specifications

Specify the runtime, data, integration, and packaging behavior needed to implement the MVP described in [PRD.md](./PRD.md). UI requirements are in [UISPEC.md](./UISPEC.md); verification requirements are in [TESTSPEC.md](./TESTSPEC.md).

Requirement IDs in this document use `DVS-`. Each entry names related PRD requirements.

## 2. Runtime and deployment model

### DVS-01 — Standalone entry and file origin (PRD-07)

- The game MUST have an `index.html` entry point at the root of the engine ZIP.
- The standalone target MUST run from a local `file://` URI in an embedded WebView without a web server.
- Game-critical files MUST be loaded from the extracted package using relative paths. Bundler public path MUST be `./`; emitted HTML, CSS, JS, and data MUST NOT depend on root-absolute `/...` paths.
- Runtime MUST NOT require network access, remote configuration, a feature-flag service, analytics vendor, or error-reporting service.
- Do not register Service Workers or use Cache Storage for the `file://` target. Do not use `window.fetch()` for local file assets; Chromium Android WebView rejects local-file fetches.
- `window.location.origin` is `"null"` for file origin and MUST NOT be used as an asset base.

### DVS-02 — Local file loading (PRD-05, PRD-07)

- Detect `window.location.protocol === 'file:'` once at startup.
- Load local JSON and text with `XMLHttpRequest`; for a local XHR, accept `status === 0` or `status === 200` as success and reject other statuses and `onerror`.
- Load local binary assets (including audio buffers and other binary resources) using asynchronous XHR with `responseType = 'arraybuffer'`; do not call `fetch()` or Cache Storage on this path.
- If an HTTP development preview is supported, it MAY use a separate HTTP loader. That path MUST NOT be required or used by the standalone file-origin build.
- Preload independent assets with `Promise.allSettled`, not `Promise.all`, so one bad media file cannot strand startup. A level-data failure is blocking; individual media failures are not.
- The root rendering element MUST exist in `index.html` before application JavaScript executes.
- BroadcastChannel MUST be optional: guard construction and null-check use if it is used. Service Worker registration MUST not occur.

## 3. Launch parameters and content language

### DVS-03 — Query parsing (PRD-06, PRD-07)

- Parse launch parameters from `window.location.search`, not from a server-side URL:
  - `cr_lang`: when present, use the requested supported language. This MVP supports `english`.
  - If `cr_lang` is absent in a plain browser (no `ReactNativeWebView.postMessage` bridge), default explicitly to `english`.
  - If `cr_lang` is absent when the Curious Reader bridge is available, show an explicit configuration error; container launches are required to supply this parameter.
  - `cr_user_id`: opaque container identity for reporting; when absent, report `""`. Never generate a user/device identifier.
- This MVP uses the 2-tier Layout A and MUST NOT require or use `cr_book`.
- An unsupported `cr_lang` MUST produce an explicit error; it MUST NOT trigger a network fallback or silently load another language.

## 4. Level JSON contract

### DVS-04 — Canonical level schema (PRD-02, PRD-05, PRD-06)

The source brief identifies `spinners`, `level_id`, and `word_list` but its sample is illustrative and not valid JSON. Use this canonical, valid JSON representation. The `word_media` map makes the brief's per-word image/audio association explicit without changing `word_list` into a different kind of collection.

```json
{
  "level_id": "level-001",
  "spinners": [
    { "id": "spinner1", "letter_list": ["c", "d", "m"] },
    { "id": "spinner2", "letter_list": ["a", "e", "i"] },
    { "id": "spinner3", "letter_list": ["t", "g", "p"] }
  ],
  "word_list": ["cat", "dog"],
  "word_media": {
    "cat": {
      "image": "../../assets/images/cat.png",
      "audio": "audios/cat.mp3"
    },
    "dog": {
      "image": "../../assets/images/dog.png",
      "audio": "audios/dog.mp3"
    }
  }
}
```

`word_media` is an explicit schema extension derived from the brief's media association requirement. It is not a new game mechanic.

### DVS-05 — Data validation and error behavior (PRD-02, PRD-05)

Validate the entire level before enabling play:

1. JSON parses to an object; `level_id` is a non-empty string.
2. `spinners` is an array of exactly three entries, in left-to-right order, with unique non-empty `id` strings.
3. Every `letter_list` is a non-empty array of single ASCII English letters (`A-Z` or `a-z`); normalize case for comparison and presentation. Reject duplicate letters after case normalization so each configured option is unambiguous.
4. The second spinner's normalized letters are limited to `a, e, i, o, u` (proposed vowel policy; confirm in PRD).
5. `word_list` is a non-empty array of unique, lowercase-normalized, exactly three-letter ASCII English words. Reject leading/trailing whitespace and punctuation rather than silently altering a word.
6. Each word's letter at index `i` occurs in spinner `i`'s normalized `letter_list`; each word is therefore spellable by the configured level.
7. `word_media` contains one object per word with non-empty `image` and `audio` relative URLs.
8. All media URLs MUST resolve within the extracted game package and MUST use a local relative path; reject `http:`, `https:`, protocol-relative URLs, root-absolute paths, and paths that escape the package root after normalization.
9. Extra JSON fields MAY be ignored for forward-compatible content. Missing required fields or any invalid word makes the level invalid; do not silently drop malformed words and present a different level.

If any blocking validation fails, enter the blocking data-error state defined in UISPEC, log a diagnostic suitable for development, and do not enable word selection. Runtime diagnostics MUST NOT include credentials or user identifiers.

## 5. Selection, animation, and game state

### DVS-06 — State and selection (PRD-01, PRD-03, PRD-04)

Implement these observable states: `loading`, `ready`, `spinning`, `result`, and `data-error`. The UI MAY render loading progress as indeterminate; the state transition contract is:

`loading -> ready` on valid level load; `loading -> data-error` on missing/invalid level; `ready|result -> spinning` on selection; `spinning -> result` only after all three wheels settle on the selected word.

- Select from the validated `word_list` using a random source. Initial proposal: equal probability for every unique word, with replacement. Keep selection behind an injectable random source or equivalent seam so tests can control the result.
- Take an immutable target snapshot at selection start. The letters that settle MUST be the three characters of that snapshot in order.
- Animate all three wheels between configured letters before settling. Intermediate positions MAY be non-word combinations; the final position MUST be the selected word.
- Disable/reject additional selection input while in `spinning`; do not start parallel animations or replace the active target.
- The result remains visible in `result` until another selection begins.
- There is no score, manual letter adjustment, completion threshold, or automatic level transition in this MVP.

Exact easing, stagger, duration, and randomness details are not defined by the source. UISPEC lists a provisional duration for stakeholder review; do not make timing a hidden content requirement.

## 6. Media and audio

### DVS-07 — Media resolution and failure handling (PRD-04, PRD-05, PRD-07)

- Resolve media references relative to the URL of the JSON file that declares them, then verify the normalized target remains within the extracted package.
- Per-language audio MUST be under `lang/{langCode}/audios/`; shared images MUST be under `assets/images/`. The example JSON uses `../../assets/images/...` and `audios/...` from `lang/{langCode}/level.json`.
- Audio format MUST be MP3 or WAV. Image formats MAY be PNG, JPEG, WebP, or SVG; a file's contents MUST match its extension.
- Decode/play audio from locally loaded buffers or use `<audio>`/`Audio` with a relative local URL. Do not depend on remote URLs. If Web Audio is used, create/unlock its context from a user gesture and handle decode/play failures.
- Attempt independent image/audio preloads without making an individual media error a level-load failure.
- If an image is unavailable/corrupt, retain the spelled word and render the image fallback in UISPEC.
- If audio is unavailable/corrupt or playback is denied, retain the spelled word and render/announce the audio-unavailable status. Use a silent buffer if the chosen playback pipeline requires a buffer to avoid an exception; do not claim that pronunciation was heard.
- A media failure MUST NOT stop later selections.

## 7. Curious Reader reporting integration

### DVS-08 — `cr_event` bridge (PRD-07)

When reporting events are approved for this MVP, send one envelope per occurrence using:

```js
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: "cr_event",
  payload: {
    payload_id: "<fresh UUID v4>",
    cr_user_id: "<cr_user_id query value or empty string>",
    sub_app_id: "<stable Curious Learning-assigned ID>",
    payload_version: 1,
    collection: "user_sessions_data",
    timestamp: "<ISO-8601 UTC>",
    data: { "type": "<stable snake_case event>", "lang": "<English catalog code>" }
  }
}));
```

- The bridge is available only when `typeof window.ReactNativeWebView?.postMessage === 'function'`. In a plain browser, reporting MUST be a no-op without an error or attempted message.
- Reporting MUST be fire-and-forget and exception-safe; it MUST NOT block gameplay, be awaited, or make network requests.
- Use a fresh UUID v4 for every message, `payload_version: 1`, `collection: "user_sessions_data"`, an ISO-8601 UTC timestamp, the query `cr_user_id` (or `""`), and the agreed stable `sub_app_id`.
- Include `data.type` (stable snake_case event) and `data.lang`; only JSON-serializable values are allowed. Include `max_score` with any score. Do not add a score to this MVP unless the PRD is deliberately revised.
- One envelope per bridge message; maximum 64 KB. Do not send `options` for `user_sessions_data`, batch, queue, retry, or emit per-frame/per-tap events.
- Proposed minimal event names are `game_started` (once when ready) and `word_presented` (once after each completed spin). Confirm event names/fields with Curious Learning; no additional event is required by the source brief.
- The bridge MUST remain in the standalone build; it performs no network I/O itself.

## 8. Build and packaging

### DVS-09 — Standalone build and package (PRD-07)

Use the ThirdPartySpec **Layout A (engine + language pack)** because this MVP has one English language pack and no defined language-independent content unit shared by multiple languages.

- Produce a standalone build with public path `./`; do not ship source maps (`.map`).
- No external `<script src>` or runtime network dependency. Exclude network-dependent analytics, feature-flag, tag-manager, or error-reporting code from this standalone target at build time. Do not register Service Workers.
- Engine ZIP name: `<engine>-core.zip` (historical filename token; this is the engine tier, not a separate core-content tier). Place `index.html` at ZIP root; include engine JS/CSS and shared assets such as `assets/images/`. The engine ZIP MUST NOT contain `lang/`.
- English language ZIP name: `<engine>-lang-<langCode>.zip`. Include the level JSON and referenced language-specific audio at `lang/<langCode>/...`, including `lang/<langCode>/audios/`. Do not include an extra wrapping directory or duplicate files that overwrite engine files.
- The language icon is a separate upload asset, not inside the ZIP: true PNG, square, recommended 512x512 and at least 192x192.
- Agree the permanent lowercase engine slug, English catalog code, title, URL template, and `sub_app_id` with Curious Learning before release. Layout A URL template includes `?cr_lang={lang}`; the container appends `cr_user_id`.
- Production upload/promotion is a Curious Reader content workflow and is not part of game runtime. Promotion is not device delivery; Curious Learning staff must Publish.

### DVS-10 — Startup/error resilience (PRD-04, PRD-05, PRD-07)

- Clear the loading screen and reach ready or explicit data-error within 10 seconds in the ThirdPartySpec direct-file offline test.
- A corrupt level JSON is a blocking error; corrupt/missing individual image/audio is non-blocking.
- Surface actionable errors in the game UI; do not present success-shaped defaults or a fabricated word.
- Handle local XHR `status 0` correctly, and surface a failed/missing JSON load explicitly.
- No uncaught runtime error or external network request is permitted in the offline test. Optional reporting errors are contained and cannot affect play.

## 9. Decisions needing confirmation

See PRD §7 for product questions. Development-impacting decisions include:

- English catalog code, engine slug, and `sub_app_id`.
- Whether to accept vowel `y`, whether to reject duplicate configured letters, and whether repeated words are allowed.
- Final event set and payload fields with the Curious Learning data team.
- Whether a development HTTP preview is needed in addition to the required file-origin build.
- Final animation duration and missing-media fallback assets.

## 10. References

- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), “MVP Implementation” — game behavior, input data, media association, and vowel constraint.
- [**ThirdPartySpec v1.8**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u) — §§1–7 and Appendix A: file-origin runtime, offline loader, media, packaging, reporting, and validation.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c) — requirements as traceable source of truth; acceptance criteria and planned spec change tracking.
- [PRD.md](./PRD.md), [UISPEC.md](./UISPEC.md), [TESTSPEC.md](./TESTSPEC.md).

## 11. Change log

2026-11-13 — Copilot — Created the initial runtime, data, offline integration, reporting, and packaging specification.
2026-11-16 — Copilot — Added the plain-browser English default and retained the required cr_lang parameter for Curious Reader launches.
