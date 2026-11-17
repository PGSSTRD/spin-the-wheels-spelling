# Task: mutable-audio

**Status:** Implemented and tested; final icon design approved - specification follow-up pending

**Created:** 2026-11-17

## Objective

Create two matching SVG assets representing muted and unmuted audio, then
implement the subsequently approved mute control.

## Specification references

- [PRD](../../specs/PRD.md): PRD-04 and PRD-07 - audio presentation and offline operation.
- [DEVSPEC](../../specs/DEVSPEC.md): DVS-07 and DVS-09 - local media assets and packaging.
- [UISPEC](../../specs/UISPEC.md): UI-07 and the open sound-control decision - accessible presentation; a mute control is not yet specified.
- [TESTSPEC](../../specs/TESTSPEC.md): TST-10 and TST-13 - visual/accessibility checks and asset validation.

The original scope was artwork only. The user authorized the mute-control
follow-up below on 2026-11-17, resolving the sound-control behavior for this task.

## Deliverables

- `content/assets/icons/audio-muted.svg`
- `content/assets/icons/audio-unmuted.svg`
- `content/assets/icons/audio-unmuted-v2.svg` (active unmuted/unavailable artwork)

The user approved implementing only the first (muted) icon on 2026-11-17 and
specified `content/assets/icons/` as the source location. Make adjustments to
that icon before deriving the unmuted variant. The user approved the muted
icon on 2026-11-17 and authorized creating the unmuted version from it.

## Requirements

1. Both icons show the same recognizable speaker in profile, facing right.
2. The muted icon adds a single diagonal slash across the speaker.
3. The unmuted icon uses the identical speaker without the slash.
4. Use black (`#000000`) for every visible stroke, including the slash. Use no other visible colors.
5. Use outline artwork with `fill="none"` and a transparent background so consumers can recolor it using a CSS filter.
6. Both icons use the same `viewBox="0 0 24 24"`, stroke width, line caps, line joins, speaker geometry, and alignment.
7. Keep all strokes inside the viewBox without clipping, including rounded stroke ends.
8. Use self-contained SVGs with the SVG namespace and no scripts, external resources, fonts, embedded raster images, or background rectangle.
9. Keep the shapes recognizable at typical small UI sizes, including 24 by 24 pixels.
10. Circular-icon follow-up requested on 2026-11-17: enclose both speakers in
    identical circles using the same stroke width as the speaker. Keep the
    mute slash, including its rounded caps, inside the circle's outer edge.
    The circle's outer diameter must match the Spell button's height, with
    unchanged bottom/left alignment relative to the primary action and brand
    mark.
11. Unmuted v2 follow-up requested on 2026-11-17: create
      `audio-unmuted-v2.svg` by removing only the circle from the original unmuted
      SVG. Preserve its viewBox, dimensions, speaker position, and styling.
      Use v2 for both the black audio-on and gray unavailable states. Retain the
      circular original and leave the muted icon unchanged.

## Original artwork-only exclusions (superseded where authorized below)

- Adding a mute button to the game.
- Changing playback, volume, mute state, persistence, or audio-error behavior.
- Re-enabling startup narration.
- Changing the asset build/copy pipeline or installing dependencies.
- Updating the four specifications without separate approval.

## Approved mute-control follow-up - 2026-11-17

- Add a button using the approved SVGs to the left of the primary action,
  at the same height and bottom alignment as Find a word/Spell. Align its
  left layout edge with the header's S brand mark.
- Default: black unmuted speaker. Muted: black slashed speaker.
  Unavailable: gray unmuted speaker, disabled.
- Recheck availability on startup and actual level changes without playing
  audio. Unavailable means none of that level's word recordings, level
  announcement, correct clip, or retry clip can load/decode. A single usable
  clip keeps the button active. Pending checks are not proof of missing audio;
  autoplay permission denial does not mean files are missing.
- Muting immediately cancels playback and pending sequence callbacks.
  Suppress all subsequent gameplay audio while muted, without reporting
  intentional silence as a failure. Preserve correct/incorrect flashes,
  starting correct flashes immediately when sound is suppressed.
- Unmuting affects future events only; do not replay canceled narration.
- Keep mute choice across levels. Fresh navigation starts audio on; a same-tab
  reload restores that tab's preference using navigation type and session
  storage. Log storage failures explicitly; do not prevent gameplay.
- Keep real per-file playback failures visible and logged.
- Bundle the icons locally. No new dependencies or startup narration.
- Test mute/unmute, sequence cancellation, unavailable/partial/pending states,
  stale level checks, permission denial, reload versus fresh launch, and
  responsive alignment at desktop and mobile widths.
- Specification synchronization remains deferred pending review and approval.

## Implementation plan

1. Create the outlined black speaker SVG.
2. Create the muted variant using identical speaker geometry plus the diagonal slash.
3. Preview both assets at 24 and 48 pixels on a light background.
4. Validate the acceptance criteria and present the artwork for user review.

## Acceptance criteria

- Both files parse as valid SVG and render offline.
- The speaker is visually identical between files; the slash is the only artwork difference.
- The muted state is clearly distinguishable from the unmuted state.
- All visible strokes are black, the background is transparent, and neither icon clips at either preview size.
- Applying a CSS filter recolors the complete icon consistently, including the mute slash.
- No gameplay or audio behavior changes.

## Approval and specification follow-up

Both icons were visually reviewed at 24, 48, and 96 pixels and approved by the
user on 2026-11-17. That approval covered artwork; the mute-control follow-up
above was authorized afterward and awaits implementation review.

After implementation is tested and approved, propose a separate specification-update task if these assets require specification changes. For each altered specification, update Status and Last updated, append a change-log entry in the format `2026-MM-DD — <author> — <one-sentence description of change>`, and report all additions and removals.

## Muted icon implementation and verification - 2026-11-17

- Created only `content/assets/icons/audio-muted.svg`: a right-facing outlined
  speaker with one diagonal slash, black strokes, and transparent fill.
- Validated XML, SVG namespace, and the 24 by 24 viewBox.
- Browser raster checks at 24 and 48 pixels confirmed visible black artwork,
  transparent outer edges without clipping, and uniform recoloring to white
  with an invert filter.
- No gameplay, audio behavior, build configuration, or specifications changed.
- Awaiting visual review and adjustments before creating the second variant.

## Unmuted icon implementation - 2026-11-17

- Created `content/assets/icons/audio-unmuted.svg` from the approved muted SVG,
  removing only the slash artwork and changing its accessible label to
  "Audio unmuted".
- Preserved the speaker path, dimensions, viewBox, transparent fill, black
  stroke, stroke width, rounded caps, and rounded joins.
- Left the approved muted icon and gameplay unchanged.
- XML checks confirmed exactly one path, identical speaker geometry, and
  matching SVG attributes except the accessible label. `git diff --check`
  passed.

## Mute-control implementation and verification - 2026-11-17

- Added the three-state, keyboard-accessible speaker button and locally
  bundled approved SVGs. A grid keeps the primary action centered; narrow
  layouts reduce its width/font to avoid overlapping the audio control.
- Matched the icon and action button at 54px high with equal bottom edges.
  Browser measurements at viewport widths 320, 375, 430, and 800px showed
  no horizontal overflow and left-edge alignment with the rotated brand
  mark within 0.01px. CSS accounts for the mark's rotated-square overhang.
- Silent native media checks use loaded data rather than play requests:
  stop/release probes once any clip is usable; gray/disable only when all
  fail. Cancel checks on level changes/unmount and ignore stale results.
- Extracted the existing cancellable audio playlist into `src/audio.ts`
  alongside availability checking. Mute stops playback, prevents later
  phases, and lets visual feedback complete without audio.
- Browser file-mode checks confirmed native playing then pause on mute,
  no additional playback attempts for muted spelling/level changes, and
  immediate gold feedback on a correct muted spelling.
- A deliberately simulated all-load-failure browser check confirmed a gray
  unmuted SVG with a disabled button, and preserved the mute choice when
  returning to a usable level. This was simulated missing media, not removal
  of the user's recordings.
- Browser navigation checks confirmed same-tab reload restores mute and
  fresh navigation starts unmuted. No startup clip was re-enabled.
- Targeted tests cover every gameplay cue, both success-sequence phases,
  stale cancellation, partial/pending/all-missing availability, level changes,
  autoplay denial, reload/fresh launch, and blocked preference storage.
- All 41 App tests, TypeScript checking, production build, and
  `git diff --check` passed.
- The four specifications remain unchanged pending separate approval.

## Playback-dropout follow-up - 2026-11-17

- The user reported intermittent gaps in narration, while the same recording
  plays clearly outside the VS Code browser. Analysis of the level-4 file
  found no mid-speech silence at a -45dB threshold over 40ms.
- Replaced the parallel availability scan (up to 43 simultaneous media
  probes in level 5) with sequential probing. Try correct, retry, and level
  cues first, then the words if needed. Release each failed probe before
  opening another; stop and release immediately on the first usable clip.
- Retained the all-unavailable rule, pending-state behavior, real error
  reporting, mute preference, and stale-result cancellation. No recordings,
  narration sequencing, or gameplay rules changed for this follow-up.
- Regression tests assert at most one live probe, exactly one probe for a
  usable shared clip even in the largest level, early termination on success,
  and exhaustive fallback before declaring all audio unavailable.
- All 42 App tests, TypeScript checking, production build, and
  `git diff --check` passed.
- Native file-mode checks of level 4, level 5, and level 4 again confirmed
  a peak of one probe and only the shared correct clip checked per change.
  Announcements reached their full durations with no mid-play waiting,
  stalled, or error events. Playing-to-ended wall times were about
  1.54/1.53/1.46 seconds, compared with about 2.08/3.00/2.41 seconds in the
  earlier parallel-scan run. Browser timing is supporting evidence, not an
  independent listening assessment; user confirmation remains pending.

## Circular-icon refinement and verification - 2026-11-17

- Added the same circle to both SVGs: center (12,12), radius 11, inherited
  2-unit black stroke. Its outer diameter is exactly the 24-unit viewBox,
  so the existing 54px image size now gives a 54px outer-circle diameter.
- Kept speaker geometry and styling unchanged. Shortened the muted slash
  to (4.25,4.25)-(19.75,19.75); including its rounded caps, its maximum
  radial extent is about 11.9602 units, within the outer circle's 12 units.
- XML/geometry checks confirmed matching circles and speakers, and slash
  containment. No CSS, gameplay, audio, or availability behavior changed.
- Native file-mode browser measurements against the actual Spell button at
  viewport widths 320, 375, 430, and 800px confirmed a 54px outer diameter
  and 54px button height, equal bottom edges, left alignment with the brand
  within 0.01px, and no horizontal overflow.
- TypeScript checking, production build, and `git diff --check` passed.
  Circular artwork awaits user review; specification synchronization remains
  separately deferred.

## Unmuted v2 implementation and verification - 2026-11-17

- Created `content/assets/icons/audio-unmuted-v2.svg` and switched the app's
  unmuted/unavailable import and its directly related tests to v2.
- XML comparison confirmed v2 is identical to the circular original except
  for removal of its circle. The original and muted SVGs remain unchanged.
- Browser file-mode checks confirmed the active unmuted icon has no circle,
  the muted icon retains its circle, and both share the same speaker path
  and identical 54px image size and position.
- All 42 App tests, TypeScript checking, production build, and
  `git diff --check` passed. Awaiting user review.
- User approved the final visual distinction on 2026-11-17: circle-free v2 for
  unmuted/unavailable, circular slashed speaker for muted.
