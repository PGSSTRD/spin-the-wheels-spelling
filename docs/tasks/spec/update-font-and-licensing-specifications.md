# Task: Update typography, asset licensing, and spinner-centering specifications

**Status:** Completed - synchronized with all four specifications

**Created:** 2026-11-17

**Completed:** 2026-11-17

The user's final instruction to get the specifications up to date authorized
the combined synchronization. The planning sections below are historical;
the completion record documents superseding decisions and the final scope.

## Objective

Synchronize the four specifications with the approved local Lexend font,
asset-license inventory, offline font distribution, and spinner-letter
centering. At draft creation, approval covered the task only; specification
edits were subsequently authorized by the final synchronization request.

## Specification references and planned changes

- [PRD](../../specs/PRD.md): extend PRD-07 and relevant acceptance criteria
  for offline typography without an external font service.
- [DEVSPEC](../../specs/DEVSPEC.md): update DVS-02/DVS-09 and directly related
  asset rules for CSS font loading, font/license distribution, and the
  license-manifest contract.
- [UISPEC](../../specs/UISPEC.md): update UI-02/UI-07 and the visual-style
  section for Lexend throughout the interface and optical centering of
  spinner capitals and the unselected question mark.
- [TESTSPEC](../../specs/TESTSPEC.md): extend responsive, offline, and package
  tests, including TST-10/TST-11/TST-13 as appropriate, with traceability
  to the typography and licensing requirements.

Preserve existing requirement IDs where possible. Add focused IDs only where
necessary, and keep cross-references consistent.

## Requirements to specify

### Local typography

- Use the supplied Lexend Latin regular WOFF2 throughout the interface,
  including the brand mark, headings, instructions, wheels, target words,
  level selector, and primary action.
- Declare a normal-style, weight-400 face with swap display and a system
  sans-serif fallback. Do not describe the supplied regular font as a
  variable font or claim that separate bold font files are supplied.
- Retain the current no-synthesized-font styling. Existing requested
  weights do not imply that additional font files exist.
- Source: `content/assets/fonts/lexend-v26-latin-regular.woff2`.
- Load the local font through CSS `@font-face`; no external font service,
  runtime font download from the Internet, or local-file `fetch()` is required.
  Reconcile any blanket binary-asset XHR rule only as necessary to permit
  native CSS font loading; do not broaden changes to audio loading.
- Keep the interface usable with the fallback font if the custom font fails.

### Spinner alignment and preserved geometry

- Center visible capital lettering and the question-mark placeholder
  optically within each spinner, rather than assuming that a centered font
  line box guarantees centered glyphs.
- Apply the same adjustment to adjustable and fixed wheels and to all
  repeated letter rows, preserving consistent baselines while dragging.
- Record the current implementation's upward 2.5 CSS-pixel adjustment as
  implementation evidence, not the sole acceptance criterion.
- Preserve the current 76px spinner height and 76px repeated-row pitch.
  Do not change drag thresholds, snapping, selection, keyboard behavior,
  feedback timing/colors, or the spinner controls' position to center text.
- At 320px, 375px, and 800px viewport widths, representative settled `A`,
  `T`, and `?` glyphs should have visible vertical centers within 1 CSS pixel
  of the spinner center using the supplied font. Keep normal capital
  baselines consistent rather than recentering each letter independently.
- Preserve responsive layout without clipping, overlap, or horizontal
  overflow caused by typography.

### Asset-license manifest

- Source manifest: `content/licenses.json`, with an `assets` array.
- Every entry has non-empty string fields: `path`, `creator`, `license`,
  `source`, and `notes`. Paths are unique and omit the source `content/`
  prefix; interpret them relative to the runtime package root, not relative
  to the manifest's directory.
- Record the three original speaker SVGs as approved:
  `assets/icons/audio-muted.svg`, `assets/icons/audio-unmuted.svg`, and
  `assets/icons/audio-unmuted-v2.svg`; creator `Project contributors`,
  license `CC0-1.0`, and source `Created for this repository`.
  Preserve the notes distinguishing active and retained unused variants.
- Record the font using the user's supplied metadata: creator
  `The Lexend Project Authors`, license `OFL-1.1`, and source
  `https://fonts.google.com/specimen/Lexend`. Preserve the supplied copyright,
  Reserved Font Name, permission, and full-notice retention notes.
- Retain the supplied full OFL notice unchanged. Do not extend the SVGs'
  CC0 dedication to the font, recordings, or any other media.
- State that the current inventory covers these four assets only; do not
  claim that the project's audio or all other media have been licensed by
  this task.
- Attribution/reference URLs in metadata are not runtime network dependencies.

### Offline distribution

- Emit the unchanged font at
  `assets/fonts/lexend-v26-latin-regular.woff2`, matching its manifest entry,
  rather than relying on an external host or a hashed replacement path.
- Include the unchanged copyright/license notice at
  `assets/fonts/OFL-Lexend.txt`.
- Include the manifest at `content/licenses.json`.
- Active speaker SVGs are inlined in the application bundle; do not claim
  that every manifest entry is a separately emitted runtime file. Retain
  source entries for the original unused circular unmuted variant.
- Keep all runtime font references compatible with standalone `file://`
  operation. Do not silently redefine unrelated engine/language ZIP rules
  to match the current combined development build.

## Validation requirements and existing evidence

Describe focused checks for:

1. Successful loading and actual rendering of Lexend, rather than merely
   checking the computed family string while a fallback is rendered.
2. Representative spinner glyph centering, fixed/adjustable consistency,
   unchanged row pitch and dimensions, and responsive layout at the widths
   above. Verify that dragging, snapping, and keyboard selection still work.
3. Offline standalone font loading with no external font requests, and
   usable fallback behavior when the font is deliberately unavailable.
4. Manifest structure, unique paths, required metadata, and the distinction
   between source assets, inlined icons, and separately emitted font files.
5. Source/package hash equality for the font, OFL notice, and manifest, with
   the exact distribution paths stated above.

Implementation evidence available on 2026-11-17:

- Type-check and production build passed.
- All 43 App tests and all 5 Wheel tests passed in their targeted runs.
- Native browser font inspection identified `Lexend-Regular` as the actual
  custom font rendering headings, wheel letters, primary action, and selector.
- Standalone browser checks at 320px, 375px, and 800px found representative
  `A`/`T` centers about 0.3px above the spinner center and `?` about 0.2px
  below it after adjustment. Spinner height/pitch remained 76px, with no
  horizontal overflow.
- Packaged font, OFL notice, and manifest matched their source hashes.

Inspect current implementation and rerun relevant checks as needed before
editing specifications. Desktop measurements do not establish validation
on all devices or constitute an exhaustive missing-font test.

## Scope boundaries

- Documentation only: do not alter app code, fonts, SVGs, or recordings.
- Coordinate shared icon/packaging references with the separate
  [audio specification task](update-audio-specifications.md), without
  implementing that task implicitly.
- Do not silently synchronize unrelated manual-spelling mechanics or other
  historical specification mismatches. List remaining relevant conflicts
  for follow-up rather than expanding this task.
- Do not mark the entire product specification approved while unrelated
  decisions remain open.

## Required metadata and completion report

For every specification altered:

1. Update **Status** to describe the synchronized scope accurately.
2. Update **Last updated** to the actual edit date in `YYYY-MM-DD` form.
3. Append an entry to the bottom change log in this exact format:
   `2026-MM-DD — <author> — <one-sentence description of change>`.
4. Report all additions, removals, and replacements by specification,
   including any resolved questions and remaining relevant mismatches.

Check cross-document consistency and run `git diff --check`.

## Completion record (2026-11-17)

- Updated [PRD](../../specs/PRD.md), [DEVSPEC](../../specs/DEVSPEC.md),
  [UISPEC](../../specs/UISPEC.md), and [TESTSPEC](../../specs/TESTSPEC.md),
  including Status, Last updated, appended change logs, and traceability.
- Specified local regular Lexend, no synthesized faces, offline font/OFL
  distribution, actual-rendered-font checks, the -2.5px optical adjustment,
  preserved 76px wheel geometry, and representative glyph-centering checks.
- The later approved complete 56-asset inventory supersedes this draft's
  four-asset-only description. Retained all 49 ElevenLabs MP3 records,
  generated WAV, five SVGs, and font, without granting new rights.
- The final combined approval supersedes the original narrow synchronization
  exclusions. Historical test counts remain historical evidence, not the
  current suite size or proof of older-device/accessibility/legal approval.
- See the [combined completion report](update-images-licenses-and-level-selector-specifications.md)
  for per-spec additions/removals/replacements and remaining release gaps.
  No runtime code, font, artwork, recording, or license declaration was altered.
