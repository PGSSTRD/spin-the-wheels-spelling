# Spin The Wheels — Test Specification

**Status:** Draft — product decisions noted below need confirmation  
**Last updated:** 2026-11-13  
**Product scope:** MVP Implementation only

## 1. Purpose

Define executable acceptance tests for the MVP in [PRD.md](./PRD.md), implementation contracts in [DEVSPEC.md](./DEVSPEC.md), and visible UI in [UISPEC.md](./UISPEC.md). A product requirement is not complete unless its behavior has an observable pass/fail test.

Test IDs use `TST-`. An implementation may use its chosen test runner, but MUST preserve the stated setup, observable, and pass criteria.

## 2. Test approach

- **Unit/contract:** JSON validation, word selection, state transitions, and media URL validation.
- **Component/UI:** wheel order, action enablement, animation completion, result display, and accessible status.
- **Integration:** load an actual level plus local media and verify word/image/audio flow.
- **Standalone/offline:** open the production standalone build directly from `file://` with network disabled.
- **Packaging:** inspect ZIP roots, tier contents, paths, and extraction merge behavior.
- **Container bridge:** verify emitted `cr_event` messages with a fake bridge; confirm actual container delivery with Curious Learning after upload.

Tests MUST run against deterministic fixtures and a controllable random source where applicable. Unit and component tests MUST NOT rely on statistical sampling to prove selection correctness.

## 3. Test fixtures

### Fixture A — valid level

```json
{
  "level_id": "test-level",
  "spinners": [
    { "id": "spinner1", "letter_list": ["c", "d"] },
    { "id": "spinner2", "letter_list": ["a", "o"] },
    { "id": "spinner3", "letter_list": ["t", "g"] }
  ],
  "word_list": ["cat", "dog"],
  "word_media": {
    "cat": { "image": "../../assets/images/cat.png", "audio": "audios/cat.mp3" },
    "dog": { "image": "../../assets/images/dog.png", "audio": "audios/dog.wav" }
  }
}
```

Include valid image and audio files at those paths in the integration fixture. Provide deterministic random values that select `cat` and then `dog`.

### Fixture B — invalid levels

Create variants with: invalid JSON; missing/empty ID; two or four spinners; empty spinner; duplicate letters (including duplicates that differ only by case); non-vowel middle letter; a word with the wrong length; a word whose position letter is not available; duplicate words; missing media mapping; missing media path; remote/root-absolute/package-escaping media URL.

### Fixture C — media failures and runtime

Use valid JSON with one missing/corrupt image, one missing/corrupt audio, one media decode failure, plus a level with a missing JSON file. Provide a simulated `file://` XHR response with status `0` and one failing XHR.

## 4. Functional and data tests

### TST-01 — Load and validate level data (PRD-05, DVS-04, DVS-05)

- **Setup:** Load Fixture A from its local JSON file.
- **Pass:** The level ID, three ordered letter sets, word list, and media mappings are accepted; the game reaches ready within the startup budget.
- **Fail:** A valid fixture is rejected, a malformed fixture is accepted, or a fabricated/default word is presented.

### TST-02 — Reject invalid level inputs (PRD-02, PRD-05, DVS-05)

Run each Fixture B variant independently.

- **Pass:** Each invalid fixture enters data-error, selection remains disabled, and an actionable UI error is visible. No invalid words are silently dropped.
- **Fail:** Any malformed level reaches ready or begins a spin.

### TST-03 — Vowel and word spellability constraints (PRD-02, DVS-05)

- **Setup:** Try valid and invalid middle-wheel sets and words that fail at each of the three letter positions.
- **Pass:** Only words with a configured letter at each position and an accepted middle vowel are accepted. Duplicate letters after case normalization are rejected. Uppercase ASCII input is normalized and behaves identically to lowercase.
- **Fail:** A consonant can settle in the middle or a word not representable by the three configured sets is accepted.

### TST-04 — Deterministic target selection and settlement (PRD-01, PRD-03, DVS-06)

- **Setup:** Inject a deterministic random source to choose `cat`, then `dog`; activate the selection action once per completed result.
- **Pass:** Each target is from the configured word list; the state changes ready/result → spinning → result; exactly three wheels animate; final letters equal the target in order.
- **Fail:** Final letters do not match the selected word, a word outside the fixture is selected, or a fourth wheel/slot is rendered.

### TST-05 — Block repeated action during spin (PRD-03, DVS-06, UI-05)

- **Setup:** Hold the spin animation open and activate the primary control repeatedly by pointer and keyboard.
- **Pass:** Only one active target and animation exist; additional activations do not interrupt, restart, or change the current target.
- **Fail:** Concurrent spins or target replacement occur.

### TST-06 — Result media and pronunciation (PRD-04, DVS-07, UI-03)

- **Setup:** Use Fixture A with valid media; activate selection with a player gesture.
- **Pass:** After wheel settlement, the matching word and image are visible and the associated audio begins playback. The media path maps to the selected word.
- **Fail:** A different word's image/audio is shown/played, or a valid audio playback error goes unreported.

### TST-07 — Non-blocking media failure (PRD-04, DVS-07, DVS-10, UI-03, UI-04)

- **Setup:** Use Fixture C; fail image load, audio load, audio decode, and playback permission separately.
- **Pass:** The settled word remains visible; the appropriate neutral fallback/status is visible or announced; the game remains in result and accepts a later selection; no uncaught error occurs.
- **Fail:** One media failure blocks the level or prevents a later word from being selected.

## 5. UI and accessibility tests

### TST-08 — Screen states and controls (PRD-03, PRD-05, UI-01, UI-04, UI-05)

- **Setup:** Observe loading, ready, spinning, result, data-error, and each media-error case.
- **Pass:** The screen shows exactly three ordered slots; selection is disabled in loading/spinning/data-error and enabled in ready/result; errors and result remain visible in their defined states.
- **Fail:** The action is available in an invalid state, an error is hidden, or a non-MVP manual-wheel control appears as required gameplay.

### TST-09 — Motion and reduced motion (PRD-03, DVS-06, UI-02, UI-06)

- **Setup:** Run normal and `prefers-reduced-motion: reduce` modes with deterministic target.
- **Pass:** Normal mode visibly animates before settling. Reduced-motion mode preserves an observable transition without continuous rotation. Both settle on the same target and then show the result.
- **Fail:** A mode skips the target update, leaves wheels moving, or has animation that prevents progress.

### TST-10 — Responsive and keyboard/assistive operation (UI-07)

- **Setup:** Test narrow portrait and landscape viewports, keyboard-only operation, focus visibility, and screen-reader/accessibility-tree output.
- **Pass:** All three letters, word, and action are visible and operable without clipping; the button has an accessible name; the selected word is exposed and announced once after settlement; status is not color-only.
- **Fail:** Any required action or word is inaccessible or obscured.

## 6. Offline, runtime, and packaging tests

### TST-11 — Local `file://` load and offline gameplay (PRD-07, DVS-01, DVS-02, DVS-10)

- **Setup:** Open built `index.html` directly in Chrome using `file:///.../index.html?cr_lang=<english-code>&cr_user_id=test-user`, set DevTools Network to Offline.
- **Pass:** Ready or explicit local-data error appears within 10 seconds; with valid content, a selection animates, local media loads and plays where allowed; there are zero external requests, zero service-worker registrations, and no uncaught JS errors. XHR status 0 succeeds for local files.
- **Fail:** Startup waits on network, a critical local asset uses `fetch()` or Cache Storage, a request escapes the package, or the loading UI remains indefinitely.

### TST-12 — Query parameters and non-container mode (DVS-03, DVS-08)

- **Setup:** Run with the English `cr_lang`, missing/unknown language, and with/without a fake `ReactNativeWebView.postMessage`.
- **Pass:** Correct English data is loaded for the configured code; unsupported/missing code produces explicit error; `cr_user_id` is read opaquely or set to `""`; without a bridge, reporting is a no-op with zero errors or attempted messages.
- **Fail:** Another language is silently substituted, an identity is invented, or bridge absence breaks gameplay.

### TST-13 — Build output audit (DVS-01, DVS-02, DVS-07, DVS-09)

- **Setup:** Inspect the standalone output after production build.
- **Pass:** Public path is `./`; no `.map` files or external script dependencies are shipped; no root-absolute game-critical asset paths or absolute/CDN URLs occur in level JSON; no forbidden runtime network/Service Worker/Cache Storage path is active.
- **Fail:** A standalone code path needs a remote resource or the bundled path resolves at filesystem root.

### TST-14 — ZIP integrity and package merge (DVS-07, DVS-09)

- **Setup:** Inspect and extract the engine and English language ZIPs into a clean directory.
- **Pass:** Engine ZIP is `<engine>-core.zip` with `index.html` at root and no `lang/`; language ZIP is `<engine>-lang-<langCode>.zip` with files under `lang/<langCode>/`; paths are relative, tiers do not overwrite each other, required audio exists, and the extracted combined game passes TST-11. Verify each `.png` is actual PNG data; verify image/audio formats are supported.
- **Fail:** An extra ZIP wrapper directory, missing media, conflicting file, or invalid extension/content format prevents offline play.

## 7. Event contract tests

### TST-15 — `cr_event` envelope and cadence (DVS-08)

- **Setup:** Inject a fake bridge that records `postMessage` strings; trigger approved events exactly once. Test a throwing bridge and plain-browser execution.
- **Pass:** Each approved occurrence emits one JSON string with outer `type: "cr_event"` and payload fields `payload_id`, `cr_user_id`, `sub_app_id`, `payload_version: 1`, `collection: "user_sessions_data"`, ISO-8601 UTC `timestamp`, and JSON-safe `data` containing stable `type` and `lang`; UUIDs are fresh; each message is under 64 KB; reporting is not awaited; bridge exceptions do not affect gameplay; no `options`, batching, retries, or network calls occur.
- **Fail:** Required fields are missing/invalid, duplicate UUID is reused, reporting blocks/fails gameplay, or event volume is per-frame/per-tap.
- **Note:** Event names and `sub_app_id` require Curious Learning confirmation. In-container storage/dedup/offline-sync checks require collaboration after upload; they cannot be proven by a local browser test alone.

## 8. Requirement traceability

| Requirement | Verification |
|---|---|
| PRD-01 — three ordered positions and settled word | TST-04, TST-08 |
| PRD-02 — configured sets and middle vowel | TST-02, TST-03 |
| PRD-03 — random word and animated spin | TST-04, TST-05, TST-09 |
| PRD-04 — word, image, pronunciation, media resilience | TST-06, TST-07 |
| PRD-05 — JSON level data and validation | TST-01, TST-02, TST-03 |
| PRD-06 — English-only content | TST-03, TST-12, TST-14 |
| PRD-07 — offline/container compatibility | TST-11, TST-12, TST-13, TST-14, TST-15 |
| DVS-01 through DVS-03 — runtime and launch | TST-11, TST-12, TST-13 |
| DVS-04 through DVS-06 — schema, validation, state | TST-01 through TST-05 |
| DVS-07 — media | TST-06, TST-07, TST-13, TST-14 |
| DVS-08 — event reporting | TST-12, TST-15 |
| DVS-09 — build and package | TST-13, TST-14 |
| DVS-10 — startup/error resilience | TST-01, TST-02, TST-07, TST-11 |
| UI-01 through UI-05 — layout and interactions | TST-04 through TST-08 |
| UI-06 — motion | TST-09 |
| UI-07 — responsive/accessibility | TST-10 |

## 9. Open decisions affecting tests

The following tests assume proposals that should be updated if product decisions change:

- Vowel policy excludes `y`; duplicate configured letters and duplicate words are rejected.
- Word selection is uniform with replacement. Deterministic tests use an injected random source, not a probability threshold.
- A single “Spin” control is proposed; its final label and form need approval.
- Spin duration is proposed as 1.5 seconds; timing tests should use the approved value and reasonable scheduling tolerance.
- `game_started` and `word_presented` are proposed reporting events. Confirm event names and payload fields with Curious Learning.
- The English language catalog code, engine slug, and stable `sub_app_id` must be supplied before release packaging tests can pass.

## 10. References

- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), “MVP Implementation.”
- [**ThirdPartySpec v1.8**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u), §§1–7 and Appendix A.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c), spec-to-test traceability and acceptance-first development principles.
- [PRD.md](./PRD.md), [DEVSPEC.md](./DEVSPEC.md), [UISPEC.md](./UISPEC.md).

## 11. Change log

2026-11-13 — Copilot — Created the initial MVP test strategy, acceptance checks, and requirement traceability matrix.
