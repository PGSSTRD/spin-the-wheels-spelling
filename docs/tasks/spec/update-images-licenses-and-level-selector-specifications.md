# Task: Update image handling, license inventory, and level-selector specifications

**Status:** Completed - synchronized with all four specifications

**Created:** 2026-11-17

**Completed:** 2026-11-17

The user's final instruction to get the specifications up to date authorized
the combined synchronization. The planning sections below are historical;
the completion record documents superseding decisions and the final scope.

## Objective

Synchronize the four specifications with the implemented picture frame,
SVG/JPG lookup and monochrome fallback, expanded media-license inventory, and
approved level-selector presentation. At draft creation, approval covered the
task only; specification edits were subsequently authorized by the final
synchronization request.

## Specification references and planned changes

- [PRD](../../specs/PRD.md): update PRD-04/PRD-05/PRD-07 and relevant acceptance
  criteria for inferred image filenames, non-blocking missing images, an
  always-visible picture frame, and local media.
- [DEVSPEC](../../specs/DEVSPEC.md): update DVS-02/DVS-04/DVS-05/DVS-07/DVS-09
  only as necessary for image resolution, presentation readiness, development
  serving, standalone packaging, and accurate license inventory.
- [UISPEC](../../specs/UISPEC.md): update UI-01/UI-03/UI-04/UI-07 and visual
  styling for persistent picture space, image sizing/fallback, and the
  unlabeled enlarged level selector.
- [TESTSPEC](../../specs/TESTSPEC.md): extend TST-06/TST-07/TST-08/TST-10/
  TST-11/TST-13 as appropriate, with fixtures and requirement traceability
  covering the behaviors below.

Preserve existing requirement IDs where possible. Add focused IDs only where
necessary, and keep cross-references consistent.

## Requirements to specify

### Persistent picture frame

- Keep the existing picture frame visible throughout the playable game
  screen, including before the first target and after a level change.
  Leave it empty when no target is selected.
- Preserve its position between the word-result area and the spinners.
  Keep the existing tinted background, dashed border, and rounded corners.
- The current frame is 146 CSS pixels high and at most 260px wide, constrained
  to available width. Preserve stable dimensions as an image loads, fails,
  or changes format.
- Do not infer a new requirement to add a picture frame to separate blocking
  loading/error screens.

### Ordered word-image resolution

- Derive image filenames from the selected normalized word. Do not add
  per-word image attributes to level data or generate an image index.
- Try `assets/images/<word>.svg` first.
- Only if SVG loading/decoding fails, try `assets/images/<word>.jpg`.
- Only if JPG also fails, show the supplied painting fallback.
- An unreadable image follows the same fallback sequence as a missing image.
- A usable SVG wins even when a JPG also exists; do not request the JPG in
  that case. Do not probe PNG, `.jpeg`, WebP, or other formats.
- Attempt candidates sequentially and only as needed for the current target;
  do not scan or preload every word/format.
- Restart at SVG for each new target and actual level change. Stale events
  from earlier candidates/cycles must not skip the current candidate or
  incorrectly signal that its picture is ready.
- Keep wheel interaction gated until the selected SVG/JPG loads or both
  formats have failed and the painting fallback is presented. A failed SVG
  alone must not enable play while JPG is still pending.
- Preserve all other spelling, target-selection, audio, and feedback behavior.

### Image appearance and accessibility

- Center both word images and fallback imagery within an image box occupying
  80% of the frame's content width and height.
- Fit the complete image inside those bounds while preserving its intrinsic
  aspect ratio. Do not stretch, crop, or require both dimensions to reach 80%.
- Show available word images in their original colors.
- Show missing-image fallback as a grayscale rendering of the supplied
  `content/assets/images/painting.svg`; preserve the original SVG file unchanged.
- Do not restore the emoji or visible unavailable-picture message.
- Preserve accessible names identifying the current word and the fact that
  its picture is unavailable. Before selection, expose the empty picture
  region as `Word picture`.

### Local image serving and packaging

- Source images live under `content/assets/images/`.
- Development serves requested word SVG/JPG files under `assets/images/`
  with `image/svg+xml` and `image/jpeg` MIME types respectively.
- Missing development image files return an explicit 404, allowing the same
  ordered fallback as standalone operation.
- Copy the source image directory into the standalone package's
  `assets/images/`. Use relative native image URLs compatible with `file://`;
  do not fetch local images through a network-only API.
- Retain the bundled local painting fallback. Its source is also present in
  the copied image directory.
- Adding/replacing a correctly named image directly in an existing
  standalone package does not require updating an index or rebuilding code;
  a subsequent target load tries the corresponding filenames again.

### Expanded license inventory

- Preserve the `assets` array and per-entry `path`, `creator`, `license`,
  `source`, and `notes` fields in `content/licenses.json`.
- Extend the earlier font/licensing draft's four-asset scope to reflect the
  current complete inventory. Do not delete later entries to match that
  draft's historical count.
- Current inventory: 56 source media assets comprising 49 MP3s, one generated
  WAV, five SVGs (three speaker icons and two supplied pictures), and one font.
  Counts describe current evidence; new assets must be inventoried as added.
- Use this project's singular `lang/english/audio/` path, including `words/`,
  for MP3 entries, not the previous project's `audios/` spelling.
- Each MP3 records creator `Project contributors using ElevenLabs`, license
  `LicenseRef-ElevenLabs-Free-Plan`, and source `https://elevenlabs.io`.
  Preserve the contributor-reported free-plan provenance and supplied
  restrictions: no commercial license, the reported noncommercial
  publication-title attribution condition, applicable terms/guidance links,
  and outstanding distribution approval.
- Identify the 2026-11-03 guidance check as inherited from the supplied
  previous-project record, not independently rechecked in this implementation.
  Recording these statements does not verify current terms, grant additional
  rights, or satisfy the reported publication-title attribution condition.
- Keep both supplied picture SVGs as `NOASSERTION` pending provenance and
  license verification. A search assistant's public-domain description is
  not sufficient evidence for a license declaration.
- Record `audio/triumphant.wav` separately as original procedurally generated
  project audio, not ElevenLabs output, with `NOASSERTION` pending an explicit
  license decision. It remains unused and unbundled.
- Preserve the three approved speaker-icon CC0 entries and the supplied
  Lexend OFL entry/notice. Do not extend those permissions to other assets.
- Paths omit the source `content/` prefix. This inventory includes retained
  source assets and does not promise that every entry is a separately shipped
  file. Keep the existing packaged manifest at `content/licenses.json`.
- Do not rename the game to satisfy an attribution condition, approve
  distribution, or assign new licenses as part of this documentation task.

### Level selector

- Remove only the separate visible `Level` caption. Retain the accessible
  name `Choose level` and option labels `Level 1` through `Level 5`.
- Preserve native selection, keyboard/focus behavior, level-change/reset
  semantics, and narration rules.
- Use a 36px-high dropdown, approximately matching the desktop title's line
  height, with responsive 16-20px Lexend text.
- Bottom-align it with the title area and preserve its previous right edge.
  Allow responsive title wrapping without overlaps or horizontal overflow.

## Validation requirements and existing evidence

Specify focused tests for:

1. Empty but visible frame before selection and after level changes; unchanged
   position/dimensions for success, pending candidates, and fallback.
2. Both formats present (SVG wins without a JPG request), SVG missing/invalid
   with usable JPG, and both failing with a grayscale fallback. Verify request
   order and no additional format probes.
3. Interaction remaining disabled while JPG is pending, then becoming usable
   on JPG success or final fallback. Cover resetting lookup for new words and
   levels and ignoring stale candidate events.
4. Square, wide, and tall image ratios, both dimension limits, no stretching
   or cropping, and grayscale limited to the painting fallback.
5. Development MIME types/404s and real standalone file-origin loading,
   including SVG and JPG decoding and images added directly to a package.
6. Unique manifest paths, required non-empty metadata fields, complete source
   media coverage, correct per-asset license classifications, and an unchanged
   packaged copy of the source manifest.
7. Absence of the visible level caption with the accessible selector name
   preserved; functional level changes; measured height/font sizing,
   title alignment, unchanged right edge, and no overlap/overflow.

Implementation evidence available on 2026-11-17:

- All 44 App tests, type-check, and production build passed.
- Native browser request traces on both file and HTTP origins confirmed
  `cat.svg` without requesting the available `cat.jpg`, then
  `mat.svg -> mat.jpg`, and `cap.svg -> cap.jpg -> grayscale fallback`.
  Temporary JPG fixtures were removed afterward.
- Actual 240x120 JPG decoding and aspect-preserving display were verified.
  Square, wide, and tall SVG sizing was checked in the native browser.
- Responsive image checks passed at 320px, 375px, 430px, and 800px widths.
- The 56-entry inventory covered all 56 current source media files with
  unique paths and required metadata; the packaged manifest matched its hash.
- Selector checks at 320px, 375px, 430px, 620px, and 800px found a 36px height,
  16-20px text, unchanged right edges, bottom alignment within about 1.1px
  of the title, and no overlap or horizontal overflow.

Use this as evidence, not as a substitute for independently stated requirements.
Inspect current implementation and rerun relevant checks as needed. Do not
present desktop browser results as older-device validation or legal approval.

## Scope boundaries and related drafts

- Documentation only: do not change app code, artwork, audio, licensing
  declarations, or build behavior.
- Coordinate overlapping license/package references with the pending
  [font and licensing task](update-font-and-licensing-specifications.md)
  and [audio task](update-audio-specifications.md); do not implicitly execute
  either draft. Reconcile their historical counts when the related edits
  are approved.
- Reconcile directly conflicting image-map, picture-visibility, and selector
  requirements, but do not silently synchronize unrelated manual-spelling
  mechanics or other historical mismatches.
- Preserve unrelated engine/language ZIP requirements; the current combined
  build's inventory is not authorization to redesign deployment tiers.
- List remaining relevant mismatches and open decisions. Do not mark the
  complete product specification approved while unrelated decisions remain.

## Required metadata and completion report

For every specification altered:

1. Update **Status** to describe the synchronized scope accurately.
2. Update **Last updated** to the actual edit date in `YYYY-MM-DD` form.
3. Append an entry to the bottom change log in this exact format:
   `2026-MM-DD — <author> — <one-sentence description of change>`.
4. Report all additions, removals, and replacements by specification,
   including resolved questions and remaining relevant mismatches.

Check cross-document consistency and run `git diff --check`.

## Completion record (2026-11-17)

The final request authorized synchronization of all approved implementation,
superseding the three drafts' original narrow exclusions. No new gameplay,
asset licensing, runtime code, media, dependency, build behavior, commit, or
push is part of this documentation-only task.

### Changes by specification

#### [PRD](../../specs/PRD.md)

- **Replaced:** original automatic-spin objective, automatic answer formation,
  and obsolete manual-play exclusions with the approved Find/select/Spell
  journey, exact-target evaluation, placeholders, fixed wheels, retry, and
  correct-answer locking.
- **Added:** immediate-repeat exclusion with singleton exception, explicit
  level-reset semantics, level-5 middle adjustment, and completion gating
  until both narration and all affected flashes finish, including muted play.
- **Added:** persistent SVG/JPG/grayscale picture behavior; local narration
  sequences; mute persistence/cancellation; sequential availability checks;
  local font, enlarged selector, icon states, and selection prevention.
- **Added:** complete source-media provenance requirements and unresolved
  publication/redistribution rights; made the future task/spec-update approval
  workflow explicit.
- **Removed/reclassified:** resolved gameplay/UI/audio questions and obsolete
  startup/automatic-spin assumptions; retained only genuine release,
  integration, licensing, startup-timeout, and device/accessibility gaps.

#### [DEVSPEC](../../specs/DEVSPEC.md)

- **Replaced:** old object/media-map schema with the complete five-level array,
  ordered spinner wrappers, exact validation/case rules, shipped word sets,
  runtime paths, and explicit numeric-ID consumer assumption.
- **Replaced:** spinning/result state machine with manual target/selection/
  evaluation states, drag/picture/completeness guards, per-submission identity,
  all-letter animation completion, and audio completion/cancellation.
- **Replaced:** obsolete `audios/`/per-word media references, blanket binary-XHR
  and preload assumptions, and provisional reporting cadence with singular
  `audio/`, native local media, prioritized SVG/JPG lookup, cancellable
  playlists, and actual ready/target reporting events.
- **Added:** reload-aware mute storage, bounded first-success probes, real
  playback/failure handling, no initial narration/fanfare, and stable local
  font/OFL/manifest output.
- **Added:** all 56 source assets' classifications and provenance restrictions,
  retained-unused versus emitted-asset distinction, and no new grants of rights.
- **Clarified:** current combined standalone artifact versus pending Layout A
  ZIPs/catalog delivery; current provisional reporting ID; no generic payload
  size guard or stalled-XHR timeout; preserved applicable release requirements.

#### [UISPEC](../../specs/UISPEC.md)

- **Replaced:** automatic-spin controls/motion and provisional labels with exact
  manual wheel behavior, 40px steps, keyboard wrapping, `?` lifecycle,
  Find/Spell states, retry/correct locking, and muted visual wait.
- **Added:** current written text and DOM/layout hierarchy, local Lexend and
  optical centering, 76px geometry, palette, 1.5-second three-flash timing,
  pronunciation-aligned gold, and mismatch-only red.
- **Replaced:** optional/emoji/text picture fallback with the always-visible
  146px frame, SVG-before-JPG, intrinsic-ratio 80% fitting, constrained grid,
  and grayscale painting with accessible description.
- **Added:** 36px enlarged right-aligned native selector without visible Level
  caption; green/red/gray 54px sound artwork, geometry and brand alignment;
  responsive measurements, focus/accessible semantics, and CSS selection
  prevention without native interaction changes.
- **Removed/reclassified:** obsolete selectable-text/automatic-motion
  assumptions and resolved visual questions; recorded actual reduced-motion
  behavior rather than claiming unimplemented flash reduction/conformance.

#### [TESTSPEC](../../specs/TESTSPEC.md)

- **Replaced:** outdated object/media-map fixtures, automatic-spin checks,
  and old media paths with parser-valid fixtures, full-catalog checks,
  deterministic nonrepeat choice, manual wheel and exact-target checks.
- **Added:** incomplete/all-fixed/three-adjustable cases; stale-media/level
  cancellation; actual SVG/JPG request order, decode and aspect ratios;
  narration/flash ordering and all audio/animation completion permutations.
- **Added:** mute/reload/fresh-navigation/storage-failure coverage, measurable
  one-probe limits, first-success stopping, icon pixel colors/geometry,
  Lexend/OFL/inventory checks, and native no-selection gameplay regressions.
- **Updated:** existing TST-01 through TST-15 and added TST-16 through TST-20;
  expanded traceability to every current requirement while preserving IDs.
- **Separated:** historical passing unit/browser/build evidence from acceptance
  requirements and unverified startup/device/accessibility/container/ZIP/
  licensing release gates; no new runtime test execution is implied.

### Metadata, history, and remaining obligations

- Updated all four Status and Last updated fields to the synchronized scope
  and 2026-11-17; retained historical change-log entries verbatim and appended
  one dated Copilot change entry to each document.
- Closed this task and the related audio/font specification tasks; retained
  their original plans with explicit supersession notes for old black icons,
  four-asset scope, test counts, and narrow exclusions.
- Remaining: permanent catalog/reporting agreement, separate release ZIPs and
  container publication, stalled-request startup handling, older-device and
  accessibility validation, and unresolved media rights/distribution approval.
- Documentation validation covers JSON examples against the actual parser
  and catalog, relative links, requirement coverage, metadata/history, source
  inventory claims, stale-contract checks, and `git diff --check`.
- Recorded checks: all seven specification/task documents passed metadata and
  link validation (55 relative links); all three JSON examples parsed; both
  level-array examples plus the described all-adjustable/all-fixed fixtures
  passed the current parser; the documented complete catalog matched source.
  All 51 requirement IDs resolve and all product/developer/UI requirements
  appear in the coverage matrix; all nine historical change-log entries were
  retained verbatim. Source inventory/classification counts matched all 56
  media files, and packaged font, OFL notice, and manifest hashes matched source.
