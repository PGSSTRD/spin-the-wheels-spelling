# Task: reworked-game-logic

**Status:** Implemented and tested — awaiting user review

**Created:** 2026-11-16

**Approved for implementation:** 2026-11-16

## Confirmed gameplay decisions

The user resolved the decisions below before implementation:

- Keep target text visible and play pronunciation once when a word is set.
- After finding a target, disable `Find a word` until a wheel value changes.
- Lock the wheels after success until the next `Find a word`.
- Use configured-order wraparound, 40px per letter, snapping on release, and remove `?` after the first step away; keyboard arrows provide equivalent changes.
- The missing-image fallback enables wheel interaction.
- For an all-fixed level, offer `Spell` immediately after finding a word, once the picture or fallback is presented.
- Keep the correct result until the next `Find a word`, then reset placeholders and feedback.
- Follow-up approved on 2026-11-16: exclude the current target from the next random selection unless the level contains only one word. Choose uniformly among the remaining words without re-rolling.
- Visual follow-up approved on 2026-11-16: single-letter fixed spinners use a monochrome gray background, border, and shadow with darker gray letter text. Multi-letter spinners retain their existing colors, including while temporarily disabled.
- Further visual follow-up approved on 2026-11-16: before a target is found (including after a level change), all spinners use the same gray styling. Finding a target restores the multi-letter spinners' colors; single-letter spinners remain gray.
- Roller styling approved on 2026-11-16: non-gray spinners have stationary dark-green top/bottom shading, a bright pale-green center band, and a subtle inset rim. Letters move beneath the non-interactive shading; gray spinners, dimensions, layout, and gameplay remain unchanged.
- Roller shading refinement approved on 2026-11-16: darken the overlay's top/bottom green color channels by 10% (rounded to whole RGB values), preserving opacity, the clear center band, and gray spinners.
- Monochrome roller follow-up approved on 2026-11-16: gray spinners also use the same stationary shading and inset rim, with monochrome colors matching their existing palette and a brighter center band. This supersedes the earlier exclusion of gray spinners from roller styling; interaction and layout remain unchanged.
- Correct-answer feedback approved on 2026-11-16: flash each selected letter gold once, left to right, for 0.5 seconds per letter (1.5 seconds total), including fixed letters. Restore each letter's normal color after its flash; starting another cycle or changing levels clears the sequence.
- Revised correct-answer feedback approved on 2026-11-16: replace the sequential flashes with two simultaneous gold flashes across all selected letters, including fixed letters, over one second total. Each 0.5-second cycle consists of 0.25 seconds gold and 0.25 seconds normal color; preserve cancellation on new cycles and level changes.
- Success audio approved on 2026-11-16: generate and bundle an original trumpet-like three-note "Ta-da-daaa" WAV lasting approximately 1.2 seconds, and play it once when the selected letters exactly match the target. Stop prior pronunciation to avoid overlap; stop the fanfare on a new word, level change, or unmount. Playback failures must be logged and shown non-blockingly without losing the correct result.
- Success-feedback sequencing approved on 2026-11-16: wait for the fanfare's actual playback-ended event before starting the two simultaneous gold flashes. If playback fails, show/log the non-blocking warning and proceed to flashing. Cancel pending completion callbacks when a new word starts, the level changes, or the game unmounts.
- Drag-selection bug fix requested on 2026-11-16: prevent browser text selection and native drag-and-drop from taking over wheel gestures. Scope suppression to the wheels, preserve keyboard focus and pointer capture, and retain normal page interaction outside the wheels.
- Success-audio removal requested on 2026-11-16: retain `content/audio/triumphant.wav`, but remove its playback for now. Correct answers immediately trigger the existing two simultaneous gold flashes, without waiting for audio; word pronunciation remains unchanged.
- Incorrect-letter feedback requested on 2026-11-16: on an incorrect submission, flash only mismatched selected positions red (including remaining question marks), using the gold feedback timing: two simultaneous 0.25-second flashes with 0.25-second normal-color intervals, one second total. Matching positions stay unchanged; repeated submissions restart flashing, and edits/new words/level changes clear it.
- Red-feedback refinement requested on 2026-11-16: brighten the red flash color by 15% per RGB channel, rounded to whole values (`#c62828` → `#e42e2e`), without changing timing or behavior.
- Supplied success/word audio requested on 2026-11-16: serve and package the new files from `content/lang/english/audio/` at runtime under `lang/english/audio/`. On a correct answer, play `correct.mp3` to completion, then play `words/<word>.mp3` while running the existing gold flashes. Finding a target also uses the supplied word MP3 instead of the obsolete `audios/` paths. Keep the synthetic WAV unused; cancel both sequence phases on a new word, level change, or unmount, and surface audio failures without blocking the remaining feedback.
- Additional narration requested on 2026-11-16: play `give-the-wheels-a-spin-and-spell-a-word.mp3` once on startup; announce actual level changes with `level-<number>.mp3`, never announcing level 1 at startup and announcing it only when returning from another level. Play `please-try-again.mp3` on each incorrect submission alongside the red flashes. New audio events cancel earlier playback to avoid overlap.
- Clarified Find/startup behavior on 2026-11-16: the user chose to keep playing the word on Find a word and not play the shorter `give-the-wheels-a-spin.mp3`, including on the first press. If startup audio cannot autoplay, show a Play instructions button for an explicit retry. Narration failures remain visible/logged and non-blocking.
- Position-label removal requested on 2026-11-16: remove the visible First/Middle/Last captions above the spinners and their unused styling, while preserving the accessible position names for screen readers.
- Flash-count increase requested on 2026-11-16: use three flashes for both incorrect red and correct gold feedback, preserving each 0.5-second cycle (0.25 seconds highlighted, 0.25 seconds normal), for 1.5 seconds total.
- Startup-render timing retained by user approval on 2026-11-16: defer the once-only introduction until the ready UI is committed and has a paint opportunity, using two animation frames rather than an arbitrary timeout. Cancel pending startup playback on early word/level selection or unmount. Preserve the Play instructions fallback, because render timing does not bypass autoplay restrictions. The user identified the original port-8000 problem as reuse of another project's port; keep the game preview on 4187.
- Startup fallback refinement on 2026-11-16: offer Play instructions while the startup play request is pending, not only after rejection. Hide it on the actual playing event; a retry cancels the previous request and starts narration in the click handler. This covers browsers that defer autoplay without rejecting the playback promise. Port 8001 initially served the previous production bundle and must load the rebuilt version to exercise the rendering delay.
- Startup narration removal requested on 2026-11-16: supersede the startup playback/render-delay/fallback decisions above. Do not play `give-the-wheels-a-spin-and-spell-a-word.mp3`; remove its error message and Play instructions button, including startup scheduling, retry state, and unused button styles. Retain the recording and written instruction. Preserve word pronunciation, level announcements, correct-answer sequencing, and try-again narration.
- Complete-selection gating requested on 2026-11-17: keep Spell disabled until all adjustable spinners have chosen letters, with no remaining `?`. Fixed letters already count as chosen. Preserve picture-readiness and no-active-drag requirements. This supersedes allowing a placeholder submission to produce incorrect feedback; the requirement follows the configured wheels, including level 5's adjustable middle vowel.
- Standalone audio compatibility fix on 2026-11-17: reproduce retry and all five level-announcement MP3s failing with `MEDIA_ELEMENT_ERROR: Format error` from `file://`, while identical recordings load over HTTP. Losslessly remux these six active clips without optional metadata, preserving the encoded frames and decoded PCM (SHA-256 equality checked per clip). Leave working word/correct audio and unused startup recordings unchanged; add no runtime dependency or playback workaround.
- Word-audio warning investigation on 2026-11-17: following the user's report of unavailable messages alongside audible playback, directly reproduce format errors for `can` on both Find and post-correct pronunciation, while `correct.mp3` still plays. Audit all 40 unique configured words in file mode; 12 fail: can, man, pam, tan, liz, sin, zit, fan, lat, sam, sap, sat. Apply the same lossless metadata-removal remux only to these failing clips, superseding the earlier decision to leave all word files untouched. Preserve real error reporting rather than suppress warnings; do not claim a false-warning state was reproduced.

## Objective

Replace automatic target-word spinning with a child-operated spelling cycle: find a random word, inspect its picture, adjust the letter spinners manually, and submit the selected spelling.

Gameplay implementation was approved with the confirmed decisions above. Specification synchronization remains a separately approved follow-up.

## Specification references and intentional scope change

- [PRD](../../specs/PRD.md): PRD-01 through PRD-06, plus the current exclusions for manual letter adjustment.
- [DEVSPEC](../../specs/DEVSPEC.md): DVS-04 through DVS-08 — content, validation, game state, media, and reporting.
- [UISPEC](../../specs/UISPEC.md): UI-01 through UI-07, plus exclusions for manual wheel controls and spelling evaluation.
- [TESTSPEC](../../specs/TESTSPEC.md): TST-01 through TST-12 and TST-15, including gameplay and layout regression tests.

The current specs require automatic spinning and exclude manual letter adjustment and manually formed-word evaluation. This request intentionally replaces those rules; it is not merely a visual change and does not authorize unrelated Better/Great features. Keep exactly three spinners and English-only content. Do not add scoring, gibberish audio, a confusion character, velocity-based flicking, or automatic level advancement.

## Required gameplay

### 1. Initial presentation

- Replace the instruction `Give the wheels a spin and discover a word!` with exactly `Give the wheels a spin and spell a word!`.
- Label the primary button exactly `Find a word`.
- Read each spinner's letter set from [levels.json](../../../content/lang/english/levels.json).
- A spinner with multiple defined letters displays one `?` as its selected value.
- A spinner with exactly one defined letter displays that letter.
- Do not enable manual spinning before a target has been selected and its picture is displayed.

### 2. Find a word

- Pressing `Find a word` selects a random target from the current level's `word_list`.
- Show that target's associated picture using the existing media handling.
- Do not automatically spin the wheels or set their selected letters to the target.
- After selection and picture presentation, enable touch/drag interaction on spinners with multiple defined letters.
- Single-letter spinners remain fixed and non-interactive.

### 3. Manual spinner interaction

- Allow each enabled spinner to move upward or downward by touch/drag.
- Spin only through that position's configured letters; preserve their configured order and snap to an unambiguous selected letter.
- Initially include a single question-mark placeholder. Once it has spun out of view, remove it from that spinner for the remainder of the current word cycle. Reversing direction must not bring it back.
- Track placeholder removal independently for each spinner.
- As soon as spinner values begin changing through user interaction:
  - Change the primary button label to exactly `Spell`.
  - Restore the instruction to exactly `Give the wheels a spin and spell a word!`, clearing any previous `Correct!` or `Please try again!` feedback.
- Preserve accessible keyboard operation with an equivalent way to change each enabled spinner in either direction; single-letter wheels must not suggest interactivity.

### 4. Spell and retry

- Each press of `Spell` compares the three selected spinner values, in left-to-right order, with the current random target, not merely with any valid word in the level.
- If all selected letters match the target, show exactly `Correct!` in the instruction position.
- Otherwise, show exactly `Please try again!` in that position.
- Disable `Spell` while any selected value remains `?`; the handler must also reject incomplete submissions without checking the spelling, playing feedback audio, or flashing letters. Fixed positions count as already selected. Reapply this rule after each new word or level change.
- An incorrect attempt must retain the target, picture, and current spinner values so the child can correct the spelling.
- Subsequent user changes to the spinners restore the original instruction, as described above.

### 5. Correct result and next cycle

- After a correct spelling, change the primary button label back to exactly `Find a word`.
- Allow the child to begin another cycle using that button; do not automatically select a new target.
- On the next cycle, reset multi-letter spinners to one `?` each, restore single-letter spinners to their fixed letters, and reset per-spinner placeholder-removal state.
- Preserve the selected level. Exclude the current target from the next selection when multiple words are defined; permit repetition for a single-word level.

## Original decision questions (resolved above)

These questions were resolved by the user before implementation; retain them as decision history:

1. **Target text and pronunciation:** The current game shows the target as text and plays its pronunciation automatically. Should the reworked game retain both when the picture is revealed, withhold target text until success, or use another reveal policy? The request specifies picture display but does not settle these existing behaviors.
2. **Button before the first manual change:** After a target/picture appears but before any spinner changes, the requested wording leaves the button as `Find a word`. Should it select another target when pressed again, or be disabled until the first manual change?
3. **Correct-result interaction:** Should the wheels lock after success until the next `Find a word`, or remain editable (and switch the button back to `Spell` on another change)?
4. **Drag details:** Confirm wraparound behavior, displacement needed to change one letter, snapping, and the precise point at which the question mark counts as having left view. Do not introduce velocity-dependent flick physics by default.
5. **Picture failure:** If the picture cannot load, should the existing visible fallback count as picture presentation and enable the wheels? Avoid leaving the game waiting indefinitely.
6. **All-fixed level edge case:** If a future valid level contains only single-letter spinners, no manual change can trigger `Spell`. Specify whether submission becomes available after selection or such a level is rejected with a clear error. Current levels 001–005 all have at least one multi-letter spinner.
7. **Cycle reset timing:** Confirm that placeholders reset on the next `Find a word` press, with the correct result retained until then, rather than resetting immediately on success.

## Implementation boundaries

- Preserve the approved word-result/picture → spinners → primary-button layout, subject to the target-text decision above.
- Use the existing React/TypeScript architecture and runtime source data; do not change the original reference content file.
- Keep target-word state separate from the child's selected letters and from per-spinner placeholder state.
- Restrict drag handling to enabled wheels, support pointer cancellation, and prevent accidental page scrolling within an active vertical wheel drag without disabling normal page navigation elsewhere.
- Do not submit while a wheel has no stable selected value; preserve a single consistent target across a submission.
- Preserve loading/data errors, media fallback handling, plain-browser English default, container launch requirements, relative/offline assets, reduced motion, and level selection.
- On level changes, reset active target, selected letters, feedback, and placeholder state so nothing leaks between levels.
- Retain exception-safe Curious Reader reporting. Review the existing `word_presented` milestone against the new target-reveal flow; do not report correct spelling merely because a target was selected or invent new event names without approval.

## Acceptance tests

Add focused tests in the existing test files and update tests that assert superseded automatic-spin behavior:

1. Initial instruction and `Find a word` label match the exact requested strings.
2. Levels with mixed single-/multi-letter wheels show fixed letters and one selected `?` per multi-letter wheel.
3. Finding a target displays the correct picture and does not trigger an automatic spin or populate target letters.
4. Manual wheels are unavailable before target/picture presentation; only multi-letter wheels become interactive afterward.
5. Upward and downward drag select configured letters in the approved order and snap consistently.
6. Once removed, `?` never returns in either direction during that cycle; untouched wheels retain their placeholders.
7. The first actual spinner change switches the button to `Spell`; a tap/no-change gesture does not count as a value change.
8. Submitting a fully selected wrong spelling or another valid word shows `Please try again!` and preserves the target. Remaining placeholders disable submission and produce no retry feedback.
9. Changing a spinner after feedback restores `Give the wheels a spin and spell a word!`.
10. Submitting the exact target shows `Correct!` and restores the `Find a word` button.
11. Starting the next cycle resets placeholders and feedback without changing the level or automatically revealing target letters.
12. Level changes, keyboard controls, pointer cancellation, reduced motion, media errors, and the approved pre-interaction/success/all-fixed edge cases behave as agreed.
13. Picture/fallback → spinners → primary button order remains correct in narrow portrait and landscape layouts.

Run `npm test` and `npm run build`; fix failures introduced by the change. Verify real touch/pointer drag behavior and layout in the browser, including reverse direction and repeated attempts.

## Approval and specification follow-up

After implementation is tested and approved, prompt for a separate spec-update task. That follow-up must align the affected PRD, DEVSPEC, UISPEC, and TESTSPEC requirements and exclusions with the new game cycle, update Status and Last updated in each altered spec, append `2026-MM-DD — <author> — <one-sentence description of change>` entries, and list all additions and removals.

## Implementation and verification — 2026-11-16

- Implemented target selection without automatic spinning, independent placeholders, manual pointer/keyboard wheels, exact-match submission, retry feedback, success locking, and next-cycle reset.
- Preserved level selection, launch-language behavior, reporting, media fallbacks, and the approved picture → wheels → button layout. Updated the README gameplay instructions.
- `npm.cmd test`: 25 tests passed across four files, including submission blocking during dragging and release on pointer cancellation.
- `npm.cmd run build`: TypeScript checking and production build passed. `git diff --check` passed.
- Production-preview browser checks passed for mouse dragging, emulated touch dragging, submission disabled during dragging and enabled on release, keyboard direction/wraparound, retry/feedback clearing, success locking, and placeholder reset.
- Browser geometry checks passed at 375×812 and 812×375: picture/fallback → wheels → button, with no horizontal overflow. Keyboard interaction also worked with reduced motion enabled.
- Real image and pronunciation assets remain unavailable in the repository; the browser displayed the existing media fallbacks. Physical touch-device testing was not performed.
- The four product specifications have not yet been synchronized with this gameplay change, pending implementation review and separate spec-update approval.
- No-repeat follow-up: selection now excludes the current word when alternatives exist. Deterministic tests cover low/middle/high random values, two-word alternation, returning to an earlier word after an intervening target, and single-word repetition. Updated validation: 29 tests passed, TypeScript checking and production build passed, and `git diff --check` passed.
- Fixed-spinner styling follow-up: browser computed-style checks confirmed neutral gray backgrounds, borders, shadows, and darker gray text on single-letter spinners; temporarily disabled multi-letter spinners retain their green styling. All 29 tests, TypeScript checking, production build, and `git diff --check` passed.
- Pre-selection styling follow-up: browser computed-style checks confirmed all spinners share the fixed-spinner gray palette before selection and after a level change, while selecting a target restores only multi-letter spinner colors. All 29 tests, TypeScript checking, production build, and `git diff --check` passed.
- Roller styling follow-up: browser computed styles and a visual screenshot confirmed top/bottom shading and the inset rim only on non-gray wheels, a pointer-transparent overlay, and unchanged wheel dimensions. All four targeted wheel tests, TypeScript checking, production build, and `git diff --check` passed.
- Monochrome roller follow-up: browser computed styles and a visual screenshot confirmed matching monochrome shading/rims on gray wheels before and after target selection, unchanged green shading, and pointer-transparent overlays. All four targeted wheel tests, TypeScript checking, production build, and `git diff --check` passed.
- Gold-feedback follow-up: browser animation checks verified exactly three single-iteration 500ms flashes with 0/500/1000ms delays. Computed colors at 0, 499, 500, 999, 1000, 1499, and 1500ms confirmed only the intended selected letter is gold, including fixed letters, with normal colors restored afterward. Wrong answers do not flash; new cycles and level changes clear the animations. All 19 targeted app/wheel tests, TypeScript checking, production build, and `git diff --check` passed.
- Simultaneous gold-feedback revision: browser animation checks verified synchronized start times, zero delays, and two 500ms iterations on all three selected letters. Color samples at 0/249/250/499/500/749/750/999/1000ms confirmed two simultaneous 250ms gold flashes separated by normal colors, with all normal colors restored at completion. All 19 targeted app/wheel tests, TypeScript checking, production build, and `git diff --check` passed.
- Success-audio follow-up: generated `content/audio/triumphant.wav` as original synthesized trumpet-like G4/C5/E5 notes, mono 16-bit PCM at 44.1kHz. Independent WAV checks confirmed exactly 1.2 seconds, three separated notes, and no clipping. The production build bundles the asset locally; a native browser playback check confirmed one playback attempt, `playing`, and `ended` at a decoded duration of 1.2 seconds after a correct spelling. All 33 tests passed, including wrong-answer exclusion, playback failure handling, and cancellation/stale-failure protection on new words, level changes, and unmount. TypeScript checking, production build, and `git diff --check` passed.
- Audio-before-flashes revision: native browser checks confirmed no flashing at playback start or midway through the sound, followed by playback-ended and then flashing. All 20 targeted app tests passed, including sequencing across successive words, flashing after playback failure, and ignoring canceled/stale completion events. TypeScript checking, production build, and `git diff --check` passed.
- Drag-selection fix: wheel pointer-down now prevents native selection while explicitly preserving focus and pointer capture; native drag-start is canceled, letter tracks do not intercept pointer hit testing, and standard/WebKit non-selection styles are scoped to wheels. Browser mouse drags beyond the frame and back changed letters without selecting text or starting native dragging; keyboard and emulated touch dragging also passed. All 25 targeted app/wheel tests, TypeScript checking, production build, and `git diff --check` passed.
- Success-audio removal: retained the original 105,884-byte WAV, removed its runtime import/playback and obsolete audio-to-flash sequencing, and restored immediate double gold flashes. Browser checks confirmed no fanfare request or additional audio playback on success, while pronunciation attempts remain unchanged. All 31 tests, TypeScript checking, production build, and `git diff --check` passed; the user preview remains running.
- Incorrect-letter feedback: mismatched positions now flash red with the shared gold animation timing. Browser samples at 0/249/250/499/500/749/750/999/1000ms verified two 250ms red flashes over one second, matching letters unchanged, synchronized multiple mismatches including question marks, restart on repeated submission, clearing on edits, and preserved gold success feedback. All 21 targeted app/wheel tests, TypeScript checking, production build, and `git diff --check` passed. The preview remains running.
- Supplied-audio sequencing: native browser playback confirmed `correct.mp3` ends before the target word MP3 starts, with gold flashes starting alongside the word's `playing` event. All 39 tests, TypeScript checking, production build, and `git diff --check` passed, including both-phase cancellation and non-blocking failures. Development and production audio endpoints returned the supplied bytes with `audio/mpeg`. Across 40 unique configured words, 39 recordings and `correct.mp3` were packaged byte-identically; the supplied source set lacks `words/sap.mp3`, which uses the explicit non-blocking error path. The synthetic WAV remains unused, and the user preview remains running.
- Recording completion: the user supplied `words/sap.mp3`. Rebuilt successfully and verified all 40 unique configured word recordings plus `correct.mp3` are present and packaged byte-identically; the running preview serves the new recording correctly. Removed the missing-recording note from the README.
- Additional narration: all 30 targeted app tests passed, including startup-only narration, no initial level-1 cue, all five level changes, user-gesture startup retry after simulated autoplay denial, stale startup-failure cancellation, repeated wrong-answer narration, and non-blocking cue failures. Native browser checks confirmed startup instruction loading, level-2 and return-to-level-1 playback through completion, try-again playback, and retained Find-a-word pronunciation without the shorter prompt. All seven newly wired narration files were packaged and served byte-identically. TypeScript checking, production build, and `git diff --check` passed; the user preview remains running.
- Position-label removal: browser and regression checks confirmed no visible First/Middle/Last captions, while all three screen-reader position names remain available. All 30 targeted app tests, TypeScript checking, production build, and `git diff --check` passed.
- Three-flash refinement: browser timing and color samples at 0/249/250/499/500/749/750/999/1000/1249/1250/1499/1500ms verified three flashes for both red mismatches and gold success, with 500ms cycles and normal colors restored at 1.5 seconds. TypeScript checking, production build, and `git diff --check` passed.
- Startup-render/fallback verification: all 35 App tests passed, including frame-by-frame startup scheduling, cancellation after early word/level selection or unmount, rejected autoplay, and indefinitely pending autoplay. TypeScript checking, production build, and `git diff --check` passed. On localhost:8001, instrumentation confirmed the rebuilt app attempts narration with the wheels already rendered. A browser check deliberately held the first play promise pending: Play instructions remained available without a false error, and clicking it started native MP3 playback and hid the button. The forced-pending condition was test instrumentation, not proof of the user's browser policy.
- Startup narration removal verification: all 29 App tests passed. The replacement regression advances two animation frames after the ready screen appears and verifies no audio player/play attempt, no instruction error, and no Play instructions button, while retaining the written instruction. Existing level, pronunciation, retry, success-sequencing, failure, and cancellation tests remain passing with no startup-audio offset. TypeScript checking, production build, and `git diff --check` passed.
- Standalone audio verification on 2026-11-17: the rebuilt game opened directly from `dist/index.html` played the retry clip through native `playing` and `ended` events after a wrong submission, with no retry-audio error. All five level clips then loaded metadata successfully from `file://`. Each of the six remuxed source files has identical decoded PCM to its original. TypeScript checking, production build, and `git diff --check` passed. No gameplay code changed.
- Word-audio verification on 2026-11-17: all 40 word recordings now load metadata successfully from the rebuilt standalone file origin (40 passed, zero failed). Native gameplay checks for `can` confirmed pronunciation through playing/ended on Find, then correct-answer playback and repeat pronunciation through playing/ended, with no audio-warning status. Decoded PCM SHA-256 remained identical before/after for each of the 12 repaired clips. TypeScript checking and production build passed; no gameplay code or error suppression was introduced.
- Complete-selection gating verification on 2026-11-17: all 43 App tests, TypeScript checking, production build, and `git diff --check` passed. Tests cover two and three adjustable wheels selected out of order, no retry feedback/audio or target change from disabled submission, successful spelling after all choices, and reset for a new word; existing fixed-wheel/all-fixed and drag-readiness cases remain passing. Native file-mode level-5 checks confirmed Spell stays disabled after selecting first and last, and enables only after selecting the adjustable middle vowel as well.
