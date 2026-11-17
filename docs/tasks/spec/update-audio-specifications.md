# Task: Update audio and mute-control specifications

**Status:** Draft - awaiting approval before specification edits

**Created:** 2026-11-17

## Objective

Synchronize the four specifications with the implemented mute controls and
approved icon states from [mutable-audio](../draft/mutable-audio.md).
The user approved creating this draft task, not editing the specifications yet.

## Specification references and planned changes

- [PRD](../../specs/PRD.md): update PRD-04 and relevant acceptance criteria;
  resolve the open sound-control/audio-policy question.
- [DEVSPEC](../../specs/DEVSPEC.md): update DVS-02/DVS-07 and directly related
  runtime/media rules for mute state, bounded availability checks, local
  SVG assets, cancellation, and reload persistence.
- [UISPEC](../../specs/UISPEC.md): update UI-03/UI-07 and relevant state/layout
  requirements; resolve the open separate-sound-control question.
- [TESTSPEC](../../specs/TESTSPEC.md): extend TST-06/TST-07/TST-10/TST-11 and
  packaging checks as appropriate, maintaining requirement traceability.

Preserve existing requirement IDs where possible. Add focused IDs only where
necessary, and keep cross-references consistent.

## Behavior to specify

### Audio state and interaction

- Fresh navigation starts unmuted. Mute preference persists across level
  changes; a same-tab reload restores that tab's preference.
- Distinguish reload from a fresh navigation using navigation timing, with
  session storage for the per-tab preference. Document that blocked storage
  is explicitly logged, gameplay remains usable, and persistence is then
  not guaranteed.
- The speaker button toggles mute and is keyboard accessible, focus-visible,
  and clearly named for its action/state.
- Muting immediately stops current playback and cancels pending playlist
  callbacks. Silence subsequent word, level, correct-answer, and retry cues.
- Intentional muting is not an audio failure. Preserve gameplay and letter
  flashes: correct flashes start immediately when sound is suppressed; red
  retry flashes continue normally.
- Unmuting affects future events only, without replaying canceled clips.
- Keep startup narration disabled; do not restore a Play instructions button.

### Availability and resource limits

- Recheck availability on startup and actual level changes without playing
  audio or requiring autoplay permission.
- A level is unavailable only when all its relevant clips fail to load/decode:
  its word recordings, level announcement, correct-answer clip, and retry clip.
- Any one usable clip keeps the toggle active, even if other files are missing.
  Keep genuine individual playback failures visible and logged.
- Pending checks and denied autoplay are not proof that the files are absent.
- Enforce at most one active availability probe at a time, independent of
  foreground playback. Probe shared correct, retry, and level clips first,
  then word recordings only as needed. Stop at the first usable clip.
- Release each failed probe before starting another. Release the successful
  probe immediately; cancel obsolete checks on level changes or unmount and
  ignore stale results.
- Do not reintroduce a full parallel media scan. The largest current level
  has 40 words plus three cues; checking all concurrently caused unnecessary
  decoder pressure associated with reported playback dropouts.

### Icons and placement

- Audio on: black `audio-unmuted-v2.svg`, without a circle.
- Muted: black `audio-muted.svg`, with an outer circle and a diagonal slash
  contained within that circle.
- Audio unavailable: gray unmuted v2, with a disabled button. Preserve the
  user's mute choice for a subsequent usable level.
- Keep the speakers' geometry, position, dimensions, and stroke styling
  identical between active variants. SVG source strokes are black with
  transparent fill, allowing filter-based recoloring.
- Retain the original circular `audio-unmuted.svg` as an unused asset.
- Source icons live under `content/assets/icons/`; active icons are bundled
  locally for standalone offline use.
- Match the muted circle's outer diameter and the icon image box to the
  primary action's height (currently 54px). Do not enlarge/recenter the v2
  speaker to compensate for removing its circle.
- Place the control to the left of the centered Find a word/Spell button,
  with equal bottom edges and its left edge aligned to the header S brand
  mark. Preserve responsive spacing without overlaps or horizontal overflow.

## Validation requirements

Describe focused tests for:

1. Default on, mute/unmute, level-change persistence, reload restoration,
   fresh-navigation reset, and blocked preference storage.
2. Cancellation during pronunciation and both success-sequence phases,
   stale callbacks, immediate muted gold feedback, and unaffected retries.
3. Partial, pending, and all-unavailable levels; disabled-state semantics;
   recovery on another level; autoplay denial not disabling the toggle.
4. A measurable maximum of one active probe, first-success termination,
   one probe for a usable shared clip even in the largest level, and
   exhaustive sequential fallback before declaring audio unavailable.
5. Active SVG selection, matching speaker geometry/position, circle/slash
   containment, and identical image boxes between muted and unmuted states.
6. File-mode playback, local packaging, keyboard operation, and responsive
   size/alignment checks at desktop/mobile widths, including 320px.
7. Repeated level announcements without detected mid-play stalls, plus
   listening tests on representative older Android hardware. Distinguish
   simulated failures and desktop measurements from actual device evidence.

Use the implementation and its 42 passing App tests as evidence, not as a
substitute for independently stated requirements. Inspect current source
and task verification before making the specification edits.

## Scope boundaries

- Documentation only: do not change app code, recordings, or artwork.
- Do not silently synchronize unrelated manual-spelling or other historical
  changes. Make only directly necessary dependent edits and explicitly list
  remaining specification mismatches for a separate follow-up.
- If an existing audio path/loading rule directly conflicts with the
  implemented mute feature, reconcile only the relevant audio rules with
  the confirmed implementation and document that change.
- Do not mark the entire product specification approved while unrelated
  product decisions remain open.

## Required metadata and completion report

For every specification altered:

1. Update **Status** to describe the synchronized audio policy accurately.
2. Update **Last updated** to the actual edit date in `YYYY-MM-DD` form.
3. Append an entry at the bottom change log in this exact format:
   `2026-MM-DD — <author> — <one-sentence description of change>`.
4. Include it in a completion report listing all additions, removals, and
   replacements by specification, including resolved open questions and
   any remaining directly relevant mismatch.

Validate consistency across all four documents and check formatting with
`git diff --check`. Request user approval before implementing this draft.
