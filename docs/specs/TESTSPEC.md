# Spin The Wheels — Test Specification

**Status:** Synchronized with approved implementation through 2026-11-17; unit/browser evidence is recorded separately from outstanding release validation
**Last updated:** 2026-11-17
**Product scope:** MVP-derived game with approved manual-spelling changes

## 1. Purpose and evidence policy

Validate [PRD.md](./PRD.md), [DEVSPEC.md](./DEVSPEC.md), and
[UISPEC.md](./UISPEC.md) sufficiently for an independent implementation.
Acceptance cases below are required checks, not a claim that every device,
integration, accessibility, legal, or packaging check has already passed.

Use unit/component tests for deterministic state, parser, reporting, and event
ordering; use real browsers for native image decoding, font rendering, media,
CSS animation, pointer/keyboard behavior, and file-origin restrictions.
jsdom media mocks and synthesized animation events alone cannot prove those.

## 2. Environments and fixtures

- Test a production build opened directly as `file://.../index.html`, offline,
  as well as equivalent development HTTP routes.
- Test browser launch with and without a fake `ReactNativeWebView.postMessage`
  bridge, query parameters, blocked bridge calls, and blocked session storage.
- Exercise narrow widths 320/375/430px and 620/800px, desktop keyboard/pointer,
  portrait/landscape, touch emulation, and actual target WebView/older Android
  hardware before release.
- Disable network during offline checks and record unexpected requests,
  console errors, media events, DOM status, and screenshots where relevant.
  Expected injected failures must have explicit assertions/diagnostics.
- Supply controllable randomness, media factories/events, and real native
  animation completion as appropriate. Do not use a fixed sleep as proof that
  the audio-plus-animation gate behaves correctly.

### Fixture A — Minimal two-word level

```json
[
  {
    "level_id": "001",
    "word_list": ["cat", "mat"],
    "spinners": [
      { "spinner1": { "letter_list": ["c", "m"] } },
      { "spinner2": { "letter_list": ["a"] } },
      { "spinner3": { "letter_list": ["t"] } }
    ]
  }
]
```

### Additional focused fixtures

- **B, singleton:** A with only `cat`; repetition is allowed.
- **C, all adjustable:** `cat,cap,mat,mit` with first `c,m`, middle `a,i`,
  last `t,p`; all three wheels must be selected. Keep numeric level ID `001`.
- **D, all fixed:** only `cat`, with singleton `c`, `a`, `t` lists.
- **E, invalid data:** mutate A one fault at a time using TST-03.
- **F, pictures:** distinct SVG+JPG for cat; JPG-only mat; neither for a third
  target; broken SVG with usable JPG; invalid JPG; square/wide/tall images.
- **G, media:** all valid; one missing word; all missing; denied autoplay;
  decode failure; delayed playing/end; missing playing; mute/cancel during cues.
- **H, font/license:** supplied Lexend WOFF2 and OFL, complete source manifest,
  and deliberate missing/duplicate/empty manifest fields in validation copies.

Do not commit temporary generated image/audio fixtures as production assets.
Use DVS-04's complete catalog for five-level/content regression tests.

## 3. Acceptance cases

### TST-01 — Entry and language parameters

1. Open a standalone build with `?cr_lang=english&cr_user_id=test-user`.
2. Repeat without `cr_user_id`; repeat without `cr_lang` in a plain browser.
3. Repeat with missing `cr_lang` and the bridge; then with unknown/empty code.

**Pass:** English loads for valid/default plain-browser cases, user defaults
to empty, and missing container language/unsupported values show explicit
configuration errors. No unrelated language or fabricated data is substituted.

### TST-02 — Offline ready, startup budget, and no eager media dependency

Open file origin with networking disabled. Measure from entry navigation to
ready or explicit local-data error; inspect every requested resource.
Repeat with missing JSON, invalid JSON, and a request that never completes.

**Pass target:** ordinary success/error completes within the ThirdPartySpec
10-second budget, no external request/module-loading failure occurs, and all
word media is not required before ready.
**Known gap:** current JSON XHR has no timeout for a never-completing request;
that injected case cannot be marked passed without a separate implementation fix.

### TST-03 — Exact level schema validation

Parse A, the complete catalog, and uppercase spinner-letter variants.
Independently reject: non-array/empty input; duplicate/missing/empty IDs;
wrong spinner count/wrapper position; empty letter list; multi-character,
non-ASCII, or duplicate case-normalized letters; middle `y`/consonant;
empty/duplicate word list; uppercase word, whitespace, punctuation,
wrong-length word; and a word not spellable by its positional sets.

**Pass:** uppercase spinner letters normalize, but uppercase words fail.
Additional fields may be ignored; no `word_media` map is needed.
Verify shipped level IDs/word sets match DVS-04, counts 3/4/13/14/40 and
40 unique words. General non-empty ID strings are parser-valid; do not
assert numeric-ID rejection the current parser does not perform.

### TST-04 — Target choice is not wheel solving

Use controlled random values at the first/last candidate boundaries.
Find a target, complete it, then Find again. Repeat A and B.

**Pass:** choices are from the current level; A alternates when only one
alternative remains; singleton B may repeat. Larger sets exclude only the
immediate current target, not all previous words. Finding leaves adjustable
wheels at `?`, fixed letters unchanged, and emits one target event.
Assert no unsolicited target change during audio, flashing, or wheel edits.

### TST-05 — Main-action guards and incomplete selections

Check ready, awaiting picture, awaiting first edit, partially selected, fully
selected, dragging, incorrect-feedback, and correct-feedback states.
Use C to ensure every adjustable position is required and D for all-fixed.

**Pass:** exact labels/disabled states match UI-03. No activation during a
disabled state queues work. Spell is unavailable while dragging or while any
placeholder remains. D offers Spell once its picture/fallback is ready.
Correct locks wheels until Find; incorrect remains on the same target.

### TST-06 — Picture priority, sizing, fallback, and native decoding

Inspect actual requested image URLs:

1. Usable cat SVG and JPG present: request/use SVG only.
2. SVG missing/corrupt, JPG usable: SVG then JPG; never fallback prematurely.
3. Both fail: SVG then JPG then grayscale painting, without visible error text.
4. Verify no PNG/`.jpeg`/WebP probe or per-word media-map dependency.
5. Change target/level while candidates are pending; deliver old events.
6. Inspect empty frame initially/reset, native JPG decode, and each aspect ratio.
7. Add a named image to a built standalone directory and load its target again.

**Pass:** persistent frame, no stale-source takeover, picture readiness stays
false through JPG loading, final fallback is ready/playable and accessible.
Actual image pixels fit within 80% of both dimensions, centered without
cropping/stretching; intrinsic SVG height cannot overflow the fixed grid row.
Both file and HTTP origins work; no generated index rebuild is needed.

### TST-07 — Exact spelling and narration sequence

Submit an incomplete selection, wrong letters, another valid word, and target.
Exercise audio cue failure, word failure, delayed/missing playing, and mute.

**Pass:** incomplete is ignored; only the exact target succeeds.
Find plays the selected word once; correct cue ends before the target begins;
gold starts at target playing or the specified completion/failure fallback,
not at cue start. Retry plays its clip with red on mismatches only.
No startup narration, initial level cue, or generated fanfare is played.
Failures are non-blocking/diagnosed and cannot strand the feedback lock.

### TST-08 — Level changes, reset, and cancellation

Change among all five levels, including return to 1, during picture lookup,
drag/attempt, retry audio, correct cue, pronunciation, and active flashes.
Reselect the current level; switch from unavailable audio to a usable level.

**Pass:** actual changes reset target/letters/frame/feedback, preserve mute,
cancel old callbacks, and announce the new level if allowed. Same-level
selection does nothing. Initial level 1 is silent. New announcements do not
inherit the previous level's unavailable result. No automatic advancement.
Selector has no visible standalone caption, keeps `Choose level`, is 36px high
with readable enlarged font, and preserves its right edge.

### TST-09 — Flash timing, normal colors, and reduced motion

In a real visible browser record representative frames and animation events
for correct and partially wrong submissions, with reduced motion on/off.

**Pass:** three synchronized 500ms cycles, 250ms highlight/250ms normal each;
correct all three gold, wrong mismatches only red; final colors return to
green/gray. Gold timing follows pronunciation. Current reduced-motion mode
removes scroll/button transitions but retains these flashes and manual gestures.
Do not claim a different reduced-motion spin implementation or full
accessibility approval; assess flashing requirements separately before release.

### TST-10 — Responsive layout and optical glyph centering

At 320, 375, 430, 620, and 800px, inspect title, selector, all wheel counts,
frame, main action, and sound button. Use square/wide/tall pictures and
representative `A`, `T`, `?` glyphs.
Assert word-result, picture, wheels, and actions occur in that order in both
DOM and visual presentation, including fallback and landscape layouts.

**Pass:** no horizontal overflow/overlap; selector right edge remains aligned;
54px sound circle and primary height agree; speaker size is stable between
states and left alignment follows the rotated brand. Letter viewport/pitch
remain 76px and drag step 40px despite the -2.5px optical shift. Representative
ink is visually centered (approximately within 1 CSS px), not low.

### TST-11 — Local data error behavior

Exercise missing/unreadable file, status outside 0/200, JSON syntax error,
and each schema fault. Observe status, console, and controls.

**Pass:** explicit blocking error and diagnostic, no uncaught exception,
fabricated word, partial playable catalog, or silent fallback to another level.
Do not conflate tolerated missing images/audio with invalid level data.

### TST-12 — Keyboard and accessible semantics

Navigate without a pointer. Inspect wheel names/ranges/Not selected,
fixed-wheel semantics, target/status live regions, image alt/fallback
description, selector name, sound action/pressed/disabled state, and focus.

**Pass:** ArrowUp/Down wrap correctly; fixed/locked wheels cannot be edited;
native select and buttons work with keyboard, focus is visible, status is not
color-only, and repeated flashes do not cause repeated target announcements.
Record remaining accessibility findings rather than asserting certification.

### TST-13 — Runtime resource audit

Check local JSON, all 40 unique word recordings, cue/level MP3s, images,
Lexend, OFL, and manifest in the production package. Test actual decode/play
from file origin, not merely successful HTTP or a mocked play promise.

**Pass:** no external dependency, root-absolute URL, Service Worker, CacheStorage
requirement, HTML returned as missing image, or undeclared source map.
Unused instruction recordings remain unplayed; original circular unmuted icon
and generated WAV are not accidentally activated. Missing media follows its
fallback, without all-at-once decoder loading.

### TST-14 — Layout A release packaging and delivery

When release ZIPs are produced, inspect engine/language roots and collisions,
mount them together, open entry offline, then validate actual container launch.
Check icon is real PNG, square and ≥192px (512 recommended); confirm catalog
slug/code/title/template, permanent ID, user-ID query propagation, and Publish.

**Pass:** DVS-09's split Layout A contract and ThirdPartySpec delivery are met.
**Current status:** combined `dist` is implemented; automatic release ZIP
generation/catalog/container publication are not. A successful local build
does not mark this case passed.

### TST-15 — Reporting envelope, cadence, and isolation

Capture/parse bridge calls after load, Find, edits, retries, correct completion,
level change, and rerender. Repeat with no bridge and a throwing bridge.

**Pass:** one game_started after initial valid ready, one word_presented per
accepted target selection (not after a spin), no other current gameplay events.
Check `cr_event`, fresh UUID-v4 payload ID, opaque/default user ID, current
`spin-the-wheels` ID, version 1, collection, UTC timestamp, JSON-safe language/
level/word data, and no collection options. No duplicate game_started on level
reset/StrictMode effects, blocking, network, or retry queue. Verify actual
release messages under 64 KB; a generic oversize guard is not implemented.
Permanent ID/event acceptance still requires integration confirmation.

### TST-16 — Native manual wheel behavior

For A and C, test primary pointer/touch up/down, exact 40px boundaries,
subthreshold movement, multiple steps, wraparound, release/cancel, and keys.
Try fixed, inactive, picture-pending, and correct-locked wheels.

**Pass:** configured-order movement; initial up selects first/down last;
placeholder never returns mid-cycle; no inertia; current choice snaps on end;
fixed/locked values do not move. Spell stays disabled throughout a drag.
Use actual pointer input as well as component dispatch tests.

### TST-17 — Audio AND animation completion gate

Cover success and retry, with audio longer than flashes and flashes longer
than audio. Finish three success animations individually. Repeat while muted,
all audio unavailable, play rejected, correct cue failing, word failing,
muting mid-cue, editing wrong letters, changing level, and unmounting.

**Pass:** no primary action until both conditions are clear. One/two success
animation ends cannot unlock a third pending letter. Muted/unavailable still
waits visuals. A retry edit cancels red flashes but not outstanding retry audio.
Mute releases audio only and starts any waiting gold feedback. Fresh attempt
IDs/cancellation ignore old completions. No duplicate submission/queued Find.
In native media testing, deliberately lengthen playback past flash completion
to prove the button waits for real audio end, not a fixed visual-duration timer.

### TST-18 — Mute, icon colors, persistence, and sequential availability

1. Verify fresh navigation unmuted; toggle, change level, reload same tab;
   then fresh-navigate again. Repeat with storage throwing.
2. Mute during correct/retry/word/level clips, then unmute.
3. Track live probe count and order with some/all missing, pending, first
   usable, denied playback, rapid level changes, and unmount.
4. Inspect native icon geometry and solid colors in each state.

**Pass:** same-tab reload restores preference, fresh navigation starts unmuted,
storage errors are logged without breaking controls; mute cancels playlist,
unmute does not replay; at most one probe, correct/retry/level/unique words
order, first loadeddata stops/releases scan, all failures alone disable it.
Pending and denied autoplay are not absence; stale scans cannot update a new
level. Foreground playback is independent of the one availability probe.
Unmuted RGB is 47,118,66; muted 228,46,46; unavailable approximately 140,140,140.
Dimensions stay 54×54; muted slash stays inside its circle.

### TST-19 — Lexend and source-license inventory

Verify actual rendered font for title, wheels, main button, and selector,
not only computed family. Inspect local @font-face/no remote requests,
stable packaged font path, no synthesized faces, and byte-identical font/OFL.
Deliberately make the font unavailable and verify readable sans-serif fallback
with usable controls and no new clipping/overflow.
Validate unique inventory paths, five non-empty metadata fields, source-file
existence, complete media coverage, and packaged-manifest equality.

**Pass:** source inventory is currently 56 files: 49 MP3 + 1 WAV + 5 SVG +
1 WOFF2. Lexend is OFL with notice; three owner-approved speaker SVGs are CC0;
pictures and generated WAV remain NOASSERTION; MP3 records retain the supplied
ElevenLabs caveats/URLs/inherited guidance date. Unused source files stay
inventoried without requiring every file to ship separately.
**Release gate:** do not mark redistribution/commercial use approved while
these permission/distribution issues remain unresolved.

### TST-20 — Prevent selection without gameplay regressions

In a real browser, drag over title, instruction, target, and footer text.
Use a temporary selection-enabled control experiment to prove the test can
detect highlighted text, then restore production CSS.

**Pass:** no accidental game-card text selection under production CSS.
Actual native dropdown selection, primary button, wheel pointer drag, wheel
keyboard arrows, focus, and feedback completion still work. Accessible text
remains exposed. No document-wide event cancellation was added to fake a pass.
Use a visible/focused page or restored temporary focus emulation; synthetic
events alone do not prove native mouse selection prevention.

## 4. Coverage matrix

| Requirement | Primary acceptance cases |
|---|---|
| PRD-01 / DVS-06 / UI-02, UI-03 | TST-04, TST-05, TST-07, TST-16, TST-17 |
| PRD-02 / DVS-04, DVS-05 / UI-02 | TST-03, TST-05, TST-16 |
| PRD-03 / DVS-06 / UI-03, UI-08 | TST-04, TST-08, TST-17 |
| PRD-04 / DVS-07 / UI-04, UI-05, UI-06 | TST-06, TST-07, TST-09, TST-17 |
| PRD-05 / DVS-04, DVS-05, DVS-07 | TST-03, TST-06, TST-11, TST-13 |
| PRD-06 / DVS-03 | TST-01 |
| PRD-07 / DVS-01, DVS-02, DVS-08, DVS-09, DVS-10 | TST-02, TST-11, TST-13, TST-14, TST-15 |
| PRD-08 / DVS-07, DVS-11 / UI-06, UI-09 | TST-07, TST-08, TST-17, TST-18 |
| PRD-09 / DVS-12 / UI-01, UI-07, UI-08, UI-09 | TST-08, TST-10, TST-12, TST-18, TST-19, TST-20 |
| PRD-10 / DVS-09, DVS-12 / UI-07 | TST-14, TST-19 |

## 5. Current verification evidence and release exit criteria

Implementation verification recorded during the approved work:

- Full Vitest suite: 60 tests across four files after the feedback-lock changes.
- Most recent targeted App/Wheel suite: 50 tests after selection-prevention CSS.
- Production type-check/build passed after the final implementation change.
- Native browser checks included standalone file origin, 40 word recordings,
  SVG/JPG/fallback requests and sizing, rendered Lexend, icon colors, responsive
  layout, real feedback completion, and native selection/input regression checks.

These are historical implementation results, not newly executed tests merely
because this document was updated. They do not prove every acceptance case.
The documentation synchronization is documentation-only; validate its links,
examples, catalog, requirement traceability, metadata, and stale-claim removal.

Before release, rerun relevant tests against the actual artifact; complete
device/WebView, startup fault, accessibility, release ZIP/catalog/bridge
validation; and resolve distribution rights. Record each result, environment,
artifact identity, and remaining failure. Do not replace missing evidence with
a successful build, inventory, mocked event, or desktop screenshot.

## 6. References

- [PRD.md](./PRD.md), [DEVSPEC.md](./DEVSPEC.md), [UISPEC.md](./UISPEC.md).
- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), original MVP baseline plus approved manual-gameplay changes.
- [**ThirdPartySpec**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u), offline/runtime/release validation requirements.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c), traceability and controlled updates.

## 7. Change log

2026-11-13 — Copilot — Created the initial MVP test strategy, acceptance checks, and requirement traceability matrix.
2026-11-16 — Copilot — Added tests for English defaulting in plain browsers and required cr_lang on container launches.
2026-11-16 — Copilot — Added DOM-order regression and portrait/landscape checks for the approved picture, spinners, and button layout including the missing-image fallback.
2026-11-17 — Copilot — Replaced automatic-spin and obsolete media fixtures with exact current data, manual-wheel, feedback-order, mute/probe, image, typography, licensing, native-selection, and honest release-gap acceptance coverage.
