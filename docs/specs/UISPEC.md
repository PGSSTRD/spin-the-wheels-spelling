# Spin The Wheels — User Interface Specification

**Status:** Synchronized with approved presentation and interactions through 2026-11-17; older-device and full accessibility validation remain outstanding
**Last updated:** 2026-11-17
**Product scope:** MVP-derived game with approved manual-spelling changes

## 1. Purpose

Define a reproducible UI for [PRD.md](./PRD.md) using the runtime/state contracts
in [DEVSPEC.md](./DEVSPEC.md). The approved manual game replaces automatic
spinning: a target is revealed first, and the player sets letters and presses
Spell. [TESTSPEC.md](./TESTSPEC.md) defines acceptance checks.

## 2. Layout

### UI-01 — Screen composition (PRD-01, PRD-04, PRD-09)

Use one centered game card with this order:

1. Header: rotated **S** brand mark and `Spin the Wheels` title on the left;
   level selector on the right. Eyebrow: `A LITTLE WORD MAGIC`.
2. Instruction/status region. Initial text:
   `Give the wheels a spin and spell a word!`
3. Target word, uppercase visually, when selected; before selection,
   `Your word will appear here`.
4. Persistent picture frame: empty without a target, resolved image or
   monochrome painting during a target cycle.
5. Three letter wheels in a row.
6. Actions: sound toggle on the left and the main action centered.
7. Encouraging footer: `One word at a time. You’ve got this!`

Keep the word-result, picture, wheels, and action order in both DOM and visual
presentation, not just through CSS reordering.

Keep the frame visible before Find and after a level reset. Remove neither it
nor its reserved space because a picture is unavailable. Do not show the old
literal painting emoji, visible missing-picture sentence, startup instruction
button, or automatic-spin progress UI.

Loading and blocking-data-error screens must explain their state rather than
display partially valid gameplay. Local media/reporting failures must not
replace a valid level with an error screen.

### UI-08 — Header and level selector (PRD-03, PRD-09)

- Use native select options `Level 1` through `Level 5` for the supplied catalog.
- Do not show a standalone `Level` caption. Retain accessible name `Choose level`.
- Selector height: 36px. Font: Lexend, `clamp(16px, 2.5vw, 20px)`, with padding
  `0 10px` (6px horizontal at widths ≤430px) and minimum width 96px (82px
  on narrow screens). Use white background, `#294d35` text, 1px `#dce8dc`
  border, and 11px corners.
- Retain right edge alignment: header flex layout, selector `margin-left: auto`
  and `align-self: flex-end`. Its height is similar to the title's text line;
  increasing size must not move its right edge or overlap the title.
- Actual level changes reset the attempt and announce the new level unless
  sound is muted/unavailable. Selecting the current option is a no-op.

## 3. Wheels and controls

### UI-02 — Three-position manual wheels (PRD-01, PRD-02)

- Always show three ordered wheels, visually uppercase. Each has a 76px
  viewport and 76px row pitch; width `clamp(76px, 20vw, 112px)`.
- Fixed wheels show their single letter in gray. Adjustable wheels show `?`
  before their first selection; no choice is implied by adjacent preview letters.
- Before a target, wheels are inactive and gray. Once a target exists,
  adjustable letters are green even while picture loading keeps them inactive;
  interaction begins only when the picture/fallback is ready.
- Pointer/touch drag is vertical: each 40 CSS px upward advances one configured
  letter, downward moves one backward. Support multiple steps and wraparound;
  do not apply velocity/flick thresholds or inertial answer selection.
- From `?`, upward/ArrowUp selects the first configured letter; downward/
  ArrowDown selects the last. Once selected, wrap only actual letters; `?`
  returns only on a new target or level.
- Show neighboring rows while moving; snap to the current choice on release
  or cancellation. Subthreshold movement does not select a letter.
- Use pointer capture and `touch-action: none` only on wheels. Track drag
  state so Spell cannot be activated during an active gesture.
- ArrowUp/ArrowDown perform the same ordered one-step changes. Fixed and
  inactive wheels must not become editable; correct-answer wheels remain locked.
- Use a stationary cylindrical gradient/shading; move the letter stack, not
  the shading. Render 48px Lexend letters, translating glyph spans upward
  2.5 CSS px without changing viewport height, row pitch, or drag geometry.
  Representative `A`, `T`, and `?` ink should appear centered, not low.

### UI-03 — Main action and feedback lock (PRD-01, PRD-03, PRD-04)

| Situation | Label and availability |
|---|---|
| Initial/new level | **Find a word**, enabled |
| Target found, no adjustable letter changed | **Find a word**, disabled |
| Any real adjustable-letter change | **Spell**, disabled until complete and picture ready |
| Complete selection, no drag/feedback | **Spell**, enabled |
| Incorrect feedback pending | **Spell**, disabled; wrong-answer wheels remain editable |
| Incorrect feedback complete | **Spell**, enabled if selection otherwise complete |
| Correct feedback pending | **Find a word**, disabled; wheels locked |
| Correct feedback complete | **Find a word**, enabled; wheels stay locked until next target |

An all-fixed level skips waiting for a change and offers Spell after picture
readiness. Repeated activation while disabled must not queue submissions.

The primary remains disabled until **both** feedback audio and every relevant
letter animation complete, whichever finishes last. Muted/unavailable audio
does not extend the wait, but the full active visual feedback still does.
Editing after a wrong answer clears the red flashes but does not bypass retry
audio. Changing level resets/cancels the lock; stale callbacks cannot restore it.
Do not communicate these states with color alone: retain label, disabled state,
instruction/status text, and accessible control semantics.

### UI-09 — Sound toggle (PRD-08, PRD-09)

- 54×54px icon/button, bottom-aligned with the primary. Keep its left edge
  aligned with the rotated S mark's visible left edge. Current layout uses a
  `54px 1fr 54px` action grid, centering the primary independently of the icon.
- Local active artwork:
  - Unmuted: `audio-unmuted-v2.svg`, green `#2f7642`, speaker without a circle.
  - Muted: `audio-muted.svg`, red `#e42e2e`, speaker with circle and slash.
  - Unavailable: unmuted-shaped icon in neutral gray, disabled.
- Preserve speaker size/position across states. Shared SVG viewBox is 24×24,
  transparent fill, stroke width 2, rounded caps/joins; speaker path is
  `M4 9h5l6-5v16l-6-5H4z`. Muted circle is centered at 12,12, radius 11;
  slash is `M4.25 4.25l15.5 15.5`, including round caps inside the circle.
- The circle's 54px outer diameter matches the primary's height. Do not enlarge
  the v2 speaker after removing its circle. Original circular unmuted SVG is
  retained source-only, not the active unmuted image.
- Unavailable filtering is `brightness(0) invert(.55)`, yielding approximately
  RGB 140,140,140; do not apply invert-only to colored art and get tinted gray.
- Accessible action name/title: `Mute audio` or `Unmute audio`; use pressed
  state for mute preference and native disabled semantics for unavailability.
  When unavailable, use `Audio unavailable for this level`. Decorative image
  alt is empty; button name carries its meaning.
- Pending availability and one failed clip keep the toggle enabled. Mute
  immediately stops playback; unmute never replays canceled narration.

## 4. Target, picture, and audio

### UI-04 — Target and feedback presentation (PRD-01, PRD-03, PRD-04)

- Show the target above the picture and retain it across incorrect submissions.
  Target type: 42px, orange `#e48a35`, letter spacing `.14em`, uppercase via CSS.
- Normal active adjustable letters: green `#2f7642`; fixed/inactive letters:
  gray `#555`. Feedback temporarily overrides these colors:
  - Correct: all three selected letters gold `#b8860b`.
  - Incorrect: only mismatched selected letters red `#e42e2e`; matches retain
    their normal color, even if a different complete configured word was made.
- Three simultaneous flashes over 1.5 seconds: each cycle 250ms highlight,
  then 250ms normal (`.5s step-end` repeated three times). End in normal colors.
- Correct feedback waits for the full correct-answer cue, then begins on actual
  target-word playback; muted/unavailable/failure fallback starts it without
  waiting indefinitely for a missing playing event.
- Retry flashes begin with the retry cue. Retain positive/retry text as well as
  color (`Correct!` / `Please try again!`), and clear incorrect feedback on the
  next actual letter edit.
- Do not show an additional score, success fanfare, new target, or automatic
  level transition.

### UI-05 — Persistent picture and sequential fallback (PRD-04, PRD-05)

- Frame: 146px high, width `min(100%, 260px)`, centered, 20px rounded corners,
  background `#f8fbf6`, 1px dashed `#dbe8d9` border, margin `8px auto 20px`.
  Present on the initial screen and after resets even with no image.
- The image area must constrain intrinsic sizing; use a definite grid track
  such as `grid-template-rows: minmax(0, 1fr)` inside the fixed-height frame.
- For target `cat`, load `assets/images/cat.svg`. On load/decode failure try
  `assets/images/cat.jpg`; only then use local painting fallback.
  A usable SVG always wins, even if JPG also exists.
- Word image and fallback each have width 80%, height 80%, `object-fit: contain`,
  centered. Scale the SVG/JPG's complete natural aspect ratio into that box;
  never stretch, crop, or exceed either limit.
- Apply `grayscale(1)` to fallback only, leaving source artwork unchanged.
  Real word pictures retain their colors.
- No target means an empty frame, not a fallback. Once both target formats fail,
  show the grayscale painting without visible error text; provide an accessible
  description of picture unavailability.
- Keep wheels/Spell gated while a candidate is pending, including the SVG-to-JPG
  handoff. New targets/levels restart lookup without inheriting stale events.

### UI-06 — Narration and media failure (PRD-04, PRD-08)

- On Find: pronounce the target once.
- On correct: correct-answer cue, then target pronunciation, with gold as above.
- On wrong: retry cue with red flashes.
- On actual level change: announce that level. No initial level-1 announcement.
- No startup spoken instruction or Play instructions control. The written
  instruction stays available.
- Muted audio is intentional, not an error. Real playback failure is visible
  and logged non-blockingly; picture failure uses the visual fallback.
- Cancel stale playback on level change/unmount. Muting preserves visuals and
  releases only the audio wait. Unmuting affects future actions.

## 5. Typography, responsive styling, and accessibility

### UI-07 — Shared visual and input rules (PRD-07, PRD-09, PRD-10)

| Element | Approved styling |
|---|---|
| Font | Local Lexend regular WOFF2, family Lexend, normal/400, swap, sans-serif fallback |
| Font synthesis | Disabled; do not imply supplied bold/variable faces |
| Page | Base `#edf4ec`, green `#d7edcf` and beige `#f8e6bf` radial accents; shell padding `28px 16px` |
| Card | Up to 620px wide, `#fffefa` background, 1px `#e8eee6` border, rounded 30px, padding `clamp(24px, 5vw, 46px)` |
| Narrow card | Radius 24px at widths ≤430px |
| Header | 14px gaps, reduced to 10px at widths ≤430px |
| Brand | S mark 52px, 30px text, `#368047` on `#dff2d9`, rotated -6deg; 44px box at widths ≤430px |
| Title | `clamp(23px, 5vw, 32px)`, line height 1.1, `#244b34` |
| Eyebrow | 10px, `.15em` letter spacing, `#63836b` |
| Instruction/status | 15px, `#65756a`, margin `30px 0 20px` (26px top on narrow screens) |
| Word region | Minimum height 66px, margin `22px 0 6px`; empty prompt 13px `#8a978c` |
| Wheel boxes | 2px border, 20px corners, gap `clamp(10px, 3vw, 18px)` |
| Wheel letters | 48px, 76px row pitch, optical shift -2.5px |
| Action row | 8px gaps, margin-top 24px, 54px / flexible center / 54px columns |
| Main action | Maximum width 176px, minimum height 54px, 17px corners, green `#39874b`, white responsive 14-19px text |
| Footer | 11px `#96a297`, margin-top 25px |
| Focus | Visible 3px `#f1bd57` outline with 3px offset |

The primary green is intentionally recorded separately from letter/icon green;
do not silently unify `#39874b` and `#2f7642`. Preserve responsive spacing,
rounded controls, shadows, disabled styles, and cylindrical wheel treatment.
The current sound-button offset for the rotated brand is
`calc(var(--brand-size) * (1 - cos(6deg) - sin(6deg)) / 2)`;
verify equivalent alignment on target browsers.

- Support layouts at 320, 375, 430, 620, and 800 CSS px without horizontal
  scrolling, title/select overlap, clipped glyphs, or displaced selector edge.
- Editable wheels use focusable `spinbutton` semantics with first/middle/last
  letter labels, allowed range/current value, and `Not selected` for `?`.
  Use minimum 0, maximum choice count, current value 0 for `?`, otherwise the
  configured one-based index. Fixed wheels are labeled non-editable images
  with `: <letter> (fixed)` in their names; inactive controls are not
  accidentally keyboard editable.
- Keep native select keyboard behavior, button activation, focus indicators,
  polite status/target announcements, meaningful word-picture alt text, and
  accessible fallback descriptions.
- Set `user-select: none` and `-webkit-user-select: none` on the game card.
  This prevents accidental text highlighting, not screen-reader access.
  Do not disable controls, blanket-cancel document pointer events, or break
  native select operation to achieve it.
- Retain wheel-local native drag prevention and touch handling. CSS-only
  selection prevention must not change drag thresholds or wheel snapping.
- Current `prefers-reduced-motion` treatment disables smooth scrolling and
  primary-button transitions only. It does **not** shorten/remove flashes or
  introduce an automatic-spin alternative. Any broader change needs separate
  approval/accessibility review.
- Bundle the unchanged Lexend OFL notice; asset provenance and release rights
  follow DVS-12. Neither palette choice nor keyboard support constitutes a
  completed accessibility-conformance assessment.

## 6. Resolved choices and remaining validation

Resolved: manual wheels, Find/Spell labels, initial placeholders, exact-target
evaluation, five levels, flash timing/colors, permanent picture frame, SVG/JPG
priority, local Lexend, right-aligned enlarged selector without caption,
green/red/gray sound icons, feedback lock including muted visuals, and
game-card selection prevention.

Outstanding: actual older-device/WebView layout/media tests, applicable
accessibility review including flashes/reduced motion, catalog/upload icon
approval, and release media rights. Do not treat resolved gameplay as an open
design question or claim outstanding validation has occurred.

## 7. Source references

- [PRD.md](./PRD.md), [DEVSPEC.md](./DEVSPEC.md), [TESTSPEC.md](./TESTSPEC.md).
- [**GameSpecBrief**](https://docs.google.com/document/d/1MWGOzbIT0L_k6DkbJx-zyBHK1l9PvwqZ7D6SVCB8iEk/edit?tab=t.0), MVP baseline with explicitly approved later UI changes.
- [**ThirdPartySpec**](https://docs.google.com/document/d/1GHSxckarR4x6ERPmKJlM3IL34-3LuplQ/edit#heading=h.xbi1mcqif22u), offline and deployment constraints.
- [**SDAD**](https://medium.com/@guruduth.banavar/spec-driven-ai-development-engineering-discipline-for-the-ai-coding-era-22a678067b1c), specification traceability.

## 8. Change log

2026-11-13 — Copilot — Created the initial screen, interaction-state, motion, and accessibility specification.
2026-11-16 — Copilot — Replaced the wheels-first hierarchy with the approved word-result, picture, spinners, and button order in both DOM and visual presentation.
2026-11-17 — Copilot — Replaced automatic-spin UI assumptions with approved manual controls, persistent format-prioritized pictures, Lexend styling, enlarged selector, colored sound icons, completion locking, and selection prevention.
